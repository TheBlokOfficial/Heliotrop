# Czy testy KamReimagined się opłacają: pomiar z repozytorium

Data: 2026-10-21. Repozytorium: `D:\Projekty\KamReimagined`, gałąź `main`, HEAD `546c084`. Tylko odczyt: nic w projekcie nie zmieniono (poza logami w katalogu tymczasowym sesji; testy uruchomiono z gotowych binariów, bez budowania i bez `ctest`).

Metoda i ograniczenia, które obowiązują dla wszystkich liczb poniżej:

- Linie kodu = niepuste, bez linii zaczynających się od `//` i bez bloków `/* */`. Gdzie podano „fiz.”, to linie fizyczne (z `git log --numstat`, który nie odróżnia komentarzy).
- Kod produkcyjny = `src/**/*.cpp|hpp` (nagłówki publiczne liczone razem z implementacją). Testy = `tests/**/*.cpp|hpp`. Nie liczę `CMakeLists.txt`, shaderów trzymanych w plikach spoza `src/` ani danych.
- Historia: 296 commitów na `main`, w tym 53 merge; analiza 243 commitów nie-merge. Cała historia obejmuje 4 dni kalendarzowe (2026-10-18 do 2026-10-21), więc „tygodni” nie ma; podaję dni.
- Repozytorium nie zapisuje przebiegów testów ani tego, kto/co wykryło usterkę. Wszystko w pkt 3 to wnioskowanie z commitów i dokumentów, nie z logów uruchomień.

## 1. Objętość

Stan na HEAD. Linie kodu (bez pustych i komentarzy); w nawiasie linie fizyczne.

| Moduł | Pliki prod. | Kod prod. | Pliki test. | Kod test. (z helperami) | Test:prod (kod) | Test:prod (fiz.) |
|---|---|---|---|---|---|---|
| `core` | 10 | 659 (959) | 6 | 762 (887) | 1,16 | 0,92 |
| `data` | 43 | 4 789 (6 019) | 22 | 3 520 (4 069) | 0,73 | 0,68 |
| `game` | 18 | 2 878 (3 611) | 10 | 2 984 (3 430) | 1,04 | 0,95 |
| `platform` | 6 | 482 (603) | 2 | 135 (159) | 0,28 | 0,26 |
| `render` | 20 | 2 485 (3 250) | 10 + 1 helper | 2 543 (3 027) | 1,02 | 0,93 |
| `sim` | 34 | 3 203 (4 356) | 15 + 1 helper | 3 787 (4 414) | 1,18 | 1,01 |
| `app` | 1 | 27 (34) | 0 | 0 | 0 | 0 |
| **Razem** | **132** | **14 523 (18 832)** | **65 + 2 helpery** | **13 731 (15 986)** | **0,95** | **0,85** |

Pliki pomocnicze testów (wliczone w „Kod test.”): `tests/render/gpu_test_support.hpp` (117 linii kodu), `tests/sim/archive_helpers.hpp` (29). Poza nimi nie ma osobnych plików fixture; wspólne helpery i dane są w anonimowych przestrzeniach nazw wewnątrz plików `*_test.cpp`: przed pierwszym `TEST_CASE` jest 4 005 linii kodu (29% kodu testów), z czego 1 106 to `#include`/`using`. Ciała samych `TEST_CASE` to 9 580 linii (70%).

Najwięksi (linie kodu):

| Plik | Linie kodu |
|---|---|
| `tests/game/mission_units_test.cpp` | 803 |
| `tests/game/original_map_test.cpp` | 570 |
| `tests/game/unit_sprites_test.cpp` | 485 |
| `tests/sim/pathfinder_test.cpp` | 452 |
| `tests/sim/animal_test.cpp` | 436 |
| `tests/render/terrain_layers_gpu_test.cpp` | 430 |
| `tests/data/map_reader_test.cpp` | 423 |
| `tests/sim/group_order_test.cpp` | 420 |
| `tests/render/terrain_gpu_test.cpp` | 419 |
| `tests/sim/unit_walk_test.cpp` | 406 |

Największy plik produkcyjny to `src/game/src/application.cpp` (701). Największy test (803) jest większy od niego. Liczba przypadków: 461 `TEST_CASE` w kodzie, 460 zarejestrowanych w CTest (zgodne z „460/460” z raportu sesji `docs/sessions/2026-10-21-merge-interp-w6.md:30`), około 3 378 makr `CHECK`/`REQUIRE` w źródłach.

