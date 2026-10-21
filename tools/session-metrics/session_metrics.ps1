# Summarises Claude Code session transcripts of one project (main session + subagents) into compact markdown:
# tokens, model calls, tool usage, duration, brief and reading indicators, the largest tool results and the commits
# made during the session. With -Record it appends the rows to diagnostics/sessions.csv and agents.csv. Used by the
# doctor agent so it never has to read raw transcripts.
#
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools/session-metrics/session_metrics.ps1 -Project <repo> ...
#   [-SessionId <uuid or prefix>]       report for one session; default: the newest session of the project
#   -Pending [-Since <date>] [-Record]  report for every finished session not yet in sessions.csv; -Record appends it
#
# Excerpt mode for one session (bounded by -MaxChars):
#   -Brief <agent>              full first prompt of one agent ('main' or a prefix of the id from the metrics table)
#   -Find <regex> [-Agent <a>]  matches with surrounding text in prompts, messages, tool inputs and results
#   -Timeline <agent>           one line per model call: context size, cache write, tools called, chars added
param(
    [string]$Project = (Get-Location).Path,
    [string]$SessionId,
    [switch]$Pending,
    [datetime]$Since = [datetime]::MinValue,
    [switch]$Record,
    [int]$MinIdleMinutes = 15,
    [int]$Top = 8,
    [string]$Brief,
    [string]$Find,
    [string]$Timeline,
    [string]$Agent,
    [int]$MaxChars = 4000,
    [string]$DataDir = (Join-Path $PSScriptRoot '..\..\diagnostics')
)
$ErrorActionPreference = 'Stop'
# Decimal points in the output and the CSV files, whatever the system's regional settings.
[Threading.Thread]::CurrentThread.CurrentCulture = [Globalization.CultureInfo]::InvariantCulture

