'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Languages, GitCompare, Menu, ChevronLeft, FileType, LucideIcon, FileText } from 'lucide-react'
import { FiImage } from 'react-icons/fi'
import { useState, useEffect } from 'react'

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon | typeof FiImage;
  stats?: {
    totalTranslations?: string;
    languages?: string;
    accuracy?: string;
    comparisons?: string;
    avgTime?: string;
    imagesCompressed?: string;
    spaceSaved?: string;
    avgReduction?: string;
    summaries?: string;
  };
  disabled?: boolean;
}

interface NavigationSection {
  category: string;
  items: NavigationItem[];
}

const navigation: NavigationSection[] = [
  {
    category: 'Document Tools',
    items: [
      {
        name: 'Document Translation',
        href: '/tools/translation',
        icon: Languages,
        stats: {
          totalTranslations: '1.2k',
          languages: '30+',
          accuracy: '98%'
        }
      },
      {
        name: 'PDF Comparison',
        href: '/tools/comparison',
        icon: GitCompare,
        stats: {
          comparisons: '850',
          avgTime: '45s',
          accuracy: '99%'
        }
      },
      {
        name: 'AI Summary',
        href: '/tools/summary',
        icon: FileText,
        disabled: true,
        stats: {
          summaries: 'Coming Soon',
          avgTime: 'TBD',
          accuracy: 'TBD'
        }
      }
    ],
  },
  {
    category: 'Image Tools',
    items: [
      {
        name: 'Image Compression',
        href: '/tools/compression',
        icon: FiImage,
        stats: {
          imagesCompressed: '2.5k',
          spaceSaved: '1.2GB',
          avgReduction: '65%'
        }
      },
    ],
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('navigationCollapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Save collapsed state to localStorage and update data attribute
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('navigationCollapsed', JSON.stringify(newState))
    document.documentElement.dataset.navCollapsed = newState.toString()
  }

  // Set initial data attribute
  useEffect(() => {
    document.documentElement.dataset.navCollapsed = isCollapsed.toString()
  }, [isCollapsed])

  return (
    <>
      {/* Desktop Navigation */}
      <nav 
        className={`hidden lg:block fixed left-0 top-0 h-full bg-[#242a2f] border-r border-[#3f4d57] transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#3f4d57]">
          {!isCollapsed && (
            <Link href="/" className="text-xl font-normal text-[#e3ebf2] truncate">
              Digital Tools <span className="font-serif italic">Hub</span>
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg bg-[#353f48] text-[#cad9e6] hover:bg-[#3f4d57] transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="mt-4 flex-1">
          {navigation.map((section) => (
            <div key={section.category} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-[#6d879b] uppercase tracking-wider">
                  {section.category}
                </h3>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#353f48] text-[#e3ebf2]'
                        : item.disabled
                        ? 'text-[#6d879b] cursor-not-allowed opacity-50'
                        : 'text-[#cad9e6] hover:bg-[#353f48]/50'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && (
                      <>
                        <span>{item.name}</span>
                        {item.disabled && (
                          <span className="ml-2 text-xs text-[#6d879b]">(Coming Soon)</span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
        {!isCollapsed && (
          <div className="p-4 text-center border-t border-[#3f4d57]">
            <p className="text-xs text-[#6d879b]">
              Made with ❤️ by Jim Andersson
            </p>
          </div>
        )}
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#242a2f] border-t border-[#3f4d57]">
        <div className="flex justify-around">
          {navigation.flatMap(section => section.items)
            .filter(item => !item.disabled) // Filter out disabled items (AI Summary)
            .map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center p-3 transition-colors ${
                    isActive 
                      ? 'text-[#ffffff] bg-[#353f48]' 
                      : 'text-[#ffffff] hover:bg-[#353f48]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              )
            })}
        </div>
      </div>
    </>
  )
} 