# KamReimagined, silnik 0.6.0 i 0.7.0: raport doktora (2026-10-28)

## Zakres

- Projekt: `D:\Projekty\KamReimagined`. Zapisano 9 sesji (`-Pending -Record`), po uzupełnieniu `kind` i `itemsDone` z
  `docs/sessions/` projektu. Do porównania doszła sesja `91ce93fb` (0.5.0, już w `sessions.csv`, `kind`/`itemsDone`
  wcześniej puste, teraz uzupełnione).
- Sesje (numer w nazwie sesji z promptu / raport projektu):

| Sesja | Silnik | Raport projektu | kind | itemsDone | Uwagi |
|---|---|---|---|---|---|
| 91ce93fb | 0.5.0 | `2026-10-24-flow-finish.md` (sesja 37) | code | 2 | F6, F8 plus pomiar |
| f6060e66 | 0.6.0 | `2026-10-25-combat-impl-3.md` | code | 3 | C3a, C12a, C3b |
| 9b8492de | 0.6.0 | `2026-10-25-combat-impl-2.md` | code | 4 | C1a, C2a, C1b, C2b |
| c9b4bed8 | 0.6.0 | brak jednoznacznego | puste | puste | 5 min, 0 agentów, prompt „Sesja 38 ... Ruszaj"; nie przypisano |
| 85dece70 | 0.6.0 | `2026-10-25-combat-impl-4.md` | code | 0 | przerwana na prośbę użytkownika, 707 min ściany (przerwa), dwóch implementerów bez statusu |
| 6b87e4ae | 0.6.0 | `2026-10-27-combat-impl-5.md` | code | 3 | C4a, C5a, C4b; start 08:33, przed hookiem 0.7.0 |
| de1e3eed | 0.7.0 | `2026-10-27-combat-review.md` | mixed | puste | sesja przeglądowa (review, test-writer, poprawki), nieporównywalna na pozycję |
| b4f6305e | 0.7.0 | `2026-10-27-combat-impl-6.md` | code | 3 | C5b, C8a, C12b |
| 94226f02 | 0.7.0 | `2026-10-28-combat-impl-7.md` | code | 2 | C6, C7a |

