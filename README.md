# carbide-ui — Code-Ausschnitte

`carbide-ui` ist eine selbst entwickelte React/TypeScript-Komponentenbibliothek für die
Dashboards meiner Cannabis-Industrie-Produkte (u. a. `growdog`, `journal-csc`). Kuratierte
Auswahl aus einem privaten, aktiven Repository (210+ Commits, 650+ Dateien) —
Ausschnitte, keine vollständige Bibliothek.

## Enthaltene Komponenten

| Komponente | Zeigt |
|---|---|
| `DataGrid/` | Virtualisierte, sortier- und filterbare Tabelle auf Basis von `@tanstack/react-table` + `@tanstack/react-virtual` — für große Datenmengen (Messreihen, Logs) ohne Performance-Einbruch |
| `ProgressIndicator/` | Wiederverwendbarer Fortschrittsanzeiger mit eigenem Modul-CSS und Tests |
| `BoardShell/` | Layout-Grundgerüst für Dashboard-Seiten (Shell-Package, trennt Layout von Fachkomponenten) |
| `charts/LineChart.tsx`, `charts/BarChart.tsx` | Eigene Chart-Komponenten für Zeitreihen und Vergleichswerte |

Jede Komponente kommt (soweit im Original vorhanden) mit:
- **Test** (`.test.tsx`) — Verhalten ist geprüft, nicht nur "sieht gut aus"
- **Storybook-Story** (`.stories.tsx`) — isoliert entwickelt und dokumentiert, unabhängig von der App, die sie einbindet
- **CSS Module** — gekapseltes Styling ohne globale Kollisionen

## Warum so gebaut

`carbide-ui` ist bewusst als eigenständiges Package-Monorepo aufgebaut (`packages/core`,
`packages/shell`), nicht als Copy-Paste-Ordner in den einzelnen Apps. Komponenten werden
einmal gebaut, getestet und dokumentiert, und von mehreren Produkten wiederverwendet —
`growdog` und `journal-csc` teilen sich dieselbe Basis.

Der Grund: Läge `DataGrid` in beiden Apps als eigene Kopie, müsste jeder Bugfix oder
jede Verbesserung (Sortierung, Barrierefreiheit, Performance bei großen Datenmengen)
zweimal gemacht werden — mit dem Risiko, dass beide Kopien nach einiger Zeit
unterschiedlich funktionieren, weil man leicht vergisst, eine davon nachzuziehen. Als
gemeinsames Package wird eine Änderung an einer Stelle gemacht und wirkt sich auf alle
Produkte aus, die es einbinden.
