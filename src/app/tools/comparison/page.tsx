'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import PDFComparison from '@/components/PDFComparison'
import { FiUpload, FiFile, FiX, FiCheckSquare, FiClock, FiFileText, FiTrendingUp, FiChevronDown, FiChevronUp, FiMonitor, FiImage } from 'react-icons/fi'
import { Languages, GitCompare } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Statistics {
  documentsCompared: number;
  timeSaved: number; // in minutes
  lastComparisonDate: string | null;
}

const MANUAL_REVIEW_TIME_PER_PAGE = 5; // estimated minutes to review one page manually

const tools = [
  {
    title: 'Document Translation',
    href: '/tools/translation',
    icon: Languages
  },
  {
    title: 'PDF Comparison',
    href: '/tools/comparison',
    icon: GitCompare
  },
  {
    title: 'Image Compression',
    href: '/tools/compression',
    icon: FiImage
  }
]

function ResponsiveWarning() {
  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-30 lg:hidden pointer-events-none">
      <div className="bg-[#131618]/95 backdrop-blur-sm p-4 flex items-center justify-center h-full">
        <div className="bg-[#242a2f] border border-[#3f4d57] rounded-xl p-6 max-w-md w-full shadow-xl pointer-events-auto">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#353f48] flex items-center justify-center">
              <FiMonitor className="w-8 h-8 text-[#e3ebf2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#e3ebf2] font-heading">
                Larger Screen Required
              </h2>
              <p className="mt-2 text-[#cad9e6] font-sans">
                The PDF Comparison tool works best on larger screens. Please use a desktop computer or tablet in landscape mode for the best experience.
              </p>
            </div>
            <div className="w-full h-px bg-[#3f4d57] my-2" />
            <p className="text-sm text-[#6d879b]">
              Recommended minimum screen width: 1024px
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComparisonPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [modifiedFile, setModifiedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [stats, setStats] = useState<Statistics>({
    documentsCompared: 0,
    timeSaved: 0,
    lastComparisonDate: null
  })

  const pathname = usePathname()

  // Load statistics from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('pdfComparisonStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  // Update statistics when a comparison is made
  const updateStatistics = (pageCount: number) => {
    const newStats = {
      documentsCompared: stats.documentsCompared + 2, // counting both documents
      timeSaved: stats.timeSaved + (pageCount * MANUAL_REVIEW_TIME_PER_PAGE),
      lastComparisonDate: new Date().toISOString()
    }
    setStats(newStats)
    localStorage.setItem('pdfComparisonStats', JSON.stringify(newStats))
  }

  const onDropOriginal = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setOriginalFile(acceptedFiles[0])
      setError(null)
    }
  }

  const onDropModified = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setModifiedFile(acceptedFiles[0])
      setError(null)
    }
  }

  const { getRootProps: getOriginalRootProps, getInputProps: getOriginalInputProps } = useDropzone({
    onDrop: onDropOriginal,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const { getRootProps: getModifiedRootProps, getInputProps: getModifiedInputProps } = useDropzone({
    onDrop: onDropModified,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const resetFiles = () => {
    setOriginalFile(null)
    setModifiedFile(null)
    setError(null)
  }

  const formatTimeSaved = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    }
  }

  return (
    <div className="min-h-screen bg-[#3e475c] bg-gradient-to-tr from-[#3e475c] via-[#1a1e21] to-[#1a1e21] bg-[length:200%_200%] bg-[position:0%_0%]">
      <ResponsiveWarning />
      {/* Header Section with 4 columns */}
      <div className="w-full border-b border-[#3f4d57] bg-[#242a2f]">
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:divide-x divide-[#3f4d57]">
          {/* Title Column */}
          <div className="p-4 sm:p-6 flex items-center gap-3">
            <GitCompare className="w-6 h-6 text-[#cad9e6] shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#cad9e6] font-heading">
                PDF Comparison
              </h1>
              <p className="text-sm text-[#cad9e6] mt-1 font-sans">
                Compare and analyze PDF documents
              </p>
            </div>
          </div>

          {/* Documents Compared Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiFileText className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm text-[#cad9e6] font-sans">Documents Compared</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight mt-1">
                  {stats.documentsCompared}
                </p>
              </div>
            </div>
          </div>

          {/* Time Saved Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiClock className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm text-[#cad9e6] font-sans">Time Saved</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight mt-1">
                  {formatTimeSaved(stats.timeSaved)}
                </p>
              </div>
            </div>
          </div>

          {/* Last Comparison Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiTrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-purple-200 shrink-0" />
              <div>
                <p className="text-sm text-[#cad9e6] font-sans">Last Comparison</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight mt-1">
                  {stats.lastComparisonDate ? 
                    new Date(stats.lastComparisonDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    }) : 
                    '—'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Collapsible Instructions */}
        <div className="bg-[#242a2f] border border-[#3f4d57] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#242a2f]/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FiCheckSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-[#e3ebf2] font-heading">
                How It Works
              </h2>
            </div>
            {showInstructions ? (
              <FiChevronUp className="w-5 h-5 text-[#3f4d57]" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-[#3f4d57]" />
            )}
          </button>
          
          {showInstructions && (
            <div className="px-6 py-4 bg-[#242a2f]">
              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[#242a2f]/80">
                  <FiUpload className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-base font-medium text-[#e3ebf2] font-heading">Upload PDFs</h3>
                    <p className="text-sm text-[#cad9e6] font-sans">Drop or select files below</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[#242a2f]/80">
                  <FiCheckSquare className="w-5 h-5 text-emerald-600 mt-1" />
                  <div>
                    <h3 className="text-base font-medium text-[#e3ebf2] font-heading">Compare</h3>
                    <p className="text-sm text-[#cad9e6] font-sans">Analyze differences</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-[#242a2f]/80">
                  <svg className="w-5 h-5 text-purple-600 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <h3 className="text-base font-medium text-[#e3ebf2] font-heading">Review</h3>
                    <p className="text-sm text-[#cad9e6] font-sans">See highlighted changes</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-[#242a2f]">
                <p className="text-sm text-[#cad9e6]">
                  <strong className="text-[#e3ebf2]">Time-saving estimate:</strong> The tool saves approximately {MANUAL_REVIEW_TIME_PER_PAGE} minutes per page compared to manual review. 
                  Users have so far saved {formatTimeSaved(stats.timeSaved)} across {stats.documentsCompared} documents.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tool Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-4xl font-semibold text-[#e3ebf2] font-heading tracking-tight">Start Comparison</h2>
              <p className="text-sm text-[#cad9e6] mt-1 font-sans">Upload your documents below to begin</p>
            </div>
            {(originalFile || modifiedFile) && (
              <button
                onClick={resetFiles}
                className="flex items-center gap-2 px-4 py-2 bg-[#353f48] text-[#e3ebf2] rounded-lg hover:bg-[#242a2f]/80 transition-all border border-[#596e7e] text-sm"
              >
                <FiX className="w-4 h-4" />
                <span>Reset Files</span>
              </button>
            )}
          </div>

          {!originalFile || !modifiedFile ? (
            <div className="grid grid-cols-2 gap-6">
              <div
                {...getOriginalRootProps()}
                className="bg-[#242a2f] border border-dashed border-[#596e7e] rounded-xl p-12 text-center cursor-pointer hover:bg-[#242a2f]/80 transition-all group"
              >
                <input {...getOriginalInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  {originalFile ? (
                    <>
                      <FiFile className="w-12 h-12 text-blue-600" />
                      <div>
                        <p className="text-lg font-medium text-[#e3ebf2] font-heading">Original PDF Selected</p>
                        <p className="text-sm text-[#6d879b] mt-1 font-sans">{originalFile.name}</p>
                        <p className="text-xs text-[#6d879b] mt-2 font-sans">Click or drag to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-12 h-12 text-blue-600" />
                      <div>
                        <p className="text-xl font-regular text-[#a3bed3] font-heading">Original PDF</p>
                        <p className="text-sm text-[#c3d5e2] mt-1 font-sans">Drag and drop here, or click to select</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div
                {...getModifiedRootProps()}
                className="bg-[#242a2f] border border-dashed border-[#596e7e] rounded-xl p-8 text-center cursor-pointer hover:bg-[#242a2f]/80 transition-all group"
              >
                <input {...getModifiedInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  {modifiedFile ? (
                    <>
                      <FiFile className="w-12 h-12 text-emerald-600" />
                      <div>
                        <p className="text-lg font-medium text-emerald-600 font-heading">Modified PDF Selected</p>
                        <p className="text-sm text-emerald-300 mt-1 font-sans">{modifiedFile.name}</p>
                        <p className="text-xs text-emerald-100 mt-2 font-sans">Click or drag to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-12 h-12 text-emerald-600" />
                      <div>
                        <p className="text-xl font-regular text-emerald-600 font-heading">Modified PDF</p>
                        <p className="text-sm text-emerald-100 mt-1 font-sans">Drag and drop here, or click to select</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <PDFComparison 
              originalFile={originalFile} 
              modifiedFile={modifiedFile}
              onComparisonComplete={(pageCount: number) => updateStatistics(pageCount)}
            />
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border-l-4 border-destructive text-destructive rounded-r-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#242a2f] border-t border-[#3f4d57]">
        <div className="flex justify-around">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className={`flex flex-col items-center p-3 transition-colors ${
                pathname === tool.href
                  ? 'text-[#ffffff] bg-[#353f48]'
                  : 'text-[#ffffff] hover:bg-[#353f48]'
              }`}
            >
              <tool.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{tool.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 