- `701c15d1` (0.7.0, „Sesja 46 ... część 8", raport `2026-10-28-combat-impl-8.md`) nie został zapisany w tym
  przebiegu: skrypt nie uznał go za zakończony (transkrypt zapisywany o 09:53 w dniu raportu). Zapisany później tego
  samego dnia przez orkiestratora, z `kind` = code, `itemsDone` = 2 (C7b, C8b).
  Jego wiersz z `-SessionId` (niezapisany): 3667 weightedK, 10 agentów, 1 partial, 1 bez statusu, 0 powyżej 150k,
  44,6 min, 2 pozycje (C8b, C7b). Do zapisania przy następnym przebiegu.
- Dwie sesje, których prompt mówi 44 i 45, mają w raportach numery 44 i 46 (raport sesji 46 zapisuje tę rozbieżność);
  łączyłem po treści raportu, nie po numerze.
- Wersje: 0.5.0, 0.6.0 (od 2026-10-25), 0.7.0 (od 2026-10-27 08:59, hook `context-budget.js`).
- Uwaga o budżecie: użyłem 11 wywołań trybów wycinków (limit 8); dwa ostatnie (`-Find 'Size: ...'`) nie dały
  użytecznego wyniku, reszta jest cytowana niżej. Dalszych wycinków nie pobierałem.

## Koszty

weightedK (tys.) wg sesji; „sub" = suma subagentów, „main" = reszta.

| Sesja | Silnik | weightedK | sub | main | Agenci | Ściana min | Czekanie main min | Min z 2+ agentami |
|---|---|---|---|---|---|---|---|---|
| 91ce93fb | 0.5.0 | 6812 | 4648 | 2164 | 15 | 125,1 | 58,9 | 15,7 |
| f6060e66 | 0.6.0 | 2610 | 2020 | 590 | 6 | 32,6 | 21,6 | 3,0 |
| 9b8492de | 0.6.0 | 3218 | 2508 | 710 | 8 | 30,4 | 21,9 | 13,6 |
| 6b87e4ae | 0.6.0 | 3058 | 2343 | 715 | 4 | 29,4 | 15,7 | 10,9 |
| 85dece70 | 0.6.0 | 1522 | 1252 | 270 | 4 | 707,4 | 1,4 | 6,9 |
| de1e3eed | 0.7.0 | 2184 | 1723 | 461 | 8 | 13,8 | 5,2 | 6,1 |
| b4f6305e | 0.7.0 | 3104 | 2367 | 737 | 11 | 20,0 | 12,7 | 14,6 |
| 94226f02 | 0.7.0 | 2524 | 1980 | 544 | 8 | 23,2 | 17,6 | 12,7 |

- Subagenci to 76 do 82 procent weightedK sesji (poza `c9b4bed8`, bez agentów). W 7 sesjach 0.6.0 i 0.7.0 (bez
  `c9b4bed8`): implementer 10035 (25 agentów, 71 procent kosztu subagentów), researcher 2417 (14), reviewer 974 (4),
  test-writer 687 (3), verifier i claude-code-guide po 40.
- Czas ściany to w większości czekanie głównej sesji na subagenta (53 do 76 procent w pięciu sesjach implementacji
  0.6.0 i 0.7.0 poza `de1e3eed` i `85dece70`); równolegle pracują zwykle dwa agenty (`maxConcurrent` 2 w pięciu z
  siedmiu sesji z agentami). Zależności (mapa kodu, potem implementacja, potem scalenie) ograniczają równoległość;
  nie traktuję tego jako usterki.
- Długie wiadomości głównej sesji: `mainMsgsLong` = 0 w trzech sesjach 0.7.0, 0 do 3 w 0.6.0, 1 do 25 w 0.5.0.

## Diagnozy

### D1. Faza czytania implementera zjada budżet, zanim padnie pierwszy Edit; `Size` w briefie ją zaniża

- Dowody (kolumny): implementerzy, mediana `firstEditK` / udział weightedK przed pierwszym Editem / mediana
  `peakK` / `calls`: 0.5.0 57 / 0,37 / 84,5 / 30,5 (n=16); 0.6.0 102 / 0,55 / 133,5 / 49 (n=12); 0.7.0 56 / 0,54 / 77 /
  27 (n=13).
- `6b87e4ae` agent `aebb00fb568c0e15b` (C4b, 0.6.0): `firstEditK` 159, peak 198, 78 wywołań, 25 szukań przed
  Editem, `partial`; 539 z 1244 weightedK przed pierwszym Editem. Oś czasu: w wywołaniach 1 i 3 dwa pełne odczyty
  (+24,8k i +23,2k znaków), kontekst 12k do 159k w 42 wywołaniach bez jednego Edita. Brief (2486 znaków, 10 ścieżek)
  nie ma linii `Size`, limit „≤ ~250 linii kodu produkcyjnego".
- `b4f6305e` agent `a2f47ab38b062f184` (C5b-2, 0.7.0): brief ma `Size: ... reading ≈ 30k, expected peak ≈ 80k`.
  Pierwszy Edit przy kontekście 72k (wywołanie 33), 101k przy zwrocie, 51 wywołań. Zwrot: „Status: partial (I hit the
  context budget, so nothing is built, formatted, tested or committed)".
- `94226f02` agent `a28f9143560669bb2` (C7a-2, 0.7.0): brief `Size: ... reading ≈ 30k, expected peak ≈ 80k`; pierwszy
  Edit przy kontekście 85k (wywołanie 26 z 38), koniec przy 101k.
- Kolumny dla pozostałych: w 0.7.0 trzech z pięciu implementerów `partial` miało `firstEditK` 87, 72 i 85
  (`a1ad1d`, `a2f47a`, `a28f91`); piąty (`ab9fec`, `firstEditK` 33) i `a2cd90` (D3) mają inną przyczynę.
- Przyczyna: brief (oszacowanie `reading` ≈ 30k nie pokrywa rzeczywistego czytania: kontekst przy pierwszym Editie to
  60 do 73k ponad 12k startu, czyli około dwukrotność oszacowania) oraz zbyt duży wycinek w 0.6.0 (`aebb00`: ≤ ~250
  linii i bez `Size`).
- Reguła: `plugins/stack/core/orchestrator.md:103` (linia `Size`) i `:132-135` (szacowanie: bajty / 4 plus ~3k za
  wywołanie). Reguła istnieje, ale daje oszacowanie, które w dwóch zbadanych briefach 0.7.0 było około dwukrotnie za
  niskie; nie sprawdziłem, ile z różnicy to rozumowanie agenta, a ile wyniki Grep/Read poza listą `Read`.
- Sesje: `6b87e4ae`, `b4f6305e`, `94226f02` (wycinki zbadane), w kolumnach to samo w `9b8492de`, `f6060e66`, `85dece70`
  (`firstEditK` 100 do 135 u sześciu implementerów).

### D2. Mapy kodu z numerami linii starzeją się między kolejnymi wycinkami tego samego pliku

- Trzy zbadane briefy implementerów zawierają ostrzeżenie o nieaktualnych numerach linii:
  - `aebb00` (`6b87e4ae`): „zakresy linii mogły się przesunąć po C4a, potwierdź Grepem"
  - `a28f91` (`94226f02`): „Numery linii są sprzed C7a-1 — potwierdź Grepem"
  - `a2f47a` (`b4f6305e`): „po C5b-1 numery linii w projectile.cpp się przesunęły — potwierdzaj Grepem"
- Ślad w kolumnach: `briefRanges` implementerów: 0 w 15 z 25 agentów, `searchesBeforeEdit` 25, 17 i 17 w tych trzech;
  metryka liczy tylko `path:line` i `path#symbol`, a briefy wskazują części dokumentów „Grep nagłówka", więc
  `briefRanges` zaniża stan.
- Przyczyna: reguła silnika (niejednoznaczna). `orchestrator.md:101` każe podawać `path:start-end` lub `path#symbol`,
  a `:166-168` (mapa kodu) wymaga `path:start-end` jako formy podstawowej. Mapa powstaje przed sekwencją wycinków, z
  których każdy przesuwa linie w tych samych plikach (`group_order.cpp`, `projectile.cpp`), więc kolejny implementer
  potwierdza zakresy Grepem. Zbadałem tylko, że ostrzeżenie występuje; nie wykazałem, ile kontekstu kosztuje
  potwierdzanie (możliwy współudział w D1).
- Sesje: `6b87e4ae`, `b4f6305e`, `94226f02`.

### D3. Brief sprzeczny z checkiem daje `partial` bez przekroczenia budżetu

- `b4f6305e` agent `a2cd90d85c94ff55d` (C8a-2): peak 67k, 26 wywołań, `testRunsRed` 2. Zwrot: „Status: partial (code done
  and committed; the fast suite has 1 red test, which comes from the brief's own instruction about the save table)".
- Przyczyna: brief (instrukcja o tabeli zapisu każe zostawić stan, który kończy się czerwonym testem; samego briefu
  tego agenta nie pobrałem, opieram się na jego zwrocie). Nie jest to przekroczenie budżetu.
- Sesje: tylko `b4f6305e`. Obserwacja (patrz niżej), bez wniosku.

### Bez znalezisk

- Czerwone uruchomienia testów (`testRunsRed` 1 do 2) są w 5 z 7 sesji, w pętli implementacji, bez wzorca kosztu:
  `testWK` najdroższych agentów 80 do 112 przy 761 do 1244 weightedK.
- Duże odczyty: `bigReads` implementerów 5 w 0.6.0 i 5 w 0.7.0, najwięcej w `85dece70` (agent `ac8df2`, odczyt
  37,3k znaków, bez statusu). Bez wzorca.

## Wzorce

Tylko D1 i D2 występują w co najmniej 3 sesjach.

### W1 (D1): oszacowanie czytania w `Size` jest za niskie

- Zmiana w silniku: w `orchestrator.md:132-135` (Slice size, 1) dopisać, że `reading` liczy się z sumy rozmiarów
  wpisów `Read` i że dla implementera kontekst przy pierwszym Editie wynosił w zbadanych przypadkach około 12k +
  2 × `reading`; wycinek, którego `12k + 2 × reading` przekracza ~80k, dzielić (reguła 2) albo skrócić czytanie
  (mapa kodu z wąskimi zakresami, reguła 6). Podany współczynnik 2 opiera się na dwóch briefach 0.7.0 i jednym
  z 0.6.0, więc to hipoteza do sprawdzenia, nie ustalona stała.
- Miernik: dodać do `session_metrics.ps1` kolumnę `briefSizeReadK` (liczba po `reading ≈` w briefie) i porównać z
  `firstEditK - 12`; skutek widoczny w medianie `firstEditK` implementerów (cel poniżej ~50k) i w liczbie
  implementerów `partial` na sesję (0.7.0 dziś: 5 z 13).

### W2 (D2): numery linii w mapach kodu starzeją się

- Zmiana w silniku: w `orchestrator.md:166-168` mapa kodu wskazuje lokalizację przez `path#symbol` jako formę
  podstawową, a numery linii jako podpowiedź; po scaleniu wycinka, który zmienia plik z mapy, kolejny brief nie
  powtarza starych numerów (zamiast „potwierdź Grepem" dostaje symbol).
- Miernik: `briefRanges` (liczy `path#symbol`) w briefach implementerów rośnie, `searchesBeforeEdit` implementerów
  spada (dziś mediana implementerów 0.7.0: 10, n=13); wycinek kontrolny: `-Find 'potwierd'` w briefach.

## Obserwacje

- `a2cd90` (D3) jest pojedynczym przypadkiem briefu sprzecznego z checkiem.
- `6b87e4ae`, agent `aebb00`: brief bez linii `Size` i ze 250 liniami produkcyjnymi, a raport sesji 44 przypisuje
  limit ~150 linii decyzji użytkownika z sesji 41 („Wycinek implementera ≤ ~150 linii"); to
  jedyny zbadany brief 0.6.0 bez `Size`, nie wiem, czy to reguła 0.6.0, czy pominięcie.
- `a2f47a` wrócił `partial` bez budowy, formatowania, testu i commita (kod napisany, brak weryfikacji): jedyny
  zbadany przypadek, w którym `partial` zostawia pracę niesprawdzoną.
- Fix: `94226f02` ma dwóch agentów `role = fix`, sonnet, 74 i 184 weightedK (peak 34k i 67k). Jedyny fix 0.5.0 w tej
  grupie, `91ce93fb` agent `ad3fe806173bef521`: opus, 1086 weightedK, peak 190k, 38 wywołań PowerShell, 25 wywołań
  testowych, 5 czerwonych uruchomień; nie badałem przyczyny (n=1 w każdej wersji, inne zadania).
- `85dece70`: 707 min ściany to przerwa użytkownika (raport: przerwano na prośbę użytkownika, koniec budżetu);
  dwóch implementerów bez statusu (`a01d0f`, `ac8df2`, peak 112k i 143k). Koszt jest zapisany, wynik użytkowy zerowy
  (WIP na gałęziach).
- `c9b4bed8`: 5 min, 31 wywołań głównej sesji, 0 agentów, 1 commit (138 linii), prompt „... Ruszaj"; nie przypisano do
  raportu.
- `de1e3eed` (przegląd): 8 agentów, peak maks. 101k, najdroższy pojedynczy agent 274 weightedK; `a72201`
  (test-writer) wrócił `partial` przy 101k, 25 szukań przed pierwszym Editem.

## Wersje silnika

KamReimagined, `kind = code`, bez sesji wznowionych (żadna nie jest wznowieniem) i bez `85dece70` w kolumnach „na
pozycję" (0 pozycji) i bez `c9b4bed8` (nieprzypisana). Agenci: wszyscy subagenci; mediana `peakK` jest z puli
agentów całej grupy. „Pozycja" to wiersz roadmapy (C-id), ich wielkość jest różna (od ~160 do ~250 linii), więc
porównanie na pozycję jest przybliżeniem.

| Grupa | n sesji | weightedK / sesję (mediana) | weightedK / pozycję (mediana) | Agenci / sesję (mediana) | `peakK` agenta: mediana / maks (n agentów) | `agentsPartial` (suma) | `agentsPeakOver150k` (suma) |
|---|---|---|---|---|---|---|---|
| 0.5.0 | 2 (`ec160e03`, `91ce93fb`) | 4831 (2850; 6812) | 2416 (1425; 3406) | 11 (7; 15) | 72,5 / 190 (22) | 4 | 2 |
| 0.6.0 | 3 (`f6060e66`, `9b8492de`, `6b87e4ae`) | 3058 (2610; 3218) | 870 (870; 804,5; 1019) | 6 (6; 8; 4) | 83,5 / 198 (18) | 1 | 3 |
| 0.6.0 z `85dece70` | 4 | 2834 (1522 do 3218) | jw. (n=3) | 5 | 83,5 / 198 (22) | 1 | 3 |
| 0.7.0 | 2 (`b4f6305e`, `94226f02`) | 2814 (3104; 2524) | 1148 (1035; 1262) | 9,5 (11; 8) | 86 / 102 (19) | 5 | 0 |
| 0.7.0 z `de1e3eed` (mixed) | 3 | 2524 (2184 do 3104) | brak (itemsDone puste) | 8 | 85 / 102 (27) | 6 | 0 |

Wszystkie grupy mają n poniżej 3 w kolumnie „na pozycję" lub w sesjach (poza 0.6.0 z `85dece70`, gdzie 4 sesje, ale
jedna bez pozycji), więc to obserwacje, nie wnioski. Co pokazują liczby:

- `peakK` agentów: maksimum 102k w 0.7.0 wobec 190 do 198k w 0.5.0 i 0.6.0; zero agentów powyżej 150k wobec 3 w
  0.6.0 i 2 w 0.5.0. Mediana `peakK` prawie niezmieniona (72,5; 83,5; 86), więc zmienił się ogon, nie środek.
- `agentsPartial` rośnie: 4 (0.5.0, z czego 4 w jednej sesji `91ce93fb`), 1 (0.6.0), 5 (0.7.0, w 2 sesjach kodu), 6
  z przeglądem. Ta zmiana idzie razem z obniżeniem maksimum `peakK`; przyczyny poszczególnych `partial` rozbiera
  orkiestrator osobno.
- weightedK na sesję jest w 0.6.0 i 0.7.0 niższe niż mediana 0.5.0, ale 0.5.0 ma n=2 i jedną sesję 125-minutową
  (`91ce93fb`, 6812). Na pozycję 0.7.0 (1148) jest wyższe niż 0.6.0 (870) przy innych wielkościach pozycji
  (C5b ~230, C6 ~220, C8a, C7a wobec mniejszych C1a/C2a), więc nie wnioskuję o pogorszeniu.
- Poza tabelą: implementerzy, mediana `firstEditK` 57 (0.5.0, n=16), 102 (0.6.0, n=12), 56 (0.7.0, n=13); 0.4.0
  53 (n=41). Skok w 0.6.0 odpowiada większym wycinkom (mediana 49 wywołań wobec 27 w 0.7.0).
- Długie wiadomości głównej sesji: 0 w trzech sesjach 0.7.0.
