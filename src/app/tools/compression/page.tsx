'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiImage, FiX, FiDownload, FiZap, FiClock, FiInfo, FiLoader } from 'react-icons/fi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Statistics {
  imagesCompressed: number;
  totalBytesSaved: number;
  lastCompressionDate: string | null;
}

interface ImagePreview {
  url: string;
  width: number;
  height: number;
  size: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Add this color interpolation function at the top level
const interpolateColor = (quality: number) => {
  // Red color for low quality (rgb(239, 68, 68))
  // Yellow color for medium quality (rgb(234, 179, 8))
  // Green color for high quality (rgb(34, 197, 94))
  
  if (quality <= 50) {
    // Interpolate between red and yellow
    const ratio = quality / 50
    const r = Math.round(239 + (234 - 239) * ratio)
    const g = Math.round(68 + (179 - 68) * ratio)
    const b = Math.round(68 + (8 - 68) * ratio)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Interpolate between yellow and green
    const ratio = (quality - 50) / 50
    const r = Math.round(234 + (34 - 234) * ratio)
    const g = Math.round(179 + (197 - 179) * ratio)
    const b = Math.round(8 + (94 - 8) * ratio)
    return `rgb(${r}, ${g}, ${b})`
  }
}

const getQualityColor = (quality: number) => {
  if (quality < 33) return 'rgb(239, 68, 68)' // Red
  if (quality < 66) return 'rgb(234, 179, 8)' // Yellow
  return 'rgb(34, 197, 94)' // Green
}

const getQualityClass = (quality: number) => {
  if (quality < 33) return 'bg-red-500'
  if (quality < 66) return 'bg-yellow-500'
  return 'bg-green-500'
}

export default function CompressionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImagePreview | null>(null)
  const [compressedPreview, setCompressedPreview] = useState<ImagePreview | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState('jpeg')
  const [stats, setStats] = useState<Statistics>({
    imagesCompressed: 0,
    totalBytesSaved: 0,
    lastCompressionDate: null
  })

  // Load statistics from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('compressionStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  // Update statistics when compression is completed
  const updateStatistics = (bytesSaved: number) => {
    const newStats = {
      imagesCompressed: stats.imagesCompressed + 1,
      totalBytesSaved: stats.totalBytesSaved + bytesSaved,
      lastCompressionDate: new Date().toISOString()
    }
    setStats(newStats)
    localStorage.setItem('compressionStats', JSON.stringify(newStats))
  }

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    setFile(file)
    const url = URL.createObjectURL(file)
    
