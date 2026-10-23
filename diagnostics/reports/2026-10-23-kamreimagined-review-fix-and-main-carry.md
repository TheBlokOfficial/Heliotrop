# 2026-10-23: KamReimagined, sesje 17-25 (silnik 0.4.0), review+fix w jednym zleceniu, koszt kontekstu orkiestratora

## Zakres

- Projekt: KamReimagined. Zapisane (`-Pending -Record`) 12 sesji, wszystkie silnik 0.4.0: `a6fa7b22` (sesja 17), `7fcaaf2b` (18),
  `2f2004b4` (19), `a97e7991` (20), `378d5d1f` (21), `7528b750` (22), `3fe3b434` (23), `e43f37ed` (24), `9fd2b5bd` (25) oraz
  trzy okruchy: `f6e4d928` (rodzic `a97e7991`, 6 wywołań), `f89c6c7f` i `7eaaf42e` (przerwane przez zamknięcie procesu,
  rodzice `9fd2b5bd`). `kind` i `itemsDone` uzupełnione dla 9 sesji z raportów `docs/sessions/` (okruchy bez).
- `9fd2b5bd` jest wznowieniem łańcucha `f89c6c7f` -> `7eaaf42e` -> `9fd2b5bd`: pierwsze ~21 z 80 wywołań main to powtórzona
  historia rodzica (call 1 o 10:29, a `startedAt` wiersza 10:33). Jego wiersz i sumy po sesjach liczą ten prefiks podwójnie.
- Sesja 26 (`47055298`, U6b, review+fix w jednym zleceniu po raz drugi) nie została zapisana: transkrypt był zapisywany
  < 15 min temu. Zmierzona tylko do odczytu (bez `-Record`), użyta w pytaniu 1.
- Limit wycinków: 8 z 8 użyte (3 briefy/Find agentów, 1 Timeline main, 4 Find main/implementer). Osobne tabele Timeline
  wszystkich czterech sesji main zapisano do pliku w scratchpadzie i policzono agregaty; do kontekstu trafiały tylko liczby.

## Koszty

Kolumny kluczowe (weightedK w tys., `wait` = `mainWaitMin`, `/item` = weightedInputK / itemsDone):

| Sesja | Nr | kind | items | weightedK | /item | wall min | wait min | main peakK/calls | agents (>150k) | fixCommits | bigReads |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a6fa7b22 | 17 | code | 1 | 1395 | 1395 | 36.8 | 13.2 | 144/43 | 4 (0) | 1 | 3 |
| 7fcaaf2b | 18 | code | 3 | 5357 | 1786 | 78.4 | 67.1 | 211/73 | 12 (2) | 5 | 18 |
| 2f2004b4 | 19 | code | 2 | 3379 | 1690 | 37.6 | 28.2 | 188/59 | 9 (1) | 1 | 6 |
| a97e7991 | 20 | code | 3 | 2928 | 976 | 26.6 | 9.4 | 158/62 | 11 (0) | 2 | 0 |
| 378d5d1f | 21 | code | 3 | 1871 | 624 | 28.8 | 12.8 | 181/55 | 8 (0) | 2 | 2 |
| 7528b750 | 22 | research | 1 | 4549 | 4549 | 26.5 | 16.6 | 293/65 | 9 (1) | 0 | 13 |
| 3fe3b434 | 23 | code | 5 | 4529 | 906 | 35.1 | 21.9 | 230/62 | 13 (0) | 4 | 6 |
| e43f37ed | 24 | code | 3 | 5063 | 1688 | 35.7 | 22.5 | 186/73 | 11 (2) | 5 | 4 |
| 9fd2b5bd | 25 | code | 4 | 5338 | 1335 | 40.7 | 27.4 | 214/80 | 11 (2) | 4 | 6 |
| f6e4d928, f89c6c7f, 7eaaf42e | - | - | - | 92, 485, 303 | - | 0.3-3.8 | - | - | - | - | - |

Razem 9 pełnych sesji: 34,4 mln weightedK wg tabeli (z podwójnie liczonym prefiksem sesji 25; kolumny `/item` dla 0.4.0 z
`itemsDone` 25 pozycji), 320 min. Statusy: 0 `partial`,
1 `blocked` (`a9a6d`, sesja 21, krótki), 6 agentów bez `Status:` (m.in. wip U6a `f0f22` i fix `f47a7`).

