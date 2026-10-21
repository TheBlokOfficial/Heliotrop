# Diagnoza: sesja 16 KamReimagined, pierwsza na silniku 0.3.0 (2026-10-21)

Poprzedni raport: [2026-10-21-trial-kamreimagined.md](2026-10-21-trial-kamreimagined.md) (D1 to zatrzymany slice W6a, D3 to
kontynuacja agenta po 200k kontekstu). Tu go nie powtarzam; odwołuję się do niego tam, gdzie sesja 16 kontynuuje te wątki.

## Zakres

- Projekt: `D:\Projekty\KamReimagined`.
- Zarejestrowane w tym przebiegu (`-Pending -Record`, z `-MinIdleMinutes 1`, bo transkrypt miał 2 minuty od ostatniego
  zapisu, a raport sesji `docs/sessions/2026-10-21-merge-interp-w6.md` potwierdza zakończenie): **`a4c6a201`**, silnik
  **0.3.0**, 58,4 min, 10 subagentów `stack:*`, 4052 weightedK. To "Sesja 16" (potwierdzone datą, tematem i pierwszym
  promptem "Zaczynamy Sesję 16"). Dodano 11 wierszy do `agents.csv`.
- Uzupełnione `kind` i `itemsDone` w `sessions.csv` z raportów sesji projektu:

| Sesja | Raport | kind | itemsDone | Uzasadnienie |
|---|---|---|---|---|
| `a4c6a201` (0.3.0) | `2026-10-21-merge-interp-w6.md` | code | 3 | zakres sesji 3 części, wszystkie scalone do `main`: interpolacja i poprawki zwierząt, W6a, W6b |
| `00462fed` (0.2.0) | `2026-10-21-movement-w4-w6.md` (sesja 15) | code | 1 | tylko W4 scalone do `main`; interpolacja i poprawki zwierząt zbudowane, ale bez review i niescalone, W6a jako `wip` |
| `e7b254ca` (0.1.0) | `2026-10-21-stack-migration.md` | docs | 1 | migracja na silnik (punkt 1 "Następnych sesji") |

  Liczę "zamknięte" jako scalone lub ukończone, więc `00462fed` ma 1, a nie 4. Przy innym liczeniu (zbudowane i
  zacommitowane też się liczą) jego wskaźnik na item spadłby do ok. 640.
- **Brak transkryptów starszych sesji.** W `C:\Users\TheBlok\.claude\projects\D--Projekty-KamReimagined` jest tylko
  `a4c6a201*.jsonl`. Pozostałe 22 mają obok plik `*.desktop-released.json` z `"releasedAt": "2026-10-21T17:47:14Z",
  "reason": "delete"`: zostały usunięte o 19:47 czasu lokalnego, w trakcie sesji 16 (trwała 19:36-20:35). Konsekwencje dla
  pytań użytkownika: wszystko, co wymaga treści lub znaczników czasu (P1 porównanie z `00462fed` i `off`, P3, P4 dla
  `00462fed`, liczba ustaleń reviewerów starszych sesji), da się zmierzyć wyłącznie dla `a4c6a201`. Dla reszty mam tylko
  to, co trafiło do CSV, oraz raporty sesji. Mówię to wprost w każdej sekcji.
- Silniki w porównaniu wersji: `off`, 0.1.0, 0.2.0, 0.3.0 (n=1 w trzech ostatnich).
- Narzędzia: `tools/session-metrics/session_metrics.ps1` (`-Pending -Record`, `-Brief`, `-Find`) oraz **jednorazowy,
  tylko-do-odczytu skrypt `diagnostics/tmp/analyze.ps1`** (parsuje transkrypt i wypisuje liczby, długości, znaczniki
  czasu, nazwy kategorii; tryby `msgs`, `excerpt`, `time`, `tests`, `reviews`, `ret`, `seq`, `cmds`, `firstedit`,
  `maincost`). Czego zabrakło w skrypcie głównym, opisuję w Obserwacjach.
- Excerpty: 11 z 14 (komunikaty głównej sesji, lista komend jednego implementera, dwa `-Find` po błędach testów, sześć
  zwrotów reviewerów/verifierów/fixera, brief `a279c502`). Każdy do 4000 znaków. Tryby `time`, `tests`, `reviews`,
  `seq`, `firstedit`, `maincost` wypisują tylko liczby i kategorie, nie liczę ich jako excerpty.

## Koszty

`weightedK` = wejście ważone ceną cache (odczyty x0,1, zapisy x1,25), w tysiącach tokenów. Nie uwzględnia różnic cen
między modelami (opus/sonnet/haiku), więc nie jest kosztem w pieniądzach.

Sesja `a4c6a201` (0.3.0), 58,4 min, 4052 weightedK, 12 commitów (4 `fix`), 1645 linii:

| Składnik | n | weightedK | udział | peakK (min-max) | minuty (suma) |
|---|---|---|---|---|---|
| sesja główna (opus) | 1 | 685 | 16,9% | 59 -> 147 | 58,4 (wall) |
| implementerzy główni: W6a (`af537856`), W6b (`a279c502`) | 2 | 1741 | 43,0% | 161-167 | 32,6 |
| implementerzy poprawek po review (`af8d3665`, `a3197b14`, `a2eb6445`) | 3 | 994 | 24,5% | 64-116 | 26,5 |
| reviewerzy (`a0c8d0b7`, `a21286af`, `ad525b20`) | 3 | 543 | 13,4% | 65-91 | 9,6 |
| verifierzy (haiku: `a41cd070`, `a8fb3fb4`) | 2 | 89 | 2,2% | 23-25 | 10,2 |

