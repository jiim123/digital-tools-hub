'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiFile, FiX, FiCheckSquare, FiGlobe, FiFileText, FiClock, FiLoader, FiInfo } from 'react-icons/fi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { supportedLanguages } from '@/lib/languages'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Statistics {
  documentsTranslated: number;
  mostUsedLanguage: {
    code: string;
    count: number;
  };
  lastTranslationDate: string | null;
}

export default function TranslationPage() {
  const [file, setFile] = useState<File | null>(null)
  const [targetLanguage, setTargetLanguage] = useState('de')
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<Statistics>({
    documentsTranslated: 0,
    mostUsedLanguage: {
      code: 'en',
      count: 0
    },
    lastTranslationDate: null
  })

  // Load statistics from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('translationStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  // Update statistics when a translation is completed
  const updateStatistics = (targetLang: string) => {
    const languageStats = JSON.parse(localStorage.getItem('languageStats') || '{}') as Record<string, number>
    const newCount = (languageStats[targetLang] || 0) + 1
    languageStats[targetLang] = newCount

    const mostUsed = Object.entries(languageStats).reduce((a, b) => 
      (a[1] > b[1] ? a : b), ['en', 0] as [string, number])

    const newStats = {
      documentsTranslated: stats.documentsTranslated + 1,
      mostUsedLanguage: {
        code: mostUsed[0],
        count: mostUsed[1]
      },
      lastTranslationDate: new Date().toISOString()
    }

    setStats(newStats)
    localStorage.setItem('translationStats', JSON.stringify(newStats))
    localStorage.setItem('languageStats', JSON.stringify(languageStats))
  }

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setFile(file)
    setProgress(0)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  })

  const translateDocument = async () => {
    if (!file) return

    setIsTranslating(true)
    setProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetLanguage', targetLanguage)

      const response = await fetch('/api/translate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 1000)

      const blob = await response.blob()
      setProgress(100)
      clearInterval(interval)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `translated_${file.name}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      updateStatistics(targetLanguage)
      toast.success('Translation completed successfully')
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('Translation failed')
    } finally {
      setIsTranslating(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-[#131618]">
      {/* Header Section with 4 columns */}
      <div className="w-full border-b border-[#3f4d57] bg-[#242a2f]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#3f4d57]">
          {/* Title Column */}
          <div className="p-4 sm:p-6 flex items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#cad9e6] font-heading">
                Document Translation
              </h1>
              <p className="text-sm text-[#cad9e6] mt-1 font-sans">
                Translate documents to any language
              </p>
            </div>
          </div>

          {/* Documents Translated Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiFileText className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 shrink-0" />
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight">
                  {stats.documentsTranslated}
                </p>
                <p className="text-sm text-[#cad9e6] font-sans">Documents Translated</p>
              </div>
            </div>
          </div>

          {/* Most Used Language Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiGlobe className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight truncate">
                  {supportedLanguages.find(lang => lang.code === stats.mostUsedLanguage.code)?.name || 'None'}
                </p>
                <p className="text-sm text-[#cad9e6] font-sans">Most Translated To</p>
              </div>
            </div>
          </div>

          {/* Last Translation Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiClock className="w-5 sm:w-6 h-5 sm:h-6 text-purple-200 shrink-0" />
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight">
                  {stats.lastTranslationDate ? 
                    new Date(stats.lastTranslationDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    }) : 
                    '—'
                  }
                </p>
                <p className="text-sm text-[#cad9e6] font-sans">Last Translation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Translation Settings */}
        <div className="bg-[#242a2f] border border-[#3f4d57] rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FiGlobe className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-lg font-semibold text-[#e3ebf2] font-heading">
                Translate document to:
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-[#6d879b] hover:text-[#cad9e6] transition-colors focus:outline-none">
                      <FiInfo className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="max-w-[300px] bg-[#353f48] border border-[#596e7e] text-[#e3ebf2] shadow-xl"
                    side="right"
                    sideOffset={10}
                  >
                    <div className="space-y-2">
                      <p className="font-medium text-[#cad9e6]">DeepL Translation</p>
                      <p className="text-sm text-[#a3bed3]">
                        Powered by DeepL's neural networks, this tool:
                      </p>
                      <ul className="text-sm text-[#a3bed3] list-disc list-inside space-y-1">
                        <li>Maintains document formatting</li>
                        <li>Preserves context and tone</li>
                        <li>Supports multiple file formats</li>
                        <li>Provides human-quality translations</li>
                        <li>No documents are being stored on our servers</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-full sm:w-[200px] bg-[#353f48] border-[#596e7e] text-[#e3ebf2]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-[#242a2f] border border-[#596e7e] shadow-lg">
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-[#e3ebf2] hover:bg-[#353f48] focus:bg-[#353f48] hover:text-[#e3ebf2] focus:text-[#e3ebf2] cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FiGlobe className="w-4 h-4" />
                      {lang.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#e3ebf2] font-heading">Start Translation</h2>
              <p className="text-sm text-[#cad9e6] mt-1 font-sans">Upload your document below to begin</p>
            </div>
            {file && (
              <button
                onClick={() => setFile(null)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#353f48] text-[#e3ebf2] rounded-lg hover:bg-[#242a2f]/80 transition-all border border-[#596e7e] text-sm w-full sm:w-auto"
              >
                <FiX className="w-4 h-4" />
                <span>Reset File</span>
              </button>
            )}
          </div>

          <div
            {...getRootProps()}
            className="bg-[#242a2f] border border-dashed border-[#596e7e] rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:bg-[#242a2f]/80 transition-all group"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <FiFile className="w-10 sm:w-12 h-10 sm:h-12 text-blue-600" />
                  <div>
                    <p className="text-base sm:text-lg font-medium text-[#e3ebf2] font-heading">Document Selected</p>
                    <p className="text-sm text-[#6d879b] mt-1 font-sans break-all">{file.name}</p>
                    <p className="text-xs text-[#6d879b] mt-2 font-sans">Click or drag to replace</p>
                  </div>
                </>
              ) : (
                <>
                  <FiUpload className="w-10 sm:w-12 h-10 sm:h-12 text-blue-600" />
                  <div>
                    <p className="text-lg sm:text-xl font-regular text-[#a3bed3] font-heading">Upload Document</p>
                    <p className="text-sm text-[#c3d5e2] mt-1 font-sans">
                      Drag and drop here, or click to select
                    </p>
                    <p className="text-xs text-[#6d879b] mt-2 font-sans">
                      Supported: PDF, TXT, DOC, DOCX, PPT, PPTX, XLS, XLSX
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-end">
              <button
                onClick={translateDocument}
                disabled={isTranslating}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#353f48] text-[#e3ebf2] rounded-lg hover:bg-[#242a2f]/80 transition-all border border-[#596e7e] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isTranslating ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <FiGlobe className="w-5 h-5" />
                    <span>Translate Document</span>
                  </>
                )}
              </button>
            </div>
          )}

          {isTranslating && (
            <div className="bg-[#242a2f] border border-[#3f4d57] rounded-lg p-4">
              <div className="flex justify-between text-sm text-[#cad9e6] mb-2">
                <span>Translation Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-[#353f48]" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 