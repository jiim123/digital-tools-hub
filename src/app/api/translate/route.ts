import { NextRequest, NextResponse } from 'next/server'
import { translateDocument } from '@/lib/deepl-api'

// Define supported file types without using browser-specific code
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/html',
  'text/markdown'
]

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting translation request ===')
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const sourceLanguage = formData.get('sourceLanguage') as string || 'auto'
    const targetLanguage = formData.get('targetLanguage') as string
    const apiKey = process.env.DEEPL_API_KEY

    console.log('Request details:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      sourceLanguage,
      targetLanguage,
      hasApiKey: !!apiKey
    })

    if (!file || !targetLanguage || !apiKey) {
      console.error('Missing required fields:', {
        hasFile: !!file,
        hasTargetLanguage: !!targetLanguage,
        hasApiKey: !!apiKey
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      console.error('Unsupported file type:', {
        fileType: file.type,
        supportedTypes: SUPPORTED_FILE_TYPES
      })
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('Starting document translation...')
    const result = await translateDocument(file, sourceLanguage, targetLanguage, apiKey)

    if (!result.success) {
      console.error('Translation failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Translation failed' },
        { status: 500 }
      )
    }

    console.log('Translation successful, sending response...')
    // Return the translated file
    return new NextResponse(result.translatedFile?.content, {
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="translated_${file.name}"`,
      },
    })
  } catch (error) {
    console.error('Translation error:', error)
    // Log the full error details
    if (error instanceof Error) {
      console.error({
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to translate document' },
      { status: 500 }
    )
  }
} 