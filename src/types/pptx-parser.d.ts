declare module 'pptx-parser' {
  interface Shape {
    text?: string
  }

  interface Slide {
    shapes: Shape[]
  }

  interface PPTXDocument {
    slides: Slide[]
  }

  function parse(buffer: ArrayBuffer): Promise<PPTXDocument>

  const pptxParser: {
    parse: typeof parse
  }

  export default pptxParser
} 