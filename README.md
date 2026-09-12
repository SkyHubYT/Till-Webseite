# Till Gaming & Dev – Production Version

Öffentliche Creator-Webseite für Minecraft, Gaming, Development und freiwillige Projekt-Unterstützung.

## Funktionen

- Öffentliche Startseite
- Projekt-Hub
- Freiwillige Unterstützung statt klassischem Shop
- Kontaktformular mit direktem E-Mail-Versand
- Kontakt über Resend HTTPS auf Render Free
- Gmail SMTP als optionaler Fallback
- Geschützter Admin-Login
- Admin-Einstellungen und Passwortänderung
- bcrypt Passwort-Hash
- Server-Sessions
- Login-, Kontakt- und Zahlungs-Rate-Limiting
- Helmet Security Headers mit Content Security Policy
- Clean URLs (`/kontakt`, `/admin`, `/projekte`, `/unterstuetzen`)
- Stripe Checkout für freiwillige Unterstützung
- Serverseitige Prüfung des Stripe-Zahlungsstatus
- Zahlungsdaten werden nicht auf dem eigenen Server eingegeben oder gespeichert
- Docker-Unterstützung
- Render Blueprint
- Health Check unter `/health`

## Render: notwendige Environment Variables

### Basis

```text
CONTACT_TO=deine-kontaktadresse@example.com
ADMIN_PASSWORD=DEIN_SICHERES_ADMIN_PASSWORT
PUBLIC_BASE_URL=https://DEINE-SEITE.onrender.com
```

`SESSION_SECRET` kann durch die Blueprint-Konfiguration automatisch erzeugt werden.

### Kontakt – empfohlen auf Render Free

Render Free kann klassische SMTP-Verbindungen einschränken. Deshalb unterstützt die Webseite jetzt Resend über HTTPS.

Bei Render setzen:

```text
RESEND_API_KEY=DEIN_RESEND_API_KEY
RESEND_FROM=Till Website <deine-verifizierte-absenderadresse@deinedomain.ch>
CONTACT_TO=deine-kontaktadresse@example.com
```

Für erste Tests kann je nach Resend-Konto auch ein von Resend bereitgestellter Test-Absender verwendet werden. Für öffentlichen Betrieb sollte eine erlaubte/verifizierte Absenderadresse eingerichtet werden.

Optional bleibt Gmail SMTP als Fallback verfügbar:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=deine-gmail-adresse@gmail.com
SMTP_PASS=DEIN_GOOGLE_APP_PASSWORT
SMTP_FROM=deine-gmail-adresse@gmail.com
```

### Stripe Checkout

Die Render-Konfiguration setzt `PAYMENT_ENABLED=true`. Eine Zahlung wird trotzdem nur angeboten, wenn zusätzlich ein gültiger `STRIPE_SECRET_KEY` vorhanden ist.

```text
STRIPE_SECRET_KEY=sk_test_...   # zuerst Testmodus
PUBLIC_BASE_URL=https://DEINE-SEITE.onrender.com
```

Im Testmodus werden keine echten Beträge belastet. Vor einem Live-Betrieb müssen das Stripe-Konto, die rechtlichen Angaben und die Berechtigung des Kontoinhabers geklärt sein. Bei minderjährigen Betreibern sollte das Zahlungsanbieter-Konto und die vertragliche Verantwortung über eine erziehungsberechtigte Person laufen.

Ablauf:

1. Besucher wählt CHF 1–200.
2. Hinweise zur freiwilligen Unterstützung werden bestätigt.
3. Der Server erstellt eine Stripe-Checkout-Session.
4. Der Besucher wird auf die Stripe-Zahlungsseite weitergeleitet.
5. Nach Rückkehr prüft der Server die Checkout-Session direkt bei Stripe.
6. Karteninformationen werden niemals auf diesem Server verarbeitet.

## Kontakt prüfen

`/health` zeigt unter anderem, ob Kontakt und Zahlungen serverseitig eingerichtet sind.

Beispiel:

```json
{
  "ok": true,
  "contact": true,
  "payments": true
}
```

## Lokal starten

1. `.env.example` zu `.env` kopieren.
2. Eigene Werte eintragen.
3. Dann:

```bash
npm install
npm start
```

Webseite: `http://localhost:3000`

Admin: `http://localhost:3000/admin`

## Datenschutz

Die Datenschutzerklärung unter `/impressum#datenschutz` beschreibt Hosting, Kontaktformular, E-Mail-Versand, Admin-Session-Cookie und Stripe-Zahlungsabwicklung. Sie ist eine technische Vorlage und keine Rechtsberatung.

## Sicherheit

- `.env` niemals committen.
- Secrets nur bei Render als Environment Variables speichern.
- `ADMIN_PASSWORD`, `SESSION_SECRET`, `RESEND_API_KEY`, `SMTP_PASS` und `STRIPE_SECRET_KEY` geheim halten.
- Bereits veröffentlichte Secrets sofort ersetzen.
- Nur HTTPS im öffentlichen Betrieb verwenden.
- `admin-user.json` nicht committen.
- Beispiel-Dateien dürfen nur Platzhalter enthalten.

## Render Free

Der kostenlose Render-Service besitzt keinen persistenten Datenträger. Einstellungen oder geänderte Admin-Passwörter, die nur lokal auf der Instanz gespeichert werden, können bei einem neuen Deployment zurückgesetzt werden. Für dauerhaft gespeicherte Admin-Daten sollte später eine Datenbank oder persistenter Speicher verwendet werden.
