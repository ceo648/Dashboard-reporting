'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { Loader2, CheckCircle2, Upload, ArrowRight } from 'lucide-react'

const STANDARD_CATEGORIES = [
  'New Lead',
  'Setting',
  'Diagnosis Set',
  'No Show Diagnosis',
  'Demo Set',
  'No Show Demo',
  'Pre-Success Set',
  'No Show Pre-Success',
  'Contract Out',
  'Won',
  'DQ',
  'Dead Lead',
  'IGNORE'
]

interface StageMapping {
  stageName: string
  category: string
}

export default function OnboardingPage() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1) // 1 = CSV Upload, 2 = Client Registration + Mapping
  
  // CSV data
  const [csvText, setCsvText] = useState('')
  const [parsedStages, setParsedStages] = useState<string[]>([])
  
  // Client data
  const [clientName, setClientName] = useState('')
  const [ghlSubaccountId, setGhlSubaccountId] = useState('')
  const [metaAdAccountId, setMetaAdAccountId] = useState('')
  const [diagnosisCalendarId, setDiagnosisCalendarId] = useState('')
  const [demoCalendarId, setDemoCalendarId] = useState('')
  const [presuccessCalendarId, setPresuccessCalendarId] = useState('')
  
  // Stage mappings
  const [stageMappings, setStageMappings] = useState<StageMapping[]>([])
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [fetchingClientName, setFetchingClientName] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Fetch client name from GHL Subaccount ID
  useEffect(() => {
    const fetchClientName = async () => {
      if (!ghlSubaccountId.trim()) {
        setClientName('')
        return
      }

      setFetchingClientName(true)
      try {
        // TODO: Replace with actual GHL API call
        // For now, this is a placeholder - you'll need to implement the actual API call
        // Example: const response = await fetch(`YOUR_GHL_API_ENDPOINT/${ghlSubaccountId}`)
        // const data = await response.json()
        // setClientName(data.name)
        
        // Temporary: simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock response - replace with actual API
        // For now, we'll leave it empty and you can implement the real API call
        // setClientName('Client Name from API')
      } catch (err) {
        console.error('Error fetching client name:', err)
      } finally {
        setFetchingClientName(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchClientName()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [ghlSubaccountId])

  const processCsvData = (csvContent: string) => {
    try {
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      })

      if (parsed.errors.length > 0) {
        setError('Errore nel parsing del CSV: ' + parsed.errors[0].message)
        return false
      }

      const data = parsed.data as any[]
      
      if (data.length === 0) {
        setError('Il CSV è vuoto o non contiene dati validi')
        return false
      }

      // Trova la colonna Stage (case-insensitive e flessibile)
      const firstRow = data[0]
      const headers = Object.keys(firstRow)
      
      // Cerca colonna Stage con varianti possibili
      const stageColumnKey = headers.find(key => 
        key.toLowerCase().trim() === 'stage' || 
        key.toLowerCase().trim() === 'stages' ||
        key.toLowerCase().trim() === 'stato' ||
        key.toLowerCase().trim() === 'status'
      )

      if (!stageColumnKey) {
        setError(`Colonna "Stage" non trovata. Colonne disponibili: ${headers.join(', ')}`)
        return false
      }

      // Estrai i nomi univoci della colonna Stage
      const uniqueStages = new Set<string>()
      data.forEach(row => {
        const stageValue = row[stageColumnKey]
        if (stageValue !== null && stageValue !== undefined && stageValue !== '') {
          const stageStr = String(stageValue).trim()
          if (stageStr.length > 0) {
            uniqueStages.add(stageStr)
          }
        }
      })

      const stagesArray = Array.from(uniqueStages)
      
      if (stagesArray.length === 0) {
        setError(`Nessuno stage trovato nella colonna "${stageColumnKey}". Verifica che la colonna contenga valori.`)
        return false
      }

      setParsedStages(stagesArray)
      
      // Crea le mappature iniziali (tutte con categoria vuota)
      const mappings: StageMapping[] = stagesArray.map(stage => ({
        stageName: stage,
        category: ''
      }))

      setStageMappings(mappings)
      setError('')
      setCurrentStep(2) // Passa allo step 2
      return true
    } catch (err) {
      setError('Errore nel parsing del CSV: ' + (err instanceof Error ? err.message : 'Errore sconosciuto'))
      return false
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verifica che sia un file CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Per favore, carica un file CSV (.csv)')
      return
    }

    setError('') // Reset errori precedenti

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
      // Non processare automaticamente, aspetta il click su "Continua"
    }
    reader.onerror = () => {
      setError('Errore nella lettura del file')
    }
    reader.readAsText(file)
  }

  const handleCsvSubmit = () => {
    if (!csvText.trim()) {
      setError('Per favore, carica un file CSV valido')
      return
    }

    processCsvData(csvText)
  }


  const updateStageMapping = (index: number, category: string) => {
    const updated = [...stageMappings]
    updated[index].category = category
    setStageMappings(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    // Raggruppa gli stage per categoria
    const groupedByCategory: Record<string, string[]> = {}
    
    stageMappings.forEach(mapping => {
      if (mapping.category && mapping.category !== '') {
        if (!groupedByCategory[mapping.category]) {
          groupedByCategory[mapping.category] = []
        }
        groupedByCategory[mapping.category].push(mapping.stageName)
      }
    })

    // Crea il payload JSON con struttura piatta
    // Campi fissi richiesti: Subaccount ID, META ID, Calendar Diagnosi ID, Calendar Demo ID
    const payload: Record<string, string> = {
      client_name: clientName,
      ghl_subaccount_id: ghlSubaccountId,
      meta_ad_account_id: metaAdAccountId,
      calendar_diagnosis_id: diagnosisCalendarId,
      calendar_demo_id: demoCalendarId,
      calendar_presuccess_id: presuccessCalendarId,
      map_new_lead: groupedByCategory['New Lead']?.join(', ') || '',
      map_setting: groupedByCategory['Setting']?.join(', ') || '',
      map_diagnosis_set: groupedByCategory['Diagnosis Set']?.join(', ') || '',
      map_no_show_diagnosis: groupedByCategory['No Show Diagnosis']?.join(', ') || '',
      map_demo_set: groupedByCategory['Demo Set']?.join(', ') || '',
      map_no_show_demo: groupedByCategory['No Show Demo']?.join(', ') || '',
      map_presuccess_set: groupedByCategory['Pre-Success Set']?.join(', ') || '',
      map_no_show_presuccess: groupedByCategory['No Show Pre-Success']?.join(', ') || '',
      map_contract_out: groupedByCategory['Contract Out']?.join(', ') || '',
      map_won: groupedByCategory['Won']?.join(', ') || '',
      map_dq: groupedByCategory['DQ']?.join(', ') || '',
      map_dead_lead: groupedByCategory['Dead Lead']?.join(', ') || ''
    }

    try {
      const response = await fetch('/api/save-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Errore HTTP: ${response.status}`)
      }

      const result = await response.json()
      setSuccess(true)
      // Reset form dopo 2 secondi
      setTimeout(() => {
        setClientName('')
        setGhlSubaccountId('')
        setMetaAdAccountId('')
        setDiagnosisCalendarId('')
        setDemoCalendarId('')
        setPresuccessCalendarId('')
        setCsvText('')
        setStageMappings([])
        setParsedStages([])
        setCurrentStep(1)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError('Errore nell\'invio: ' + (err instanceof Error ? err.message : 'Errore sconosciuto'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Registrazione Nuovo Cliente
          </h1>

          {/* STEP 1: CSV UPLOAD */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  Carica il CSV della pipeline per iniziare. Il sistema estrarrà automaticamente gli stage da mappare.
                </p>
              </div>

              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Carica File CSV
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="csvFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Carica un file</span>
                        <input
                          id="csvFile"
                          name="csvFile"
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">o trascina e rilascia</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV fino a 10MB</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              {csvText && (
                <div className="flex justify-end">
                  <button
                    onClick={handleCsvSubmit}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                  >
                    <span>Continua</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CLIENT REGISTRATION + MAPPING */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* DATI CLIENTE */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Dati Cliente
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ghlSubaccountId" className="block text-sm font-medium text-gray-700 mb-1">
                      GHL Subaccount ID *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="ghlSubaccountId"
                        value={ghlSubaccountId}
                        onChange={(e) => setGhlSubaccountId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {fetchingClientName && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      readOnly={!!ghlSubaccountId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={ghlSubaccountId ? 'Inserisci GHL Subaccount ID per auto-popolare' : 'Auto-popolato da GHL Subaccount ID'}
                    />
                  </div>

                  <div>
                    <label htmlFor="metaAdAccountId" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Ad Account ID *
                    </label>
                    <input
                      type="text"
                      id="metaAdAccountId"
                      value={metaAdAccountId}
                      onChange={(e) => setMetaAdAccountId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="diagnosisCalendarId" className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnosis Calendar ID *
                    </label>
                    <input
                      type="text"
                      id="diagnosisCalendarId"
                      value={diagnosisCalendarId}
                      onChange={(e) => setDiagnosisCalendarId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="demoCalendarId" className="block text-sm font-medium text-gray-700 mb-1">
                      Demo Calendar ID *
                    </label>
                    <input
                      type="text"
                      id="demoCalendarId"
                      value={demoCalendarId}
                      onChange={(e) => setDemoCalendarId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="presuccessCalendarId" className="block text-sm font-medium text-gray-700 mb-1">
                      Pre-Success Calendar ID *
                    </label>
                    <input
                      type="text"
                      id="presuccessCalendarId"
                      value={presuccessCalendarId}
                      onChange={(e) => setPresuccessCalendarId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* MAPPATURA PIPELINE */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Mappatura Stage → Categorie Standard
                </h2>
                
                {stageMappings.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Nome Stage (CSV)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoria Standard
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stageMappings.map((mapping, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                              {mapping.stageName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <select
                                value={mapping.category}
                                onChange={(e) => updateStageMapping(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">-- Seleziona Categoria --</option>
                                {STANDARD_CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PULSANTE SUBMIT */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1)
                    setError('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Indietro
                </button>
                
                <div className="flex items-center space-x-4">
                  {loading && (
                    <div className="flex items-center text-blue-600">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      <span>Invio in corso...</span>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span>Cliente salvato con successo!</span>
                    </div>
                  )}
                  {error && (
                    <div className="text-red-600 text-sm">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salva Cliente
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}