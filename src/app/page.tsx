import Link from 'next/link'
import { FileText, Languages, GitCompare } from 'lucide-react'

const tools = [
  {
    title: 'Document Translation',
    description: 'Translate documents in various formats across 30+ languages',
    icon: Languages,
    href: '/tools/translation',
  },
  {
    title: 'PDF Comparison',
    description: 'Visually compare two PDF documents and highlight differences',
    icon: GitCompare,
    href: '/tools/comparison',
  },
]

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Document Tools Hub</h1>
        <p className="mt-2 text-gray-600">
          A comprehensive web application for document processing and translation tasks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="group block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <tool.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                  {tool.title}
                </h2>
                <p className="mt-1 text-gray-600">{tool.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