Gdzie poszły tokeny (weightedK, 9 sesji, razem 34,4 mln): main 10,0 mln (29%), reszta to agenci. Podział ról (typy agentów z
`agents.csv`): reviewer średnio 212 (n=19, mediana 182), agent z `role=fix` średnio 212
(n=13; bez outliera `f47a7` 172, mediana 167), implementer bez fix mediana 389 (n=26). Udział main w sesji: 23-35%.

## Diagnozy

### D1. Duże implementery: 5 z 26 przekracza 150k kontekstu i kosztuje 800-918 weightedK (wzorzec, 3 sesje)

- Dowód: `8486b` (164k, 801) i `c9611` (185k, 900) w sesji 18; `7c6dd` (195k, 848) i `f0f22` (187k, 918, `Status:` brak,
  `wip ... unverified`) w sesji 24; `60884` (191k, 839) w sesji 25. Pozostałe 20 implementerów: mediana 349 weightedK, mediana
  peak 104k, mediana 29,5 wywołania.
- Porównanie grup (mediany): grupa duża (n=6, >=690) briefPaths 24,5 / briefRanges 3 / briefChars 4831 / bigReads 2 /
  `wKBeforeEdit` 290 / 53,5 wywołań; reszta (n=20) 17 / 1 / 3400 / 0 / 101 / 29,5. `c9611` ma 34 ścieżki, 5 zakresów, Read x31
  (16 odczytów całych plików w wycinku Find: `unit_interaction.cpp`, `unit_walk.cpp`, `terrain.cpp`, `unit.cpp`, ...).
- Koszt wtórny: U6a (sesja 24 `f0f22` 918, przerwany) był kończony w sesji 25 (`194` + review `328` + fix `84`) = 1524 weightedK
  na jeden wycinek.
- Przyczyna: brief (wycinek za duży, 22-34 ścieżek z kilkoma zakresami) i reguła silnika zignorowana lub niewykonalna w praktyce:
  `plugins/stack/core/orchestrator.md:119-121` (plan do ~120k, "shrink the reading"). Raporty sesji potwierdzają przekroczenie
  ("implementer U6b doszedł do ~194k", sesja 25).
- Szacunek: koszt wycinka rośnie z wywołania x kontekstu. Podział 53 wywołań/186k na dwa po ~27/100k to ~2 x 349 = 700 wobec
  ~850 (-18%), przy dodatkowych ~30-40 weightedK na start drugiego agenta. To jest rząd wielkości, nie pomiar.

### D2. `7528b750` (sesja 22, research): 4549 weightedK na jedną pozycję, main peak 293k

- Dowód: main 1601 (35%), 8 researcherów 2384 (52%; `wKBeforeEdit` 137-386, peak 84-142k), reviewer projektu `d234f` 564
  (178k, `wKBeforeEdit` 515, 4 bigReads, 18 wyszukiwań). Main: w wywołaniach 25-27 trzy Read-y dołożyły 64k tokenów (29+23+12),
  to pełne pliki `gui-gameplay-layout.md`, `gui-unit-panel.md`, `gui-widgets.md`, `gui-fonts.md` i `gui-selection-orders.md`
  (limit 175 linii), napisane godzinę wcześniej przez researcherów. Ich przenoszenie przez pozostałe 38 wywołań kosztuje 251
  weightedK = 15,7% weightedK main i 5,5% sesji.
- Przyczyna: w większej części inherent (research robi czytanie; 6 równoległych researcherów po ok. 300 weightedK), z elementem
  brakującej reguły: orchestrator.md nie mówi, ile z dokumentów napisanych przez researcherów orkiestrator czyta w całości przed
  napisaniem ADR (`:127-131` dotyczy poprawek, `:111` zwrotów do ~250 słów, pliki badań pomija). Jedna sesja: obserwacja.

### D3. `7fcaaf2b` (sesja 18): 78 min zegara, z czego main czeka 67 min (86%)

