# Till Gaming & Dev – Production Version

Öffentliche Creator-Webseite für Minecraft, Gaming, Development und freiwillige Projekt-Unterstützung.

## Funktionen

- Öffentliche Startseite
- Projekt-Hub
- Freiwillige Unterstützung statt klassischem Shop
- Kontaktformular mit direktem E-Mail-Versand
- Geschützter Admin-Login
- Admin-Einstellungen
- Admin-Passwortänderung
- bcrypt Passwort-Hash
- Server-Sessions
- Login- und Kontakt-Rate-Limiting
- Helmet Security Headers
- Clean URLs (`/kontakt`, `/admin`, `/projekte`, `/unterstuetzen`)
- Docker-Unterstützung
- Render Blueprint
- Health Check unter `/health`

## Lokal starten

1. `.env.example` zu `.env` kopieren.
2. Eigene Werte eintragen.
3. Abhängigkeiten installieren und Server starten:

```bash
npm install
npm start
```

Webseite:
`http://localhost:3000`

Admin:
`http://localhost:3000/admin`

## Kostenlos auf Render deployen

Die vorhandene `render.yaml` ist auf den Render-Free-Web-Service eingestellt.

1. Repository mit Render verbinden.
2. `New` → `Blueprint` auswählen.
3. Dieses Repository auswählen.
4. Folgende geheimen Environment-Variablen bei Render eintragen:
   - `CONTACT_TO`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `ADMIN_PASSWORD`
5. `SESSION_SECRET` wird durch die Blueprint-Konfiguration automatisch erzeugt.

### Hinweis zum Free-Tarif

Der kostenlose Render-Service besitzt keinen persistenten Datenträger. Änderungen an Einstellungen oder am Admin-Passwort, die nur auf dem Server gespeichert werden, können bei einem neuen Deployment oder einer neuen Instanz zurückgesetzt werden. Das ursprüngliche Admin-Passwort kommt aus `ADMIN_PASSWORD` bei Render.

Für dauerhaft gespeicherte Admin-Einstellungen sollte später eine Datenbank oder ein persistenter Tarif verwendet werden.

## Gmail / Kontaktformular

Für `SMTP_PASS` niemals das normale Google-Passwort verwenden. Nutze ein separates Google-App-Passwort.

Je nach Hosting-Tarif können SMTP-Verbindungen eingeschränkt sein. Wenn SMTP auf dem verwendeten Hoster blockiert wird, sollte das Kontaktformular später auf einen HTTP-basierten Mail-Anbieter umgestellt werden.

## Sicherheit

- `.env` niemals committen oder auf GitHub hochladen.
- Geheimnisse nur als Render Environment Variables speichern.
- Bereits veröffentlichte Passwörter und Secrets sofort ersetzen.
- `ADMIN_PASSWORD`, `SESSION_SECRET` und `SMTP_PASS` geheim halten.
- Online nur über HTTPS verwenden.
- `admin-user.json` nicht committen.
- Das Repository enthält nur `.env.example`-Dateien mit Platzhaltern.

## Eigene Domain

Nach erfolgreichem Deployment kann eine eigene Domain wie `tillgaming.ch` mit dem Render-Web-Service verbunden werden. Die nötigen DNS-Einträge zeigt Render im Domain-Bereich an.
