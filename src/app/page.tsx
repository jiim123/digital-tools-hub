import Link from 'next/link'
import { Languages, GitCompare } from 'lucide-react'
import { FiImage, FiMonitor } from 'react-icons/fi'
import Navigation from '@/components/Navigation'

const tools = [
  {
    title: 'Document Translation',
    description: 'Translate documents in various formats across 30+ languages',
    icon: Languages,
    href: '/tools/translation'
  },
  {
    title: 'PDF Comparison',
    description: 'Visually compare two PDF documents and highlight differences',
    icon: GitCompare,
    href: '/tools/comparison'
  },
  {
    title: 'Image Compression',
    description: 'Optimize images for digital use with customizable quality settings',
    icon: FiImage,
    href: '/tools/compression'
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#3e475c] bg-gradient-to-tr from-[#3e475c] via-[#1a1e21] to-[#1a1e21] bg-[length:200%_200%] bg-[position:0%_0%]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="w-full border-b border-[#3f4d57] rounded-t-xl">
          <div className="p-4 sm:p-6 flex items-center gap-6">
            <div>
              <h1 className="text-4xl sm:text-4xl font-semibold text-[#cad9e6] font-heading">
                <span className="block">Welcome to the Digital Tools Hub</span>
              </h1>
              <p className="text-sm sm:text-sm text-[#cad9e6] mt-2 font-mono">
                A comprehensive web application for document processing and translation tasks
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group bg-[#242a2f] border border-[#3f4d57] rounded-xl overflow-hidden hover:border-emerald-400 transition-all duration-300"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-3 bg-[#353f48] rounded-lg group-hover:bg-emerald-600/20 transition-colors">
                    <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#cad9e6] group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-[#cad9e6] font-heading group-hover:text-emerald-400 transition-colors">
                      {tool.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#cad9e6] mt-1 font-sans">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}