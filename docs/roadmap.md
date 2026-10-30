# Roadmapa

<!-- Centrum dowodzenia projektu: stan, co czeka na decyzję, etapy z krokami, pomysły na później, znane problemy.
Pisana po polsku (reguła językowa w `CLAUDE.md`). Aktualizują ją `end` i `handover` (krok 2 skilla `end`): zrobiony krok jest
odhaczany, nie usuwany; zakończony etap zwija się do jednej linii. -->

## Gdzie jesteśmy

Wersje 2.0, 2.1 i 3.0 są gotowe, zatwierdzone i wypchnięte. Wersja 3.0: kontrakt `.claude/contract.md` zamiast notatek
o projekcie, blok w `CLAUDE.md`, strażnik (bez kontraktu hooki milczą), liczby w jednym miejscu (`hooks/common.js`),
`init` proponuje zestaw dokumentów; usunięte: skill `guide`, komunikat o cache, reguła o dwóch agentach piszących.
Wersja 3.1 jest gotowa: poprzeczka jakości z 3.0 wycofana (źle odczytana intencja), w jej miejsce twarda reguła
„Struktury silnika” (kontrakt, roadmapa, notatki przekazania i reguły w strukturze silnika i aktualne; wyjątek robi
tylko użytkownik). Następny krok bez zmian: obserwacja w prawdziwych projektach, w tym migracja projektów z 2.x przez
`/heliotrop:init`.

## Czeka na Ciebie

- Po zatwierdzeniu wersji 3.1: przebudowanie archiwum `build/` (`build.bat`).
- Przeinstalowanie wtyczki z wersji 3.1 (README).

## Etapy

### ✓ Heliotrop 1.0, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-heliotrop-1.0.md))

### ✓ Heliotrop 1.1: roadmapa jako centrum dowodzenia, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-command-center.md))

### ✓ Heliotrop 1.2: odsyłanie do roadmapy, sprawy poboczne na koniec, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-command-center.md))

### ✓ Heliotrop 2.0: krótki, organiczny silnik, gotowe 2026-10-30 ([notatka projektowa](design/heliotrop-2.0.md))

### ✓ Heliotrop 2.1: rodzaje pracy w rdzeniu, gotowe 2026-10-30

### ✓ Heliotrop 3.0: kontrakt, strażnik, gotowe 2026-10-30 (zatwierdzone i wypchnięte; poprzeczka jakości wycofana w 3.1)

### ✓ Heliotrop 3.1: struktury silnika zamiast poprzeczki jakości, gotowe 2026-10-31 ([rejestr](decisions.md))

### Wdrożenie

Silnik działa w prawdziwych sesjach, a jego zachowanie jest sprawdzone w praktyce.

- [ ] Przeinstalowanie wtyczki (patrz Czeka na Ciebie).
- [ ] Sprawdzenie, czy żadna inna wtyczka Claude Code nie nazywa się `heliotrop`.
- [ ] Pierwszy prawdziwy projekt (z notatkami 2.x lub kontraktem 1.x) przechodzi przez `/heliotrop:init`, a jego sesje
  są obserwowane pod kątem: punktów kontekstu, reguły „Struktury silnika”, zachowania strażnika, bloku w `CLAUDE.md` w
  subagentach, raportu końcowego i notatki przekazania.

### Pomiar

Koszt i przebieg sesji znów da się zmierzyć.

- [ ] Przywrócenie skryptu metryk i agenta-doktora z historii git, z nazwami Heliotrop, czytających transkrypty z
  `~/.claude/heliotrop-archive/` (i `~/.claude/stack-archive/` dla sesji 0.x). [CHANGELOG](../CHANGELOG.md)

## Później

- Pomiar, z czego składa się ok. 57k tokenów, które sesja niesie przed pierwszą wiadomością.
- Metryka `briefSizeReadK`: ile czytania (w tys. tokenów) zleca brief, na agenta; wymaga przywróconych metryk.
- Decyzja, czy role tylko do odczytu (researcher, reviewer, verifier) dostają własne progi budżetu.

## Znane problemy

- Brak.