## 2. Wzrost w historii git

Linie dodane i usunięte w `.cpp/.hpp` (z `git log --numstat`, linie fizyczne, commity nie-merge). Kolumna „Commity” zawiera wszystkie commity dnia, także dokumentacyjne.

| Dzień | Commity | Testy + | Testy − | Prod. + | Prod. − | Testy + / (testy + prod.) + |
|---|---|---|---|---|---|---|
| 2026-10-18 | 68 | 4 146 | 697 | 8 448 | 3 347 | 33% |
| 2026-10-19 | 58 | 5 345 | 580 | 6 597 | 979 | 45% |
| 2026-10-20 | 62 | 5 637 | 754 | 6 657 | 884 | 46% |
| 2026-10-21 | 55 | 3 028 | 138 | 2 674 | 334 | 53% |
| **Razem** | **243** | **18 156** | **2 169** | **24 376** | **5 544** | **43%** |

Stan końcowy zgadza się z historią: testy 18 156 − 2 169 = 15 987 (HEAD: 15 986), prod. 24 376 − 5 544 = 18 832.

Rodzaj commitów (liczba commitów; dodane linie testów / prod.):

| Typ | Commity | Testy + | Prod. + |
|---|---|---|---|
| `docs` | 100 | 0 | 4 |
| `feat` | 74 | 13 720 | 20 317 |
| `fix` | 35 | 1 218 | 953 |
| `test` | 14 | 2 738 | 1 |
| `chore` | 10 | 0 | 45 |
| `style` | 4 | 459 | 2 988 |
| `refactor` | 3 | 5 | 68 |
| `build` | 2 | 16 | 0 |

Udział commitów dotykających testów (243 commity nie-merge):

| Miara | Wartość |
|---|---|
| Commity zmieniające testy | 109 (45%) |
| Commity zmieniające kod produkcyjny | 116 (48%) |
| Commity zmieniające kod (prod. lub testy) | 131 |
| z tego prod. i testy razem | 94 |
| z tego tylko testy | 15 (11% commitów z kodem) |
| z tego tylko prod. | 22 (17%) |
| Commity `feat` z kodem bez żadnych testów | 9 z 74 |
| Udział testów w dodanych liniach kodu | 43% (45% bez 4 commitów `style`) |

Commity zmieniające wyłącznie testy (15): `c78c29f` (Catch2), `0ce300f` (core), `ff3bc0e`, `b0f2715`, `3e136ce` (render), `5863fbd` (platform), `3c101be` (render), `34fede1` (game), `cd64e5c` (data), `814966c` (style), `1caab90`, `40473a8`, `2fe9828`, `933be58`, `b11e0a7`. Cztery z nich (`40473a8`, `2fe9828`, `933be58`, `b11e0a7`, z 2026-10-21) dopisują testy do kodu wycinka W6 w osobnych commitach po commitach funkcji, które same nie zawierały testów (`ac6cf80`, `2c1d69b`).

Przepisywanie (churn) testów:

| Miara | Testy | Prod. |
|---|---|---|
| Usunięte / dodane linie | 2 169 / 18 156 = 11,9% | 5 544 / 24 376 = 22,7% |
| w tym commit formatujący `1b5cbe1` (452 usunięte i 457 dodane w testach) | 1 717 / 17 699 = 9,7% po odjęciu | nie liczono osobno |
| Commity usuwające ≥ 100 linii testów | 6, razem 1 532 linie (71% wszystkich usunięć) | |

Największe usunięcia testów: `036763d` (574 linie, usunięcie uśredniania wody po decyzji użytkownika o odstępstwie nr 9), `1b5cbe1` (452, formatowanie), `a52a9bf` (139), `3973361` (135), `df7440f` (127, wymiana generatora losowego), `a0ab43e` (105). Najmocniej przepisywany plik: `tests/render/terrain_gpu_test.cpp`, 13 commitów, 1 398 linii dodanych i 897 usuniętych (64%). Test:prod w samych dodanych liniach: 0,74 (z `style`), 0,83 bez `style`.

Czas agentów na testy nie jest mierzony w repozytorium (`docs/process/optimizer/metrics.csv` nie rozdziela testów). Jedyne bezpośrednie dane: `docs/process/optimizer/reviews/2026-10-20-179deeb3.md:28` stwierdza, że testy mają ok. 0,85× linii kodu (zakres 0,66 do 1,29 na wycinek), co zgadza się z moim 0,85 (fiz.) i 0,95 (kod).

