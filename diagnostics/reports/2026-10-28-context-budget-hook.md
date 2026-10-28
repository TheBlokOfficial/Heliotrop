# Hook `context-budget` (0.7.0) w sesjach KamReimagined

## Zakres

- Hook: `plugins/stack/hooks/context-budget.js` (PostToolUse, tylko subagenci). Budżet 100k: przy ≥80k notice
  `warn`, przy ≥100k notice `over`, dalej co +20k. Release: commit `372ebfa`, 2026-10-27 08:59:55 +01:00
  (07:59:55 UTC).
- Sesje z hookiem (0.7.0): `b4f6305e` (sesja 44, C5b/C8a/C12b), `de1e3eed` (sesja 45, przegląd kodu),
  `94226f02` (sesja 46, C6/C7a), `701c15d1` (sesja 47, C7b/C8b). Razem 37 subagentów.
- Grupa porównawcza (0.6.0, bez hooka): `9b8492de` (s38), `f6060e66` (s39), `85dece70` (s40), `6b87e4ae` (s41).
  Razem 21 subagentów.
- Dwie korekty przypisania względem danych wejściowych:
  - `6b87e4ae` należy do 0.6.0. Jej subagenci działali 07:34–07:59:01 UTC, wszyscy przed releasem 07:59:55 UTC.
    To jest sesja, w której hook powstał: od 07:55:30 UTC wątek główny pracuje nad silnikiem (265 wK), a agent
    `a4c56bf` (claude-code-guide) dotyczy hooka. Oba wyłączyłem z kosztów KamReimagined.
  - `91ce93fb` (sesja 37, 2026-10-24 19:06–21:11 UTC) jest sprzed release'u 0.6.0 (`3983159`, 2026-10-25 06:30
    UTC), czyli to 0.5.x. Nie wchodzi do porównania; pokazuję ją tylko w jednym wierszu.
- Metryka kosztu: `wK` = ważone tokeny wejścia (cache read ×0,1, cache write ×1,25, input ×1), w tysiącach.
  `wK` nie uwzględnia modelu: `a722011`, `a5a3c99` i `a3094fa` biegły na sonnet, reszta na opus.
- Dane: `budget07.json` / `budget06.json` ze scratchpadu (skrypt `budget.js`) oraz własne odczyty z transkryptów
  (ogony wywołań wokół notice, wiadomości `<agent-message>`, `SendMessage`), pliki stanu
  `%TEMP%\stack-context-budget`, raporty sesji 38–47 i `git log` / `git show --numstat` w KamReimagined.
- Korekta statusu: `aeb1f72` (C8b-1) zwrócił najpierw `blocked` (08:15:09, pytanie o zakres). Orkiestrator
  odpowiedział przez `SendMessage`, a agent skończył ze statusem `done` (08:21:05). Skrypt brał pierwszą
  wiadomość, więc zapisał `blocked`.
- Liczba agentów z notice `over` to 8, nie 9. Plików stanu jest 24: 16 z `level 0` i 8 z `level 1`. Zgadza się
  to z transkryptami.

## Wyniki

### 1. Ilu subagentów zakończyło się przez hook

| Grupa (0.7.0) | n | Agenci |
|---|---|---|
| Dostali notice (≥80k) | 24 z 37 | 16 tylko `warn`, 8 także `over` |
| Notice `warn` → `partial` | **0** | Żaden agent nie skorzystał z „return partial” w chwili ostrzeżenia |
| Notice `over` → `partial` (przyczyna: hook) | **6** | `a722011` (test-writer), `a1ad1d4`, `a2f47ab`, `a28f914`, `ab9fecc`, `a91cbb2` (implementerzy) |
| Notice `over` → `done` | 2 | `a484d54` (po notice uruchomił ctest i commit), `aeb1f72` (po notice tylko odczytał wynik ctest) |
| `partial` z innej przyczyny | 1 | `a2cd90d`, peak 67k, bez notice |
| Agent przy 120k (reminder) | 0 | maksymalny peak 102k |

- Wszystkie 6 partiali z hooka podaje w zwrocie jako przyczynę budżet kontekstu, np. `a2f47ab`:
  „Status: partial (I hit the context budget, so nothing is built, formatted, tested or committed)”.
- `a2cd90d` (C8a-2): przyczyną jest sprzeczność w briefie, nie budżet. Zakaz dodania wiersza zastępczego zapisu
  przy wymaganym zielonym zestawie testów: „The brief's constraint contradicts "zestaw w pełni zielony"… It will be
  green once C5b-2's v11 row is merged in. I did not add a placeholder row, because that was explicitly forbidden.”
