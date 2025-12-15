# Sunpower Agency Dashboard

Dashboard di monitoraggio clienti con metriche in tempo reale.

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
http://localhost:3000
```

## Configurazione Webhook

Nel file `/app/page.tsx`, aggiorna le seguenti costanti con gli URL dei tuoi webhook n8n:

- `GET_CLIENTS_LIST_URL`: URL del workflow per ottenere la lista clienti
- `GET_LIVE_STATS_URL`: URL del workflow per ottenere le statistiche live di un cliente

## Funzionalità

- **Executive Overview**: 5 KPI aggregati del portfolio
  - Total Clients
  - Clients with Alerts
  - Portfolio Avg CPL (7D)
  - Portfolio Avg Booking Rate
  - Portfolio Avg Show-Up Rate

- **Client Status**: Lista clienti con:
  - Metriche 3 giorni e 7 giorni
  - Booking Rate e Show-Up Rate
  - CPL e Spend
  - Alert count e status
  - Grafico trend 30 giorni
  - Lista alert dettagliati

## Tecnologie

- Next.js 14
- React 18
- Tailwind CSS
- Tremor React (componenti UI)
- Lucide React (icone)
- Recharts (grafici)