$Project = (Resolve-Path $Project).Path.TrimEnd('\')
$DataDir = [IO.Path]::GetFullPath($DataDir)
$projectName = Split-Path $Project -Leaf
# Claude Code stores a project's transcripts under its path with every non-alphanumeric character replaced by '-'.
$transcriptDir = Join-Path "$env:USERPROFILE\.claude\projects" ($Project -replace '[^A-Za-z0-9]', '-')
$sessionsCsv = Join-Path $DataDir 'sessions.csv'
$agentsCsv = Join-Path $DataDir 'agents.csv'

function Get-SessionFiles($id) {
    $main = Join-Path $transcriptDir "$id.jsonl"
    return @($main) + @(Get-ChildItem (Join-Path $transcriptDir "$id\subagents") -Filter *.jsonl -ErrorAction SilentlyContinue | ForEach-Object FullName)
}

function Get-TextLength($content) {
    if ($null -eq $content) { return 0 }
    if ($content -is [string]) { return $content.Length }
    $sum = 0
    foreach ($c in $content) { if ($c.text) { $sum += $c.text.Length } }
    return $sum
}

function Get-Text($content) {
    if ($null -eq $content) { return '' }
    if ($content -is [string]) { return $content }
    return (@($content | Where-Object { $_.text } | ForEach-Object { $_.text }) -join "`n")
}

function Get-AgentName($file) {
    if ($file -like '*\subagents\*') { return [IO.Path]::GetFileNameWithoutExtension($file) -replace '^agent-', '' }
    return 'main'
}

function Get-AgentMeta($file) {
    $meta = [IO.Path]::ChangeExtension($file, '.meta.json')
    if (Test-Path $meta) { return (Get-Content $meta -Raw | ConvertFrom-Json) }
    return $null
}

# --- Excerpt modes -------------------------------------------------------------------------------------------------

if ($Brief -or $Find -or $Timeline) {
    if (-not $SessionId) { $SessionId = (Get-ChildItem $transcriptDir -File -Filter *.jsonl | Sort-Object LastWriteTime -Descending | Select-Object -First 1).BaseName }
    $SessionId = (Get-ChildItem $transcriptDir -File -Filter "$SessionId*.jsonl" | Select-Object -First 1).BaseName
    $files = Get-SessionFiles $SessionId
}

if ($Timeline) {
    $file = $files | Where-Object { (Get-AgentName $_) -like "$Timeline*" } | Select-Object -First 1
    $out = New-Object System.Text.StringBuilder
    [void]$out.Append("## Timeline: $(Get-AgentName $file)`n`nN time ctxK cacheWriteK | tools | chars added after the call (tool results + messages)`n")
    $seen = @{}; $n = 0; $line = $null; $added = 0
    $flush = { if ($line) { [void]$out.Append("$line| +$([math]::Round($added / 1000, 1))k`n") } }
    foreach ($l in [IO.File]::ReadLines($file)) {
        $e = $l | ConvertFrom-Json
        if ($e.type -eq 'assistant') {
            $id = $e.message.id
            if ($id -and -not $seen.ContainsKey($id) -and $e.message.usage) {
                $seen[$id] = $true; & $flush; $added = 0; $n++
                $u = $e.message.usage
                $ctx = [long]$u.input_tokens + [long]$u.cache_creation_input_tokens + [long]$u.cache_read_input_tokens
                $line = "$n $(([datetime]$e.timestamp).ToString('HH:mm')) $([math]::Round($ctx / 1000)) $([math]::Round([long]$u.cache_creation_input_tokens / 1000, 1)) | "
            }
            foreach ($c in $e.message.content) { if ($c.type -eq 'tool_use') { $line += "$($c.name) " } }
        }
        if ($e.type -eq 'user') {
            if ($e.message.content -is [string]) { $added += $e.message.content.Length }
            else { foreach ($c in $e.message.content) { if ($c.type -eq 'tool_result') { $added += Get-TextLength $c.content } elseif ($c.text) { $added += $c.text.Length } } }
        }
    }
    & $flush
    $s = $out.ToString()
    if ($s.Length -gt $MaxChars) { $s = $s.Substring(0, $MaxChars) + "`n[truncated at $MaxChars chars]" }
    $s
    return
}

# Searchable texts of one transcript entry: user prompts, assistant text, tool inputs and tool results.
function Get-EntryTexts($e) {
    if ($e.type -eq 'user') {
        if ($e.message.content -is [string]) { return @($e.message.content) }
        return @($e.message.content | Where-Object { $_.type -eq 'tool_result' } | ForEach-Object { Get-Text $_.content })
    }
    if ($e.type -eq 'assistant') {
        return @($e.message.content | ForEach-Object {
            if ($_.type -eq 'text') { $_.text } elseif ($_.type -eq 'tool_use') { $_.input | ConvertTo-Json -Compress -Depth 5 }
        })
    }
    return @()
}

if ($Brief -or $Find) {
    $target = if ($Brief) { $Brief } else { $Agent }
    $out = New-Object System.Text.StringBuilder
    foreach ($file in $files | Where-Object { -not $target -or (Get-AgentName $_) -like "$target*" }) {
        $name = Get-AgentName $file
        foreach ($line in [IO.File]::ReadLines($file)) {
            if ($out.Length -ge $MaxChars) { break }
            $e = $line | ConvertFrom-Json
            if ($Brief) {
                if ($e.type -eq 'user') { [void]$out.Append("## Brief: $name`n`n$(Get-Text $e.message.content)`n"); break }
                continue
            }
            foreach ($text in Get-EntryTexts $e) {
                if (-not $text) { continue }
                $shownUntil = -1
                foreach ($m in [regex]::Matches($text, $Find)) {
                    if ($out.Length -ge $MaxChars) { break }
                    if ($m.Index -lt $shownUntil) { continue }
                    $start = [math]::Max(0, $m.Index - 200)
                    $snippet = $text.Substring($start, [math]::Min($text.Length - $start, $m.Index - $start + $m.Length + 200))
                    $shownUntil = $start + $snippet.Length
                    [void]$out.Append("- [$name $($e.type) $($e.timestamp)] ...$($snippet -replace '\s+', ' ')...`n")
                }
            }
        }
    }
    $s = $out.ToString()
    if (-not $s) { $s = 'No match.' }
    if ($s.Length -gt $MaxChars) { $s = $s.Substring(0, $MaxChars) + "`n[truncated at $MaxChars chars]" }
    $s
    return
}

# --- Metrics -------------------------------------------------------------------------------------------------------

# Engine versions over time, from the history of plugin.json in this repository. A session gets the version of the
# last commit before it started; edits not yet committed at that time are not visible here.
$engineRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$engineVersions = @(git -C $engineRoot log --reverse --format='%cI %H' -- plugins/stack/.claude-plugin/plugin.json | ForEach-Object {
    $date, $hash = $_ -split ' '
    $json = (git -C $engineRoot show "${hash}:plugins/stack/.claude-plugin/plugin.json") -join "`n"
    [pscustomobject]@{ Date = [datetime]$date; Version = ($json | ConvertFrom-Json).version }
})

function Get-EngineVersion($start, $injected) {
    if (-not $injected) { return 'off' }
    $v = 'unknown'
    foreach ($x in $engineVersions) { if ($x.Date -le $start) { $v = $x.Version } }
    return $v
}

# Commits in the project made between the session's first and last entry, on any branch.
function Get-GitStats($first, $last) {
    $range = @('--all', '--no-merges', "--since=$($first.ToString('o'))", "--until=$($last.ToString('o'))")
    $subjects = @(git -C $Project log @range --format=%s 2>$null)
    $lines = 0
    foreach ($s in @(git -C $Project log @range --shortstat --format= 2>$null)) {
        foreach ($m in [regex]::Matches($s, '(\d+) (insertion|deletion)')) { $lines += [int]$m.Groups[1].Value }
    }
    return [pscustomobject]@{
        Commits = $subjects.Count
        FixCommits = @($subjects | Where-Object { $_ -match '^fix(\(|:|!)' }).Count
        LinesChanged = $lines
    }
}

$pathPattern = '(?:[\w.-]+[/\\])+[\w.-]+'
$rangePattern = '(?:[\w.-]+[/\\])*[\w.-]+\.\w+(?::\d+(?:-\d+)?|#\w+)'

function Measure-Transcript($file) {
    $seen = @{}; $toolCounts = @{}; $fullReads = @{}; $toolNames = @{}
    $inTok = 0; $cacheWrite = 0; $cacheRead = 0; $outTok = 0; $calls = 0; $peak = 0
    $first = $null; $last = $null; $model = ''; $brief = $null; $status = ''; $injected = $false
    $searches = 0; $searchesBeforeEdit = 0; $edited = $false; $bigReads = 0; $big = @()
    $name = Get-AgentName $file
    foreach ($line in [IO.File]::ReadLines($file)) {
        $e = $line | ConvertFrom-Json
        if ($e.timestamp) {
            $t = [datetime]$e.timestamp
            if (-not $first) { $first = $t }
            $last = $t
        }
        if ($e.type -eq 'attachment' -and $e.attachment.type -eq 'hook_additional_context' -and
            (@($e.attachment.content) -join "`n") -like '*# stack: orchestrator rules*') { $injected = $true }
        if ($e.type -eq 'user' -and $null -eq $brief -and
            ($e.message.content -is [string] -or -not @($e.message.content | Where-Object { $_.type -eq 'tool_result' }))) {
            $brief = Get-Text $e.message.content
        }
        if ($e.type -eq 'assistant') {
            foreach ($c in $e.message.content) {
                if ($c.type -eq 'tool_use') {
                    $toolNames[$c.id] = $c.name
                    $toolCounts[$c.name] = 1 + [int]$toolCounts[$c.name]
                    if ($c.name -in 'Grep', 'Glob') { $searches++; if (-not $edited) { $searchesBeforeEdit++ } }
                    if ($c.name -in 'Edit', 'Write', 'NotebookEdit') { $edited = $true }
                    if ($c.name -eq 'Read' -and -not $c.input.limit -and $c.input.file_path -notlike '*\.claude\project.md') { $fullReads[$c.id] = $true }
                    # A subagent may deliver its return through a handback tool instead of a final text message.
                    if ($c.input.message -is [string] -and $c.input.message -match 'Status:\s*\**\s*(done|partial|blocked)') { $status = $Matches[1] }
                }
                if ($c.type -eq 'text' -and $c.text -match 'Status:\s*\**\s*(done|partial|blocked)') { $status = $Matches[1] }
            }
            # One API response is split into several lines (one per content block) that repeat the same usage.
            $id = $e.message.id
            # Synthetic messages (interruptions, errors) are written by Claude Code, not returned by the API.
            if ($id -and -not $seen.ContainsKey($id) -and $e.message.usage -and $e.message.model -ne '<synthetic>') {
                $seen[$id] = $true
                $u = $e.message.usage
                $calls++; $model = $e.message.model
                $inTok += [long]$u.input_tokens; $cacheWrite += [long]$u.cache_creation_input_tokens
                $cacheRead += [long]$u.cache_read_input_tokens; $outTok += [long]$u.output_tokens
                $ctx = [long]$u.input_tokens + [long]$u.cache_creation_input_tokens + [long]$u.cache_read_input_tokens
                if ($ctx -gt $peak) { $peak = $ctx }
            }
        }
        if ($e.type -eq 'user' -and $e.message.content -isnot [string]) {
            foreach ($c in $e.message.content) {
                if ($c.type -eq 'tool_result') {
                    $text = Get-Text $c.content
                    if ($fullReads.ContainsKey($c.tool_use_id) -and ($text -split "`n").Count -gt 200) { $bigReads++ }
                    $big += [pscustomobject]@{ Agent = $name; Tool = $toolNames[$c.tool_use_id]; KChars = [math]::Round($text.Length / 1000, 1) }
                }
            }
        }
    }
    $meta = Get-AgentMeta $file
    if ($null -eq $brief) { $brief = '' }
    $total = $inTok + $cacheWrite + $cacheRead
    $task = ($brief -replace '\s+', ' ')
    if ($task.Length -gt 70) { $task = $task.Substring(0, 70) + '...' }
    return [pscustomobject]@{
        Agent = $name
        Type = if ($name -eq 'main') { 'main' } elseif ($meta) { $meta.agentType } else { '' }
        Model = $model; Calls = $calls; PeakK = [math]::Round($peak / 1000)
        InputK = [math]::Round($total / 1000)
        WeightedK = [math]::Round(($inTok + 1.25 * $cacheWrite + 0.1 * $cacheRead) / 1000)
        CacheReadPct = if ($total -gt 0) { [math]::Round(100 * $cacheRead / $total) } else { 0 }
        OutputK = [math]::Round($outTok / 1000, 1)
        Minutes = if ($first) { [math]::Round(($last - $first).TotalMinutes, 1) } else { 0 }
        BriefChars = $brief.Length
        BriefPaths = @([regex]::Matches($brief, $pathPattern) | ForEach-Object Value | Sort-Object -Unique).Count
        BriefRanges = @([regex]::Matches($brief, $rangePattern) | ForEach-Object Value | Sort-Object -Unique).Count
        SearchesBeforeEdit = $searchesBeforeEdit; Searches = $searches; BigReads = $bigReads
        Status = if ($name -eq 'main') { '' } elseif ($status) { $status } else { 'none' }
        Tools = ($toolCounts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "$($_.Key) x$($_.Value)" }) -join ' '
        Task = $task
        First = $first; Last = $last; Injected = $injected; Big = $big
    }
}

