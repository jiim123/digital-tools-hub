import { z } from 'zod'
import mammoth from 'mammoth'
// @ts-ignore
import pptxParser from 'pptx-parser'
import * as XLSX from 'xlsx'

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_CHAR_COUNT = 50000

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export const fileSchema = z.object({
  file: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, 'File size must be less than 100MB')
    .refine(
      (file) => SUPPORTED_FILE_TYPES.includes(file?.type),
      'Unsupported file format. Please upload a PDF, TXT, DOC, DOCX, PPT, PPTX, XLS, or XLSX file.'
    ),
})

async function extractWordText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function extractPowerPointText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pptx = await pptxParser.parse(arrayBuffer)
  let text = ''
  
  for (const slide of pptx.slides) {
    for (const shape of slide.shapes) {
      if (shape.text) {
        text += shape.text + '\n'
      }
    }
  }
  
  return text
}

async function extractExcelText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  let text = ''
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    for (const row of jsonData) {
      if (Array.isArray(row)) {
        text += row.join(' ') + '\n'
      }
    }
  }
  
  return text
}

export async function countCharacters(file: File): Promise<number> {
  if (typeof window === 'undefined') {
    return 0
  }

  try {
    if (file.type === 'application/pdf') {
      const { countPDFCharacters } = await import('./pdf-utils')
      const totalCharacters = await countPDFCharacters(file)
      return totalCharacters
    } else if (file.type === 'text/plain') {
      const text = await file.text()
      return text.length
    } else if (
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const text = await extractWordText(file)
      return text.length
    } else if (
      file.type === 'application/vnd.ms-powerpoint' ||
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      const text = await extractPowerPointText(file)
      return text.length
    } else if (
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      const text = await extractExcelText(file)
      return text.length
    }
    return 0
  } catch (error) {
    console.error('Error counting characters:', error)
    throw new Error('Failed to analyze file')
  }
}

export function getFileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase()
}

export function generateTranslatedFilename(filename: string, targetLanguage: string) {
  const extension = getFileExtension(filename)
  const baseName = filename.replace(`.${extension}`, '')
  return `${baseName}_${targetLanguage}.${extension}`
}

export const validateFile = (file: File, allowedTypes: string[]) => {
  if (!file) {
    throw new Error('No file provided')
  }

  const fileType = file.type
  if (!allowedTypes.includes(fileType)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
  }

  // 100MB max file size
  const MAX_FILE_SIZE = 100 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size too large. Maximum size is 100MB')
  }

  return true
} 