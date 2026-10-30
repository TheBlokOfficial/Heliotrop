# Roadmapa

<!-- Centrum dowodzenia projektu: stan, co czeka na decyzję, etapy z krokami, pomysły na później, znane problemy.
Pisana po polsku (kontrakt `user documents:`). Aktualizują ją `plan`, `end` i `handover` według szablonu
plugins/heliotrop/skills/write-doc/templates/roadmap.md: zrobiony krok jest odhaczany, nie usuwany; zakończony etap
zwija się do jednej linii. -->

## Gdzie jesteśmy

Heliotrop 1.2 jest wydany: roadmapa jest centrum dowodzenia w języku użytkownika, silnik subtelnie do niej odsyła,
a sprawy poboczne niezwiązane z tematem sesji orkiestrator załatwia na jej końcu, gdzie kosztują najmniej. Następny
krok: przeinstalowanie wtyczki i obserwacja silnika w prawdziwych sesjach.

## Czeka na Ciebie

- Przeinstalowanie wtyczki: odinstalować `stack@agent-stack`, zainstalować `heliotrop@heliotrop`
  ([README](../README.md)). Do tego czasu sesje działają na hookach 0.x.

## Etapy

### ✓ Heliotrop 1.0, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-heliotrop-1.0.md))

### ✓ Heliotrop 1.1: roadmapa jako centrum dowodzenia, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-command-center.md))

### ✓ Heliotrop 1.2: odsyłanie do roadmapy, sprawy poboczne na koniec, gotowe 2026-10-30 ([sesja](sessions/2026-10-30-command-center.md))

### Wdrożenie

Silnik działa w prawdziwych sesjach, a jego zachowanie jest sprawdzone w praktyce.

- [ ] Przeinstalowanie wtyczki (patrz Czeka na Ciebie).
- [ ] Sprawdzenie, czy żadna inna wtyczka Claude Code nie nazywa się `heliotrop`.
- [ ] Migracja pierwszego prawdziwego projektu przez `/heliotrop:init` i obserwacja jego pierwszych sesji: punkty
  kontekstu, komunikat o cache, triage, rodzaje sesji, roadmapa.

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