Struktura sesji głównej (tylko `maincost`): 14 wywołań git (merge, commit, usuwanie gałęzi i worktree) = 175 (26% jej
kosztu), 12 wywołań kończących turę samym tekstem = 148 (22%), 12 `Edit` = 87 (13%), 10 `Agent` = 71 (10%), 7
`update_plan` = 56 (8%). Poprawka do poprzedniego raportu: w `00462fed` implementerzy kosztowali **1668** (65%), nie 1904
(74%); reviewer `abbe778b` 314 (12%), sesja główna 591 (23%).

## Diagnozy

### D1. Implementerzy główni czytają i szukają przez prawie połowę kontekstu przed pierwszą edycją (`a4c6a201`, `a279c502`, `af537856`)

- Dowody (`firstedit`): `a279c502` pierwsza edycja w wywołaniu 23 przy kontekście 93k, 19 odczytów i 18 wyszukiwań
  przed nią, 227 z 977 weightedK (23%) wydane przed pierwszą edycją; `af537856` wywołanie 26, kontekst 106k, 17 odczytów,
  11 wyszukiwań, 289 z 764 (38%). Szczyty 167k i 161k. Dla porównania implementerzy poprawek z lokalizacjami od
  reviewera: `a2eb6445` 8. wywołanie, 50k, 3 wyszukiwania; `a3197b14` 9., 53k, 3 wyszukiwania.
- Brief `a279c502` (excerpt): `Read:` zawiera sekcje dokumentów (`§6`, `§6.3`, "points 4 and 6"), ale kod ma opisany
  jako "the game's existing mission import (grep in src/game for where mission groups/units are created, e.g.
  `SET_GROUP`...)" i "src/game/src/application.cpp around line 320". `briefRanges` = 0 we wszystkich 10 briefach sesji.
  Format `path:start-end` z `orchestrator.md:80` nie został użyty, a lokalizację kodu W6b agent miał znaleźć sam.
- Przyczyna: **brief** (lokalizacje nieznane orkiestratorowi, zlecone do wyszukania) oraz **reguła silnika pominięta**
  `orchestrator.md:121-127` (mapa kodu przed dużą implementacją: "when the implementer would have to locate the code
  itself"). W sesji nie było ani jednego agenta `stack:researcher`. Nie sprawdziłem dziennika decyzji w pliku sesji pod
  kątem `deviation:`; raport sesji nie zawiera wpisu o pominięciu mapy.
- Poprawa względem 0.2.0/`off`: kontekst przy pierwszej edycji 93-106k wobec 136-138k (`ade2c669`, `a1dd0ab2` z
  poprzedniego raportu). Nie było `partial` ani zatrzymanego agenta (w `00462fed` był). Różnica może wynikać z
  mniejszych slice'ów, nie z reguł 0.3.0; n=1 sesja na 0.3.0.
- Występuje w: `a4c6a201`, `00462fed` (`ade2c669`), `179deeb3` (`a1dd0ab2`, `af04319c`): trzy sesje (patrz Wzorce).

### D2. Komunikaty orkiestratora w trakcie pracy: reguła zawiera warunki, które w tym pipeline'ie spełnia każdy krok (`a4c6a201`)

Szczegóły w P1. W skrócie: 19 wiadomości tekstowych w 58 min, 14 z nich w czasie pracy subagentów, 7 z 18 pośrednich ma
ponad 500 znaków. Klasa: **reguła silnika niejednoznaczna** (`orchestrator.md:38-42`) plus częściowo zignorowana.
Występuje w jednej sesji z pomiarem, więc obserwacja, nie wzorzec.

### D3. Verifier powtórzył 3-minutowy pełny `ctest`, bo pierwszy wynik został ucięty (`a8fb3fb4`)

- Dowody: 7,0 min i 10 wywołań, wobec 3,2 min i 7 wywołań u `a41cd070`; w zwrocie: "The first ctest run was cut short
  in the tool output (only 200 of 458 test lines shown), so the top-3 list comes from a second full run" (łącznie ok.
  181 s testów na przebieg). Fix W6b (`a2eb6445`) czekał na ten przebieg 4,2 min po zwrocie reviewera (patrz P4).
- Przyczyna: **agent/brief** (brief weryfikatora, 851 znaków, nie wymagał zapisu wyniku do pliku ani ograniczenia
  wyjścia). `verifier.md:1-4` nie mówi, jak postąpić przy długim wyjściu. Jeden przypadek, koszt tokenów mały (49).

## Pytania użytkownika

### P1. Komunikaty do użytkownika w trakcie sesji

**Pomiar (tylko `a4c6a201`; dla `00462fed` i `off` nie da się porównać: transkrypty usunięte).**

