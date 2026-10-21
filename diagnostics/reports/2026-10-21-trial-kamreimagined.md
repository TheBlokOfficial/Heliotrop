# Diagnoza: próbny przebieg doktora na KamReimagined (2026-10-21)

Pierwsze uruchomienie doktora. Cel: ocenić, czy raport jest użyteczny, zanim będzie używany regularnie. Krok 1
(rejestracja) pominięty na polecenie: wszystkie 22 sesje projektu były już w `sessions.csv` i `agents.csv`.

## Zakres

- Projekt: `D:\Projekty\KamReimagined`.
- Sesje w zakresie (3 z 22; pozostałe wiersze CSV użyte tylko jako kontekst do porównania wersji):

| Sesja | Data | Silnik, który faktycznie działał | Charakter | Agenci |
|---|---|---|---|---|
| `00462fed` | 2026-10-21 | 0.2.0 | kod (ruch: W4, poprawki zwierząt, W6a) | 6 subagentów `stack:*` |
| `e7b254ca` | 2026-10-21 | 0.1.0 | dokumentacja / migracja projektu na stack | 2 (`stack:verifier`, `stack:doc-writer`, oba haiku) |
| `179deeb3` | 2026-10-20 | `off` (poprzednie agenty projektu, nie stackowe) | kod (jednostki: import, sprite'y) | 18 subagentów projektu |

- Wersja 0.3.0 nie ma jeszcze sesji. Jej reguły (`plugins/stack/core/orchestrator.md`,
  `plugins/stack/skills/protocol/SKILL.md`) są stanem bieżącym, z którym porównuję briefy; gdzie wersja sesji miała
  inną regułę, jest to zaznaczone (stan 0.2.0 sprawdzony w commicie `9b183c2`).
- `kind` i `itemsDone` dla `00462fed` i `e7b254ca` są puste w CSV (nie wskazano ich raportu sesji); nie uzupełniałem
  ich, bo nie były mi podane. Skutek: patrz Wersje silnika.
- Użyte excerpty: 9, czyli budżet 8 przekroczony o jeden (patrz O4). `00462fed`: `-Brief` agentów `ade2c669` i
  `aab3574d`, `-Timeline` agenta `ade2c669`, `-Find "TaskStop|stopped|W6a"` w sesji głównej. `179deeb3`: `-Timeline`
  agenta `a1dd0ab2`, `-Brief` agentów `a1dd0ab2` i `af04319c`, `-Find "SendMessage"` w sesji głównej. `e7b254ca`:
  `-Timeline main`; poza tym oglądana tylko w tabelach (`-SessionId`).
- Limity: briefy `ade2c669`, `a1dd0ab2` i `af04319c` pokazane do 4000 znaków; końcówki (Done when, Return) nieoglądane.

## Koszty

`weightedK` = wejście ważone ceną (odczyty z cache x0,1, zapisy do cache x1,25), w tysiącach tokenów.

| Sesja | weightedK | wallMin | main weightedK (udział) | subagenci weightedK | agenci o szczycie >150k | bigReads | commity (fix) | linie |
|---|---|---|---|---|---|---|---|---|
| `00462fed` | 2573 | 44 | 591 (23%) | 1982 | 1 (`ade2c669`, 160k) | 12 | 7 (2) | 1839 |
| `e7b254ca` | 1062 | 41 | 940 (89%) | 122 | 0 (main: 181k) | 0 | 6 (0) | 1662 |
| `179deeb3` | 10765 | 113 | 2188 (20%) | 8577 | 3 (`af04319c` 244k, `a1dd0ab2` 241k, `a86217a0` 187k) | 6 | 24 (3) | 7411 |

Najdroższe agenty w zakresie:

| Sesja | Agent | Typ | calls | peakK | weightedK | min | Brief (znaki / ścieżki / zakresy) | wyszukiwania przed 1. edycją | status |
|---|---|---|---|---|---|---|---|---|---|
| `179deeb3` | `af04319c` | cpp-implementer | 114 | 244 | 2705 | 54,9 | 4698 / 20 / 0 | 16 | done |
| `179deeb3` | `a1dd0ab2` | cpp-implementer | 87 | 241 | 1827 | 37,2 | 5187 / 19 / 0 | 19 | done |
| `179deeb3` | `a86217a0` | cpp-implementer | 92 | 187 | 1284 | 21,7 | 3666 / 25 / 0 | 12 | done |
| `00462fed` | `aab3574d` | stack:implementer | 44 | 128 | 554 | 13,1 | 3025 / 14 / 0 | 11 | done |
| `00462fed` | `ade2c669` | stack:implementer | 35 | 160 | 517 | 9,2 | 3110 / 11 / 0 | 14 | none |
| `00462fed` | `abbe778b` | stack:reviewer | 25 | 122 | 314 | 7,6 | 1526 / 10 / 0 | 14 | done |
| `e7b254ca` | `a69915ba` | stack:doc-writer (haiku) | 8 | 56 | 98 | 2,2 | 2716 / 12 / 8 | 10 | done |

Struktura kosztu: w `179deeb3` siedmiu implementerów to 7346 z 10765 (68%), ośmiu recenzentów 782 (7%), sesja główna 20%.
W `00462fed` implementerzy 1904 z 2573 (74%). W `e7b254ca` prawie cały koszt to sesja główna (89%).

## Diagnozy

### D1. Slice W6a nie zmieścił się w budżecie kontekstu i został zatrzymany bez zbudowania (`00462fed`, `ade2c669`)

- Dowody: peak 160k, 35 wywołań, 26 odczytów (5 całych plików >200 linii; największy wynik 28,4k znaków), 14 wyszukiwań
  przed pierwszą edycją. Pierwsza edycja dopiero w wywołaniu 26 przy kontekście 136k; kontekst 120k przekroczony już
  w wywołaniu 22. W całym przebiegu jedno wywołanie PowerShell, zero budowań i testów, brak `SubagentHandback`
  (status `none`).
- Zakończenie: sesja główna zatrzymała agenta przez `TaskStop` po ok. 9 minutach i zacommitowała jego pracę jako
  `wip(sim): group walk order W6a (unverified, stopped before build and tests)`, 412 wstawień; wpis głównej sesji:
  "W6a stoi w połowie: ~400 linii bez testów, niezbudowane".
- Brief (excerpt): ma Read z 12 ścieżkami, bez zakresów (`briefRanges` 0); lokalizacje kodu opisane niedokładnie:
  `Group` (`src/sim/include/kr/sim/group.hpp or similar`), "the W5 assignment function"; limit podany w liniach
  nowego kodu ("budget ~600 new lines"), bez limitu czytania. Zakres obejmuje 5 pól `Group`, `MemberOrderTask`,
  `orderGroupWalk`, `Halt`, `Formation`, korektę co 7 ticków, limit pushbacku, obrót, zapis/odczyt/hash i testy T11 i
  test scenariuszowy.
- Przyczyna: brief (slice za duży i bez wskazanych miejsc w kodzie), z drugiej strony zignorowana reguła agenta
  (protocol `SKILL.md:17` w 0.3.0, ta sama treść w 0.2.0, p. 5: przy ~120k zatrzymać się i zwrócić `partial`; agent
  przekroczył 120k w wywołaniu 22 i czytał do 136k).
- Reguła silnika: `orchestrator.md:108-110` (Ceiling: slice ma się skończyć poniżej ~120k, wraz z oszacowaniem materiału
  do czytania; w 0.2.0 ta reguła była w linii 102) oraz `orchestrator.md:121-127` (mapa kodu przed dużą implementacją,
  dodana dopiero w 0.3.0, więc sesja jej nie miała). Brief w 0.3.0 wymaga `path:start-end` (`orchestrator.md:80`),
  w 0.2.0 wymagano "exact files or sections" (linia 74).
- Występuje w: `00462fed` (`ade2c669`, w łagodniejszej formie `aab3574d`), `179deeb3` (`a1dd0ab2`, `af04319c`). Dwie sesje.

### D2. Ciągnięcie slice'a z poprzedniego przebiegu: W4 dokończony przez drugiego agenta (`00462fed`, `aab3574d`)

- Dowody: brief mówi, że poprzedni agent "hit its turn limit" i zostawił niezbudowany commit `377972a wip(sim)`
  (~780 linii). `aab3574d`: 44 wywołania, peak 128k, 4061K wejścia, 11 wyszukiwań przed edycją, status `done`
  (czy `wip` zniknął z historii, nie sprawdzałem).
- Przyczyna: ta sama klasa co D1 po stronie poprzedniego przebiegu (slice za duży), koszt `aab3574d` jest uzasadniony:
  zweryfikować ~780 linii i dokończyć T6/T7. Sam brief ma wskazaną komendę diffu, brak zakresów plików.
- Reguła: `orchestrator.md:115-117` (kontynuacja lub nowy agent po `partial`); tu zastosowano nowy agent z listą braków.
  Zgodne z regułą.
- Klasa: inherent (koszt uzasadniony), przyczyna pierwotna w D1.

### D3. Ten sam agent kontynuowany z kontekstem >200k (`179deeb3`, `a1dd0ab2`)

- Dowody: pierwszy `SubagentHandback` w wywołaniu 68 przy kontekście 215k; kolejne 19 wywołań (69-87) tego samego
  agenta aż do 241k i drugi `SubagentHandback`. Sesja główna użyła `SendMessage` 13 razy (agentów kontynuowano po
  zwrocie). Pierwszą edycję agent zrobił w wywołaniu 31 przy 138k, czyli ~130k kontekstu zeszło na czytanie.
- Dodatkowo: wywołanie 52 (PowerShell, 21:41 -> 21:50) ma zapis do cache 172,4k: po 9 minutach bez wywołań cache
  wygasł i cały kontekst 180k zapisano od nowa, ok. 215k wagi z 1827 całego agenta (12%). Najpewniej długi build/test.
- Brief (excerpt, `a1dd0ab2` i `af04319c`): 5187 i 4698 znaków, 19-20 ścieżek, zakresów zero; pięć punktów zakresu w
  jednym briefie (import jednostek, statystyka na 148 misjach, wiring aplikacji, testy T6-T10); nakaz "przeczytaj
  cały ADR (86 linii)" i "src/game/src/application.cpp (598 linii, czytaj fragmentami)" bez wskazania fragmentu:
  "znajdź w ... miejsce, gdzie powstaje lista domów do rysowania".
- Przyczyna: brief (slice za duży, miejsca w kodzie do znalezienia przez agenta). Sesja nie miała silnika (`off`), więc
  reguła nie była naruszona: dziś obejmują to `orchestrator.md:108-110`, `:115-117` (kontynuacja tylko poniżej
  ~100k), `:121-127` (mapa kodu).
- Występuje w: tylko `179deeb3` (`a1dd0ab2`, `af04319c`; kontynuacja potwierdzona tylko dla `a1dd0ab2`).

### D4. Brak statusu zwrotu u recenzentów starego procesu (`179deeb3`)

- Dowody: wszyscy 8 `code-reviewer` mają status `none` (brak linii `Status:`), a kosztują łącznie 782 z 10765 (7%).
- Klasa: nie dotyczy silnika: agenty nie używały formatu protocol. Brak wniosku dla stacka; wiersze `none` w tej
  sesji nie są sygnałem (`agentsNoStatus` 8 z 18 jest artefaktem wersji `off`).

## Wzorce

Żaden ustalony wniosek nie występuje w co najmniej 3 sesjach zakresu z potwierdzoną przyczyną, więc żadnej zmiany
silnika nie proponuję. Najbliżej progu (2 sesje z 3, 4 agentów implementujących): D1/D3, czyli czytanie większości
budżetu kontekstu przed pierwszą edycją (kontekst przy pierwszej edycji: `ade2c669` 136k, `a1dd0ab2` 138k; u
`aab3574d` szczyt całego agenta 128k). Czy zmiany z 0.3.0 (zakresy `path:start-end`, mapa kodu, próg czytania 200 linii) to naprawiają,
pokażą kolumny `briefRanges`, `searchesBeforeEdit`, `peakK` i `bigReads` w pierwszych sesjach kodu na 0.3.0 oraz
excerpt `-Timeline` pierwszego implementera (pierwsza edycja przy jakim kontekście).

## Obserwacje

- O1 (`e7b254ca`): 89% kosztu (940 z 1062) to sesja główna; kontekst rósł od 55k w pierwszym wywołaniu do 181k w 61
  wywołaniach. Skrypt pokazuje w `-Timeline` ok. 100k znaków wyników narzędzi i wiadomości (rzędu 30k tokenów) na wzrost
  o 126k tokenów, więc większość wzrostu nie jest wyjaśniona dostępnymi kolumnami. Przyczyny nie ustaliłem. Subagenci
  (haiku) kosztowali 122, więc delegowanie nie jest tu problemem. Nie badałem briefów doc-writera ani verifiera;
  `a69915ba` zrobił 10 wyszukiwań przed edycją mimo 8 zakresów w briefie (19 wyszukiwań łącznie, koszt 98): mały.
- O2 (`179deeb3`): w komunikatach zadań widać zatrzymanie agenta przez limit użycia konta (wzmianka o resecie
  "Oct 22, 10pm"; ścieżka worktree zaczyna się od `agent-a862`, co odpowiada `a86217a0`, ale tekst jest ucięty).
  Dwóch agentów ma status `partial` (`a81b3534` i `a8bfa792`); nie ustaliłem, który z nich zatrzymał limit. Przyczyna
  zewnętrzna, nie silnika.
- O3 (`00462fed`): `bigReads` 12 liczy odczyty całych plików >200 linii; w 0.2.0 próg w protocol był ~300 linii
  (`SKILL.md:13` w `9b183c2`), więc część z 12 nie łamała reguły tej wersji. Dopiero 0.3.0 obniżył próg do 200, czyli
  do progu kolumny.
- O4 (narzędzie i przebieg): `-Timeline main` dla `e7b254ca` był 9. excerptem; przekroczyłem budżet o jeden i
  zauważyłem to dopiero przy liczeniu. Do `agents.csv` przydałyby się kolumny `firstCallK` (kontekst przy pierwszym
  wywołaniu) i `firstEditCallK` (kontekst przy pierwszej edycji): bez nich D1, D3 i O1 wymagają osobnego excerptu osi
  czasu.
- O5: `040d1600` (silnik 0.1.0, 1 wywołanie, 0,2 min) to sesja niemerytoryczna i wyłączona z porównania.

## Wersje silnika

Wyłączone: sesje wznowione (`2755f500`, `wallMin` 0) i `040d1600` (0,2 min). Silnik `off`: n=18 (po wykluczeniu);
`0.1.0`: n=1 (`e7b254ca`); `0.2.0`: n=1 (`00462fed`); `0.3.0`: n=0. Dla `00462fed` i `e7b254ca` `kind` i `itemsDone`
są puste, więc porównania "ten sam kind, znormalizowane `itemsDone`" z definicji nie da się wykonać. Poniżej przybliżenie
roboczo: kind `code` przypisany `00462fed` na podstawie treści (slice'y implementacyjne ruchu), normalizacja na 1000
zmienionych linii zamiast `itemsDone`. Normalizacja liniami jest słaba (`linesChanged` obejmuje commity równoległych sesji
i commit `wip`), więc to tylko obserwacja.

| Grupa (projekt KamReimagined, kind `code`) | n | mediana weightedK | mediana weightedK / 1000 linii | mediana wallMin | mediana mainPeakK | mediana bigReads |
|---|---|---|---|---|---|---|
| `off` (z wypełnionym kind) | 6 | 7660 | 1415 | 87,4 | 263,5 | 8,5 |
| `off` (z `itemsDone`; weightedK / item) | 5 | 3051 / item | n/d | n/d | n/d | n/d |
| `0.2.0` (`00462fed`) | 1 | 2573 | 1399 | 44 | 136 | 12 |
| `0.1.0`, docs (`e7b254ca`) | 1 | 1062 | 639 | 41,1 | 181 | 0 |

Obserwacje (n poniżej 3, bez wniosków):

- `00462fed` ma koszt na 1000 linii (1399) praktycznie równy medianie `off` (1415): na tych danych silnik 0.2.0 nie
  zmienił kosztu jednostkowego; krótszy czas (44 min wobec 87) wynika częściowo z tego, że sesja zakończyła się przed
  dokończeniem W6a (D1) i ma mniej linii.
- Szczyt kontekstu sesji głównej w `00462fed` (136k) jest poniżej mediany `off` (263,5k), ale to jedna sesja.
- `e7b254ca` (docs) nie ma w `off` sesji tego samego kind. Dla `mixed` (n=2) 1212 i 2106 na 1000 linii (mediana 1659)
  wobec 639; inny kind, nieporównywalne.
- Z porównania nie wynika żadna zmiana silnika.
