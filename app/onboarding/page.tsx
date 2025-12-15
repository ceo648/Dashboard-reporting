'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Loader2, CheckCircle2, Upload, ArrowRight } from 'lucide-react'

// Categorie standard per la pipeline
const STANDARD_CATEGORIES = [
  'No Show Demo',
  'Trattative',
  'Dead Lead',
  'Setting',
  'Demo Set',
  'Non Qualificato',
  'New Lead',
  'Fuori Target',
  'No Show Diagnosi',
  'Won',
  'Lost',
  'Diagnosi Set',
] as const

type StandardCategory = (typeof STANDARD_CATEGORIES)[number]

interface StageMapping {
  stageName: string
  category: StandardCategory | ''
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [csvText, setCsvText] = useState('')
  const [stageMappings, setStageMappings] = useState<StageMapping[]>([])

  // Dati cliente
  const [ghlSubaccountId, setGhlSubaccountId] = useState('')
  const [metaAdAccountId, setMetaAdAccountId] = useState('')
  const [diagnosisCalendarId, setDiagnosisCalendarId] = useState('')
  const [demoCalendarId, setDemoCalendarId] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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

      const firstRow = data[0]
      const headers = Object.keys(firstRow)

      const stageColumnKey = headers.find(
        (key) => key.toLowerCase().trim() === 'stage',
      )

      if (!stageColumnKey) {
        setError(`Colonna "Stage" non trovata. Colonne disponibili: ${headers.join(', ')}`)
        return false
      }

      const uniqueStages = new Set<string>()
      data.forEach((row) => {
        const value = row[stageColumnKey]
        if (value) {
          const s = String(value).trim()
          if (s) uniqueStages.add(s)
        }
      })

      const stagesArray = Array.from(uniqueStages)
      if (stagesArray.length === 0) {
        setError(`Nessuno stage trovato nella colonna "${stageColumnKey}".`)
        return false
      }

      setStageMappings(
        stagesArray.map((stage) => ({
          stageName: stage,
          category: '',
        })),
      )
      setError('')
      setCurrentStep(2)
      return true
    } catch (err) {
      setError(
        'Errore nel parsing del CSV: ' +
          (err instanceof Error ? err.message : 'Errore sconosciuto'),
      )
      return false
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Per favore, carica un file CSV (.csv)')
      return
    }

    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
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
    updated[index].category = category as StandardCategory | ''
    setStageMappings(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    const groupedByCategory: Record<string, string[]> = {}
    stageMappings.forEach((mapping) => {
      if (!mapping.category) return
      if (!groupedByCategory[mapping.category]) {
        groupedByCategory[mapping.category] = []
      }
      groupedByCategory[mapping.category].push(mapping.stageName)
    })

    const payload: Record<string, string> = {
      // Campi fissi
      ghl_subaccount_id: ghlSubaccountId,
      meta_ad_account_id: metaAdAccountId,
      calendar_diagnosis_id: diagnosisCalendarId,
      calendar_demo_id: demoCalendarId,
      // Mappature pipeline
      map_no_show_demo: groupedByCategory['No Show Demo']?.join(', ') || '',
      map_trattative: groupedByCategory['Trattative']?.join(', ') || '',
      map_dead_lead: groupedByCategory['Dead Lead']?.join(', ') || '',
      map_setting: groupedByCategory['Setting']?.join(', ') || '',
      map_demo_set: groupedByCategory['Demo Set']?.join(', ') || '',
      map_non_qualificato: groupedByCategory['Non Qualificato']?.join(', ') || '',
      map_new_lead: groupedByCategory['New Lead']?.join(', ') || '',
      map_fuori_target: groupedByCategory['Fuori Target']?.join(', ') || '',
      map_no_show_diagnosi: groupedByCategory['No Show Diagnosi']?.join(', ') || '',
      map_won: groupedByCategory['Won']?.join(', ') || '',
      map_lost: groupedByCategory['Lost']?.join(', ') || '',
      map_diagnosi_set: groupedByCategory['Diagnosi Set']?.join(', ') || '',
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

      await response.json()
      setSuccess(true)
      setTimeout(() => {
        setGhlSubaccountId('')
        setMetaAdAccountId('')
        setDiagnosisCalendarId('')
        setDemoCalendarId('')
        setCsvText('')
        setStageMappings([])
        setCurrentStep(1)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(
        'Errore nell\'invio: ' +
          (err instanceof Error ? err.message : 'Errore sconosciuto'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Registrazione Nuovo Cliente
          </h1>

          {/* STEP 1: CSV UPLOAD */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-blue-800">
                  Carica il CSV della pipeline per iniziare. Il sistema
                  estrarrà automaticamente gli stage da mappare.
                </p>
              </div>

              <div>
                <label
                  htmlFor="csvFile"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Carica File CSV
                </label>
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="csvFile"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                      >
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
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {csvText && (
                <div className="flex justify-end">
                  <button
                    onClick={handleCsvSubmit}
                    className="flex items-center space-x-2 rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Dati Cliente
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="ghlSubaccountId"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      GHL Subaccount ID *
                    </label>
                    <input
                      type="text"
                      id="ghlSubaccountId"
                      value={ghlSubaccountId}
                      onChange={(e) => setGhlSubaccountId(e.target.value)}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="metaAdAccountId"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Meta Ad Account ID *
                    </label>
                    <input
                      type="text"
                      id="metaAdAccountId"
                      value={metaAdAccountId}
                      onChange={(e) => setMetaAdAccountId(e.target.value)}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="diagnosisCalendarId"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Diagnosis Calendar ID *
                    </label>
                    <input
                      type="text"
                      id="diagnosisCalendarId"
                      value={diagnosisCalendarId}
                      onChange={(e) => setDiagnosisCalendarId(e.target.value)}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="demoCalendarId"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Demo Calendar ID *
                    </label>
                    <input
                      type="text"
                      id="demoCalendarId"
                      value={demoCalendarId}
                      onChange={(e) => setDemoCalendarId(e.target.value)}
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* MAPPATURA PIPELINE */}
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Mappatura Stage → Categorie Standard
                </h2>

                {stageMappings.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border-r border-gray-300 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Nome Stage (CSV)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Categoria Standard
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {stageMappings.map((mapping, index) => (
                          <tr key={index}>
                            <td className="border-r border-gray-300 px-4 py-3 text-sm font-medium text-gray-900">
                              {mapping.stageName}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={mapping.category}
                                onChange={(e) =>
                                  updateStageMapping(index, e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">
                                  -- Seleziona Categoria --
                                </option>
                                {STANDARD_CATEGORIES.map((cat) => (
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
                  className="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Indietro
                </button>

                <div className="flex items-center space-x-4">
                  {loading && (
                    <div className="flex items-center text-blue-600">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Invio in corso...</span>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      <span>Cliente salvato con successo!</span>
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-red-600">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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