'use client'

import { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface LanguageSelectorProps {
  isCollapsed?: boolean
  isLoginPage?: boolean
}

export default function LanguageSelector({ isCollapsed = false, isLoginPage = false }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'ko' as const, name: '한국어', flag: '🇰🇷' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  // 로그인 페이지용 심플한 토글
  if (isLoginPage) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-white/80 backdrop-blur-sm rounded-full border border-white/30 shadow-sm hover:shadow-md transition-all duration-200"
          title={`Switch to ${language === 'ko' ? 'English' : '한국어'}`}
        >
          <span className="text-base">{currentLanguage?.flag}</span>
          <span className="font-medium">{language === 'ko' ? 'KR' : 'US'}</span>
        </button>
      </div>
    )
  }

  if (isCollapsed) {
    // 접힌 상태: 국기만 보여주고 토글 방식으로 동작
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
          className="w-10 h-10 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
          title={currentLanguage?.name}
        >
          {currentLanguage?.flag}
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage?.flag}</span>
        <span>{currentLanguage?.name}</span>
        <ChevronDown className="w-3 h-3 ml-auto" />
      </button>

      {isOpen && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 드롭다운 메뉴 */}
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}