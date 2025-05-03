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
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="w-full border-b border-[#3f4d57] bg-[#242a2f] rounded-t-xl">
          <div className="p-4 sm:p-6 flex items-center gap-3">
            <Languages className="w-5 h-5 sm:w-6 sm:h-6 text-[#cad9e6] shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#cad9e6] font-heading">
                Document Tools Hub
              </h1>
              <p className="text-xs sm:text-sm text-[#cad9e6] mt-1 font-sans">
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
      <ResponsiveWarning />
    </div>
  )
}

function ResponsiveWarning() {
  return (
    <div className="fixed inset-0 bottom-16 md:bottom-0 z-40 lg:hidden">
      <div className="min-h-screen bg-[#131618]/95 backdrop-blur-sm p-4 flex items-center justify-center">
        <div className="bg-[#242a2f] border border-[#3f4d57] rounded-xl p-6 max-w-md w-full shadow-xl">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#353f48] flex items-center justify-center">
              <FiMonitor className="w-8 h-8 text-[#e3ebf2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#e3ebf2] font-heading">
                Larger Screen Required
              </h2>
              <p className="mt-2 text-[#cad9e6] font-sans">
                The PDF Comparison tool works best on larger screens. Please use a desktop computer or tablet in landscape mode for the best experience.
              </p>
            </div>
            <div className="w-full h-px bg-[#3f4d57] my-2" />
            <p className="text-sm text-[#6d879b]">
              Recommended minimum screen width: 1024px
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
