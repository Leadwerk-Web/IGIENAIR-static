# Bildzuordnung – Analyse-Zusammenfassung

Erstellt: 2026-05-20  
Projekt: IGIENAIR-static (nur Vorschläge, keine Website-Änderungen)

## Excel-/CSV-Quelle

| Kennzahl | Wert |
|----------|------|
| Analysierte Seiten (Datenzeilen) | 123 |
| Summe fehlender Bilder | 458 |
| Seiten mit fehlenden Bildern (>0) | 102 |
| Seiten ohne fehlende Bilder | 21 |
| Excel-Probleme (Duplikate/leer) | 6 |

Spalten in der Quelle: **Titel**, **URL - aktuelle Seite**, **Anzahl Bilder**, **Anmerkungen**

## Bilderpool

| Kennzahl | Wert |
|----------|------|
| Gescannte Dateien (Bild/Video-SVG) | 324 |
| Davon Raster für Vorschläge | 322 |

## Vorschläge (image-mapping-proposals.csv)

| Status | Anzahl Positionen |
|--------|-------------------|
| weak_match | 323 |
| needs_review | 112 |
| good_match | 23 |

**Anzahl Vorschlagszeilen (Bildpositionen):** 458

## Auffällige Dopplungen (gleiches Bild ≥8× vorgeschlagen)

- Keine extremen Dopplungen über Schwelle

## Ordner mit vielen Treffern

- **Anlagen**: 367 Zuordnungen
- **Kunden**: 83 Zuordnungen
- **Leistungen**: 8 Zuordnungen

## Seiten ohne brauchbare Treffer (Score <40)

- Keine

## Manuell prüfen (Auszug)

- Start (https://igienair.de/)
- Unternehmen (https://igienair.de/unternehmen/)
- Qualität (https://igienair.de/unternehmen/qualitaet/)
- Sicherheit (https://igienair.de/unternehmen/sicherheit/)
- Nachhaltigkeit (https://igienair.de/unternehmen/nachhaltigkeit/)
- Umweltschutz (https://igienair.de/unternehmen/umweltschutz/)
- Hygieneispektion VDI 6022 (https://igienair.de/hygieneinspektion-vdi-6022/)
- Energetische Inspektion (https://igienair.de/energetische-inspektion-geg-2020/)
- Lüftungsanlagen (https://igienair.de/anlagen/lueftungsreinigung/)
- Verdunstungskühlanlage (https://igienair.de/anlagen/kuehlturmreinigung/)
- Laborabzüge & Digestorien (https://igienair.de/anlagen/laborabzuege/)
- Reinräume (https://igienair.de/anlagen/reinraumqualifizierung/)
- Lecktest Schwebstofffilter (https://igienair.de/lecktest-schwebstofffilter/)
- RLT-Anlagen (https://igienair.de/anlagen/lueftungsanlagenreinigung/)
- RLT-Hygiene (https://igienair.de/rlt-hygiene/)
- OP-Räume (https://igienair.de/anlagen/op-raum-pruefung/)
- Filterintigritätstest (https://igienair.de/filterintegritaetstest/)
- Karlsruhe (https://igienair.de/kunden/referenzen/baden-wuerttemberg/karlsruhe/)
- Ulm (https://igienair.de/kunden/referenzen/baden-wuerttemberg/ulm/)
- Konstanz (https://igienair.de/kunden/referenzen/baden-wuerttemberg/konstanz/)
- Stuttgart (https://igienair.de/kunden/referenzen/baden-wuerttemberg/stuttgart/)
- Mannheim (https://igienair.de/kunden/referenzen/baden-wuerttemberg/mannheim/)
- Heidelberg (https://igienair.de/kunden/referenzen/baden-wuerttemberg/heidelberg/)
- Freiburg (https://igienair.de/kunden/referenzen/baden-wuerttemberg/freiburg/)
- Koblenz (https://igienair.de/kunden/referenzen/rheinland-pfalz/koblenz/)

## Empfehlungen für fehlendes Bildmaterial

1. **Standort-Referenzen**: Ordner `Kunden/<Bundesland>/<Stadt>` systematisch befüllen – viele Städteseiten teilen sich Motive.
2. **Branchen-Seiten** (Gesundheitswesen, Pharma, …): eigene Branchenmotive statt generischer Anlagenbilder.
3. **VDI 2047-2**: laut Excel ohne Live-URL – Seite/Inhalt klären vor Bildwahl.
4. **RLT-Anlagenreinigung** (`/anlagen/lueftungsanlagenreinigung/`): lokale HTML fehlt – Abgleich mit `lueftungsreinigung.html` / `rlt-hygiene.html`.
5. **Hero-Breite**: Für Startseite/Unternehmen hochauflösende Querformate (≥1920px) priorisieren.
6. **„Originale Bilder – Nicht verwenden“** und **„Bilder vor Umsetzung“**: bewusst ausgeschlossen.

## Ausgabedateien

- `asset-analysis/output/excel-analysis.json`
- `asset-analysis/output/image-index.json`
- `asset-analysis/output/page-topic-analysis.csv`
- `asset-analysis/output/image-mapping-proposals.csv`
- `asset-analysis/output/image-mapping-summary.md`

## Hinweis

Alle Vorschläge basieren auf **Dateiname, Ordnerstruktur, HTML-Text und Heuristiken** – keine visuelle KI-Bildanalyse. Status `needs_review` und `weak_match` erfordern manuelle Freigabe.
