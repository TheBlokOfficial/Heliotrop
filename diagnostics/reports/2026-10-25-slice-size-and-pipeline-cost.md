# Rozmiar wycinków i koszt potoku (KamReimagined, 2026-10-25)

Przebieg doktora przerwany przez awarię klasyfikatora trybu auto po zapisaniu sesji `acac754a` i `532edfd2`
(2026-10-24, silnik 0.5.0). Liczby niżej pochodzą z `agents.csv` i `sessions.csv`, bez wyciągów briefów.

## Zakres

- Projekt `D:\Projekty\KamReimagined`, wszystkie zapisane sesje (138 agentów `stack:*`), silnik 0.3.x–0.5.0.
- Pytania użytkownika: (1) dlaczego wycinki przekraczają ~120k mimo reguły, (2) ile kosztuje potok review + testy +
  poprawki w porównaniu z samą implementacją.

## Rozmiar wycinków

| Szczyt kontekstu | Agenci | W tym |
|---|---|---|
| > 120k | 30 / 138 (22%) | — |
| > 150k | 15 / 138 (11%) | 11 implementer, 2 researcher, 1 reviewer, 1 doc-writer |

Najnowsze przekroczenia (2026-10-24): doc-writer 248k (`acac754a/a61d181a61839cba5`), researcher 187k i 162k
(`acac754a/ab4feca28c61f8efb`, `a63047b8506650eea`), implementer 156k (`532edfd2/a7c70c7144c0d3710`). Brak trendu
spadkowego po regule sufitu z 0.4.0.

Przyczyna (hipoteza, briefy nieczytane): reguła sufitu żąda szacunku, ale brief nie miał na niego miejsca, a zwrot
agenta nie podaje jego szczytu, więc orkiestrator nie dostaje informacji zwrotnej. Przypomnienie użytkownika z liczbą
z poprzedniej sesji jest dziś jedyną taką informacją. Według użytkownika briefy łączą po 4–5 pytań.

Zmiana w silniku 0.6.0: zalecany sufit ~100k (bez twardego limitu), linia `Size` w briefie, zasada „jeden wycinek, jedna
pozycja” (`orchestrator.md`, Slice size 1). Miara skutku: udział agentów > 100k i > 150k w kolejnych sesjach.

## Koszt potoku

Udział agentów review, `test-writer` i poprawek (`role` = `fix`) w `weightedK` sesji kodu silnika 0.4.0–0.5.0:

| Sesja | weightedK sesji | review + test-writer + fix | Udział |
|---|---|---|---|
| `e43f37ed` | 5063 | 803 + 247 + 470 | 30% |
| `9fd2b5bd` | 5338 | 481 + 213 + 1088 | 33% |
| `47055298` | 1280 | 0 + 301 + 478 | 61% |
| `ec160e03` | 2850 | 258 + 0 + 74 | 12% |
| `532edfd2` | 3273 | 205 + 0 + 178 | 12% |

- Uruchamianie testów u implementerów (`testWK`): 12–15% ich `weightedK` (`532edfd2`); u agentów poprawek do 27%
  (`a4c6a201/a279c502d3cb5ddbd`: 263 z 977).
- Czas: review i test-writer równolegle 3–8 min, poprawki sekwencyjnie 4–17 min, czyli ok. 10–20 min ponad
  implementację na wycinek.
- Pożytek (raport 2026-10-23, n=3 wycinki): 1 średni błąd z review, 1 błąd znaleziony przez `test-writer`a, 1 błąd
  specyfikacji nie wykryty przez nikogo.

Decyzja użytkownika (2026-10-25): wycinki implementacji bez review, `test-writer`a i poprawek; w wycinku tylko testy
krytyczne i jeden przebieg szybkiego zestawu; review i pozostałe testy w osobnych sesjach przeglądowych
(`orchestrator.md`, Delegation, Review sessions). Miara skutku: `wallMin` i `weightedK` na pozycję (`itemsDone`)
w sesjach kodu oraz liczba commitów `fix` z sesji przeglądowych i z gry.
