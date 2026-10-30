# Roadmapa

<!-- Centrum dowodzenia projektu: stan, co czeka na decyzję, etapy z krokami, pomysły na później, znane problemy.
Pisana po polsku (notatki projektu). Aktualizują ją `end` i `handover` (krok 2 skilla `end`): zrobiony krok jest
odhaczany, nie usuwany; zakończony etap zwija się do jednej linii. -->

## Gdzie jesteśmy

Heliotrop 2.0 jest zbudowany i zrecenzowany: krótki rdzeń z czterema twardymi regułami (punkty kontekstu 150k/200k,
budżet subagenta, decyzje użytkownika, rozłączne pliki agentów piszących) i wskazówkami zamiast procedury. Notatki o
projekcie (opcjonalne) zastępują kontrakt, a `init` rozpoznaje projekt i pyta tylko o to, czego nie widać. Następny
krok: przeinstalowanie wtyczki i obserwacja wersji 2.0 w prawdziwych sesjach.

## Czeka na Ciebie

- Przeinstalowanie wtyczki: odinstalować `stack@agent-stack`, zainstalować `heliotrop@heliotrop`
  ([README](../README.md)). Do tego czasu sesje działają na hookach 0.x.
- Zatwierdzenie (commit) zmiany 2.0: nie jest jeszcze zatwierdzona.

## Etapy

### ✓ Heliotrop 1.0, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-heliotrop-1.0.md))

### ✓ Heliotrop 1.1: roadmapa jako centrum dowodzenia, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-command-center.md))

### ✓ Heliotrop 1.2: odsyłanie do roadmapy, sprawy poboczne na koniec, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-command-center.md))

### ✓ Heliotrop 2.0: krótki, organiczny silnik, gotowe 2026-10-30 ([notatka projektowa](design/heliotrop-2.0.md))

### Wdrożenie

Silnik działa w prawdziwych sesjach, a jego zachowanie jest sprawdzone w praktyce.

- [ ] Przeinstalowanie wtyczki (patrz Czeka na Ciebie).
- [ ] Sprawdzenie, czy żadna inna wtyczka Claude Code nie nazywa się `heliotrop`.
- [ ] Pierwszy prawdziwy projekt przechodzi przez `/heliotrop:init` (kontrakt 1.x zamieniony na notatki), a jego
  sesje są obserwowane pod kątem: punktów kontekstu, komunikatu o cache, reakcji na zmiany tematu, raportu końcowego
  i notatki przekazania.

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