function Measure-Session($id) {
    $agents = @(Get-SessionFiles $id | ForEach-Object { Measure-Transcript $_ })
    $main = $agents | Where-Object { $_.Agent -eq 'main' }
    $subs = @($agents | Where-Object { $_.Agent -ne 'main' })
    $git = Get-GitStats $main.First $main.Last
    $session = [pscustomobject]@{
        project = $projectName; session = $id; date = $main.First.ToString('yyyy-MM-dd')
        engine = Get-EngineVersion $main.First $main.Injected; kind = ''; itemsDone = ''
        totalInputK = ($agents | Measure-Object InputK -Sum).Sum
        weightedInputK = ($agents | Measure-Object WeightedK -Sum).Sum
        wallMin = $main.Minutes; mainModel = $main.Model; mainPeakK = $main.PeakK; mainCalls = $main.Calls
        mainInputK = $main.InputK; agents = $subs.Count
        agentsPeakOver150k = @($subs | Where-Object { $_.PeakK -gt 150 }).Count
        agentsPartial = @($subs | Where-Object { $_.Status -eq 'partial' }).Count
        agentsBlocked = @($subs | Where-Object { $_.Status -eq 'blocked' }).Count
        agentsNoStatus = @($subs | Where-Object { $_.Status -eq 'none' }).Count
        bigReads = ($agents | Measure-Object BigReads -Sum).Sum
        commits = $git.Commits; fixCommits = $git.FixCommits; linesChanged = $git.LinesChanged
    }
    $rows = $agents | ForEach-Object {
        [pscustomobject]@{
            project = $projectName; session = $id; agent = $_.Agent; type = $_.Type; model = $_.Model; calls = $_.Calls
            peakK = $_.PeakK; inputK = $_.InputK; weightedK = $_.WeightedK; outputK = $_.OutputK; minutes = $_.Minutes
            briefChars = $_.BriefChars; briefPaths = $_.BriefPaths; briefRanges = $_.BriefRanges
            searchesBeforeEdit = $_.SearchesBeforeEdit; searches = $_.Searches; bigReads = $_.BigReads
            status = $_.Status; tools = $_.Tools
        }
    }
    return [pscustomobject]@{ Session = $session; Agents = $agents; Rows = @($rows) }
}