| Wielkość | `a4c6a201` (0.3.0) |
|---|---|
| wywołania API sesji głównej / prompty użytkownika | 52 / 3 |
| wiadomości z tekstem | 19 (19,5 na godzinę, 0,37 na wywołanie) |
| znaki: suma / mediana / max | 8719 / 217 / 2215 (końcowy raport) |
| bez raportu końcowego (n=18): suma / mediana / max | 6504 / 202 / 1123 |
| tekst obok wywołania narzędzia (komentarz przed pracą) | 7 szt., mediana 77, max 659, suma 1178 |
| tekst bez narzędzia (koniec tury) | 12 szt., mediana 574, max 2215, suma 7541 |
| w czasie, gdy działał co najmniej jeden subagent | 14 z 19 (6217 znaków, 71%) |
| ponad 500 znaków (bez raportu końcowego) | 7 szt. (640, 718, 693, 655, 508, 1123, 659), razem 4996 znaków |

Szacunek udziału: 8719 znaków to rzędu 2-3k tokenów z 32,6k tokenów wyjścia sesji głównej (ok. 8%); koszt tokenowy
wiadomości jest znikomy, istotny jest czas czytania użytkownika.

**Czy 16 pisało więcej niż wcześniej?** Z transkryptów: nie wiadomo. Jedyny pośredni wskaźnik w CSV, tokeny wyjścia
sesji głównej: `a4c6a201` 32,6k na 52 wywołania (0,63k na wywołanie, 0,56k na minutę); `00462fed` (0.2.0) 26,4k na 46
(0,57k, 0,60k na minutę); sesje `off` o `kind` `code` mają 0,62-0,88k na wywołanie (mediana ok. 0,72k). Ten wskaźnik
obejmuje też argumenty narzędzi i rozumowanie, więc nie potwierdza ani nie obala wrażenia; nie widać w nim wzrostu
względem `00462fed` ani `off`. Zmiana liczby wiadomości nie jest wykluczona.

