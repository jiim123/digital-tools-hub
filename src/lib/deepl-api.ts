import { supportedLanguages } from '@/lib/languages'

// Use the correct API endpoint based on the API key
const getApiUrl = (apiKey: string) => {
  return apiKey.endsWith(':fx') 
    ? 'https://api-free.deepl.com/v2'
    : 'https://api.deepl.com/v2'
}

export interface TranslationResult {
  success: boolean
  error?: string
  translatedFile?: {
    name: string
    content: ArrayBuffer
  }
}

export async function translateDocument(
  file: File,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string
): Promise<TranslationResult> {
  try {
    console.log('=== Starting DeepL translation ===')
    console.log('Translation parameters:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      sourceLanguage,
      targetLanguage,
      apiKeyLength: apiKey?.length || 0,
    })

    if (!apiKey) {
      console.error('Missing API key')
      return {
        success: false,
        error: 'DeepL API key is required',
      }
    }

    // Convert target language to lowercase for validation
    const targetLanguageLower = targetLanguage.toLowerCase()
    
    // Validate target language
    const validLanguage = supportedLanguages.find((lang) => lang.code === targetLanguageLower)
    if (!validLanguage) {
      console.error('Invalid target language:', {
        provided: targetLanguage,
        providedLower: targetLanguageLower,
        supported: supportedLanguages.map(l => l.code)
      })
      return {
        success: false,
        error: `Invalid target language: ${targetLanguage}. Supported languages: ${supportedLanguages.map(l => l.code).join(', ')}`,
      }
    }

    const apiUrl = getApiUrl(apiKey)
    console.log('Using DeepL API URL:', apiUrl)

    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('target_lang', targetLanguage.toUpperCase())
    if (sourceLanguage !== 'auto') {
      formData.append('source_lang', sourceLanguage.toUpperCase())
    }

    // Send request to DeepL
    console.log('Sending document to DeepL...')
    const response = await fetch(`${apiUrl}/document`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('DeepL API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        responseHeaders: Object.fromEntries(response.headers.entries())
      })
      
      if (response.status === 403) {
        return {
          success: false,
          error: 'Invalid or expired API key. Please check your DeepL API key configuration.',
        }
      }
      
      return {
        success: false,
        error: errorData.message || `Translation failed: ${response.statusText}`,
      }
    }

    // Get document ID from response
    const responseData = await response.json()
    console.log('DeepL initial response:', responseData)
    
    const { document_id, document_key } = responseData
    if (!document_id || !document_key) {
      console.error('Invalid DeepL response:', responseData)
      return {
        success: false,
        error: 'Invalid response from DeepL API: missing document ID or key',
      }
    }

    // Poll for translation status
    let status = 'queued'
    let attempts = 0
    const maxAttempts = 120 // 10 minutes maximum (5 seconds * 120)

    console.log('Starting translation status polling...')
    while ((status === 'translating' || status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      console.log(`Checking translation status (attempt ${attempts})...`)
      const statusResponse = await fetch(
        `${apiUrl}/document/${document_id}?document_key=${document_key}`,
        {
          headers: {
            Authorization: `DeepL-Auth-Key ${apiKey}`,
          },
        }
      )

      if (!statusResponse.ok) {
        console.error('Status check failed:', {
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          headers: Object.fromEntries(statusResponse.headers.entries())
        })
        return {
          success: false,
          error: `Failed to check translation status: ${statusResponse.statusText}`,
        }
      }

      const statusData = await statusResponse.json()
      console.log('Translation status response:', statusData)
      status = statusData.status

      if (status === 'done') {
        console.log('Translation completed, downloading result...')
        // Download translated document
        const downloadResponse = await fetch(
          `${apiUrl}/document/${document_id}/result?document_key=${document_key}`,
          {
            headers: {
              Authorization: `DeepL-Auth-Key ${apiKey}`,
            },
          }
        )

        if (!downloadResponse.ok) {
          console.error('Download failed:', {
            status: downloadResponse.status,
            statusText: downloadResponse.statusText,
            headers: Object.fromEntries(downloadResponse.headers.entries())
          })
          return {
            success: false,
            error: `Failed to download translated document: ${downloadResponse.statusText}`,
          }
        }

        const translatedContent = await downloadResponse.arrayBuffer()
        console.log('Successfully downloaded translated content')
        return {
          success: true,
          translatedFile: {
            name: `translated_${file.name}`,
            content: translatedContent,
          },
        }
      }

      if (status === 'error') {
        console.error('Translation error from DeepL:', statusData)
        return {
          success: false,
          error: statusData.error || 'Translation failed',
        }
      }
    }

    console.error('Translation timed out after', attempts, 'attempts')
    return {
      success: false,
      error: 'Translation timed out',
    }
  } catch (error) {
    console.error('Translation error:', error)
    if (error instanceof Error) {
      console.error({
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
} 