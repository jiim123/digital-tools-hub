import { PDFDocument } from 'pdf-lib'
import { StandardFonts } from 'pdf-lib'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// Types for PDF.js
interface TextItem {
  str: string
  transform: number[]
  width?: number
  height?: number
}

interface TextContent {
  items: TextItem[]
}

interface PDFPageProxy {
  getTextContent(): Promise<TextContent>
  view: number[]
}

export interface PDFDifference {
  page: number
  type: 'addition' | 'deletion' | 'modification'
  content: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

// Initialize PDF.js lazily
async function initPDFJS() {
  if (typeof window === 'undefined') {
    // Server-side
    const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist')
    GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`
    return { getDocument }
  } else {
    // Client-side
    const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist')
    GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js?v=${version}`
    return { getDocument }
  }
}

export async function comparePDFs(
  originalFile: File,
  modifiedFile: File,
  onProgress?: (progress: number) => void
): Promise<PDFDifference[]> {
  const differences: PDFDifference[] = []

  try {
    const { getDocument } = await initPDFJS()
    
    // Load both PDFs
    const originalPdf = await getDocument(await originalFile.arrayBuffer()).promise
    const modifiedPdf = await getDocument(await modifiedFile.arrayBuffer()).promise

    // Get the number of pages
    const originalPageCount = originalPdf.numPages
    const modifiedPageCount = modifiedPdf.numPages
    const totalPages = Math.max(originalPageCount, modifiedPageCount)

    // Compare each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      // Report progress (0-100)
      if (onProgress) {
        const progress = Math.round((pageNum / totalPages) * 100)
        onProgress(progress)
      }

      if (pageNum > originalPageCount) {
        // Page was added
        const addedPage = await modifiedPdf.getPage(pageNum)
        const textContent = await addedPage.getTextContent()
        differences.push({
          page: pageNum,
          type: 'addition',
          content: textContent.items.map((item: any) => item.str).join(' '),
          position: {
            x: 0,
            y: 0,
            width: addedPage.view[2],
            height: addedPage.view[3],
          },
        })
        continue
      }

      if (pageNum > modifiedPageCount) {
        // Page was deleted
        const deletedPage = await originalPdf.getPage(pageNum)
        const textContent = await deletedPage.getTextContent()
        differences.push({
          page: pageNum,
          type: 'deletion',
          content: textContent.items.map((item: any) => item.str).join(' '),
          position: {
            x: 0,
            y: 0,
            width: deletedPage.view[2],
            height: deletedPage.view[3],
          },
        })
        continue
      }

      // Compare text content of both pages
      const originalPage = await originalPdf.getPage(pageNum)
      const modifiedPage = await modifiedPdf.getPage(pageNum)
      const originalText = await originalPage.getTextContent()
      const modifiedText = await modifiedPage.getTextContent()

      // Compare text items
      const originalItems = originalText.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height,
      }))

      const modifiedItems = modifiedText.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height,
      }))

      // Find differences
      for (let i = 0; i < Math.max(originalItems.length, modifiedItems.length); i++) {
        const originalItem = originalItems[i]
        const modifiedItem = modifiedItems[i]

        if (!originalItem && modifiedItem) {
          // Text was added
          differences.push({
            page: pageNum,
            type: 'addition',
            content: modifiedItem.text,
            position: {
              x: modifiedItem.x,
              y: modifiedItem.y,
              width: modifiedItem.width,
              height: modifiedItem.height,
            },
          })
        } else if (originalItem && !modifiedItem) {
          // Text was deleted
          differences.push({
            page: pageNum,
            type: 'deletion',
            content: originalItem.text,
            position: {
              x: originalItem.x,
              y: originalItem.y,
              width: originalItem.width,
              height: originalItem.height,
            },
          })
        } else if (originalItem && modifiedItem && originalItem.text !== modifiedItem.text) {
          // Text was modified
          differences.push({
            page: pageNum,
            type: 'modification',
            content: `"${originalItem.text}" → "${modifiedItem.text}"`,
            position: {
              x: modifiedItem.x,
              y: modifiedItem.y,
              width: modifiedItem.width,
              height: modifiedItem.height,
            },
          })
        }
      }
    }

    return differences
  } catch (error) {
    console.error('PDF comparison error:', error)
    throw new Error('Failed to compare PDFs')
  }
}

export async function generateComparisonReport(
  originalFile: File,
  modifiedFile: File,
  differences: PDFDifference[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 12
  const lineHeight = 18
  const margin = 50
  const maxWidth = 500
  const maxHeight = 800

  // Add title page
  const titlePage = pdfDoc.addPage([595, 842])
  titlePage.drawText('PDF Comparison Report', {
    x: margin,
    y: 800 - margin,
    size: 24,
    font,
  })

  titlePage.drawText(`Original File: ${originalFile.name}`, {
    x: margin,
    y: 750 - margin,
    size: fontSize,
    font,
  })

  titlePage.drawText(`Modified File: ${modifiedFile.name}`, {
    x: margin,
    y: 720 - margin,
    size: fontSize,
    font,
  })

  // Group differences by page
  const differencesByPage = differences.reduce((acc, diff) => {
    if (!acc[diff.page]) {
      acc[diff.page] = []
    }
    acc[diff.page].push(diff)
    return acc
  }, {} as Record<number, PDFDifference[]>)

  // Add content pages
  for (const [pageNum, pageDifferences] of Object.entries(differencesByPage)) {
    let contentPage = pdfDoc.addPage([595, 842])
    let y = 800 - margin

    contentPage.drawText(`Page ${pageNum} Differences:`, {
      x: margin,
      y,
      size: 16,
      font,
    })
    y -= lineHeight * 2

    for (const diff of pageDifferences) {
      const typeText = diff.type.charAt(0).toUpperCase() + diff.type.slice(1)
      contentPage.drawText(`${typeText}:`, {
        x: margin,
        y,
        size: fontSize,
        font,
      })
      y -= lineHeight

      const lines = diff.content.split('\n')
      for (const line of lines) {
        if (y < margin) {
          const newPage = pdfDoc.addPage([595, 842])
          y = 800 - margin
          contentPage = newPage
        }
        contentPage.drawText(line, {
          x: margin + 20,
          y,
          size: fontSize,
          font,
        })
        y -= lineHeight
      }
      y -= lineHeight
    }
  }

  return await pdfDoc.save()
}

export async function countPDFCharacters(file: File): Promise<number> {
  try {
    const { getDocument } = await initPDFJS()
    const pdfData = await file.arrayBuffer()
    const pdf = await getDocument(pdfData).promise
    let totalCharacters = 0

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join('')
      totalCharacters += pageText.length
    }

    return totalCharacters
  } catch (error) {
    console.error('Error counting PDF characters:', error)
    throw new Error('Failed to analyze PDF file')
  }
} 