# Dashboard Reporting - Client Onboarding

Sistema di onboarding clienti con mappatura pipeline tramite CSV.

## Installazione

1. Installa le dipendenze:
```bash
npm install
```

2. Avvia il server di sviluppo:
```bash
npm run dev
```

3. Apri il browser su:
```
http://localhost:3000/onboarding
```

## Funzionalità

- Form per registrare un nuovo cliente con:
  - Client Name
  - GHL Subaccount ID
  - Meta Ad Account ID
  - Diagnosis Calendar ID
  - Demo Calendar ID
  - Pre-Success Calendar ID

- Mappatura Pipeline:
  - Incolla CSV con colonna "Stage"
  - Parsing automatico al blur del campo
  - Tabella di mappatura Stage → Categorie Standard
  - 12 categorie standard predefinite

- Invio dati:
  - Raggruppamento automatico degli stage per categoria
  - Invio POST al webhook n8n
  - Gestione loading e messaggi di successo/errore

## Webhook

I dati vengono inviati a:
```
https://sunpoweragency.app.n8n.cloud/webhook-test/add-client-config
```