function Format-AgentTable($agents, [switch]$WithSession) {
    $sessionCol = if ($WithSession) { '| Session ' } else { '' }
    "$sessionCol| Agent | Type | Model | Calls | PeakK | InputK | WeightedK | Cache read % | Min | Brief chars / paths / ranges | Searches (before edit) | Big reads | Status | Tools | Task |"
    "$(if ($WithSession) { '|---' })|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"
    foreach ($a in $agents) {
        $s = if ($WithSession) { "| $($a.SessionShort) " } else { '' }
        "$s| $($a.Agent) | $($a.Type) | $($a.Model) | $($a.Calls) | $($a.PeakK) | $($a.InputK) | $($a.WeightedK) | $($a.CacheReadPct) | $($a.Minutes) | $($a.BriefChars) / $($a.BriefPaths) / $($a.BriefRanges) | $($a.Searches) ($($a.SearchesBeforeEdit)) | $($a.BigReads) | $($a.Status) | $($a.Tools) | $($a.Task -replace '\|', '/') |"
    }
}

function Format-SessionTable($sessions) {
    '| Session | Date | Engine | WeightedK | InputK | Wall min | Main peakK / calls | Agents | Peak>150k | Partial / blocked / no status | Big reads | Commits (fix) | Lines |'
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|'
    foreach ($s in $sessions) {
        "| $($s.session.Substring(0, 8)) | $($s.date) | $($s.engine) | $($s.weightedInputK) | $($s.totalInputK) | $($s.wallMin) | $($s.mainPeakK) / $($s.mainCalls) | $($s.agents) | $($s.agentsPeakOver150k) | $($s.agentsPartial) / $($s.agentsBlocked) / $($s.agentsNoStatus) | $($s.bigReads) | $($s.commits) ($($s.fixCommits)) | $($s.linesChanged) |"
    }
}