    // Get image dimensions
    const img = new Image()
    img.onload = () => {
      setPreview({
        url,
        width: img.width,
        height: img.height,
        size: file.size
      })
    }
    img.src = url
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/tiff': ['.tif', '.tiff']
    },
    maxFiles: 1,
  })

  const compressImage = async () => {
    if (!file) return

    setIsCompressing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('quality', quality.toString())
      formData.append('format', format)

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Compression failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Get compressed image info
      const originalSize = Number(response.headers.get('X-Original-Size'))
      const compressedSize = Number(response.headers.get('X-Compressed-Size'))
      const width = Number(response.headers.get('X-Image-Width'))
      const height = Number(response.headers.get('X-Image-Height'))
      const compressionRatio = Number(response.headers.get('X-Compression-Ratio'))

      setCompressedPreview({
        url,
        width,
        height,
        size: compressedSize
      })

      updateStatistics(originalSize - compressedSize)
      toast.success(`Compressed successfully! Saved ${compressionRatio}% of original size`)
    } catch (error) {
      console.error('Compression error:', error)
      toast.error('Compression failed')
    } finally {
      setIsCompressing(false)
    }
  }

  const downloadCompressed = () => {
    if (!compressedPreview) return
    const a = document.createElement('a')
    a.href = compressedPreview.url
    a.download = `compressed_${file?.name.split('.')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-[#3e475c] bg-gradient-to-bl from-[#3e475c] via-[#1a1e21] to-[#1a1e21] bg-[length:200%_200%] bg-[position:0%_0%]">
      {/* Header Section with 4 columns */}
      <div className="w-full border-b border-[#3f4d57] bg-[#242a2f]">
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:divide-x divide-[#3f4d57]">
          {/* Title Column */}
          <div className="p-4 sm:p-6 flex items-center gap-3">
            <FiImage className="w-6 h-6 text-[#cad9e6] shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#cad9e6] font-heading">
                Image Compression
              </h1>
              <p className="text-sm text-[#cad9e6] mt-1 font-sans">
                Optimize images for digital use
              </p>
            </div>
          </div>

          {/* Images Compressed Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiImage className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm text-[#cad9e6] font-sans">Images Compressed</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight mt-1">
                  {stats.imagesCompressed}
                </p>
              </div>
            </div>
          </div>

          {/* Total Space Saved Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiZap className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm text-[#cad9e6] font-sans">Total Space Saved</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight mt-1">
                  {formatBytes(stats.totalBytesSaved)}
                </p>
              </div>
            </div>
          </div>

          {/* Last Compression Column */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <FiClock className="w-5 sm:w-6 h-5 sm:h-6 text-purple-200 shrink-0" />
              <div>
                <p className="text-sm text-[#cad9e6] font-sans">Last Compression</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#cad9e6] font-heading tracking-tight mt-1">
                  {stats.lastCompressionDate ? 
                    new Date(stats.lastCompressionDate).toLocaleDateString(undefined, {
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

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Upload Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-4xl font-semibold text-[#e3ebf2] font-heading tracking-tight">Start Compression</h2>
              <p className="text-sm text-[#cad9e6] mt-1 font-sans">Upload your image below to begin</p>
            </div>
            {file && (
              <button
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  setCompressedPreview(null)
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#353f48] text-[#e3ebf2] rounded-lg hover:bg-[#242a2f]/80 transition-all border border-[#596e7e] text-sm w-full sm:w-auto"
              >
                <FiX className="w-4 h-4" />
                <span>Reset Image</span>
              </button>
            )}
          </div>

          <div
            {...getRootProps()}
            className="bg-[#242a2f] border border-dashed border-[#596e7e] rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:bg-[#242a2f]/80 transition-all group"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {preview ? (
                <>
                  <img 
                    src={preview.url} 
                    alt="Preview" 
                    className="max-w-full max-h-[300px] rounded-lg object-contain"
                  />
                  <div>
                    <p className="text-base sm:text-lg font-medium text-[#e3ebf2] font-heading">Image Selected</p>
                    <p className="text-sm text-[#6d879b] mt-1 font-sans">
                      {preview.width}x{preview.height}px • {formatBytes(preview.size)}
                    </p>
                    <p className="text-xs text-[#6d879b] mt-2 font-sans">Click or drag to replace</p>
                  </div>
                </>
              ) : (
                <>
                  <FiUpload className="w-10 sm:w-12 h-10 sm:h-12 text-blue-600" />
                  <div>
                    <p className="text-lg sm:text-xl font-regular text-[#a3bed3] font-heading">Upload Image</p>
                    <p className="text-sm text-[#c3d5e2] mt-1 font-sans">
                      Drag and drop here, or click to select
                    </p>
                    <p className="text-xs text-[#6d879b] mt-2 font-sans">
                      Supported: JPEG, PNG, WebP, TIFF
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compression Settings */}
        <div className="bg-[#242a2f] border border-[#3f4d57] rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FiZap className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 className="text-lg font-semibold text-[#e3ebf2] font-heading">
                  Compression Settings
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
                        <p className="font-medium text-[#cad9e6]">Image Compression</p>
                        <p className="text-sm text-[#a3bed3]">
                          Adjust these settings to balance quality and file size:
                        </p>
                        <ul className="text-sm text-[#a3bed3] list-disc list-inside space-y-1">
                          <li>Quality affects compression level</li>
                          <li>Format determines compatibility</li>
                          <li>WebP offers best compression</li>
                          <li>Original aspect ratio is preserved</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#cad9e6] mb-2">
                  Quality ({quality}%)
                </label>
                <div className="relative py-3">
                  <Slider
                    value={[quality]}
                    onValueChange={(values) => setQuality(values[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="absolute -bottom-0 left-0 right-0 h-[1px] bg-[#353f48] rounded-full overflow-hidden">
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-200 rounded-full ${getQualityClass(quality)}`}
                      style={{ width: `${quality}%` }}
                    />
                  </div>
                </div>
                <style jsx global>{`
                  [class*="SliderTrack"] {
                    height: 6px !important;
                    background: #353f48 !important;
                  }

                  [class*="SliderRange"] {
                    background: ${getQualityColor(quality)} !important;
                    height: 6px !important;
                  }

                  [class*="SliderThumb"] {
                    width: 20px !important;
                    height: 20px !important;
                    background: ${getQualityColor(quality)} !important;
                    border: 2px solid #242a2f !important;
                    transition: all 0.2s ease !important;
                    cursor: pointer !important;
                  }

                  [class*="SliderThumb"]:hover {
                    transform: scale(1.1) !important;
                    box-shadow: 0 0 10px ${getQualityColor(quality)} !important;
                  }
                `}</style>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cad9e6] mb-2">
                  Output Format
                </label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="w-full bg-[#353f48] border-[#596e7e] text-[#e3ebf2]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242a2f] border border-[#596e7e] shadow-lg">
                    <SelectItem value="jpeg" className="text-[#e3ebf2] hover:bg-[#353f48] focus:bg-[#353f48] cursor-pointer">
                      JPEG
                    </SelectItem>
                    <SelectItem value="png" className="text-[#e3ebf2] hover:bg-[#353f48] focus:bg-[#353f48] cursor-pointer">
                      PNG
                    </SelectItem>
                    <SelectItem value="webp" className="text-[#e3ebf2] hover:bg-[#353f48] focus:bg-[#353f48] cursor-pointer">
                      WebP
                    </SelectItem>
                    <SelectItem value="tiff" className="text-[#e3ebf2] hover:bg-[#353f48] focus:bg-[#353f48] cursor-pointer">
                      TIFF
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {file && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
            <button
              onClick={compressImage}
              disabled={isCompressing}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#353f48] text-[#e3ebf2] rounded-lg hover:bg-[#242a2f]/80 transition-all border border-[#596e7e] disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            >
              {isCompressing ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Compressing...</span>
                </>
              ) : (
                <>
                  <FiZap className="w-5 h-5" />
                  <span>Compress Image</span>
                </>
              )}
            </button>

            {compressedPreview && (
              <button
                onClick={downloadCompressed}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all order-1 sm:order-2"
              >
                <FiDownload className="w-5 h-5" />
                <span>Download Compressed</span>
              </button>
            )}
          </div>
        )}

        {compressedPreview && (
          <div className="bg-[#242a2f] border border-[#3f4d57] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e3ebf2] mb-4">Compression Result</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-[#cad9e6] mb-2">Original</p>
                <img 
                  src={preview?.url} 
                  alt="Original" 
                  className="max-w-full rounded-lg object-contain"
                />
                <p className="text-sm text-[#6d879b] mt-2">
                  {preview?.width}x{preview?.height}px • {formatBytes(preview?.size || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#cad9e6] mb-2">Compressed</p>
                <img 
                  src={compressedPreview.url} 
                  alt="Compressed" 
                  className="max-w-full rounded-lg object-contain"
                />
                <p className="text-sm text-[#6d879b] mt-2">
                  {compressedPreview.width}x{compressedPreview.height}px • {formatBytes(compressedPreview.size)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 