## 3. Czy testy łapią błędy

Repozytorium nie zawiera żadnego zapisu przebiegu testów, który zakończył się czerwono i ujawnił usterkę. Zapisy są tylko po stronie commitów i dokumentów procesu. Dlatego liczby poniżej to klasyfikacja 35 commitów `fix` według tego, co dokumenty pozwalają ustalić.

Skąd znana usterka (35 commitów `fix`):

| Źródło wykrycia | Liczba | Podstawa |
|---|---|---|
| Code review (agent `code-reviewer`/`reviewer`) | 24 | 16 wymienionych imiennie w dokumentach procesu: `09b3ce2`, `2f71f1b`, `fd2e1f7`, `b2533fb`, `dfed259`, `1a48b4f`, `0e34884`, `8504cac`, `c70216f`, `e66013c`, `fdae283`, `12d6d0b`, `e5469cf`, `f079c06`, `b443df7`, `a49072c`; 3 jako „zaplanowane długi z przeglądów” (`6804328`, `dc534ff`, `afdfe92`); 5 po przeglądach W4/W6 wg raportów sesji (`295f33c`, `005917c`, `c66a49f`, `fc79c3d`, `5f8bb6e`) |
| Ocena wizualna użytkownika | 3 | `e52a7b4`, `a5f33d6`, `036763d` (woda; `docs/design/water-dither-notes.md`: „Diagnoza po ocenie wizualnej”) |
| Uruchomienie programu (budowanie/pakowanie) | 2 | `66c270b`, `6015c42` (brak DLL i plików JSON obok gry; test jednostkowy tego nie widzi) |
| Test, który zawiódł i ujawnił usterkę | 0 udokumentowanych | brak zapisu w commitach i `docs/` |
| Bez zapisu źródła | 6 | `a0ab43e`, `a61ec4d`, `71d58a3`, `9b35508`, `86af115`, `1d5fe99` |

Zastrzeżenie: „0 przez testy” oznacza brak zapisu, nie brak zdarzeń. Testy uruchamiane w trakcie pisania funkcji i naprawiane przed commitem nie zostawiają śladu w historii. Ten pomiar nie rozstrzyga, ile usterek wyłapały one przed commitem.

Relacja poprawek do testów (35 commitów `fix`):

| Cecha | Liczba |
|---|---|
| bez zmian w testach | 10 |
| testy tylko dodane (regresja przypięta po fakcie) | 10 |
| testy też zmienione lub usunięte | 15 |
| Linie testów w commitach `fix` | +1 218 / −830 |

Dane z samej dokumentacji procesu o recenzji (`docs/process/optimizer/reviews/2026-10-21-a74a6657.md:35-70`): 27 przeglądów kodu w 7 sesjach, 15 ustaleń zmieniających kod, z czego 10 błędów poprawności, 0 z determinizmu, 0 z granic modułów, 4 kosmetyczne, 1 naruszenie reguły danych. Każdy przegląd następuje po tym, jak build i testy przeszły (Definition of done, `.claude/project.md:89-91`). Czyli te 10 błędów poprawności przeszło przy zielonych testach.

### Przykłady: błąd był w kodzie, testy były zielone, znalazł review

| Commit | Co | Co robiły testy |
|---|---|---|
| `a49072c` | błąd zaokrąglenia Single w 7 209 z 33 024 par (`a74a6657.md:64-65`) | testy przechodziły; zmieniono limit i test w `formation_assignment_test.cpp` (9 dodanych / 7 usuniętych) |
| `fdae283` | progi wysokości sądzone w złej skali | test kampanii przed poprawką tolerował różnicę („Terrain passes more near a threshold”, usunięty `stepNearThreshold`); po poprawce asercja brzmi: brak różnicy flag i `WalkConnect` |
| `b443df7` | zgon zwierzęcia o tick za późno (213 zamiast 212) | istniejący test T14 przypinał „2 ticks later” (diff: nazwa i liczba ticków zmienione) |
| `e66013c` | odczyt poza zakresem `previous[slot]` po wstawieniu jednostki | test dodany razem z poprawką (39 dodanych / 1 usunięta w `unit_test.cpp`); przed poprawką żaden test tego nie wykrył |
| `dfed259` | brak obiektów w ostatniej kolumnie i wierszu mapy | test GPU dodany w poprawce (58 linii); wykrył review (`dc419968.md:92-94`) |

