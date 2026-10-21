# Summarises Claude Code session transcripts of one project (main session + subagents) into compact markdown:
# tokens, model calls, tool usage, duration, brief and reading indicators, the largest tool results and the commits
# made during the session. With -Record it appends the rows to diagnostics/sessions.csv and agents.csv. Used by the
# doctor agent so it never has to read raw transcripts.
#
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools/session-metrics/session_metrics.ps1 -Project <repo> ...
#   [-SessionId <uuid or prefix>]       report for one session; default: the newest session of the project
#   -Pending [-Since <date>] [-Record]  report for every finished session not yet in sessions.csv; -Record appends it
#
# A transcript missing in ~\.claude\projects\<project> is read from ~\.claude\stack-archive\<project> (copies written by
# the plugin's Stop hook); the original wins when both exist.
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
# Copies of the transcripts written by the plugin's Stop hook; used for what is missing in $transcriptDir.
$archiveDir = Join-Path "$env:USERPROFILE\.claude\stack-archive" (Split-Path $transcriptDir -Leaf)

# Main transcripts of the project, from the archive and the original folder; the original wins when both exist.
function Get-MainTranscripts {
    $all = @{}
    foreach ($d in $archiveDir, $transcriptDir) {
        Get-ChildItem $d -File -Filter *.jsonl -ErrorAction SilentlyContinue | ForEach-Object { $all[$_.BaseName] = $_ }
    }
    return @($all.Values)
}

function Get-SessionFiles($id) {
    $main = @($transcriptDir, $archiveDir | ForEach-Object { Join-Path $_ "$id.jsonl" } | Where-Object { Test-Path $_ })[0]
    $subs = @{}
    foreach ($d in $archiveDir, $transcriptDir) {
        Get-ChildItem (Join-Path $d "$id\subagents") -Filter *.jsonl -ErrorAction SilentlyContinue | ForEach-Object { $subs[$_.Name] = $_.FullName }
    }
    return @($main) + @($subs.Values | Sort-Object { Split-Path $_ -Leaf })
}