$legend = 'PeakK = largest single-call context. InputK = all input tokens over all calls (incl. cache reads). WeightedK = input weighted by price: cache reads 0.1x, cache writes 1.25x. Brief paths = distinct paths in the first prompt; ranges = path:line or path#symbol. Big reads = whole-file Reads over 200 lines (the contract excluded).'

if ($Pending) {
    $recorded = @()
    if (Test-Path $sessionsCsv) { $recorded = @(Import-Csv $sessionsCsv | Where-Object { $_.project -eq $projectName } | ForEach-Object session) }
    $cutoff = (Get-Date).AddMinutes(-$MinIdleMinutes)
    $ids = @(Get-ChildItem $transcriptDir -File -Filter *.jsonl | Where-Object { $_.LastWriteTime -ge $Since -and $_.LastWriteTime -lt $cutoff } |
        Sort-Object LastWriteTime | ForEach-Object BaseName |
        Where-Object { $id = $_; -not ($recorded | Where-Object { $id.StartsWith($_) }) })
    if (-not $ids) { "No pending sessions for $projectName."; return }
    $results = @($ids | ForEach-Object { Measure-Session $_ })
    $allAgents = @($results | ForEach-Object { $short = $_.Session.session.Substring(0, 8); $_.Agents | ForEach-Object { $_ | Add-Member SessionShort $short -PassThru } })
    "# Pending sessions: $projectName ($($ids.Count))"
    ''
    $legend
    ''
    Format-SessionTable ($results | ForEach-Object Session)
    ''
    "## Most expensive agents (top $Top by WeightedK)"
    ''
    Format-AgentTable ($allAgents | Sort-Object WeightedK -Descending | Select-Object -First $Top) -WithSession
    ''
    "## Largest tool results (top $Top)"
    ''
    '| Session | Agent | Tool | K chars |'
    '|---|---|---|---|'
    $results | ForEach-Object { $short = $_.Session.session.Substring(0, 8); $_.Agents | ForEach-Object { $_.Big } | ForEach-Object { $_ | Add-Member SessionShort $short -PassThru } } |
        Sort-Object KChars -Descending | Select-Object -First $Top | ForEach-Object { "| $($_.SessionShort) | $($_.Agent) | $($_.Tool) | $($_.KChars) |" }
    if ($Record) {
        New-Item -ItemType Directory -Force $DataDir | Out-Null
        $results | ForEach-Object Session | Export-Csv $sessionsCsv -Append -NoTypeInformation -Encoding UTF8
        $results | ForEach-Object { $_.Rows } | Export-Csv $agentsCsv -Append -NoTypeInformation -Encoding UTF8
        ''
        "Recorded $($ids.Count) sessions in $sessionsCsv and their agents in $agentsCsv."
    }
    return
}

if (-not $SessionId) { $SessionId = (Get-ChildItem $transcriptDir -File -Filter *.jsonl | Sort-Object LastWriteTime -Descending | Select-Object -First 1).BaseName }
$SessionId = (Get-ChildItem $transcriptDir -File -Filter "$SessionId*.jsonl" | Select-Object -First 1).BaseName
$result = Measure-Session $SessionId
"# Session metrics: $projectName $SessionId"
''
$legend
''
Format-SessionTable @($result.Session)
''
Format-AgentTable $result.Agents
''
"## Largest tool results (top $Top)"
''
'| Agent | Tool | K chars |'
'|---|---|---|'
$result.Agents | ForEach-Object { $_.Big } | Sort-Object KChars -Descending | Select-Object -First $Top | ForEach-Object { "| $($_.Agent) | $($_.Tool) | $($_.KChars) |" }
