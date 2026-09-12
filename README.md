# Till Gaming & Dev – Production Version

Diese Version ist für einen echten öffentlichen Webserver vorbereitet.

## Enthalten

- Öffentliche Startseite
- Projekte
- Freiwillige Unterstützung
- Kontaktformular mit direktem E-Mail-Versand
- Admin-Login
- Admin-Einstellungen
- Passwortänderung
- Sichere Server-Sessions
- Rate Limiting
- Produktionsmodus
- Clean URLs (`/kontakt`, `/admin`, `/projekte`, ...)
- Dockerfile
- Render Blueprint
- Health Check
- Persistenter Datenordner für Einstellungen und Admin-Hash

## Lokal starten

1. `.env.example` zu `.env` kopieren.
2. Eigene Werte eintragen.
3. Dann:

```bash
npm install
npm start
```

Webseite:
`http://localhost:3000`

Admin:
`http://localhost:3000/admin`

## Öffentlich online stellen

### Variante: Render

Die Dateien in ein GitHub-Repository hochladen.

Danach auf Render:
- New
- Blueprint
- GitHub Repository auswählen
- `render.yaml` wird erkannt

Anschliessend die geheimen Environment-Variablen eintragen:
- CONTACT_TO
- SMTP_USER
- SMTP_PASS
- SMTP_FROM
- ADMIN_PASSWORD

`SESSION_SECRET` kann Render automatisch erzeugen.

Der Datenordner `/data` wird als persistenter Datenträger verwendet. Dadurch bleiben Admin-Passwortänderungen und Einstellungen auch nach einem Neustart erhalten.

## Gmail

Für `SMTP_PASS` ein Google-App-Passwort verwenden, nicht das normale Google-Passwort.

## Eigene Domain

Nach dem Deployment kannst du beim Hosting-Anbieter eine eigene Domain verbinden, z.B.:

`www.dein-kanal.ch`

oder

`tillgaming.ch`

Dafür brauchst du eine registrierte Domain und setzt beim Domain-Anbieter die DNS-Einträge, die dein Hosting-Anbieter anzeigt.

## Sicherheit

- `.env` niemals in GitHub hochladen.
- ADMIN_PASSWORD und SESSION_SECRET nicht öffentlich teilen.
- SMTP_PASS geheim halten.
- Online immer HTTPS verwenden.
- `admin-user.json` wird im persistenten Datenordner gespeichert und nicht ins Repository gelegt.
