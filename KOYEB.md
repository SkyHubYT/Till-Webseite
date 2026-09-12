# Deployment auf Koyeb

Diese Webseite kann direkt aus dem GitHub-Repository auf Koyeb deployed werden. Der vorhandene Dockerfile ist kompatibel.

## Empfohlene Einstellungen

- Quelle: GitHub
- Repository: `SkyHubYT/Till-Webseite`
- Branch: `main`
- Builder: Dockerfile
- Dockerfile: `Dockerfile`
- Service-Typ: Web Service
- Exposed Port: `3000`
- Route: `/`
- Health Check: `/health`
- Region: möglichst nahe bei der Zielgruppe, z. B. Frankfurt/Europa falls verfügbar
- Auto-Deploy: aktivieren

## Environment Variables

Folgende Werte in Koyeb unter den Service-Einstellungen als Environment Variables setzen. Geheimnisse niemals in GitHub speichern.

```text
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
ADMIN_USER=admin
ADMIN_PASSWORD=<GEHEIM>
SESSION_SECRET=<LANGER_ZUFAELLIGER_WERT>
CONTACT_TO=Tillscheidegget@gmail.com
PAYMENT_ENABLED=true
STRIPE_SECRET_KEY=<GEHEIM>
PUBLIC_BASE_URL=https://<deine-koyeb-domain>
```

### Kontakt per Gmail SMTP

Falls Koyeb ausgehendes Gmail-SMTP für deinen Service zulässt, zusätzlich:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=Tillscheidegget@gmail.com
SMTP_PASS=<GOOGLE_APP_PASSWORT>
SMTP_FROM=Tillscheidegget@gmail.com
```

`SMTP_PASS` muss ein Google-App-Passwort sein, nicht das normale Google-Passwort.

Alternativ kann weiterhin Resend über HTTPS verwendet werden:

```text
RESEND_API_KEY=<GEHEIM>
RESEND_FROM=<VERIFIZIERTER_ABSENDER>
```

## Stripe

Für Stripe Checkout müssen `PAYMENT_ENABLED=true`, `STRIPE_SECRET_KEY` und `PUBLIC_BASE_URL` korrekt gesetzt sein. Der Stripe Secret Key darf ausschliesslich serverseitig in Koyeb gespeichert werden.

## Nach dem Deploy testen

- `/health`
- `/api/payment/status`
- `/api/contact/status`
- `/admin`
- `/unterstuetzen`
- `/kontakt`

Wenn `/health` erreichbar ist und der Service als healthy angezeigt wird, läuft die Node.js-Anwendung korrekt.
