import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = 'https://sunpoweragency.app.n8n.cloud/webhook/add-client-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📤 Invio a n8n:', N8N_WEBHOOK_URL)
    console.log('📦 Payload:', JSON.stringify(body, null, 2))

    // Inoltra la richiesta al webhook n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('📥 Risposta n8n:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Errore n8n:', errorText)
      return NextResponse.json(
        { 
          error: `Errore dal webhook n8n: ${response.status} ${response.statusText}`,
          details: errorText,
          webhookUrl: N8N_WEBHOOK_URL
        },
        { status: response.status }
      )
    }

    const data = await response.json().catch(() => ({})) // Se la risposta non è JSON, restituisci oggetto vuoto

    return NextResponse.json({ 
      success: true,
      data 
    })
  } catch (error) {
    console.error('Errore nella chiamata al webhook n8n:', error)
    return NextResponse.json(
      { 
        error: 'Errore nell\'invio dei dati',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}


