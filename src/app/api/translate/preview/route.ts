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
        { error: error.message },
        { status: 400 }
      )
    }

    const charCount = await countPDFCharacters(file)
    
    return NextResponse.json({
      charCount,
      estimatedCost: (charCount * 0.00002).toFixed(2), // $0.02 per 1000 characters
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
} 