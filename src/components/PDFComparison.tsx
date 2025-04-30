import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiCheck, FiLoader } from 'react-icons/fi';
import { MdCompareArrows } from 'react-icons/md';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFComparisonProps {
  originalFile: File;
  modifiedFile: File;
  onComparisonComplete?: (pageCount: number) => void;
}

interface TextDifference {
  pageNumber: number;
  text: string;
  type: 'addition' | 'deletion' | 'unchanged';
}

interface PageContent {
  pageNumber: number;
  lines: TextDifference[];
}

const PDFComparison: React.FC<PDFComparisonProps> = ({ originalFile, modifiedFile, onComparisonComplete }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [modifiedFileUrl, setModifiedFileUrl] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTextLayerReady, setIsTextLayerReady] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<{
    original: number;
    modified: number;
  }>({ original: 0, modified: 0 });
  const [pageContents, setPageContents] = useState<{
    original: PageContent[];
    modified: PageContent[];
  }>({ original: [], modified: [] });
  const [textLayerStatus, setTextLayerStatus] = useState<{
    original: boolean;
    modified: boolean;
  }>({ original: false, modified: false });
  const [documentStatus, setDocumentStatus] = useState<{
    original: boolean;
    modified: boolean;
  }>({ original: false, modified: false });

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo('Component mounted');
    addDebugInfo(`Original file: ${originalFile?.name} (${originalFile?.type}, ${originalFile?.size} bytes)`);
    addDebugInfo(`Modified file: ${modifiedFile?.name} (${modifiedFile?.type}, ${modifiedFile?.size} bytes)`);
    addDebugInfo(`PDF.js worker source: ${pdfjs.GlobalWorkerOptions.workerSrc}`);

    // Create object URLs
    const originalUrl = URL.createObjectURL(originalFile);
    const modifiedUrl = URL.createObjectURL(modifiedFile);
    setOriginalFileUrl(originalUrl);
    setModifiedFileUrl(modifiedUrl);
    addDebugInfo(`Created object URLs: ${originalUrl}, ${modifiedUrl}`);

    return () => {
      // Cleanup object URLs when component unmounts
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (modifiedUrl) URL.revokeObjectURL(modifiedUrl);
      addDebugInfo('Component unmounted, object URLs revoked');
    };
  }, [originalFile, modifiedFile]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }, type: 'original' | 'modified') => {
    addDebugInfo(`${type === 'original' ? 'Original' : 'Modified'} document loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setError(null);
    
    setDocumentStatus(prev => {
      const newStatus = {
        ...prev,
        [type]: true
      };
      
      // Log the updated document status
      addDebugInfo(`Document status - Original: ${newStatus.original}, Modified: ${newStatus.modified}`);
      
      if (newStatus.original && newStatus.modified) {
        setIsLoading(false);
        addDebugInfo('Both documents loaded, setting isLoading to false');
      }
      
      return newStatus;
    });
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    addDebugInfo(`Document load error: ${error.message}`);
    addDebugInfo(`Error stack: ${error.stack}`);
    setError(`Failed to load PDF file. Please try again. Error: ${error.message}`);
  };

  const onPageLoadSuccess = () => {
    addDebugInfo(`Page ${currentPage} loaded successfully`);
    
    // Add a small delay to ensure text layers are rendered
    setTimeout(() => {
      const originalTextLayer = document.querySelector('.react-pdf__Page__textContent');
      const modifiedTextLayer = document.querySelectorAll('.react-pdf__Page__textContent')[1];

      if (originalTextLayer) {
        onTextLayerLoadSuccess('original');
      }
      if (modifiedTextLayer) {
        onTextLayerLoadSuccess('modified');
      }
    }, 1000); // Give it a second to render the text layers
  };

  const onPageLoadError = (error: Error) => {
    console.error('Error loading page:', error);
    addDebugInfo(`Page load error: ${error.message}`);
    addDebugInfo(`Error stack: ${error.stack}`);
  };

  const onTextLayerLoadSuccess = (type: 'original' | 'modified') => {
    addDebugInfo(`${type} text layer loaded successfully`);
    
    setTextLayerStatus(prev => {
      const newStatus = {
        ...prev,
        [type]: true
      };
      
      // Log the updated text layer status
      addDebugInfo(`Text layer status - Original: ${newStatus.original}, Modified: ${newStatus.modified}`);
      
      if (newStatus.original && newStatus.modified) {
        setIsTextLayerReady(true);
        addDebugInfo('Both text layers ready, setting isTextLayerReady to true');
      }
      
      return newStatus;
    });
  };

  const onTextLayerLoadError = (type: 'original' | 'modified', error: Error) => {
    console.error(`${type} text layer load error:`, error);
    addDebugInfo(`${type} text layer load error: ${error.message}`);
  };

  const onDocumentLoadProgress = (progress: { loaded: number; total: number }, type: 'original' | 'modified') => {
    const percentage = Math.round((progress.loaded / progress.total) * 100);
    setLoadingProgress(prev => ({
      ...prev,
      [type]: percentage
    }));
    addDebugInfo(`${type === 'original' ? 'Original' : 'Modified'} document loading: ${percentage}%`);
  };

  const compareDocuments = async () => {
    if (!isReadyToCompare) {
      setError('Documents are not ready for comparison. Please wait for the text layers to load.');
      return;
    }

    setIsComparing(true);
    setError(null);
    addDebugInfo('Starting document comparison...');

    try {
      const originalPdf = await pdfjs.getDocument(originalFileUrl!).promise;
      const modifiedPdf = await pdfjs.getDocument(modifiedFileUrl!).promise;

      // Call onComparisonComplete with the page count
      onComparisonComplete?.(numPages);

      const originalContents: PageContent[] = [];
      const modifiedContents: PageContent[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        addDebugInfo(`Processing page ${pageNum}...`);
        
        try {
          const [originalPage, modifiedPage] = await Promise.all([
            originalPdf.getPage(pageNum),
            modifiedPdf.getPage(pageNum)
          ]);

          const [originalContent, modifiedContent] = await Promise.all([
            originalPage.getTextContent(),
            modifiedPage.getTextContent()
          ]);

          // Process text content into lines
          const processTextContent = (content: any) => {
            const items = content.items as { str: string; transform: number[] }[];
            const lines: { text: string; y: number }[] = [];
            let currentLine = { text: '', y: 0 };

            items.forEach((item) => {
              const y = Math.round(item.transform[5]);
              if (currentLine.y === 0) {
                currentLine.y = y;
              }

              if (Math.abs(y - currentLine.y) > 5) {
                if (currentLine.text.trim()) {
                  lines.push({ ...currentLine });
                }
                currentLine = { text: item.str, y };
              } else {
                currentLine.text += (currentLine.text && item.str ? ' ' : '') + item.str;
              }
            });

            if (currentLine.text.trim()) {
              lines.push(currentLine);
            }

            return lines.map(line => line.text.trim()).filter(Boolean);
          };

          const originalLines = processTextContent(originalContent);
          const modifiedLines = processTextContent(modifiedContent);

          // Compare lines and create differences
          const maxLines = Math.max(originalLines.length, modifiedLines.length);
          const originalPageContent: PageContent = { pageNumber: pageNum, lines: [] };
          const modifiedPageContent: PageContent = { pageNumber: pageNum, lines: [] };

          for (let i = 0; i < maxLines; i++) {
            const originalLine = originalLines[i] || '';
            const modifiedLine = modifiedLines[i] || '';

            if (originalLine === modifiedLine) {
              originalPageContent.lines.push({ pageNumber: pageNum, text: originalLine, type: 'unchanged' });
              modifiedPageContent.lines.push({ pageNumber: pageNum, text: modifiedLine, type: 'unchanged' });
            } else {
              originalPageContent.lines.push({ pageNumber: pageNum, text: originalLine, type: 'deletion' });
              modifiedPageContent.lines.push({ pageNumber: pageNum, text: modifiedLine, type: 'addition' });
            }
          }

          originalContents.push(originalPageContent);
          modifiedContents.push(modifiedPageContent);

          // Update contents after each page
          setPageContents({
            original: [...originalContents],
            modified: [...modifiedContents]
          });
          
          addDebugInfo(`Completed processing page ${pageNum}`);
        } catch (error) {
          console.error(`Error processing page ${pageNum}:`, error);
          addDebugInfo(`Error processing page ${pageNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      }

      addDebugInfo('Comparison complete');
    } catch (error) {
      console.error('Error comparing documents:', error);
      addDebugInfo(`Comparison error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setError('Failed to compare documents. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  const renderPageContent = (content: PageContent) => {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-sm font-mono">
        {content.lines.map((line, index) => (
          <div
            key={`${content.pageNumber}-${index}`}
            className={`py-1 ${
              line.type === 'addition' ? 'bg-green-100 text-green-800' :
              line.type === 'deletion' ? 'bg-red-100 text-red-800' :
              ''
            }`}
          >
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>
    );
  };

  const Legend = () => (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-10 border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-3">Changes Legend</h3>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
          <span className="text-sm text-gray-600">Deleted text</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
          <span className="text-sm text-gray-600">Added text</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30"></div>
          <span className="text-sm text-gray-600">Modified text</span>
        </div>
      </div>
    </div>
  );

  const isReadyToCompare = !isLoading && 
    documentStatus.original && 
    documentStatus.modified && 
    textLayerStatus.original && 
    textLayerStatus.modified;

  useEffect(() => {
    const ready = !isLoading && 
      documentStatus.original && 
      documentStatus.modified && 
      textLayerStatus.original && 
      textLayerStatus.modified;

    addDebugInfo(`Ready state check:
      - isLoading: ${isLoading}
      - documentStatus.original: ${documentStatus.original}
      - documentStatus.modified: ${documentStatus.modified}
      - textLayerStatus.original: ${textLayerStatus.original}
      - textLayerStatus.modified: ${textLayerStatus.modified}
      - isReadyToCompare: ${ready}`);
  }, [isLoading, documentStatus, textLayerStatus]);

  // Add an effect to check text layers periodically
  useEffect(() => {
    if (!isLoading && documentStatus.original && documentStatus.modified && !isTextLayerReady) {
      const checkTextLayers = () => {
        const originalTextLayer = document.querySelector('.react-pdf__Page__textContent');
        const modifiedTextLayer = document.querySelectorAll('.react-pdf__Page__textContent')[1];

        if (originalTextLayer && !textLayerStatus.original) {
          onTextLayerLoadSuccess('original');
        }
        if (modifiedTextLayer && !textLayerStatus.modified) {
          onTextLayerLoadSuccess('modified');
        }
      };

      // Check immediately and then every second
      checkTextLayers();
      const interval = setInterval(checkTextLayers, 1000);

      return () => clearInterval(interval);
    }
  }, [isLoading, documentStatus, textLayerStatus, isTextLayerReady]);

  if (!originalFileUrl || !modifiedFileUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin text-blue-500 mr-2">
          <FiLoader className="w-6 h-6" />
        </div>
        <span className="text-gray-600">Loading PDFs...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#131618]">
      <div className="flex justify-between p-4 bg-[#242a2f] backdrop-blur-sm border-b border-[#3f4d57]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScale(scale * 1.2)}
            className="flex items-center gap-2 px-4 py-2 bg-[#353f48] text-[#e3ebf2] rounded-lg shadow-sm hover:bg-[#242a2f]/80 transition-all border border-[#596e7e]"
          >
            <FiZoomIn className="w-4 h-4" />
            <span>Zoom In</span>
          </button>
          <button
            onClick={() => setScale(scale / 1.2)}
            className="flex items-center gap-2 px-4 py-2 bg-[#353f48] text-[#e3ebf2] rounded-lg shadow-sm hover:bg-[#242a2f]/80 transition-all border border-[#596e7e]"
          >
            <FiZoomOut className="w-4 h-4" />
            <span>Zoom Out</span>
          </button>
          <button
            onClick={compareDocuments}
            disabled={!isReadyToCompare || isComparing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all ${
              isReadyToCompare 
                ? 'bg-[#353f48] text-[#e3ebf2] hover:bg-[#242a2f]/80 border border-[#596e7e]' 
                : 'bg-[#242a2f] text-[#6d879b] cursor-not-allowed border border-[#3f4d57]'
            }`}
          >
            {isComparing ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                <span>Comparing...</span>
              </>
            ) : (
              <>
                <MdCompareArrows className="w-4 h-4" />
                <span>Compare Documents</span>
              </>
            )}
            {!isReadyToCompare && (
              <span className="block text-xs mt-1 text-[#6d879b]">
                {!documentStatus.original || !documentStatus.modified ? 'Loading documents...' :
                 !textLayerStatus.original || !textLayerStatus.modified ? 'Waiting for text layers...' :
                 'Getting ready...'}
              </span>
            )}
          </button>
          {isReadyToCompare && !isComparing && (
            <div className="flex items-center gap-2 text-emerald-300 bg-[#242a2f] px-3 py-1.5 rounded-full border border-[#3f4d57]">
              <FiCheck className="w-4 h-4" />
              <span className="text-sm font-medium">Ready to Compare</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex items-center gap-2 px-4 py-2 bg-[#353f48] text-[#e3ebf2] rounded-lg shadow-sm hover:bg-[#242a2f]/80 transition-all border border-[#596e7e] disabled:bg-[#242a2f] disabled:text-[#6d879b] disabled:cursor-not-allowed disabled:border-[#3f4d57]"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="text-lg font-medium text-[#e3ebf2]">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="flex items-center gap-2 px-4 py-2 bg-[#353f48] text-[#e3ebf2] rounded-lg shadow-sm hover:bg-[#242a2f]/80 transition-all border border-[#596e7e] disabled:bg-[#242a2f] disabled:text-[#6d879b] disabled:cursor-not-allowed disabled:border-[#3f4d57]"
          >
            <span>Next</span>
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border-l-4 border-red-500 text-red-300 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <div className="absolute top-4 right-4 bg-[#242a2f]/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-10 border border-[#3f4d57]">
          <h3 className="font-semibold text-[#e3ebf2] mb-3">Changes Legend</h3>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
              <span className="text-sm text-[#cad9e6]">Deleted text</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
              <span className="text-sm text-[#cad9e6]">Added text</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30"></div>
              <span className="text-sm text-[#cad9e6]">Modified text</span>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full overflow-auto p-4">
          <div className="space-y-4">
            <div className="bg-[#242a2f] rounded-lg shadow-sm p-4 mb-4 border border-[#3f4d57]">
              <Document
                file={originalFileUrl}
                onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, 'original')}
                onLoadError={onDocumentLoadError}
                onLoadProgress={(progress) => onDocumentLoadProgress(progress, 'original')}
                loading={
                  <div className="flex items-center justify-center p-4">
                    <FiLoader className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="ml-2 text-[#cad9e6]">Loading original PDF...</span>
                  </div>
                }
                error="Failed to load PDF file"
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="flex items-center justify-center p-4">
                      <FiLoader className="w-6 h-6 animate-spin text-blue-400" />
                      <span className="ml-2 text-[#cad9e6]">Loading page...</span>
                    </div>
                  }
                  error="Failed to load page"
                  onLoadSuccess={onPageLoadSuccess}
                  onLoadError={onPageLoadError}
                  className="mb-4"
                />
              </Document>
            </div>
            {pageContents.original[currentPage - 1] && (
              <div className="sticky top-0 bg-[#242a2f] rounded-lg shadow-sm p-4 border border-[#3f4d57]">
                <h3 className="font-semibold text-[#e3ebf2] mb-3">Original Text</h3>
                {renderPageContent(pageContents.original[currentPage - 1])}
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 h-full overflow-auto p-4">
          <div className="space-y-4">
            <div className="bg-[#242a2f] rounded-lg shadow-sm p-4 mb-4 border border-[#3f4d57]">
              <Document
                file={modifiedFileUrl}
                onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, 'modified')}
                onLoadError={onDocumentLoadError}
                onLoadProgress={(progress) => onDocumentLoadProgress(progress, 'modified')}
                loading={
                  <div className="flex items-center justify-center p-4">
                    <FiLoader className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="ml-2 text-[#cad9e6]">Loading modified PDF...</span>
                  </div>
                }
                error="Failed to load PDF file"
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="flex items-center justify-center p-4">
                      <FiLoader className="w-6 h-6 animate-spin text-emerald-400" />
                      <span className="ml-2 text-[#cad9e6]">Loading page...</span>
                    </div>
                  }
                  error="Failed to load page"
                  onLoadSuccess={onPageLoadSuccess}
                  onLoadError={onPageLoadError}
                  className="mb-4"
                />
              </Document>
            </div>
            {pageContents.modified[currentPage - 1] && (
              <div className="sticky top-0 bg-[#242a2f] rounded-lg shadow-sm p-4 border border-[#3f4d57]">
                <h3 className="font-semibold text-[#e3ebf2] mb-3">Modified Text</h3>
                {renderPageContent(pageContents.modified[currentPage - 1])}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug information panel */}
      <div className="p-4 bg-[#242a2f] backdrop-blur-sm text-[#cad9e6] text-sm overflow-auto max-h-48 border-t border-[#3f4d57]">
        <div className="mb-2">
          <h3 className="font-semibold">Debug Information</h3>
        </div>
        <pre className="whitespace-pre-wrap font-mono text-xs opacity-80">
          {debugInfo.join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default PDFComparison; 