# Appends rows to a CSV file. When the rows have columns the file lacks, the old rows are kept as they are and get
# empty values for the new columns (which must come last).
function Add-CsvRows($path, $rows) {
    $rows = @($rows)
    if (-not $rows) { return }
    $old = @()
    if (Test-Path $path) { $old = @(Import-Csv $path) }
    if ($old.Count -gt 0) {
        $have = @($old[0].PSObject.Properties.Name)
        $missing = @($rows[0].PSObject.Properties.Name | Where-Object { $_ -notin $have })
        if ($missing.Count -gt 0) {
            foreach ($o in $old) { foreach ($m in $missing) { $o | Add-Member -NotePropertyName $m -NotePropertyValue '' } }
            @($old) + $rows | Export-Csv $path -NoTypeInformation -Encoding UTF8
            return
        }
    }
    $rows | Export-Csv $path -Append -NoTypeInformation -Encoding UTF8
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
    if (-not $SessionId) { $SessionId = (Get-MainTranscripts | Sort-Object LastWriteTime -Descending | Select-Object -First 1).BaseName }
    $SessionId = (Get-MainTranscripts | Where-Object { $_.Name -like "$SessionId*" } | Select-Object -First 1).BaseName
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
# Tests: files under tests/ or named *_test.* / *.test.*, and shell commands that run a test suite.
$testPathPattern = '(?i)(^|[\\/])tests[\\/]|_test\.[^\\/]*$|\.test\.[^\\/]*$'
$testCmdPattern = '(?i)\bctest\b|_tests\.exe\b|\bnpm\s+(run\s+)?test\b|\bpytest\b|-m\s+(pytest|unittest)\b|\b(dotnet|go|cargo)\s+test\b|\b(jest|vitest|mocha)\b|\bnode\s+--test\b'
$testOutPattern = 'All tests passed|test cases:|\d+% tests passed|tests failed out of|assertions:|\d+ tests? passed'
$testRedPattern = 'The following tests FAILED|\*\*\*Failed|\[\s*FAILED\s*\]|(?<![\w-])[1-9]\d* failed\b|Tests:\s+\d+ failed|FAILED\s+\S+::|\b[1-9]\d* tests? failed'
$nonTestCmd = '^\s*(git|Get-Content|cat|Select-String|rg|grep)\b'
# Brief of an agent that fixes review findings.
$fixPattern = '(?i)finding|review fix|fixes from review|poprawk'

function Get-Median($values) {
    $s = @($values | Sort-Object)
    if ($s.Count -eq 0) { return 0 }
    if ($s.Count % 2) { return $s[($s.Count - 1) / 2] }
    return ($s[$s.Count / 2 - 1] + $s[$s.Count / 2]) / 2
}

function Measure-Transcript($file) {
    $seen = @{}; $toolCounts = @{}; $fullReads = @{}; $toolNames = @{}; $callRecs = @{}; $toolRecs = @{}
    $inTok = 0; $cacheWrite = 0; $cacheRead = 0; $outTok = 0; $calls = 0; $peak = 0; $runCost = 0.0
    $first = $null; $last = $null; $model = ''; $brief = $null; $status = ''; $injected = $false
    $searches = 0; $searchesBeforeEdit = 0; $edited = $false; $bigReads = 0; $big = @(); $firstEdit = $null
    $name = Get-AgentName $file
    $entries = New-Object System.Collections.ArrayList
    foreach ($line in [IO.File]::ReadLines($file)) {
        $e = $line | ConvertFrom-Json
        $t = $null
        if ($e.timestamp) {
            $t = [datetime]$e.timestamp
            if (-not $first) { $first = $t }
            $last = $t
        }
        if ($e.type -eq 'attachment' -and $e.attachment.type -eq 'hook_additional_context' -and
            (@($e.attachment.content) -join "`n") -like '*# stack: orchestrator rules*') { $injected = $true }
        if ($e.type -eq 'user') {
            $hasResult = $e.message.content -isnot [string] -and @($e.message.content | Where-Object { $_.type -eq 'tool_result' }).Count -gt 0
            if ($null -eq $brief -and -not $hasResult) { $brief = Get-Text $e.message.content }
            if ($name -eq 'main' -and $t) {
                # A real prompt is one the user typed, not a tool result, notification or injected reminder.
                $real = $false
                if (-not $hasResult -and -not $e.isMeta) { $real = (Get-Text $e.message.content) -notmatch '^\s*<(task-notification|system-reminder|command-|local-command)' }
                [void]$entries.Add([pscustomobject]@{ Ts = $t; Kind = 'user'; Real = $real })
            }
        }
        if ($e.type -eq 'assistant') {
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
                $cost = ([long]$u.input_tokens + 1.25 * [long]$u.cache_creation_input_tokens + 0.1 * [long]$u.cache_read_input_tokens) / 1000
                $callRecs[$id] = [pscustomobject]@{ Idx = $calls; Ts = $t; CtxK = $ctx / 1000; Cost = $cost; CostBefore = $runCost; Tools = 0; TextLen = 0 }
                $runCost += $cost
            }
            $call = if ($id) { $callRecs[$id] } else { $null }
            if ($name -eq 'main' -and $t -and $call) { [void]$entries.Add([pscustomobject]@{ Ts = $t; Kind = 'assistant'; Real = $false }) }
            foreach ($c in $e.message.content) {
                if ($c.type -eq 'tool_use') {
                    $toolNames[$c.id] = $c.name
                    $toolCounts[$c.name] = 1 + [int]$toolCounts[$c.name]
                    if ($c.name -in 'Grep', 'Glob') { $searches++; if (-not $edited) { $searchesBeforeEdit++ } }
                    if ($c.name -in 'Edit', 'Write', 'NotebookEdit') { if (-not $edited -and $call) { $firstEdit = $call }; $edited = $true }
                    if ($c.name -eq 'Read' -and -not $c.input.limit -and $c.input.file_path -notlike '*\.claude\project.md') { $fullReads[$c.id] = $true }
                    # A subagent may deliver its return through a handback tool instead of a final text message.
                    if ($c.input.message -is [string] -and $c.input.message -match 'Status:\s*\**\s*(done|partial|blocked)') { $status = $Matches[1] }
                    if ($call) { $call.Tools++ }
                    $shell = $c.name -in 'PowerShell', 'Bash'
                    $cmd = ''; $isTest = $false
                    if ($shell) {
                        $cmd = "$($c.input.command)" -replace '\$(cl|env:[A-Za-z_]+)\s*=\s*("[^"]*"|''[^'']*'')\s*;?', ''
                        $isTest = $cmd -notmatch $nonTestCmd -and $cmd -match $testCmdPattern
                    } elseif ($c.name -in 'Edit', 'Write', 'NotebookEdit') {
                        $isTest = "$($c.input.file_path)$($c.input.notebook_path)" -match $testPathPattern
                    }
                    $toolRecs[$c.id] = [pscustomobject]@{ Call = $call; Shell = $shell; Cmd = $cmd; Test = $isTest; Run = ($shell -and $isTest); Red = $false }
                }
                if ($c.type -eq 'text') {
                    if ($c.text -match 'Status:\s*\**\s*(done|partial|blocked)') { $status = $Matches[1] }
                    if ($call -and $c.text.Trim().Length -gt 0) { $call.TextLen += $c.text.Length }
                }
            }
        }
        if ($e.type -eq 'user' -and $e.message.content -isnot [string]) {
            foreach ($c in $e.message.content) {
                if ($c.type -eq 'tool_result') {
                    $text = Get-Text $c.content
                    if ($fullReads.ContainsKey($c.tool_use_id) -and ($text -split "`n").Count -gt 200) { $bigReads++ }
                    $big += [pscustomobject]@{ Agent = $name; Tool = $toolNames[$c.tool_use_id]; KChars = [math]::Round($text.Length / 1000, 1) }
                    $rec = $toolRecs[$c.tool_use_id]
                    if ($rec -and $rec.Shell) {
                        # A command that does not look like a test run but prints test results is one.
                        if (-not $rec.Test -and $rec.Cmd -notmatch $nonTestCmd -and $text -match $testOutPattern) { $rec.Test = $true; $rec.Run = $true }
                        if ($rec.Run -and $text -match $testRedPattern) { $rec.Red = $true }
                    }
                }
            }
        }
    }
    $meta = Get-AgentMeta $file
    if ($null -eq $brief) { $brief = '' }
    $total = $inTok + $cacheWrite + $cacheRead
    $task = ($brief -replace '\s+', ' ')
    if ($task.Length -gt 70) { $task = $task.Substring(0, 70) + '...' }
    $type = if ($name -eq 'main') { 'main' } elseif ($meta) { $meta.agentType } else { '' }
    # Test work: tool calls that write tests or run them; a call's cost is shared among the tools it called.
    $testCalls = 0; $testWK = 0.0; $testRunsRed = 0
    foreach ($r in $toolRecs.Values) {
        if ($r.Test) { $testCalls++; if ($r.Call) { $testWK += $r.Call.Cost / [math]::Max(1, $r.Call.Tools) } }
        if ($r.Run -and $r.Red) { $testRunsRed++ }
    }
    $textMsgs = @($callRecs.Values | Where-Object { $_.TextLen -gt 0 } | Sort-Object Idx | ForEach-Object { [pscustomobject]@{ Ts = $_.Ts; Len = $_.TextLen } })
    return [pscustomobject]@{
        Agent = $name
        Type = $type
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
        StartedAt = if ($first) { $first.ToString('o') } else { '' }
        EndedAt = if ($last) { $last.ToString('o') } else { '' }
        FirstEditCall = if ($firstEdit) { $firstEdit.Idx } else { '' }
        FirstEditK = if ($firstEdit) { [math]::Round($firstEdit.CtxK) } else { '' }
        WKBeforeEdit = if ($firstEdit) { [math]::Round($firstEdit.CostBefore) } else { '' }
        TestCalls = $testCalls; TestWK = [math]::Round($testWK, 1); TestRunsRed = $testRunsRed
        Role = if ($name -ne 'main' -and $type -notmatch 'review|verif|research' -and $brief -match $fixPattern) { 'fix' } else { '' }
        First = $first; Last = $last; Injected = $injected; Big = $big; TextMsgs = $textMsgs; Entries = $entries
    }
}