- Dowód: `mainWaitMin` 67,1, `concurrentMin2` 29,7. Oś czasu agentów: impl W8a (10:07-10:27) -> reviewer + test-writer (10:28-10:35)
  -> fix `e495f` (10:35-10:43) -> impl W8b `c9611` (10:44-11:03, 18,6 min, 3 czerwone przebiegi, `testWK` 195 z 900) -> reviewer
  + test-writer (11:03-11:11) -> fix `16ed8` (11:11-11:20). Zależności W8b od W8a wymuszają łańcuch 6 agentów; po drodze 2 fixy
  i 3 czerwone przebiegi `c9611`.
- Przyczyna: w większości inherent (łańcuch zależnych wycinków), plus D1 (`c9611` 185k). Nie ma tu reguły do zmiany.

### D4. Rozmiar i stałe tło orkiestratora (wzorzec, 4 sesje zmierzone Timeline, patrz pytanie 2)

- Dowód: main peak > 200k w 4 z 9 sesji (211, 293, 230, 214) i dwie sesje zakończone właśnie z tego powodu ("kontekst
  orkiestratora ~200k", sesja 23; "zamknięcie sesji przy ~190k", sesja 25).
- Przyczyna: stałe tło 57k na call 1 (`firstCtx` identyczne w 4 sesjach) plus ~12k tokenów wczytanych w call 1 (+26-27k znaków
  w każdej z 4 sesji: plik `hook-...-additionalContext.txt`, `.claude/project.md`, najnowszy raport). Klasa: koszt stały silnika
  i kontraktu; reguła `orchestrator.md:24-25` ("only the newest report") jest przestrzegana w 3 sesjach; w 9fd2b5bd pojawia
  się dodatkowo odczyt starszego raportu (`2026-10-22-ui-implementation.md`, call 5).

## Pytanie 1: review i poprawki w jednym zleceniu

Gdzie: sesja 25 (`9fd2b5bd`): U5b (`a86587db`) i U7-game (`aa6af42e`), brief: "code review of slice ... AND fixing what you find, in one
assignment (session trial: review and fixes by one agent)". Sesja 26 (`47055298`, niezapisana): U6b (`a71c4838`), tak samo. W tej samej
sesji 25 był też trójkrokowy wycinek (U6a: reviewer `d1602` + fix `195fc`) i review S1 (`8dd0d`) bez osobnego fixa. Modele:
zlecenia łączone na opus; osobne fixy prawie zawsze na sonnet (11 z 13), reviewery na opus (15 z 19).

| Przepływ | n | weightedK | Minuty agenta | `wKBeforeEdit` | firstEditK | Peak |
|---|---|---|---|---|---|---|
| Review + fix w jednym zleceniu (U5b, U7, U6b) | 3 | 305, 699, 478 (średnia 494) | 4,9, 8,2, 5,8 (śr. 6,3) | 226, 377, 256 (śr. 286) | 84, 137, 99 | 90, 157, 115 |
| Reviewer + osobny fix, ten sam wycinek (U6a, sesja 25) | 1 | 328 + 84 = 412 | 3,9 + 4,9 = 8,8 | fix: 16 | fix: 20 | 109, 36 |
| Reviewer + osobny fix, wszystkie sesje 17-25 (bez łączonych) | 19 / 13 | średnio 212 + 172 = 384 (mediany 182 + 167 = 349); z outlierem `f47a7` 212 + 212 | ok. 4 + 6 = 10 | fix: mediana 39, zakres 16-77, śr. 42; outlier `f47a7` 405 | fix: mediana 35 | fix: mediana ok. 60k |

Wnioski z liczb:

- Koszt: łączone zlecenie jest droższe, nie tańsze: 494 wobec 349-412 weightedK, czyli +18% do +41% (n=3 wobec 13-19;
  obserwacja, nie wniosek). Cena modelu nie jest w weightedK: łączony agent poprawia na opus, a osobny fix zwykle na sonnet, więc
  różnica w pieniądzach jest większa.
- Czas: oszczędza ok. 3-4 min agenta na wycinek (6,3 wobec ok. 10 przy dwóch sekwencyjnych), bez doliczenia przejścia przez
  orkiestratora między krokami. Zysk zegarowy realny, tokenowy ujemny.
- Koszt ponownego czytania przed pierwszą edycją: łączony ma `wKBeforeEdit` 286 średnio, ale to jest czytanie dla review. Trójkrok
  płaci reviewera 212 + fix 42 przed edycją = 254. Czyli oszczędność "fix nie czyta kontekstu od nowa" to ~42 weightedK
  (jeden fix potrzebuje listy ustaleń z `path:line`, czyta mało). Strata jest po edycji: faza po pierwszej edycji łączonego agenta
  kosztuje średnio 208 (79, 322, 222) wobec 130 u osobnego fixa, bo każde wywołanie nosi 85-140k kontekstu zamiast ~35k
  (reguła `orchestrator.md:129-131`: fix do ~50k kontekstu, `Read` tylko zakresy ustaleń).
- Jakość (wszystko w granicach n=3): 0 czerwonych przebiegów u łączonych agentów (u osobnych fixów 12 czerwonych przebiegów w 13
  agentach, ale tam część czerwieni to oczekiwane testy). U5b: 1 błąd średni (rozmiary slotów flag) + 2 testy naprawione, jedna
  pozycja zostaje otwarta ("deselect w `GameInput::updateUi` bez testu"). U7-game: reviewer-fixer nie znalazł defektu (assert przy
  celu poza mapą), znalazł go niezależny `test-writer` (czerwone 2 przebiegi), naprawa `b737e6a`. U6b: 3 commity `fix` + 2
  `refactor`, 4 pozycje świadomie pominięte; po review orkiestrator sam poprawił `Alt+PPM` (`a6ece2f`, 5 linii), błąd specyfikacji
  nieujęty ani w review, ani w testach (0 defektów). Po scaleniu nie ma kolejnych commitów `fix` do U5b i U7. Brak dowodu, że jakość
  jest gorsza, ale też brak dowodu, że jest równa: dwa z trzech wycinków miały błąd znaleziony przez kogoś innego niż reviewer-fixer.
- Ryzyko: ten sam agent ocenia, co jest ustaleniem, i naprawia je bez niezależnego sprawdzenia. W trójkroku też nie ma
  ponownego review poprawki, więc różnica leży w tym, że fix wykonuje ktoś, kto nie wybrał ustaleń (może się nie zgodzić, ale
  rzadko to robi) oraz w tym, że ustalenia są jawną listą przed zmianą kodu. W łączonym trybie tę listę widać dopiero w zwrocie;
  orkiestrator "ogląda poprawki w diffie przed merge" (raport sesji 25), co kosztuje kontekst main, niezmierzone tu.

Rekomendacja: nie wprowadzać łączonego zlecenia jako domyślnego. Dane (n=3) pokazują czas -3/-4 min i koszt +18% do +41% weightedK
(więcej w pieniądzach przez opus), bez zysku w jakości. Jeśli zależy na czasie zegarowym, zachować jako opcję na małe wycinki
(U5b: 305 weightedK, wynik bliski trójkrokowi 349-412), nie na duże (U7: 699, peak 157k). Test do kolejnej decyzji: kolumny
`role=fix`, `wKBeforeEdit`, `weightedK`, `testRunsRed` i `fixCommits` dla kolejnych 3-4 wycinków w obu trybach.

## Pytanie 2: koszt kontekstu orkiestratora, wczesne odczyty i edycje

Metoda: `-Timeline main` daje dla każdego wywołania ctx i cache write. Koszt wywołania = 0,1 x (ctx - cw) + 1,25 x cw. Model
odtwarza `weightedK` main z `agents.csv` dokładnie (1601, 1252, 1159, 1396). Treść dodana w wywołaniu k jest odczytywana z
cache w każdym z M - k kolejnych wywołań, więc jej koszt przenoszenia to 0,1 x tokeny x (M - k) weightedK; zapis kosztuje tyle
samo bez względu na moment. Wyliczenia z 4 sesji (sesja 25 z zastrzeżeniem o wznowieniu).

| Wielkość | 7528b750 (22) | 7fcaaf2b (18) | e43f37ed (24) | 9fd2b5bd (25) |
|---|---|---|---|---|
| Wywołań main M / weightedK main | 65 / 1601 | 73 / 1252 | 73 / 1159 | 80 / 1396 |
| Main jako % weightedK sesji | 35% | 23% | 23% | 26% |
| Stałe tło 57k, przenoszone: weightedK (% main) | 365 (23%) | 410 (33%) | 410 (35%) | 450 (32%) |
| Kontekst po 10 wywołaniach przenoszony resztę sesji, % main | 38% | 49% | 51% | 50% |
| z tego dodane przez orkiestratora (bez tła 57k), % main | 19% | 20% | 20% | 22% |
| To samo po 20 wywołaniach | 22% | 27% | 24% | 27% |
| Treść z wywołania 1 (+26-27k znaków, ok. 11-12k tokenów): przenoszenie, % main | 4,8% | 6,3% | 7,5% | 6,8% |
| Wywołania z samymi Edit/Write (n): przenoszenie weightedK (% main) | 14: 83 (5,2%) | 11: 29 (2,3%) | 6: 15 (1,3%) | 15: 73 (5,2%) |
| z tego w pierwszej połowie | 30 (1,9%) | 22 (1,7%) | 11 (0,9%) | 55 (3,9%) |
| Te same Edit/Write jako % weightedK sesji | 1,8% | 0,5% | 0,3% | 1,4% |

(Wywołania mieszane Edit + inne narzędzie nie są w wierszach Edit/Write; delta ctx obejmuje też tekst asystenta, więc to
górne oszacowanie dla samych edycji, dolne dla ich pełnego udziału.)

Co orkiestrator czytał i edytował wcześnie (Find na main, sesje 22 i 25):

- call 1-5: hook `additionalContext` (reguły silnika), `.claude/project.md`, najnowszy raport, `roadmap.md` od linii 67;
  w sesji 25 dodatkowo pełny starszy raport sesji 23. To potrzebne do wyboru wycinka (poza starszym raportem: brak dowodu, czy
  był potrzebny).
- call 10: `Write` pliku sesji (wymagany przez `orchestrator.md:28-29`), call 12-16: edycje ADR-0010 po wycofaniu skali UI (8 `Edit`
  w jednym wywołaniu, ok. 4k tokenów, 26 weightedK przenoszenia). Te edycje poprzedzały briefy implementerów, którzy czytają ADR
  jako specyfikację, więc odłożenie ich na koniec rozjechałoby specyfikację z briefem.
- sesja 22: `Write` raportu w call 7 i `Edit` w call 12 (decyzje użytkownika) są małe (ok. 1k tokenów każda).

Odpowiedź liczbowa:

- Hipoteza o mechanizmie jest trafna: kontekst po 10 wywołaniach (ok. 100k) jest ponownie czytany przez ok. 60 kolejnych i
  odpowiada za 38-51% weightedK main. Ale 57k z tego to tło stałe (23-35% main), którego odłożenie nie zmienia.
- To, co orkiestrator dokłada sam w pierwszych 10 wywołaniach, to 19-22% weightedK main, czyli 4,5-5,7% weightedK sesji. Prawie
  wszystko to odczyty konieczne na start (kontrakt, raport, roadmapa, ADR).
- Odroczenie edycji dokumentów i notatek statusowych na koniec oszczędza co najwyżej 15-83 weightedK na sesję (0,3-1,8%
  weightedK sesji; 1,3-5,2% main), w praktyce mniej, bo część edycji (ADR, plik sesji) musi poprzedzać briefy. Koszt: utrata
  zapisu w razie przerwanej sesji (sesja 25 miała przerwanie procesu).
- Największa pojedyncza pozycja to nie edycja, tylko odczyt: pełne dokumenty research w sesji 22 (251 weightedK, 15,7% main,
  5,5% sesji). To jedna sesja, więc obserwacja.

Rekomendacja: nie wprowadzać reguły "odkładaj aktualizacje dokumentów na koniec" (zysk <= 2% sesji, ryzyko utraty stanu). Lepsze
dźwignie, w kolejności: (1) skrócić wczytywane na start (call 1 = 11-12k tokenów, 5-8% main, 1,5-2% sesji) czytaniem raportu od
"Następne sesje" przez `offset`/`limit`; (2) w sesjach research nie czytać w całości dokumentów napisanych przez researcherów,
tylko ich zwroty i zakresy (do sprawdzenia w następnej sesji research); (3) zmierzyć, z czego składa się tło 57k (każde 10k
mniej to ok. 70 weightedK na sesję). Wskaźniki: `Timeline main`, ctx w call 2 (dziś 68-69k) i kolumna `mainInputK`.

## Pytanie 3: koszt orientacji orkiestratora przed pierwszym dispatchem

Metoda: z `-Timeline main` (zapisane do plików w scratchpadzie, do kontekstu tylko agregaty) policzone wywołania i weightedK przed
pierwszym wywołaniem z `Agent`. Wycinki excerptów były już wyczerpane (8 z 8), więc przy ścieżkach plików opieram się na dwóch
sesjach, w których te Find-y już zrobiono (22 i 25), oraz na raportach sesji (dokumenty, nie transkrypty).

| Sesja | Nr | Wywołań przed 1. Agent | weightedK przed (% main) | Read / Grep+Glob / PS | Dodane przed dispatchem | ctx przy dispatchu | Przenoszenie orientacji (ponad call 2) na późniejsze wywołania |
|---|---|---|---|---|---|---|---|
| a6fa7b22 | 17 | 11 | 135 (23%) | 7 / 12 / 2 | 58k zn. | 91k | 61 |
| 7fcaaf2b | 18 | 16 | 225 (18%) | 9 / 12 / 1 | 91k | 110k | 218 |
| 2f2004b4 | 19 | 17 | 277 (27%) | 12 / 10 / 3 | 146k | 135k | 265 |
| a97e7991 | 20 | 6 | 92 (11%) | 3 / 4 / 2 | 41k | 81k | 50 |
| 378d5d1f | 21 | 15 | 220 (25%) | 9 / 12 / 4 | 97k | 116k | 172 |
| 7528b750 | 22 | 8 | 129 (8%) | 4 / 7 / 1 | 81k | 104k | 179 |
| 3fe3b434 | 23 | 10 | 186 (15%) | 11 / 8 / 1 | 121k | 120k | 245 |
| e43f37ed | 24 | 13 | 170 (15%) | 6 / 6 / 4 | 75k | 99k | 159 |
| 9fd2b5bd | 25 | 10 | 156 (11%) | 5 / 8 / 3 | 78k | 101k | 200 |
| 47055298 (niezapisana) | 26 | 5 | 80 (16%) | 4 / 2 / 2 | 51k | 84k | 38 |

Mediana: 10 wywołań i 170 weightedK przed pierwszym dispatchem (8-27% weightedK main, 3-6% sesji) i ok. 2 minuty zegara.
Dodatkowo dodane tokeny przenoszone są przez pozostałe wywołania: 50-265 weightedK na sesję.

Co czytano: w call 1 zawsze (4 z 4 sesji z Find) hook `additionalContext` + `.claude/project.md` + najnowszy raport (+26-27k znaków,
opisane w D4). Dalej, sesja 22: `roadmap.md`, plik sesji, potem `gui-*.md` x5 i kod referencyjny Remake'a; sesja 25: `roadmap.md`
od linii 67, starszy raport sesji 23, ADR-0010 linie 21-146 oraz 8 edycji ADR. Dla pozostałych sesji znam tylko liczby (Read,
Grep, znaki), nie ścieżki.

Powtarzalność między kolejnymi sesjami tego samego sektora (z raportów sesji, "Zakres"): UI sesje 23, 24, 25 i 26 mają identyczny
zestaw specyfikacji (ADR-0010, testy z `design/reviews/ui.md` §2, wycinki z `roadmap.md`); ruch: sesje 19 i 20 identyczne
(ADR-0009 pkt 3, `reviews/movement.md` §5.1, §5.4, §12, `unit-walk.md` Q2, Q3, L2, L3). Kontrakt i roadmapa są wczytywane w każdej
z 4 sesji, w których znam ścieżki. To jest powtórzenie na poziomie zestawu dokumentów, nie zmierzone na poziomie linii.

Plan z briefami: plik planu nie istnieje (umiarkowanie pewne: `.claude/` i `docs/` bez pliku planu; umiejętność `plan` zapisuje
plan do listy zadań klienta, `plugins/stack/skills/plan/SKILL.md` pkt 6, nie do pliku). Istnieją dwa zastępniki: tabela wycinków
w `docs/roadmap.md` (wycinek, moduł, zależność, szacunek linii, np. U0-U6b) bez ścieżek i zakresów, oraz sekcja "Następne sesje"
raportu poprzedniej sesji (615-3176 znaków). Sesja 25 zostawiła tam gotowe briefy U6b (41 linii, "Czytać tylko briefy niżej") i sesja
26 je użyła: 5 wywołań i 80 weightedK przed dispatchem, najmniej w całym zbiorze (mediana 10 i 170); sesja 20, kontynuacja
z jednym wycinkiem, 6 wywołań i 92. Pozostałe sesje wyprowadzały orientację od nowa, mimo że raporty miały sekcję "Następne
sesje" z 12-24 liniami wskazującymi ADR i zakresy bez briefów.

Szacunek oszczędności, gdyby istniał gotowy plik briefów: orientacja po wczytaniu kontraktu, raportu i hooka (call 1-2, ctx 69k)
kurczy się do przeczytania jednego pliku ok. 3k tokenów (założenie), a wywołania 3..k-1 znikają (zostaje ok. 10 weightedK na
jedno wywołanie z odczytem). Oszczędność = koszt tych wywołań + przenoszenie zaoszczędzonych tokenów (0,1 x tokeny x liczba
późniejszych wywołań):

| Sesja | Tokeny do uniknięcia | Wywołania 3..k-1 | Przenoszenie | Razem weightedK | % main | % sesji |
|---|---|---|---|---|---|---|
| 17 | 19k | 94 | 61 | 145 | 25% | 10,4% |
| 18 | 39k | 175 | 218 | 384 | 31% | 7,2% |
| 19 | 63k | 237 | 265 | 491 | 48% | 14,5% |
| 20 | 9k | 42 | 50 | 82 | 10% | 2,8% |
| 21 | 44k | 179 | 172 | 341 | 38% | 18,2% |
| 22 | 32k | 88 | 179 | 258 | 16% | 5,7% |
| 23 | 48k | 136 | 245 | 371 | 29% | 8,2% |
| 24 | 27k | 129 | 159 | 279 | 24% | 5,5% |
| 25 | 29k | 106 | 200 | 296 | 21% | 5,5% |

Razem 2647 weightedK na 34 409 (7,7% weightedK 9 sesji), mediana 296 na sesję (5,5% sesji), zakres 82-491. Przenoszenie
(kolumna) to 42-69% oszczędności w poszczególnych sesjach. Granice: (1) założenie 3k tokenów pliku briefów jest moje; (2) bez ścieżek nie wiem, ile z
uniknianych tokenów jest naprawdę zbędne (np. ADR czytany do napisania briefu); (3) koszt sesji planistycznej nie jest tu odjęty:
jedna taka sesja kosztuje orientację rzędu 250-400 weightedK jak powyżej plus wypisanie briefów, więc zwraca się dopiero od
drugiej sesji sektora; (4) briefy z góry się starzeją: w tych danych plan sektora zmieniał się w trakcie (sesja 20 "wycinki
drobniejsze niż w sesji 19"; sesja 23 "zakres zawężony na prośbę użytkownika"; sesja 25 wycofanie skali UI zmieniło ADR i briefy).

Rekomendacja: nie wprowadzać osobnej sesji planistycznej na cały sektor. Dane pokazują, że gotowe briefy wystarczają do skrócenia
orientacji o ok. połowę (sesja 26: 80 wobec mediany 170 weightedK; n=1), a to już dzieje się bez nowej procedury wtedy, gdy raport
poprzedniej sesji w "Następne sesje" zawiera briefy kolejnego wycinka. Tańsza zmiana: w kroku "End"/`end` skill i w regule
`orchestrator.md:24-25` ustalić, że raport kończący sesję zawiera w "Następne sesje" gotowe briefy 1-2 następnych wycinków
(Goal, Read ze ścieżkami i zakresami, Done when) i że nowa sesja zaczyna od ich dispatchu, a poza nimi nie czyta ADR ani research.
Wskaźniki skuteczności: `Timeline main` (wywołania i weightedK przed pierwszym `Agent`: cel <= 6 wywołań, <= 100 weightedK),
oraz `briefRanges` w pierwszych briefach sesji. Jeśli ta zmiana się utrzyma przez 3-4 sesje, dopiero wtedy ocenić plan sektora
w pliku; jego marginalny zysk wobec "briefów na następne 1-2 wycinki" to tylko sesje, które dziś nie mają briefów w raporcie.

## Wzorce

0. **Orientacja przed pierwszym dispatchem (pytanie 3)**, 9 z 9 sesji: mediana 10 wywołań i 170 weightedK, razem z
   przenoszeniem 2647 weightedK (7,7%) do uniknięcia. Propozycja: briefy 1-2 następnych wycinków w "Następne sesje" raportu
   kończącego (zob. wyżej); wskaźnik: wywołania i weightedK przed pierwszym `Agent` w `Timeline main`.
1. **Duże implementery (D1)**, sesje 18, 24, 25 (+ fix `f47a7` w 19): 5 agentów > 150k kontekstu, 800-918 weightedK, 24,5
   ścieżki w briefie, 2 bigReads. Propozycja: w `orchestrator.md:119-121` dodać, że brief wycinka z > ~20 ścieżkami wymaga
   `Read` z zakresami albo podziału, a przy wycinku z planem > 120k zlecić najpierw mapę kodu (reguła :140-146 działa dopiero
   > 30k odczytu). Skuteczność: `peakK` implementerów > 150k oraz `briefRanges`/`bigReads` (cel: 0 agentów > 150k, `bigReads` 0).
2. **Stałe tło i start orkiestratora (D4)**, 4 z 4 zmierzonych sesji: call 1 kosztuje 11-12k tokenów (5-8% main). Propozycja:
   w `orchestrator.md:24-25` czytać raport sesji od sekcji "Następne sesje" (`offset`/`limit`); Skuteczność: `Timeline main`,
   ctx w call 2 (cel poniżej 65k) i `+k` znaków po call 1 (dziś 26-27k).
3. Łączone review+fix (3 zlecenia, 2 sesje) i odkładanie edycji dokumentów nie spełniają progu 3 sesji z wnioskiem; patrz niżej.

## Obserwacje

- Review+fix w jednym zleceniu (n=3, 2 sesje): +18-41% weightedK, -3/-4 min; patrz pytanie 1.
- `f47a7` (sesja 19): fix na opus, 688 weightedK, 152k, `wKBeforeEdit` 405, 8 zakresów w 5048-znakowym briefie, brak `Status:`.
  Przeczy regule fixów (`orchestrator.md:129-131`: ~50k, sonnet); nie sprawdzono briefu wycinkiem (limit wycinków), więc przyczyny
  nie klasyfikuję.
- Cache nie wygasa przy przerwach main: luki 5-18 min (np. call 58 w sesji 18 po 18 min) bez zapisu cache > 3k tokenów. Czekanie
  main na agentów nie kosztuje tokenów.
- Sesja 25 jest łańcuchem wznowień: pierwsze ~21 wywołań to powtórzenie; należy ją wykluczyć z porównań wersji.
- Sesja 22 (research): 6 researcherów równolegle po ok. 300 weightedK, `wKBeforeEdit` 191-386; nie wiadomo, czy briefy
  zawężały czytanie (nie sprawdzano).
- Sesja 21 (`378d5d1f`) jest najtańsza na pozycję (624) przy 8 agentach i 0 agentach > 150k: wycinki małe (plan <= 60k).
  Zgodne z D1, ale to jedna sesja.

## Wersje silnika

Sesje `code` z uzupełnionym `itemsDone`, mediana weightedInputK na pozycję (n w grupie). Wznowione wykluczone (`9fd2b5bd`),
okruchy bez `itemsDone` pominięte.

| Silnik | n | mediana weightedK / pozycja | zakres | mediana minut / pozycja |
|---|---|---|---|---|
| off | 5 | 3051 | 588-10765 | 25,2 |
| 0.2.0 | 1 | 2573 | - | 44,0 |
| 0.3.0 | 1 | 1351 | - | 19,5 |
| 0.4.0 | 7 | 1395 | 624-1786 | 11,9 |

0.4.0 wobec `off`: mediany -54% weightedK i -53% minut na pozycję, ale `off` to inny proces projektu (wcześniejszy log
procesu), a ich wycinki nie są porównywalne rozmiarem. 0.3.0 i 0.2.0 mają n=1: obserwacje. W 0.4.0 rozrzut (624-1786, 2,9x) jest
większy niż różnica względem 0.3.0 (1351), więc ta wersja nie wykazuje przewagi nad 0.3.0 na tych danych. Sesja `research`
(7528b750, 4549) nie wchodzi do tabeli.
