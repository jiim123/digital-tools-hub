import { NextRequest, NextResponse } from 'next/server'
import { comparePDFs, generateComparisonReport } from '@/lib/pdf-utils'
import { PDFDocument } from 'pdf-lib'

// Helper function to create SSE response
function createEventStream() {
  console.log('Creating new SSE stream...')
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  return {
    stream: stream.readable,
    write: async (event: string, data: any) => {
      console.log(`Writing SSE event: ${event}`, data)
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      await writer.write(encoder.encode(eventData))
    },
    close: () => {
      console.log('Closing SSE stream...')
      writer.close()
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('Received comparison request')
  // Check if the client accepts SSE
  const acceptsSSE = request.headers.get('accept') === 'text/event-stream'
  console.log('Client accepts SSE:', acceptsSSE)

  try {
    const formData = await request.formData()
    const originalFile = formData.get('originalFile') as File
    const modifiedFile = formData.get('modifiedFile') as File

    console.log('Received files:', {
      originalFile: originalFile?.name,
      originalFileType: originalFile?.type,
      originalFileSize: originalFile?.size,
      modifiedFile: modifiedFile?.name,
      modifiedFileType: modifiedFile?.type,
      modifiedFileSize: modifiedFile?.size
    })

    if (!originalFile || !modifiedFile) {
      console.error('Missing files:', { hasOriginal: !!originalFile, hasModified: !!modifiedFile })
      return NextResponse.json(
        { error: 'Both original and modified files are required' },
        { status: 400 }
      )
    }

    if (originalFile.type !== 'application/pdf' || modifiedFile.type !== 'application/pdf') {
      console.error('Invalid file types:', {
        originalType: originalFile.type,
        modifiedType: modifiedFile.type
      })
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Convert File objects to ArrayBuffer
    const originalBuffer = await originalFile.arrayBuffer()
    const modifiedBuffer = await modifiedFile.arrayBuffer()

    if (acceptsSSE) {
      console.log('Creating SSE response...')
      const eventStream = createEventStream()

      // Start comparison in the background
      const comparePromise = (async () => {
        try {
          console.log('Starting PDF comparison...')
          // Compare the PDFs with progress updates
          const differences = await comparePDFs(
            new File([originalBuffer], originalFile.name, { type: 'application/pdf' }),
            new File([modifiedBuffer], modifiedFile.name, { type: 'application/pdf' }),
            async (progress) => {
              console.log('Comparison progress:', progress)
              await eventStream.write('progress', { phase: 'comparing', progress })
            }
          )

          console.log('Comparison complete, generating report...')
          // Generate the comparison report
          await eventStream.write('progress', { phase: 'generating', progress: 0 })
          const reportBytes = await generateComparisonReport(
            new File([originalBuffer], originalFile.name, { type: 'application/pdf' }),
            new File([modifiedBuffer], modifiedFile.name, { type: 'application/pdf' }),
            differences
          )
          await eventStream.write('progress', { phase: 'generating', progress: 100 })

          console.log('Sending complete event...')
          // Send the final result
          await eventStream.write('complete', { reportBytes: Array.from(reportBytes) })
          await eventStream.close()
        } catch (error) {
          console.error('Comparison error:', error)
          await eventStream.write('error', { 
            message: error instanceof Error ? error.message : 'Failed to compare PDFs'
          })
          await eventStream.close()
        }
      })()

      // Return the event stream
      console.log('Returning SSE response...')
      return new NextResponse(eventStream.stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      console.log('Using regular response...')
      // Fallback to regular request-response for clients that don't support SSE
      const differences = await comparePDFs(
        new File([originalBuffer], originalFile.name, { type: 'application/pdf' }),
        new File([modifiedBuffer], modifiedFile.name, { type: 'application/pdf' })
      )
      const reportBytes = await generateComparisonReport(
        new File([originalBuffer], originalFile.name, { type: 'application/pdf' }),
        new File([modifiedBuffer], modifiedFile.name, { type: 'application/pdf' }),
        differences
      )

      return new NextResponse(reportBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="comparison_report.pdf"',
        },
      })
    }
  } catch (error) {
    console.error('PDF comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to compare PDFs' },
      { status: 500 }
    )
  }
} 