# Session-level measures of the main session's messages and of how long subagents ran in parallel with it.
function Measure-Overlap($main, $subs) {
    $texts = @($main.TextMsgs)
    $lens = @($texts | ForEach-Object Len)
    $running = { param($t) @($subs | Where-Object { $_.First -le $t -and $_.Last -ge $t }).Count }
    $long = 0
    if ($texts.Count -gt 1) { $long = @($texts[0..($texts.Count - 2)] | Where-Object { $_.Len -gt 500 }).Count }
    $whileAgents = @($texts | Where-Object { (& $running $_.Ts) -gt 0 }).Count

    # Concurrency: sweep over the starts and ends of the subagents, clipped to the main session's window.
    $wS = $main.First; $wE = $main.Last
    $events = @()
    foreach ($s in $subs) {
        $events += [pscustomobject]@{ T = [math]::Max(0, ($s.First - $wS).TotalSeconds); D = 1 }
        $events += [pscustomobject]@{ T = [math]::Min(($wE - $wS).TotalSeconds, ($s.Last - $wS).TotalSeconds); D = -1 }
    }
    $level = 0; $prev = 0; $maxLevel = 0; $secs2 = 0.0
    foreach ($x in @($events | Sort-Object T, D)) {
        if ($level -ge 2) { $secs2 += $x.T - $prev }
        $prev = $x.T; $level += $x.D
        if ($level -gt $maxLevel) { $maxLevel = $level }
    }

    # Gaps over 60 s between entries of the main session while a subagent ran (a gap that ends with the user's
    # own prompt is the user's time, not waiting).
    $wait = 0.0
    $et = @($main.Entries | Sort-Object Ts)
    for ($i = 1; $i -lt $et.Count; $i++) {
        $g = ($et[$i].Ts - $et[$i - 1].Ts).TotalSeconds
        if ($g -le 60 -or ($et[$i].Kind -eq 'user' -and $et[$i].Real)) { continue }
        if ((& $running $et[$i - 1].Ts.AddSeconds($g / 2)) -gt 0) { $wait += $g }
    }
    return [pscustomobject]@{
        mainMsgs = $texts.Count
        mainMsgChars = ($lens | Measure-Object -Sum).Sum
        mainMsgMedian = [math]::Round((Get-Median $lens), 1)
        mainMsgMax = ($lens | Measure-Object -Maximum).Maximum
        mainMsgsLong = $long
        mainMsgsWhileAgents = $whileAgents
        maxConcurrent = $maxLevel
        concurrentMin2 = [math]::Round($secs2 / 60, 1)
        mainWaitMin = [math]::Round($wait / 60, 1)
    }
}