**Przykłady (2):** krok planu: "Czekam jeszcze na weryfikator. Po jego powrocie puszczę poprawki W6b." (69 znaków);
decyzja: "Poprawki wyglądają dobrze. Scalam gałąź do `main`." (50 znaków). Początki długich (640-1123 znaków) to
podsumowania zwrotów podwykonawców z listami punktowanymi ("Recenzent zatwierdził gałąź interpolacji pod warunkiem
trzech drobnych poprawek. Przyjąłem wszystkie trzy i puściłem do nich wykonawcę: 1. ...").

**Reguła:** `orchestrator.md:38-42`: "While working: no running commentary; the task list and the tool summaries already
show progress. Write one or two sentences only when you change direction ... or take a decision or action that changes
the result, scope or plan and that the task list and tool summaries do not show. Moving to the next step of the plan,
delegating as planned and a return that matches expectations are not reasons to write." Pozostałe: `:37` (start i
koniec jako raporty), `:43` (rozmowa jak w komunikatorze), `:46` ("Analyses and comparisons go into documents, not into
the chat"). Stan 0.2.0 (`4858e95:orchestrator.md:38-40`) dopuszczał dodatkowo wiadomość, gdy "a long-running agent,
several minutes without output" zostawiłby użytkownika bez znaku postępu; 0.3.0 tę klauzulę usunął. Literalnie reguła 0.3.0
jest więc węższa niż 0.2.0.

**Dlaczego mimo to powstaje taki wynik (wniosek z reguły i liczb):**

1. Warunek zapisu ("decyzja lub akcja zmieniająca wynik, zakres lub plan") spełnia w tym pipeline'ie każdy kolejny
   krok: przyjęcie uwag review, wypuszczenie poprawek, scalenie do `main`. Z 19 wiadomości co najmniej 7 otwiera się
   właśnie decyzją lub scaleniem (19:40, 19:46:36, 19:46:54, 20:04, 20:05, 20:18, 20:33:28). Reguła nazywa, co raportować, ale nie mówi, że
   wynik pipeline'u zapisany w dzienniku decyzji i sesyjnym raporcie nie wymaga wiadomości.
2. Tura bez narzędzia musi mieć jakąś treść. Pipeline działa na agentach w tle (wszystkie 10 `bg=true`), więc po każdym
   starcie orkiestrator kończy turę i czeka na powiadomienie; 12 z 19 wiadomości to właśnie takie końce tur. Reguła nie
   mówi, co pisać (albo nie pisać), gdy turę kończy tylko oczekiwanie. Model wypełnia ją streszczeniem. Dotyczy to też
   wiadomości, które reguła wprost wyklucza: wg pierwszego zdania co najmniej 7 z 19 to "ruch do następnego kroku",
   "delegowanie wg planu" lub "czekam" (19:37 "Uruchomiłem dwóch agentów równolegle...", 19:50 "Teraz równolegle sprawdzam
   build...", 19:53, 19:55, 20:18:56, 20:33:33, 20:34:25), czyli reguła jest tu **zignorowana**, nie tylko niejasna.
3. "One or two sentences" nie ma twardego limitu rozmiaru; 6 wiadomości pośrednich ma 640-1123 znaków z punktami
   numerowanymi, które powtarzają treść z briefu poprawek (`orchestrator.md:46` mówi o dokumentach zamiast czatu).
   Wyjątek "unexpected finding" jest uzasadniony w jednym przypadku (20:15: 141 z 202 grup staje na stałe, 1119 znaków).
4. Wiadomości na pytanie użytkownika (20:11, 187 znaków) i raport końcowy (2190 znaków, `end/SKILL.md:18`) są zgodne z
   regułą.

Brak propozycji zmiany: pomiar tylko z jednej sesji (próg wzorca to trzy).

### P2. Czy agenci review / verify / fix się opłacają

**Sesja 16 (jedyna z treścią).** Liczba i koszt:

| Agent | Rola | peakK | weightedK | udział sesji | min | Wynik |
|---|---|---|---|---|---|---|
| `a0c8d0b7` | reviewer interpolacji | 65 | 168 | 4,1% | 2,7 | 3 ustalenia `minor`, approve with fixes |
| `a21286af` | reviewer W6a | 91 | 190 | 4,7% | 3,9 | 4 ustalenia (3 `minor` + 1 `minor, uncertain`), approve with fixes |
| `ad525b20` | reviewer W6b | 80 | 185 | 4,6% | 3,0 | 3 ustalenia `minor`, approve with fixes |
| `a41cd070` | verifier (po merge `main` do W6) | 23 | 40 | 1,0% | 3,2 | PASS 451/451 |
| `a8fb3fb4` | verifier (po merge `main` do W6b) | 25 | 49 | 1,2% | 7,0 | PASS 458/458 |
| `af8d3665` | fix po review interpolacji | 64 | 144 | 3,6% | 6,0 | 3 uwagi |
| `a3197b14` | fix po review W6a | 116 | 378 | 9,3% | 10,1 | 4 uwagi |
| `a2eb6445` | fix po review W6b | 113 | 472 | 11,6% | 10,4 | 3 uwagi, 2 nowe testy, 460/460 |
| razem | 8 agentów | | 1626 | 40,1% | | |

(Kolumna peakK to największy kontekst agenta, najpewniej to, co użytkownik widzi jako 50-150k; suma wejścia w
`InputK` jest wielokrotnie większa przez odczyty z cache.)

Co znaleziono (10 ustaleń, 0 blockerów i 0 majorów, wszystkie przyjęte wg raportu sesji, poprawki obejrzane w diffie;
klasyfikacja z treści zwrotów reviewerów oraz zwrotu `a2eb6445` i raportu sesji):

| Rodzaj | Ile | Które |
|---|---|---|
| prawdziwy defekt zachowania, skutkował zmianą kodu | **4** | interpolacja: utajony zawrót licznika `uint8` przy `walkUnit` na zwierzęciu czekającym w zawróceniu; W6a: przydział miejsc po `next` zamiast `logicalTile()` (Observable) oraz limit pchnięć liczony raz zamiast per członek (potwierdzone w źródle Remake'a przez fixera); W6b: cel na krawędzi mapy pomijany, a w Remake'u wydawany |
| naruszenie reguły projektu bez zmiany zachowania | 1 | W6a: `greedySwapPasses` zaszyte w kodzie zamiast z `movement.json` |
| brakujący test, dopisany | 3 | interpolacja, W6a, W6b (szczelniejszy test kampanii) |
| wydajność testu | 1 | W6b: test kampanii 24 s -> 18 s |
| dokumentacja lub komentarz | 1 | interpolacja: `--smooth-units` w README, nieaktualny komentarz |
| fałszywe alarmy | 0 | jedno ustalenie oznaczone `uncertain` okazało się prawdziwe |

Verifier: 2 z 2 uruchomień to tylko potwierdzenie zielonego stanu, bez ustaleń. Oba sprawdzały stan po scaleniu `main`
do gałęzi (informacja nowa względem przebiegu implementera), ale następny agent (fix) i tak uruchamiał pełne `check`
na końcu (zob. P3), więc wynik był przez niego nadpisywany.

**Wydajność.** Same reviewy: 543 weightedK na 4 defekty zachowania = **136 weightedK na defekt** (109, jeśli policzyć
naruszenie reguły projektu). Z poprawkami i verifierami: 1626 / 4 = 407 na defekt, 163 na przyjęte ustalenie. Każdy z
3 reviewów znalazł co najmniej jeden defekt zachowania (1, 2, 1), więc w tej sesji żaden review nie był "pusty".
Czy 40% sesji na 10 drobnych ustaleń się opłaca, z danych nie wynika: nie znam kosztu defektów, które przeszłyby do
`main`. Brama "code review przed merge gałęzi funkcji" jest w kontrakcie (`.claude/project.md:58`), a pominięcie bramy
to decyzja użytkownika (`orchestrator.md:133`).

**Pozostałe sesje (tylko CSV, bez liczby ustaleń):**

| Grupa | n agentów | weightedK | mediana weightedK | mediana peakK | uwagi |
|---|---|---|---|---|---|
| `off`: `code-reviewer` | 35 (13 sesji) | 4072 | 108 | 51 | 8,1% weightedK sesji, które mają reviewerów (5386 z 66649 razem z `design-reviewer`, 6 szt., 1314) |
| `off`: `test-engineer` + `build-doctor` | 6 | 689 | | | najbliższy odpowiednik verifiera |
| 0.1.0-0.3.0: `stack:reviewer` | 4 (2 sesje) | 857 | 188 | 86 | `abbe778b` w `00462fed`: 314, 12% sesji |
| 0.1.0-0.3.0: `stack:verifier` | 3 | 113 | 40 | 23 | `a1e56075` w `e7b254ca`: 24, wynik nieznany |

Dla `00462fed` raport sesji mówi: "Code review: approve, dwie drobne uwagi poprawione" (obie rzeczywiste: UB przy
przepełnieniu z zapisu, seed celów Observable), czyli 314 na 2 defekty = 157 na defekt reviewera; który z trzech małych
implementerów (106, 253, 238) poprawiał, z CSV nie wynika. Dla `off` liczby ustaleń i identyfikacji agentów poprawek
(`cpp-implementer` z briefem o poprawkach) nie da się odtworzyć. Obserwacja (n=4 wobec 35): `stack:reviewer` ma medianę
188 wobec 108 u `code-reviewer` z `off` i szczyt kontekstu 86k wobec 51k; może to wynikać z większych diffów
(slice'y 600-810 linii), z danych nie wynika.

**Co można scalić (kandydaci, nie wniosek):**

1. Verifier po merge `main` (2 uruchomienia, 89, 2,2%): koszt tokenowy mały, ale `a8fb3fb4` zajął ścieżkę krytyczną
   (P4). Mogłoby go zastąpić końcowe `check` agenta poprawek (które i tak biegnie) z wymogiem, by agent poprawek
   zaczynał od zbudowania stanu po merge i zgłosił, jeśli jest czerwony. Ryzyko: poprawki na zepsutej bazie. Zgodnie z
   kontraktem (`project.md:47-49`) pipeline ma verifier; zmiana to decyzja użytkownika.
2. Fix po review jako osobny agent (3 uruchomienia, 994, 24,5%): przy kontekście implementera 161-167k reguła
   `orchestrator.md:116-117` każe zaczynać nowego agenta, który czyta od nowa (17-45% jego kosztu przed pierwszą
   edycją). Scalenie fixów interpolacji i W6a nie wchodzi w grę: dwie gałęzie, zależność przez merge `main`. Jedyna
   realna oszczędność to krótsze briefy z `path:start-end` zamiast ponownego czytania.
3. "Jeden review na paczkę zamiast na slice": w sesji 16 każda gałąź miała jeden review (3 reviewy na 3 gałęzie),
   więc nie ma tu co łączyć; podział na W6a/W6b był decyzją o rozmiarze slice'a.

### P3. Testy w przebiegach implementerów

Sesja 16, 5 implementerów (223 wywołania API, 2735 weightedK). Udział liczony wg wywołania, które zleca narzędzie
(koszt wejścia tej tury), kategorie z komend i ścieżek; wynik uruchomienia testów rozpoznany po wyjściu (podsumowanie
Catch2/ctest). To przybliżenie: koszt tokenów wyniku narzędzia ląduje w następnych turach, a edycje plików testowych
przez PowerShell (3 wywołania w `a279c502`) nie są liczone.

| Wielkość | wywołania | udział wywołań | weightedK | udział weightedK |
|---|---|---|---|---|
| `Edit`/`Write` w plikach testowych (`tests/...`) | 60 | 26,9% | 399 | 14,6% |
| uruchomienia testów (`ctest`, binaria testowe, także w jednej komendzie z buildem) | 23 | 10,3% | 297 | 10,9% |
| razem pisanie i uruchamianie testów | 83 | 37,2% | 696 | 25,4% |
| sam build (bez testów) | 10 | 4,5% | 108 | 3,9% |
| `Edit`/`Write` w kodzie źródłowym | 40 | 17,9% | n/d | n/d |

Główni implementerzy: `a279c502` pisanie testów 19 z 73 wywołań (26%, 16% weightedK), `af537856` 19 z 55 (35%, 18%). W
tych dwóch edycji testów jest 38 wobec 21 edycji źródła, zgodnie z kontraktem (`project.md:57`: testy zwykle tyle linii
co kod).

**Niepowodzenia.** 11 uruchomień testów z wynikiem czerwonym (`a279c502` 5, `af537856` 4, `a3197b14` 1, `a2eb6445` 1)
oraz 2 błędy buildu/konfiguracji (`a279c502`: `-Werror=missing-field-initializers` w `original_map.cpp`; `af537856`:
konfiguracja padła, bo `tests/CMakeLists.txt` z commita `wip` wskazywał na nieistniejący plik testu).

| Co po czerwonym uruchomieniu | liczba |
|---|---|
| następna edycja to **plik testowy** | 9 (5 w `a279c502`, 4 w `af537856`) |
| następna edycja to **źródło** | 0 |
| brak dalszej edycji (czerwony był ostatnim przebiegiem agenta albo stan znany) | 2 |
| błąd buildu -> poprawka źródła | 1 (`a279c502`, `-Werror`) |

Przykłady z excerptów: `a279c502` dostał `FAILED: CHECK( neverMoved == 0 ) with expansion: 2 == 0` i
`warning: 42 missions, 202 groups ordered, 61 formed up within 3000 ticks`; testy kampanii ujawniły, że grupy stają bez
W8, więc agent przeprojektował oczekiwania testu (to samo wyszło w raporcie sesji jako "141 z 202 grup staje na
zawsze"). `af537856`: cztery przebiegi `REQUIRE( groupOf(world, id).order == GroupOrder::None ) ... 1 == 0`, potem
wydruki `DBG` i edycje testu; po pierwszym czerwonym przebiegu agent nie edytował już żadnego pliku źródłowego.

**Wniosek:** w tej sesji 0 z 11 czerwonych testów doprowadziło do poprawki źródła; wszystkie rozstrzygnięto zmianą
testu (w jednym przypadku wynik dał realną wiedzę o produkcie, nie błąd w teście). To dolna granica "złapanych błędów":
poprawka źródła mogła nastąpić dopiero po kolejnej edycji testu, ale w sekwencji kategorii po pierwszym czerwonym
przebiegu nie ma żadnej edycji źródła w `af537856` ani (poza jedną na końcu po zielonym przebiegu) w `a279c502`.
Dla 0.1.0, 0.2.0 i `off` nie da się odpowiedzieć (transkrypty usunięte). Tego, czy te testy zapobiegną regresjom
później, ten pomiar nie pokazuje.

### P4. Równoległość (sesja 16 i `00462fed`)

**`a4c6a201`** (wall 58,4 min; przedziały agentów = pierwszy-ostatni wpis ich transkryptu, obcięte do okna sesji):

| Współbieżność subagentów | minuty | udział wall |
|---|---|---|
| 0 (nic nie działa w tle) | 3,8 | 6,5% |
| 1 | 30,2 | 51,7% |
| 2 (maksimum) | 24,4 | 41,8% |

Suma minut agentów 79,0 (1,35 x wall); wszystkich 10 agentów uruchomiono w tle (`run_in_background`). Sesja główna: 50,7
min (87%) w przerwach ponad 60 s między swoimi wpisami, zawsze gdy działał subagent (10 przerw); 7,7 min aktywności w
przerwach krótszych niż 60 s; zero wykrytych oczekiwań na prompt użytkownika (3 prompty użytkownika były w trakcie).
Harmonogram (godziny): 19:37 reviewer interpolacji ‖ W6a-finish (do 19:49:55); 19:40 fix interpolacji; 19:50 verifier ‖
reviewer W6a; 19:54-19:55 fix W6a ‖ W6b (20,1 min, do 20:15); 20:15 verifier ‖ reviewer W6b; 20:22:56 fix W6b (do
20:33:20); koniec 20:34:52.

**Co mogło iść równolegle, a szło po kolei:**

1. **Start W6b (`a279c502`) po review W6a.** W6b ruszył 19:55:18, dopiero gdy reviewer W6a (`a21286af`) zwrócił o
   19:54:11, choć W6a-finish zwrócił 19:49:55, a brief W6b mówi, że bazuje na `feat/movement-w6 @10834b3` (przed
   poprawkami) i że pliki `game` są rozłączne z `sim`. Możliwe było uruchomienie o 19:50:15, razem z verifierem i
   reviewerem: oszczędność do **ok. 5,1 min** (9% wall) na ścieżce krytycznej (W6b -> review -> fix -> koniec).
2. **Fix W6b (`a2eb6445`) po verifierze.** Reviewer W6b zwrócił 20:18:46, fix ruszył 20:22:56, 14 s po verifierze
   (`a8fb3fb4`, który pracował w tym samym worktree `w6b`; wiadomość 20:18:56: "Po jego powrocie puszczę poprawki W6b").
   Czekanie było uzasadnione współdzieleniem drzewa, ale verifier przedłużył się przez powtórzony `ctest` (D3). Strata
   **4,2 min** (7%). Kontrakt dopuszcza osobny katalog buildu (`project.md:83`), co pozwoliłoby je rozdzielić.
3. Pozostałe sekwencje wynikają z zależności: scalenie interpolacji do `main` przed merge `main` do W6 (oba zmieniają
   `unit_walk.cpp`, `world.cpp`), review W6a po jego implementacji, scalenie W6a przed W6b do `main`.

Razem do ok. 9,3 min z 58,4 (16%), gdyby oba punkty dało się zrealizować; to oszacowanie z harmonogramu, nie wiem,
czy orkiestrator miał powód (np. chciał znać werdykt W6a przed startem W6b); raport sesji go nie podaje.

**`00462fed`:** przedziałów czasowych agentów nie da się odtworzyć (transkrypty usunięte). Z CSV: suma minut 6 subagentów
48,5 wobec wall 44,0, więc przynajmniej 4,5 min się nakładało (dolna granica), reszty rozkładu nie znam. Czas bezczynności
głównej sesji nieznany.

### P5. Dopasowanie modelu

Koszt per typ i model (stack 0.1.0-0.3.0, 3 sesje; w nawiasie `off` dla kontekstu):

| Typ (model) | n | weightedK | mediana | mediana peakK | co faktycznie robił |
|---|---|---|---|---|---|
| `stack:implementer` (opus) | 10 | 4403 | 425 | 115 | pisanie kodu sim/game, testów; budowanie, `ctest` |
| `stack:reviewer` (opus) | 4 | 857 | 188 | 86 | czytanie diffa, odczyty badań/ADR, 4-11 wyszukiwań, 4-10 komend `git`; zwrot 2,5k znaków |
| `stack:verifier` (haiku) | 3 | 113 | 40 | 23 | configure, build, `ctest`, zwrot liczb |
| `stack:doc-writer` (haiku) | 1 | 98 | | 56 | dokumentacja |
| sesja główna (opus) | 3 | 685 / 591 / 940 | | 136-181 | planowanie, osądy, scalanie |
| (`off`: `cpp-implementer` opus) | 45 | 27482 | 537 | 128 | 53% kosztu subagentów `off` |
| (`off`: `code-reviewer` opus) | 35 | 4072 | 108 | 51 | |
| (`off`: `kam-researcher` sonnet) | 29 | 10193 | 321 | 110 | |
| (`off`: `docs-writer` haiku) | 15 | 1142 | 66 | 41 | |

Model implementera: `implementer.md:5` ma `model: sonnet`; opus pochodzi z kontraktu (`project.md:196`
"model overrides: implementer: opus"). Reviewer: `reviewer.md:5` opus; verifier: `verifier.md:5` haiku.

Kandydaci do obniżenia o stopień (wnioski z tego, co agenci faktycznie robili; żadnej zmiany nie sprawdzałem
eksperymentem, więc to hipotezy do próby):

| Kandydat | Zakres w sesji 16 | Dlaczego tak | Ryzyko |
|---|---|---|---|
| implementer poprawek po review: opus -> sonnet | 3 uruchomienia, 994 (24,5%) | brief dostaje gotowe ustalenia z `path:line` i proponowaną poprawką; 5-17 edycji, 2-3 wyszukiwania przed pierwszą edycją | średnie: `a2eb6445` sam rozszerzył poprawkę na walidację przy wczytywaniu zapisu (`unitsMatchGroups`), `a3197b14` rozstrzygał ustalenie "uncertain" na źródle Remake'a; kod sim jest deterministyczny i błąd wychodzi dopiero w kolejnym review. Bezpiecznik: orkiestrator ogląda diff (`project.md:58-59`) |
| implementer slice'a "klej `game`" (typ `a279c502`): opus -> sonnet | 1741 to dwóch głównych; ten jeden 977 | mapowanie komendy misji na rozkaz sim, testy na danych | wysokie dla slice'ów sim (T11, formacje, determinizm); dla `game` średnie: ten agent znalazł zablokowane grupy i musiał zdecydować, co raportować. Tylko jako próba A/B |
| reviewer: opus -> sonnet | 3 uruchomienia, 543 (13,4%) | zadanie czytelnicze (diff + badania), mały zwrot | **wysokie**: wartość to osąd (Observable a Internal, scenariusz zawrotu `uint8`, zgodność z Remake'em); 4 defekty w 3 reviewach. Nie obniżać bez próby równoległej na tym samym diffie |
| scalanie, usuwanie gałęzi i worktree, budowanie `main` w sesji głównej: opus -> haiku (agent verifier/podobny) | 14 wywołań git i 1 build = ok. 190 z 685 | operacje mechaniczne w kontekście 100-147k, każde wywołanie sesji głównej ok. 13 | niskie przy scaleniach bez konfliktów, wysokie przy konfliktach; zysk najwyżej ok. 4% sesji. Najniższy priorytet |

Bez kandydatów: verifier (już haiku, mediana 40, 23k kontekstu, wykonywał dokładnie `check`), doc-writer (haiku).
W `off` największy blok to `cpp-implementer` opus (53% kosztu subagentów), ale o jego zadaniach nie wiem nic poza
CSV i poprzednim raportem; `kam-researcher` jest już na sonnet.

Czego nie da się ocenić: ceny. `weightedK` nie zawiera różnic cen modeli; bez nich nie przeliczę oszczędności z zejścia o
stopień na pieniądze.

## Wzorce

### W1. Implementer zużywa 17-38% swojego kosztu na wyszukiwanie i czytanie przed pierwszą edycją, gdy lokalizacje kodu nie są w briefie

Występuje w trzech sesjach: `00462fed` (`ade2c669`: pierwsza edycja w wywołaniu 26, 136k, 14 wyszukiwań),
`179deeb3` (`a1dd0ab2`: wywołanie 31, 138k, 19 wyszukiwań; `af04319c` 16 wyszukiwań), `a4c6a201` (`a279c502`: 23., 93k,
18 wyszukiwań; `af537856`: 26., 106k, 11). Przyczyna we wszystkich: brief wskazuje ścieżki, ale nie zakresy ani miejsca
w kodzie; w 0.3.0 dodatkowo mapa kodu (`orchestrator.md:121-127`) nie została użyta.

Propozycja zmiany silnika (do rozważenia, nie wdrożona):

- `orchestrator.md:86` (Brief, "Name the files you know"): dopisać, że brief zawierający polecenie "grep for / find where"
  oznacza, że orkiestrator nie zna lokalizacji, i wtedy przed delegowaniem (a) robi 1-3 celowane wyszukiwania sam i
  podaje wyniki jako `path:start-end`, albo (b) uruchamia slice z mapą kodu (reguła 6). Reguła 6 ma dziś próg w
  tokenach i plikach ("more than ~30k tokens or searching more than ~5 files"), którego orkiestrator nie potrafi ocenić
  bez przeczytania kodu; polecenie wyszukania w briefie jest obserwowalnym sygnałem.
- Czy zadziałało pokażą: `agents.csv` `searchesBeforeEdit` dla `stack:implementer` poniżej 6 przy slice'ach głównych
  (obecnie 11 i 18), `briefRanges` powyżej 0 (obecnie 0 w 10 z 10 briefów; patrz Obserwacje o zakresach), oraz excerpt
  `analyze.ps1 -Mode firstedit` (kontekst przy pierwszej edycji poniżej 80k przy szczycie poniżej 150k; obecnie
  93-106k i 161-167k). Ocena po trzech kolejnych sesjach kodu na 0.3.x.

Nie proponuję zmian dla P1-P5: żadne z tych ustaleń nie występuje w trzech sesjach z pomiarem (pomiar treści był
możliwy tylko dla jednej).

## Obserwacje

- **O1 (narzędzie, ważne).** Transkrypty 22 z 23 sesji projektu zostały usunięte przez użytkownika o 19:47 w dniu sesji
  16 (`*.desktop-released.json`, `"reason": "delete"`). Doktor może mierzyć tylko to, co zdążył zapisać do CSV przy
  `-Record`. Do `-Record` warto dodać (i zapisać od razu po sesji, przed możliwym usunięciem): per agent `startedAt` i
  `endedAt` (nakładanie, bezczynność), `firstEditCallK` i `wKBeforeFirstEdit`, liczbę i długość wiadomości tekstowych
  sesji głównej (suma, mediana, max, ile w trakcie pracy subagentów), udział wywołań i weightedK na zapis/uruchomienie
  testów dla implementerów, liczbę ustaleń reviewera wg ważności i `Result:` verifiera, oraz typ agenta poprawek
  (brief zawierający "findings"). `analyze.ps1` w `diagnostics/tmp/` to prototyp tych pomiarów.
- **O2 (miara).** `briefRanges` = 0 we wszystkich 10 briefach sesji 16 nie znaczy braku zakresów: brief W6b ma "§6.3",
  "points 4 and 6", "application.cpp around line 320". Regex `path:start-end` / `path#symbol` ich nie liczy, a reguła
  (`orchestrator.md:80`) wymaga właśnie tej formy. Wniosek o przestrzeganiu reguły z samej kolumny byłby fałszywy;
  trzeba excerptu briefu.
- **O3 (poprzedni raport).** Poprawka liczb: implementerzy `00462fed` 1668 (65%), nie 1904 (74%) (patrz Koszty).
- **O4.** Wszystkie 10 agentów sesji 16 skończyło ze statusem `done`, zero `partial`/`blocked`/`none`; w `00462fed`
  jeden agent bez statusu został zatrzymany (D1 poprzedniego raportu). Jedna sesja na 0.3.0, więc bez wniosku.
- **O5.** Kontekst sesji głównej rósł 59k -> 147k w 52 wywołaniach (`mainPeakK` 147), poniżej mediany `off`.
- **O6.** Reviewer W6b zauważył w zwrocie, że diff `3093f2c..933be58` pokazuje odwrócone zmiany sim (brak `main` w bazie
  gałęzi) i że wynik "61/202" pochodzi sprzed poprawki z `main`; orkiestrator miał to w zwrocie przed scaleniem. Koszt
  zwykłej sekwencji merge-then-review (review gałęzi, do której `main` nie został jeszcze scalony): nie mierzony.
- **O7.** Stack reviewer (n=4) jest ok. 1,7 raza większy niż `code-reviewer` z `off` (n=35) wg mediany; patrz P2.

## Wersje silnika

Wyłączone: sesje wznowione (`2755f500`, wallMin 0), `040d1600` (0,2 min). `kind` `code`, projekt KamReimagined;
`itemsDone` dla `off` z poprzedniego raportu.

| Silnik | n | sesje | weightedK | itemsDone | weightedK / item | wallMin / item | weightedK / 1000 linii | agenty >150k | bigReads |
|---|---|---|---|---|---|---|---|---|---|
| `off` (kind code z `itemsDone`) | 5 | `6cb5011d`, `dc419968`, `4dab608f`, `a74a6657`, `179deeb3` | mediana 8822 | 3, 3, 2, 4, 1 | mediana 3051 | mediana 25,2 | mediana 1415 (n=6) | mediana 2 | mediana 6 |
| 0.1.0 (docs, nie porównywalne) | 1 | `e7b254ca` | 1062 | 1 | 1062 | 41,1 | 639 | 0 | 0 |
| 0.2.0 | 1 | `00462fed` | 2573 | 1 | 2573 | 44,0 | 1399 | 1 | 12 |
| 0.3.0 | 1 | `a4c6a201` | 4052 | 3 | **1351** | **19,5** | 2463 | 2 | 8 |

n=1 w każdej grupie silnikowej, więc to obserwacje, nie wnioski:

- Na item `a4c6a201` jest tańsza (1351) niż mediana `off` (3051) i niż `00462fed` (2573) oraz szybsza (19,5 min na item
  wobec 25,2 i 44), ale na 1000 zmienionych linii droższa (2463 wobec 1415 i 1399). Rozbieżność wynika z tego, co
  liczy się jako item (3 scalone części, z których dwie to głównie review i poprawki) i z linii (`linesChanged` liczy
  commity z okna czasowego, nie tylko tej sesji); żadna z dwóch miar nie jest rozstrzygająca.
- Udział sesji głównej: `a4c6a201` 16,9%, `00462fed` 23%, `179deeb3` 20%.
- Agenty >150k: 2 (oba implementerzy główni, bez zatrzymania), `bigReads` 8, wszystkie w implementerach (1, 1, 2, 3, 1).
- Z porównania nie wynika żadna zmiana silnika.