### Przykłady: test był zły, słaby albo zmieniany przez zmianę wymagań

| Commit | Co |
|---|---|
| `5863fbd` | test `Clock` oparty o `sleep_for(20 ms)` z progiem 15 ms: zależny od systemu, przepisany na przedział z `steady_clock` |
| `b11e0a7` | `test(game)`: „tighten the campaign SEND_GROUP guard”, słaba asercja przepisana (47 dodanych / 23 usunięte) |
| `fdae283`, `b443df7` | patrz wyżej: testy kodowały błędne zachowanie i trzeba je było przepisać razem z poprawką |
| `036763d` | zmiana wymagań, nie błąd testu: usunięto uśrednianie wody po decyzji użytkownika; 574 linie testów (m.in. `terrain_gpu_test.cpp`, `terrain_atlas_test.cpp`) skasowane |
| `a52a9bf` | wcześniejsza zmiana tej samej cechy (uśrednianie wody w każdym zoomie), −139 linii testów; cecha odwrócona w `036763d` |

Zliczenie „test był zły, słaby albo kodował błąd”, potwierdzone w diffach: 4 (`fdae283`, `b443df7` to commity `fix`; `5863fbd`, `b11e0a7` to commity `test`). Wśród 15 commitów `fix`, które zmieniły lub usunęły istniejące linie testów, pozostałe 13 nie mają w diffie ani komunikacie dowodu, że test był zły; część to zmiany interfejsu (`b443df7` zmienia kolejność argumentów konstruktora `World` w wielu plikach testów), część odwrócone wymagania (`036763d`, `a0ab43e`). Ich nie klasyfikuję. Dla porównania: 24 poprawki z review kontra 0 udokumentowanych wykryć przez test.

## 4. Rodzaje testów

Klasyfikacja automatyczna po nazwie przypadku, tagach i ścieżce, na 461 przypadkach (ciała `TEST_CASE`, 9 580 linii; helpery i `#include` są poza tym podziałem). Błąd klasyfikacji szacuję na około ±5 do 10 punktów procentowych, bo granice są płynne (np. test świata z zapisem to jednocześnie scenariusz i serializacja). Sprawdziłem ręcznie próbki z każdej grupy.

