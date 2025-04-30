import { NextRequest, NextResponse } from 'next/server'
import { countPDFCharacters } from '@/lib/pdf-utils'
import { validateFile } from '@/lib/file-utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    // Validate file
    try {
      validateFile(file, ['application/pdf'])
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid file' },
        { status: 400 }
      )
    }

    const totalCharacters = await countPDFCharacters(file)
    const estimatedCost = (totalCharacters / 1000) * 0.02 // $0.02 per 1000 characters
    
    return NextResponse.json({
      charCount: totalCharacters,
      estimatedCost: estimatedCost.toFixed(2),
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    )
  }
} 