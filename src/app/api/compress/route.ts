import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const quality = Number(formData.get('quality')) || 80
    const format = (formData.get('format') as string) || 'jpeg'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let sharpInstance = sharp(buffer)

    // Get original image info
    const metadata = await sharpInstance.metadata()
    const originalSize = buffer.length

    // Process the image based on format
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality })
        break
      case 'png':
        sharpInstance = sharpInstance.png({ quality })
        break
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality })
        break
      case 'tiff':
        sharpInstance = sharpInstance.tiff({
          quality,
          compression: 'jpeg',
          predictor: 'horizontal'
        })
        break
      default:
        sharpInstance = sharpInstance.jpeg({ quality })
    }

    const compressedBuffer = await sharpInstance.toBuffer()
    const compressedSize = compressedBuffer.length

    // Calculate compression stats
    const savedBytes = originalSize - compressedSize
    const compressionRatio = ((savedBytes / originalSize) * 100).toFixed(1)

    return new NextResponse(compressedBuffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': compressionRatio.toString(),
        'X-Image-Width': (metadata.width || 0).toString(),
        'X-Image-Height': (metadata.height || 0).toString(),
      },
    })
  } catch (error) {
    console.error('Image compression error:', error)
    return NextResponse.json(
      { error: 'Failed to compress image' },
      { status: 500 }
    )
  }
} 