| Rodzaj | Przypadki | Linie | Udział |
|---|---|---|---|
| Logika czysta (jednostkowe: parsery, matematyka, reguły) | 236 | 3 858 | 40% |
| Scenariusze / symulacja (tick po ticku, marsz, zwierzęta, grupy) | 84 | 1 723 | 18% |
| Dane rzeczywiste gry i liczby z oryginału (test czyta instalację Remake'a lub przypina liczby z researchu) | 38 | 1 513 | 16% |
| Serializacja / hash / determinizm (zapis-odczyt-zapis, ten sam hash) | 66 | 1 485 | 16% |
| GPU, odczyt pikseli (testy wizualne bez plików referencyjnych) | 26 | 811 | 8% |
| Stałe, tabele, trywialne | 11 | 190 | 2% |

Uwagi:

- Testów typu golden/snapshot z plikami referencyjnymi nie ma. Funkcję „golden” pełnią liczby wpisane w kod (np. `kExpected` w `tests/data/terrain_kinds_test.cpp`, 5 liczb ukończonych rozkazów kampanii w `mission_units_test.cpp`) i porównania z rzeczywistymi plikami gry (`KR_KAM_REMAKE_DIR`).
- Testy determinizmu (ten sam seed i komendy daje ten sam hash) i zapisu świata, wymagane w `.claude/project.md:179`, to 16% linii; w 16 z 65 plików testowych występują słowa `hash` lub `determin`.
- Liczba asercji w czasie działania: 315 545 w 460 przypadkach, z czego 173 775 w samym `sim` (pętle po tickach i polach).

Kandydaci na niską wartość (do przejrzenia przez człowieka; nie dowodzę, że są zbędne):

| Plik / przypadek | Dlaczego podejrzany |
|---|---|
| `tests/core/version_test.cpp` (12 linii) | porównuje literał nazwy silnika i sprawdza `version > 0`; powtarza implementację |
| `tests/data/terrain_kinds_test.cpp`, `kExpected` | tabela flag przepisana z `tiles.json`, a drugi test sprawdza ją z plikiem gry; zmiana danych wymaga edycji w trzech miejscach (7 wystąpień `kExpected`) |
| `tests/render/terrain_gpu_test.cpp`, `terrain_atlas_test.cpp` | testy pikseli sprzężone z decyzjami wizualnymi, które odwrócono dwa razy (`a52a9bf`, `036763d`); 64% dodanych linii skasowane |
| `tests/game/command_line_test.cpp` | 9 przypadków po 5 do 8 linii, po jednym na flagę; niskie ryzyko, ale tanie i stabilne |
| Przypadki ≤ 8 linii | 80 z 461; część to sensowne granice (`Fixed overflow wraps without UB`), część trywia (`Missing file reports CannotReadFile` powtórzony w 4 czytnikach) |
| `mission_units_test.cpp` (803) i `original_map_test.cpp` (570) | jedne z największych plików, oba czytają dane rzeczywiste; ich koszt czasowy pokazuje pkt 5 |

Duplikaty nazw przypadków: 0. Nie mierzyłem duplikacji treści.

## 5. Czas uruchomienia

Zbudowane binaria istnieją w `build/debug/tests` (zbudowane po ostatniej zmianie `src/` i `tests/` każdego modułu; sprawdziłem daty). Uruchomienie bezpośrednio plików `kr_*_tests.exe -d yes` (bez `ctest`, żeby nic nie zapisywać w katalogu projektu), debug, z `mingw\bin` w `PATH` i `KR_KAM_REMAKE_DIR=D:\Gry\KaM Remake Beta r16397`. Wszystkie wyniki: przeszły.

| Zestaw | Przypadki | Asercje | Czas (suma czasów przypadków) |
|---|---|---|---|
| `core` | 39 | 45 208 | < 0,1 s |
| `platform` | 11 | 10 046 | < 0,1 s |
| `data` | 100 | 22 513 | 2,2 s |
| `sim` | 130 | 173 775 | 1,0 s |
| `render` | 65 | 5 755 | 0,3 s |
| `render_gpu` | 24 | 1 123 | 1,8 s |
| `game_gpu` | 2 | 14 | 0,2 s |
| `game` | 89 | 57 111 | 159,9 s (ściana 160 s) |
| **Razem** | **460** | **315 545** | **ok. 165 s** |

Pięć przypadków trwa ponad 1 s i razem zajmuje 159 s, czyli 96% czasu całości; wszystkie to testy kampanii na rzeczywistych danych w `game`:

| s | Przypadek |
|---|---|
| 65,5 | every KaM Remake campaign mission places its units in the World |
| 61,8 | Campaign houses: placed, rejected and tiles made too steep without EnsureWalkable |
| 18,2 | Campaign SEND_GROUP groups march to their targets or wait for W8 |
| 9,5 | Campaign animals wander for 400 ticks, keep the occupancy and replay alike |
| 4,0 | every KaM Remake campaign mission loads with its map |

Pozostałe 455 przypadków mieści się w około 6 s. Dług jest znany: `docs/roadmap.md:70` wymienia „testy kampanii w debug trwają ~65 s (jednostki) i ~62 s (domy)”. Pomiar jest z jednego uruchomienia w buildzie debug, bez powtórzeń.

## 6. Zasady kontraktu o testach

Plik `.claude/project.md` (numery linii z pliku):

| Linia | Treść |
|---|---|
| 47-49 | „**Mechanika:** `researcher` (research Remake'a) → notatka projektowa (orkiestrator) → `reviewer` (design review, raport w `docs/design/reviews/`) → ADR → `implementer` (kod i testy z liczbami z oryginału) → `verifier` → `reviewer` (code review) → merge → `doc-writer`, jeśli zmieniło się API lub decyzja.” |
| 56-57 | „Rozmiar briefów: … implementacja to najwyżej ~600 nowych linii razem z testami (testy dodają zwykle tyle linii co kod produkcyjny).” |
| 58-59 | „Bramki: design review przed ADR-em lub implementacją opartą na researchu Remake'a; code review przed merge gałęzi funkcji; …” |
| 73 | `check: cmake --preset debug; cmake --build --preset debug; ctest --preset debug` |
| 90 | „2. Testy przechodzą; nowa logika symulacji ma testy.” |
| 146 | Design review, Observable: „czy projekt je zachowuje i co przypiąć testem z liczbami z oryginału.” |
| 175-180 | sekcja „### Testy”: „Catch2 v3, układ `tests/<module>/<feature>_test.cpp`, rejestracja w `tests/CMakeLists.txt`.” / „Testujemy zachowanie obserwowalne przez publiczne nagłówki, nie wnętrze.” / „Symulacja: test determinizmu (ten sam seed i te same komendy → identyczny hash stanu), gdy dotyczy.” / „Liczby z researchu oryginału są oczekiwaniami testu, z odsyłaczem do raportu.” |

Co kontrakt wymaga, a czego nie: testy są obowiązkowe wprost tylko dla „nowej logiki symulacji” (linia 90). Dla `data`, `render`, `game`, `platform` nie ma wymogu, a mimo to mają 9 182 z 13 731 linii kodu testów (67%); `sim` ma 3 787 (28%), `core` 762 (6%). Linia 177-178 (układ i „zachowanie obserwowalne przez publiczne nagłówki”) dotyczy wszystkich modułów. Kontrakt nie ma progu pokrycia, limitu wielkości testów ani wymogu testów GPU ani testów na rzeczywistych danych gry. Jedyne ograniczenie objętości to budżet briefu ~600 linii łącznie z testami (linie 56-57). Testy kampanii na `KR_KAM_REMAKE_DIR` wynikają z linii 68 (zmienna środowiskowa „testy na prawdziwych danych”) i linii 180.

## Wnioski

Co liczby pokazują:

1. Testy to prawie połowa pracy nad kodem: 0,95 linii testów na linię produkcji (0,85 fiz.), 43% dodanych linii w historii, 45% commitów dotyka testów, a 83% commitów zmieniających kod dotyka też testów. Kontrakt tego oczekuje (`project.md:56-57`), więc rozmiar jest zgodny z regułą, nie jest przypadkowy. Najniższy stosunek ma `platform` (0,28), najwyższy `sim` (1,18).
2. W repozytorium nie ma udokumentowanego przypadku, w którym test wykrył usterkę. Z 35 commitów `fix` 24 mają źródło w code review, 3 w ocenie wizualnej, 2 w uruchomieniu programu, 6 bez zapisu. Dla 10 błędów poprawności z dokumentu `a74a6657.md` testy były zielone w chwili przeglądu (wynika to z kolejności kroków w kontrakcie, nie z logu), a w 2 przypadkach potwierdzonych w diffie (`fdae283`, `b443df7`) istniejący test sam zakodował błędne zachowanie.
3. Test kosztuje także w utrzymaniu: 12% dodanych linii testów usunięto (9,7% bez formatowania), a 6 commitów skasowało 71% usuniętych linii; jeden plik testów GPU stracił 64% tego, co dodano, przez odwrócone decyzje wizualne.
4. Czas uruchomienia jest zdominowany przez 5 przypadków kampanii (159 z 165 s, 96%); 455 pozostałych przypadków trwa około 6 s.

Czego liczby nie pokazują:

- Nie wiadomo, ile usterek testy wyłapały przed commitem (czerwony test poprawiany w pętli „kompilacja, test, poprawka”). Repozytorium tego nie zapisuje; ten pomiar może więc zaniżać wartość testów, i nie da się z niego wyliczyć „ile błędów na 1000 linii testów”.
- Nie wiadomo, ile usterek zapobiegły testy regresyjne po późniejszych zmianach (brak historii przebiegów, brak CI). Stan zielony na HEAD (460/460) nie rozróżnia „nic się nie psuje” od „nic nie jest wykrywane”.
- Atrybucja źródła poprawek opiera się na dokumentach procesu i komunikatach commitów; 6 z 35 poprawek nie ma źródła w zapisach. Podział według rodzaju testów (pkt 4) jest szacunkiem automatycznym.
- Czas agentów spędzony na testach nie jest zmierzony; jako przybliżenie służy udział linii, co nie jest tym samym co koszt tokenów.
- Brak porównania z projektem bez testów: wniosek „opłaca się/nie opłaca się” wymaga porównania, którego te dane nie dają. Można powiedzieć tylko, że po stronie kosztu jest 43% linii i 12% przepisywania, a po stronie wykrywania: 0 udokumentowanych wykryć przy 24 wykryciach przez review.
- Przy kosztach, które da się zmierzyć, istnieją konkretne miejsca do przejrzenia: 5 wolnych testów kampanii, testy GPU sprzężone z decyzjami wizualnymi, i drobne testy powtarzające implementację (`version_test.cpp`).