function Measure-Session($id) {
    $agents = @(Get-SessionFiles $id | ForEach-Object { Measure-Transcript $_ })
    $main = $agents | Where-Object { $_.Agent -eq 'main' }
    $subs = @($agents | Where-Object { $_.Agent -ne 'main' })
    $git = Get-GitStats $main.First $main.Last
    $overlap = Measure-Overlap $main $subs
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
        mainMsgs = $overlap.mainMsgs; mainMsgChars = $overlap.mainMsgChars; mainMsgMedian = $overlap.mainMsgMedian
        mainMsgMax = $overlap.mainMsgMax; mainMsgsLong = $overlap.mainMsgsLong
        mainMsgsWhileAgents = $overlap.mainMsgsWhileAgents; maxConcurrent = $overlap.maxConcurrent
        concurrentMin2 = $overlap.concurrentMin2; mainWaitMin = $overlap.mainWaitMin
    }
    $rows = $agents | ForEach-Object {
        [pscustomobject]@{
            project = $projectName; session = $id; agent = $_.Agent; type = $_.Type; model = $_.Model; calls = $_.Calls
            peakK = $_.PeakK; inputK = $_.InputK; weightedK = $_.WeightedK; outputK = $_.OutputK; minutes = $_.Minutes
            briefChars = $_.BriefChars; briefPaths = $_.BriefPaths; briefRanges = $_.BriefRanges
            searchesBeforeEdit = $_.SearchesBeforeEdit; searches = $_.Searches; bigReads = $_.BigReads
            status = $_.Status; tools = $_.Tools
            startedAt = $_.StartedAt; endedAt = $_.EndedAt; firstEditCall = $_.FirstEditCall; firstEditK = $_.FirstEditK
            wKBeforeEdit = $_.WKBeforeEdit; testCalls = $_.TestCalls; testWK = $_.TestWK; testRunsRed = $_.TestRunsRed
            role = $_.Role
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

function Format-OverlapTable($sessions) {
    '| Session | Main msgs (long, while agents) | Msg chars / median / max | Max concurrent | Min with 2+ agents | Main wait min |'
    '|---|---|---|---|---|---|'
    foreach ($s in $sessions) {
        "| $($s.session.Substring(0, 8)) | $($s.mainMsgs) ($($s.mainMsgsLong), $($s.mainMsgsWhileAgents)) | $($s.mainMsgChars) / $($s.mainMsgMedian) / $($s.mainMsgMax) | $($s.maxConcurrent) | $($s.concurrentMin2) | $($s.mainWaitMin) |"
    }
}

function Format-EditTestTable($agents, [switch]$WithSession) {
    $sessionCol = if ($WithSession) { '| Session ' } else { '' }
    "$sessionCol| Agent | Type | Role | Started | First edit call / ctxK / wK before | Test calls / wK / red runs |"
    "$(if ($WithSession) { '|---' })|---|---|---|---|---|---|"
    foreach ($a in $agents) {
        $s = if ($WithSession) { "| $($a.SessionShort) " } else { '' }
        $edit = if ($a.FirstEditCall -ne '') { "$($a.FirstEditCall) / $($a.FirstEditK) / $($a.WKBeforeEdit)" } else { 'no edit' }
        "$s| $($a.Agent) | $($a.Type) | $($a.Role) | $($a.StartedAt.Substring(11, 8)) | $edit | $($a.TestCalls) / $($a.TestWK) / $($a.TestRunsRed) |"
    }
}

$legend = 'PeakK = largest single-call context. InputK = all input tokens over all calls (incl. cache reads). WeightedK = input weighted by price: cache reads 0.1x, cache writes 1.25x. Brief paths = distinct paths in the first prompt; ranges = path:line or path#symbol. Big reads = whole-file Reads over 200 lines (the contract excluded). Main msgs = text messages of the main session (long = over 500 chars, final message excluded; while agents = sent while a subagent ran). Wait = main session gaps over 60 s while a subagent ran. Test calls = Edit/Write on test paths and commands that run tests; red runs = test runs whose output shows failures.'

if ($Pending) {
    $recorded = @()
    if (Test-Path $sessionsCsv) { $recorded = @(Import-Csv $sessionsCsv | Where-Object { $_.project -eq $projectName } | ForEach-Object session) }
    $cutoff = (Get-Date).AddMinutes(-$MinIdleMinutes)
    $ids = @(Get-MainTranscripts | Where-Object { $_.LastWriteTime -ge $Since -and $_.LastWriteTime -lt $cutoff } |
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
    '## Main messages and overlap'
    ''
    Format-OverlapTable ($results | ForEach-Object Session)
    ''
    "## First edit and tests (the same agents)"
    ''
    Format-EditTestTable ($allAgents | Sort-Object WeightedK -Descending | Select-Object -First $Top) -WithSession
    ''
    "## Largest tool results (top $Top)"
    ''
    '| Session | Agent | Tool | K chars |'
    '|---|---|---|---|'
    $results | ForEach-Object { $short = $_.Session.session.Substring(0, 8); $_.Agents | ForEach-Object { $_.Big } | ForEach-Object { $_ | Add-Member SessionShort $short -PassThru } } |
        Sort-Object KChars -Descending | Select-Object -First $Top | ForEach-Object { "| $($_.SessionShort) | $($_.Agent) | $($_.Tool) | $($_.KChars) |" }
    if ($Record) {
        New-Item -ItemType Directory -Force $DataDir | Out-Null
        Add-CsvRows $sessionsCsv ($results | ForEach-Object Session)
        Add-CsvRows $agentsCsv ($results | ForEach-Object { $_.Rows })
        ''
        "Recorded $($ids.Count) sessions in $sessionsCsv and their agents in $agentsCsv."
    }
    return
}

if (-not $SessionId) { $SessionId = (Get-MainTranscripts | Sort-Object LastWriteTime -Descending | Select-Object -First 1).BaseName }
$SessionId = (Get-MainTranscripts | Where-Object { $_.Name -like "$SessionId*" } | Select-Object -First 1).BaseName
$result = Measure-Session $SessionId
"# Session metrics: $projectName $SessionId"
''
$legend
''
Format-SessionTable @($result.Session)
''
Format-AgentTable $result.Agents
''
'## Main messages and overlap'
''
Format-OverlapTable @($result.Session)
''
'## First edit and tests'
''
Format-EditTestTable $result.Agents
''
"## Largest tool results (top $Top)"
''
'| Agent | Tool | K chars |'
'|---|---|---|'
$result.Agents | ForEach-Object { $_.Big } | Sort-Object KChars -Descending | Select-Object -First $Top | ForEach-Object { "| $($_.Agent) | $($_.Tool) | $($_.KChars) |" }