- Ostrzeżenie przy 80k nie zakończyło formalnie żadnego agenta. 10 z 16 agentów, którzy dostali tylko `warn`, oddało
  wynik w 1–3 wywołaniach po nim. To wszyscy 4 recenzenci i 6 researcherów (patrz pyt. 2 i 5).

### 2. Agenci z samym ostrzeżeniem, którzy zwrócili `done`: czy coś obcięli

Porównałem brief (`Size`, `Done when`), wywołania po ostrzeżeniu i zwrot każdego z 16 agentów.

| Rola | Agenci | Po `warn` | Ocena |
|---|---|---|---|
| implementer (5) | `a565beb`, `a298038`, `a0056a5`, `a0c3b13`, `a8126d4` | 4–12 wywołań: edycje testów, build, ctest, commit | Kryteria `Done when` (build bez ostrzeżeń, zielony szybki zestaw, commit) spełnione u wszystkich. Bez oznak obcięcia. |
| test-writer (1) | `a5a3c99` | 10 wywołań (E7 X8): poprawki, budowanie i uruchamianie testów | **Możliwe obcięcie zakresu** (niżej) |
| reviewer (4) | `a926b27`, `a3a8ba7`, `a377d48`, `af342c8` | 1–4 wywołania, 0 `Read`, potem zwrot | Do chwili ostrzeżenia czytali kod, potem przestali. 3 z nich zostawili punkty oznaczone jako niezweryfikowane (niżej) |
| researcher (6) | `ac53a31`, `a1b559c`, `a45a9a0`, `a60e502`, `acc800d`, `a5620f3` | 2–5 wywołań, 0 `Read`, `Write` mapy | Mapa napisana. Luki zgłoszone jawnie: `a1b559c` „Niesprawdzone: lista źródeł w CMake modułu `sim` (wnioskowane)…”. |

Przypadki podejrzane (nic nie zostało ukryte, ale przyczyny nie da się rozstrzygnąć):

- `a5a3c99` (de1e3eed, testy-kotwice wręcz, ostrzeżenie przy 82k w wywołaniu 13/23). Brief: „write the missing
  anchor tests for … ADR-0011 points 4-6”. Zwrot: „Not written: C17 (kill before step 5 and after step 5), C20 and
  C21. These need a target that moves away or a march order given mid-fight.” oraz „The "target leaves" path is
  untested.” Agent podaje powód techniczny, ale pominięcie przypada na okres po ostrzeżeniu, w którym agent już
  tylko poprawiał i uruchamiał testy.
- Recenzenci przestali czytać zaraz po ostrzeżeniu. `a926b27` przy 81k czytał `world.cpp`, a w następnym wywołaniu
  oddał zwrot z punktem „Possible gap, not verified: when the fight switches to a new target
  (combat_fight.cpp:160-171)…”. `af342c8`: „Unverified edge case: `pruneOffenders` matches melee offenders by
  `offender.group`…”. `a3a8ba7`: „I did not check E16…”. Brief wymagał weryfikacji tylko dla findingów, a te punkty
  są jawnie oznaczone jako niezweryfikowane, więc brief nie został naruszony. Pozostaje pytanie, czy przy większym
  budżecie zostałyby rozstrzygnięte. Punkt `a926b27` sesja 46 rozstrzygnęła później bez zmiany kodu („zmiana celu
  w `FightAction` bez `attackingUnit` … zostaje”).
- `a8126d4` po poprawce testu nie uruchomił drugi raz pełnego szybkiego zestawu („pełnego szybkiego zestawu drugi
  raz nie uruchamiałem”). Brief przewidywał jeden przebieg („Raz szybki zestaw…”), a po scaleniu `main` miał
  833/833. To nie jest obcięcie.

Nie znalazłem agenta, który zadeklarował `done` i ukrył pominiętą weryfikację, test albo wymaganie briefu.

### 2b. Czy notice wywołały niestaranną pracę i co z tego wynikło

Szukałem po notice: pominiętej weryfikacji, punktów „not checked” / „unverified”, cicho porzuconych wymagań,
commitów kodu bez builda, placeholderów i TODO. Potem sprawdziłem skutki: findingi przeglądu, agentów i commity
`fix`, czerwone testy w kontynuacjach.

| Grupa | n (bez verifierów) | Zwroty z ≥1 punktem „nie sprawdzono / niezweryfikowane / pominięte” | Defekty znalezione później w ich wycinkach |
|---|---|---|---|
| 0.7.0, dostali notice, nie `partial` | 18 | 8 (`a3a8ba7`, `a926b27`, `af342c8`, `a1b559c`, `a45a9a0`¹, `a5a3c99`, `aeb1f72`, `a8126d4`) | 1: C6b `lastShotTick` (`a298038`), ale błąd był w projekcie z briefu² |
| 0.7.0, bez notice | 12 | 4 (`a98a7e6`, `ac2cc30`, `a7c2fe4`, `a3094fa`) | 1: render pocisku o tick za późno (C12b, `a7c2fe4`, przegląd R2) |
| 0.6.0 (bez hooka) | 19 | ok. 9 (np. `a0db941`: „I forgot to set `KR_KAM_REMAKE_DIR`, so the tests that need real game data were skipped”) | R1-1 (łucznik zadaje obrażenia wręcz) i R4-1 (odcisk schematu bez pocisku i `offenders`) z przeglądu w sesji 45, oba w kodzie z 0.6.0 |

¹ Luka wynikała z briefu („nie czytałem kodu Remake'a, bo brief tego zabraniał”).
² Brief `a298038`: „C6b: `std::uint32_t lastShotTick = 0` w `MemberOrderTask`”. Poprawił to `ab07df1` (184 wK).

Wycinki przerwane przez hook (6) i co znalazła kontynuacja:

- Commit kodu bez builda zdarzył się raz i był jawnie oznaczony: `59cd24e` „(WIP: not built, save fingerprint
  placeholder)” (`ab9fecc`). Tak każe tekst notice (`save or commit what is done … mark unverified work as such`).
  `a28f914` zacommitował kod zbudowany, ale nieprzetestowany. Orkiestrator uruchomił potem ctest: 822/822.
- Kontynuacje znalazły: jeden błąd kompilacji (`ab08f65`: „fixes `-Werror=missing-field-initializers` in
  group_lanes.cpp:75…”), oczekiwane czerwone testy na wierszach zastępczych odcisku (`a766ca3`, `a3094fa`) i jeden
  stary test zepsuty przez nową logikę (`a8126d4`). Odstępstwo od mapy (`exact = false`) `ab9fecc` zgłosił sam,
  a `a3094fa` je zastosował.
- Jedna zmiana została zastosowana częściowo: `a722011` zostawił plik testów z nieudaną edycją (`The -replace line
  did not apply, so <string>, <tuple> and <utility> are not included`) i opisał to w zwrocie. Plik leżał
  w głównym checkoucie, który dzielili równolegli test-writerzy. `a5a3c99` zgłosił: „projectile_anchor_test.cpp …
  failed to compile at line 215 … A normal full build of `kr_sim_tests` will fail until that agent fixes it”.
  Orkiestrator przeniósł plik na gałąź `test/projectile-anchors`, a na `main` zostawił zaślepkę. Testy nie zostały
  dokończone do dziś.
- Przegląd w sesji 45 objął C5b-2 i C8a-1 (oba przerwane i dokończone przez kontynuacje). Obszar R3 („oddział,
  ruch i cel dom”): bez usterek. R2-1 odrzucone. Wycinki z sesji 46–47 nie przeszły jeszcze przeglądu, więc dla
  nich odpowiedź „bez defektów” jest niepełna.

Wniosek: nie widać, żeby wycinki z notice były robione mniej starannie. Udział zwrotów z zastrzeżeniami (8/18)
jest podobny do 0.6.0 (~9/19) i niewiele wyższy niż u agentów 0.7.0 bez notice (4/12). Liczby pochodzą ze
skanu słów kluczowych, więc są przybliżone. Defekty znalezione później nie mają źródła w pracy po notice. Jedyny
konkretny koszt to niezbudowany plik testów `a722011` w dzielonym checkoucie.

### 3. Agenci zatrzymani przy 100k: co zostało i ile kosztowała kontynuacja

Model kosztu z danych: wywołanie oryginału przy ~100k kosztuje 10,5–12 wK (≈0,1 × kontekst + 1,7–2 wK nowych
tokenów). Świeża kontynuacja płaci na start 35–50 wK (orientacja: status, diff, ponowne czytanie), potem 4–5 wK za
wywołanie. Próg opłacalności wychodzi przy około 5–7 wywołaniach reszty: przy mniejszej reszcie taniej jest
skończyć w miejscu, przy większej taniej jest uruchomić świeżego agenta. Szacunek „dokończenia w miejscu” liczy
tylko wywołania robocze kontynuacji (bez orientacji), z kontekstu oryginału i przy przyroście kontekstu na
wywołanie zmierzonym w kontynuacji.

| Wycinek | Oryginał (wK) | Co zostało | Kontynuacja | Koszt kontynuacji | Szacunek dokończenia w miejscu | Taniej |
|---|---|---|---|---|---|---|
| C7a-2 `a28f914` (94226f02) | 350 | 1 krok: ctest | wątek główny, 1 wywołanie | ~13 wK (przy 118k) + przyrost kontekstu głównego | 1–2 wywołania ≈ 11–23 wK | ≈ remis; w miejscu slice kończy się `done` |
| testy pocisków `a722011` (de1e3eed) | 221 | include'y, build, uruchomienie, poprawki, commit | brak w sesji (zaparkowane) | — | ~5–8 wywołań ≈ 60–90 wK, peak ~110k | nieznane; w miejscu prawdopodobnie |
| C5b-2 `a2f47ab` (b4f6305e) | 423 | test determinizmu, format, build, odcisk, ctest, commit | `a766ca3`, 19 wywołań (9 orientacji = 50 wK) | 93 wK | 10 wywołań ≈ 111–121 wK, peak ~107k | kontynuacja (−18 do −28) |
| C8a-1 `a1ad1d4` (b4f6305e) | 330 | test zapisu, format, build, ctest, commit | `ab08f65`, 18 (7 = 48 wK) | 106 wK | 11 wywołań ≈ 130–135 wK, peak ~111k | kontynuacja (−24 do −29) |
| C7a-1 `ab9fecc` (94226f02) | 430 | configure, format, build, odcisk, ctest, commit | `a3094fa` (sonnet), 13 (4 = 35 wK); dodatkowo scalenie `main` | 74 wK | 9 wywołań ≈ 108–112 wK, peak ~112k | kontynuacja (−34 do −38, do tego tańszy model) |
| C8b-3 `a91cbb2` (701c15d1) | 339 | 4 kroki logiki + format, build, 3 testy, commit | `a8126d4` (opus), 43 wywołania, peak 95k | 361 wK | ≥26 wywołań ≈ 372+ wK, peak ~145k | kontynuacja (≈ remis w wK, ale oryginał przekroczyłby 120k) |
| C8b-2b `a484d54`, C8b-1 `aeb1f72` | 416, 449 | nic | — | — | po notice 2 i 1 wywołanie (≈ 23 i 11 wK) | — |

- Uruchomienie kontynuacji kosztuje też wątek główny: jedno wywołanie na brief (~13–17 wK przy 120–160k) plus
  brief i zwrot, które zostają w kontekście głównym. Szacuję to na ~15–25 wK na kontynuację. Po doliczeniu tego
  przewaga kontynuacji w C5b-2 i C8a-1 prawie znika, w C7a-1 maleje do ~10–20 wK.
- Wyższy budżet byłby tańszy dla C7a-2 (1 wywołanie) i prawdopodobnie dla `a722011` (4–8 wywołań, ale bez
  kontynuacji w sesji). Świeży agent był tańszy albo równy dla C5b-2, C8a-1, C7a-1 i C8b-3. W C8b-3 dokończenie
  w miejscu skończyłoby się około 145k, czyli w obszarze, którego hook ma unikać.

#### 3b. Hipoteza: notice przy 100k jest zbyt autorytarny

Stan w chwili notice `over` i zachowanie po nim:

| Agent | Co robił tuż przed notice | 1–3 wywołania po notice | Co zostawił | Pozostałe kroki (cytat ze zwrotu) | Ile kosztowała reszta |
|---|---|---|---|---|---|
| `a722011` | `Write` całego pliku testów (15,7k tokenów wyjścia, 84k→99k), potem configure `build/tw-proj` | od razu zwrot | plik niezbudowany, bez commita, nieudana edycja include'ów | „1. Add the three includes. 2. Build … 3. Run … with the tag `[projectile]`. 4. Fix co…” | nie dokończono w sesji |
| `a1ad1d4` | edycje `pathfinder_test.cpp` (kod produkcyjny gotowy) | od razu zwrot | bez builda i formatowania, bez commita | „Remaining steps: 1. world_save_test.cpp, one TEST_CASE…” | 18 wywołań / 106 wK |
| `a2f47ab` | czytał `projectile_test.cpp` pod test determinizmu | od razu zwrot | bez builda i formatowania, bez commita | „1. In tests/sim/projectile_test.cpp, add a determinism test where a shot hits a unit…” | 19 / 93 wK |
| `a28f914` | build zakończony bez ostrzeżeń | commit, zwrot | ctest nie uruchomiony | „Remaining step: run `ctest --preset debug -LE slow` and fix the new test if it fails.” | 1 wywołanie w wątku głównym, ~13 wK |
| `ab9fecc` | skończył ostatnią edycję testów | commit WIP, zwrot | bez builda i formatowania, placeholder odcisku | „1. `cmake --preset debug` … build without warnings. 2. … v13 row has the placeholder… 3. Run `ctest`… 4. Commit…” | 13 / 74 wK |
| `a91cbb2` | `Write` `house_attack.cpp` | `Grep`, edycja CMakeLists (dokończył edycję w toku), zwrot | bez builda, bez commita, 4 kroki logiki nie zaczęte | „1. combat_policy.cpp `canInterruptAction`… 5. clang-format, build in build/c8b3, the 3 tests…” | 43 / 361 wK |
| `a484d54` | build | ctest, commit, zwrot `done` | nic | — | — |
| `aeb1f72` | ctest | odczyt wyniku, zwrot `done` | nic | — | — |

- Wszyscy skończyli na 100–102k: 3 agentów oddało zwrot od razu, 3 po jednym wywołaniu, 2 po dwóch. Tekst „start
  no new step” działa dosłownie.
- W tym samym stanie („build gotowy, testy przed nami”) agenci zachowali się różnie. `a484d54` uruchomił ctest,
  zrobił commit i zwrócił `done`. `a28f914` zrobił commit i oddał `partial` z resztą na jedno wywołanie. Dla
  `a722011` build był „nowym krokiem”. W tych dwóch przypadkach (`a28f914`, `a722011`) notice zatrzymał agentów
  wcześniej, niż zrobiłoby to sformułowanie z ostrzeżenia 80k („finish the current step”), jeśli build i testy
  traktować jako część kroku.
- Pozostałe 4 przerwane wycinki (`a1ad1d4`, `a2f47ab`, `ab9fecc`, `a91cbb2`) nie były blisko końca: zostało im
  9–26 wywołań roboczych. „Dokończ bieżący krok” oznaczałoby u nich dopisanie testu, a build, testy i commit
  i tak zostałyby na potem.
- Łagodniejsze brzmienie przy 100k („finish the step in progress including its build/test/commit, then return”)
  z twardym stopem przy 120k. Szacunek dla tych 8 przypadków:
  - `a28f914`: `done` zamiast `partial`, koszt ≈ 0 (+11–23 wK w agencie, −13 wK w wątku głównym);
  - `a722011`: +60–90 wK w sesji, ale bez późniejszej kontynuacji (która kosztowałaby ~35–50 wK startu plus
    pracę), czyli ≈ remis;
  - `a1ad1d4`, `a2f47ab`, `ab9fecc`: dokończyłyby przy ~107–112k, koszt +18–38 wK każdy minus ~15–25 wK
    narzutu wątku głównego, czyli netto ≈ 0 do +20 wK każdy;
  - `a91cbb2`: twardy stop przy 120k i tak dałby `partial` po ~15 dodatkowych wywołaniach (~190 wK), a kontynuacja
    i tak byłaby potrzebna, choć mniejsza. Netto ≈ +100–190 wK;
  - `a484d54`, `aeb1f72`: bez zmian.
  - Razem ≈ +100–250 wK na trzy sesje (1–3% z 9295 wK). Partiale spadłyby z 6 do 1–2.

### 4. Czy hook obniżył koszt

Spadek peaku (0.6.0 do 198k, 0.7.0 do 102k) to bezpośredni skutek odcięcia, nie oszczędność. Liczę koszt
dokończenia tej samej pracy.

Role (subagenci; n = 4 sesje na grupę):

| Rola | 0.6.0: n / med. peak / med. wK | 0.7.0: n / med. peak / med. wK | wK ≥80k: 0.6.0 → 0.7.0 | wK ≥100k: 0.6.0 → 0.7.0 |
|---|---|---|---|---|
| implementer | 12 / 134k / 593 | 20 / 89k / 327 | 66% → 30% | 50% → 3% |
| test-writer | 0 / – / – | 3 / 97k / 221 | – | – |
| reviewer | 0 / – / – | 4 / 84k / 242 | – | – |
| researcher | 7 / 67k / 127 | 9 / 91k / 197 | 20% → 18% | 13% → 0% |
| wszyscy | 21, suma 8083 wK | 37, suma 8908 wK | 59% → 25% | 44% → 2% |

Sesje i jednostki pracy (wK = subagenci + wątek główny):

| | 0.6.0 (s38–s41) | 0.7.0 impl. (s44, s46, s47) | s45 przegląd (0.7.0) |
|---|---|---|---|
| Sesje: łącznie wK | 3218, 2610, 1522, 2753³ = 10103 | 3104, 2524, 3667 = 9295 | 2184 |
| Subagenci na sesję | 8, 6, 4, 3 (śr. 5,3) | 11, 8, 10 (śr. 9,7) | 8 |
| Pozycje roadmapy zamknięte | 10 (C1a, C2a, C1b, C2b, C12a, C3a, C3b, C4a, C5a, C4b) | 7 (C5b, C12b, C8a, C6, C7a, C7b, C8b) w 15 wycinkach | 0 (4 obszary przeglądu, 2 pliki testów, 1 poprawka) |
| wK na pozycję | **1010** | **1328** (+31%) | – |
| wK na linię `src` dodaną w commitach | 10103 / 1939 = 5,2 | 9295 / 1590 = 5,8 | – |
| wK na linię z szacunku roadmapy | 10103 / 2100 = 4,8 | 9295 / 1430 = 6,5 | – |
| `partial` | 1 (`aebb00f`, „partial by design”, kod w commicie) + 2 przerwane przez użytkownika (s40) | 7 (6 przez hook, 1 przez brief) | 1 (hook) |

³ `6b87e4ae` bez części o silniku (265 wK w wątku głównym, 40 wK w `a4c56bf`).

Doctor podał 870k → 1148k na pozycję. Moje liczby (1010 → 1328) różnią się poziomem, prawdopodobnie przez inny
dobór sesji albo liczenie pozycji. Kierunek i skala (+31% wobec +32%) są te same.

Koszt wycinka liczony jako agent przerwany plus kontynuacja, w wK subagentów na linię `src`:

| Grupa | Wycinki | wK / linia `src` |
|---|---|---|
| 0.7.0 przerwane przez hook + kontynuacje (C5b-2, C8a-1, C7a-1, C7a-2, C8b-3) | 5 | 2519 / 733 = **3,44** |
| 0.7.0 bez przerwania | 10 | 3140 / 857 = 3,66 |
| 0.6.0 agenci ponad 100k bez przerwania (z parami WIP C4a i C5a) | 8 | 6427 / 1844 = **3,49** |

Rozrzut między wycinkami jest duży (1,3–8,2 wK/linię), a n jest małe, więc to obserwacja, nie wniosek. Para
„przerwany agent + kontynuacja” kosztuje na linię tyle samo co agent 0.6.0, który przekroczył 100k bez
przerwania. Na poziomie wycinka hook ani nie obniżył, ani nie podniósł kosztu. Wzrost o ~31% na pozycję widać na
poziomie sesji i nie da się go przypisać hookowi z tych danych. Czynniki zakłócające:

- Od sesji 42 obowiązuje decyzja użytkownika: wycinek najwyżej ~150 linii produkcyjnych i jedno zachowanie. Stąd
  15 wycinków na 7 pozycji, 9,7 zamiast 5,3 agentów na sesję, więcej startów, scaleń i odcisków zapisu.
- Inne zadania: C6–C8b dotykają wielu plików (`group_order.cpp`, `world_save_test.cpp`, Flow), a C1–C3 są
  bardziej lokalne.
- s40 nie zamknęła żadnej pozycji (przerwanie przez użytkownika), a jej WIP wliczyłem do s41.
- Model nie jest uwzględniony w wK (część kontynuacji i test-writerów działała na sonnet).
- n = 4 sesje na grupę (3 implementacyjne w 0.7.0).

### 5. Czy 100k to za mało

Za tym, że za mało:

- Wycinki planowane jako małe i tak dochodzą do budżetu. Briefy implementerów 0.7.0 szacują peak na 50–85k
  (`a1ad1d4`, `a2f47ab`, `a28f914`, `ab9fecc`, `a484d54`, `aeb1f72`: „expected peak ≈ 80k”), a faktycznie było
  100–102k. Briefy researcherów (55–60k) i recenzentów (70–75k) też są poniżej rzeczywistości (83–97k).
  Orkiestrator zaniża szacunek o ~15–30k. 8 z 20 implementerów 0.7.0 doszło do 100k.
- Dwa odcięcia (`a28f914`, `a722011`) nastąpiły 1–8 wywołań przed końcem. Przy takiej reszcie dokończenie
  w miejscu jest tańsze niż nowy agent.
- Każda kontynuacja dokłada 35–50 wK orientacji i ~15–25 wK w wątku głównym.

Przeciw:

- Przy reszcie ≥ ~6 wywołań świeży agent był tańszy albo równy (C5b-2, C8a-1, C7a-1, C8b-3). Jedno wywołanie przy
  100k kosztuje ~11–12 wK, w świeżym agencie 4–5 wK.
- Koszt na linię dla pary „przerwany + kontynuacja” (3,44) nie jest wyższy niż dla agentów 0.6.0 ponad 100k
  (3,49).
- C8b-3 przy dokończeniu w miejscu doszedłby do ~145k. W 0.6.0 6 z 12 implementerów przekroczyło 130k.

Ostrzeżenie 80k a recenzenci i researcherzy:

- Wszystkie 10 read-only agentów, które dostały `warn` (4 recenzentów, 6 researcherów), oddało wynik w 1–5
  wywołaniach i po ostrzeżeniu nie wykonało już żadnego `Read`. Recenzenci jeszcze w wywołaniu przed ostrzeżeniem
  czytali kod (`a926b27` czytał `world.cpp` przy 81k, `a3a8ba7` szukał w `world_save_test.cpp`).
- Researcherzy po ostrzeżeniu od razu pisali mapę (`Write`). To ich naturalny ostatni krok, a przed ostrzeżeniem
  przekroczyli już plan z briefu o 20–35k.
- Mediana peaku researcherów wzrosła z 67k (0.6.0) do 91k (0.7.0), a skupienie 83–97k to „80k + zapis mapy”.
  Ostrzeżenie nie obcięło ich wcześniej niż plan, bo plan był niższy.
- Recenzenci zostawili 3 punkty „niezweryfikowane”. Jeden rozstrzygnięto później bez zmian w kodzie, dwa pozostają
  otwarte, a defektu z nich nie znaleziono. Dane nie pokazują, czy recenzent z budżetem 100k znalazłby więcej
  (n = 4, tylko jedna sesja przeglądowa).

### 6. Inne obserwacje

- Notice w trakcie builda i testów: `a722011` (po configure), `a28f914` (po buildzie), `a484d54` (po buildzie),
  `aeb1f72` (po ctest). Agenci w tej samej sytuacji zachowywali się różnie (pyt. 3b).
- Ignorowanie notice: `a484d54` po `over` zaczął nowy krok (ctest), zrobił commit i zwrócił `done`, a nie
  `partial`. Formalnie to niezgodne z tekstem notice, ale dało tańszy wynik. Poza tym nikt nie przekroczył 102k.
- Czytanie po ostrzeżeniu pod kroki, których agent już nie skończył: `a91cbb2` po `warn` czytał
  `combat_fight.cpp`, `combat_policy.cpp` i `combat_detect.cpp` pod kroki 1–3, a `a2f47ab` czytał
  `projectile_test.cpp` pod test determinizmu. Oba zostały odcięte, zanim tę wiedzę wykorzystały, i kontynuacje
  przeczytały te pliki jeszcze raz (u `a2f47ab` ~23–33 wK zmarnowane, wywołania c48–c50). Między `warn` a `over` przerwani
  implementerzy wydali 122–191 wK.
- Zalecenie z ostrzeżenia „if the remaining work will not fit … return `Status: partial`” nie zostało użyte ani
  razu (0/24). Agenci nie szacują, czy reszta się zmieści.
- Wszystkie 6 partiali z hooka ma listę pozostałych kroków (u `a28f914` w sekcji Attention).
- Zapis pracy: commit zrobiło 2 z 6 (`ab9fecc` WIP, `a28f914`). Pozostałe 4 zostawiły zmiany niezacommitowane
  w worktree (u `a722011` w głównym checkoucie, patrz 2b). Kontynuacje pracowały w tych samych worktree, więc nic
  nie zginęło.
- Orkiestrator po `partial`: 4 razy nowy agent „Finish …” w tym samym worktree (dwa razy sonnet do pracy
  mechanicznej: „Dokończenia `partial` (C7a-1) … sonnet”, raz opus do logiki C8b-3). Raz sam uruchomił ctest
  (C7a-2). Raz zaparkował pracę (testy pocisków, przy 10% budżetu tokenów użytkownika). Ani razu nie wznowił
  przerwanego agenta przez `SendMessage`, co zgadza się z regułą orchestrator.md (Slice size 4).
- Duże pojedyncze `Write` przesuwają kontekst ponad próg w jednym kroku: `a722011` 84k → 99k (cały plik testów),
  `a91cbb2` 96k → 101k. Notice przychodzi po narzędziu, więc taki ruch zawsze go wyprzedza.
- Reminder co +20k nigdy nie zadziałał (max 102k). Wątek główny nie jest objęty hookiem i miał peaki 138–160k.

## Wnioski i opcje decyzji

Ustalenia: hook trzyma subagentów poniżej 103k. Udział wK powyżej 100k spadł z 44% do 2%, ale ten koszt
przeniósł się do kontynuacji. Liczone na wycinek („przerwany + kontynuacja”) koszt na linię jest taki jak w 0.6.0.
Koszt na pozycję roadmapy wzrósł o ~31%, przy silnych czynnikach zakłócających. Nie widać niestarannej pracy po
notice. Notice `over` jest dosłowny: odcina także resztę na 1 wywołanie.

| Opcja | Oczekiwany efekt | Za | Przeciw | Metryka do obserwacji |
|---|---|---|---|---|
| A. Bez zmian (100k, obecne teksty) | jak w s44–s47 | brak przekroczeń 103k; kontynuacje przy dużej reszcie tanie | ~2 partiale na sesję implementacyjną; odcięcia 1 wywołanie przed końcem; narzut orkiestratora | partiale na sesję; wK „przerwany + kontynuacja” na linię |
| B. Łagodniejszy tekst przy 100k: „finish the step in progress including its build/test/commit, then return”; twardy stop dopiero przy 120k | w tych 8 przypadkach ok. +100–250 wK na 3 sesje (1–3%); partiale 6 → 1–2 | domyka wycinki z małą resztą (`a28f914`, `a722011`); mniej briefów „Finish …” | „krok w toku” jest nieostry: `a91cbb2` dobiłby do 120k i i tak oddał `partial` (+100–190 wK) | wywołania i peak po notice; udział partiali z resztą ≤3 wywołań |
| C. Budżet 120k (`context-budget: 120000` w kontrakcie, ostrzeżenie przy 96k) | 3 średnie przypadki kończą się przy 107–112k (+18–38 wK każdy), C8b-3 nadal odcięty | proste; mniej kontynuacji | droższe wywołania w strefie 100–120k dla wszystkich ról; ryzyko powrotu do długich ogonów | udział wK ≥100k; koszt na linię; mediana peaku |
| D. Wyjątek dla końcówki: w tekście `over` „if only build, tests and commit remain, finish them and return done” | celuje w `a28f914` i `a722011` (≈ 0 wK netto) | wąskie, nie otwiera drogi do 145k | wymaga, by agent dobrze ocenił, że „zostały tylko” build i testy; hook tego nie sprawdzi | partiale, których reszta to tylko weryfikacja |
| E. Zmiana tekstu `warn`: oszacuj resztę; jeśli to więcej niż ~6 wywołań poza bieżącym krokiem, zrób commit i zwróć `partial` teraz; nie czytaj pod kroki, których nie skończysz | wymienia 122–191 wK między 80k a 100k na tańsze wywołania świeżego agenta; usuwa zmarnowane odczyty (`a91cbb2`, `a2f47ab`) | dziś zalecenie ostrzeżenia nie działa (0/24) | agenci źle szacują resztę; więcej partiali | partiale już przy `warn`; wK między `warn` a `over` |
| F. Osobne progi dla ról read-only (np. `warn` dopiero przy 90k dla `reviewer`/`researcher`) | recenzenci czytają dłużej, mniej punktów „niezweryfikowanych” | 4/4 recenzentów urwało czytanie zaraz po `warn` | brak dowodu, że więcej czytania daje więcej findingów (n = 4) | punkty niezweryfikowane na przegląd; findingi na przegląd |
| G. Poprawa szacunku `Size` w orchestratorze (dziś zaniżony o 15–30k) | wycinki planowane z realnym peakiem, mniej odcięć | działa u źródła, zgodnie z regułą Slice size | może prowadzić do dalszego dzielenia, a więc więcej agentów i startów | stosunek faktycznego peaku do `expected peak` z briefu |

Opcje B, D i E można łączyć. Żadna z nich nie ma dowodu na obniżenie kosztu na pozycję. Różnice szacowane dla
tych 8 przypadków mieszczą się w ±3% kosztu trzech sesji.
