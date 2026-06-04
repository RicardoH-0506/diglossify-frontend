import { Suspense, lazy, useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import './App.css'

// Lazy loading del contenedor de traducción para mejor rendimiento
const TranslationContainer = lazy(() => import('./features/translation/TranslationContainer').then(mod => ({
  default: mod.TranslationContainer
})))

function App () {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className='flex-1 flex flex-col w-full'>
      <header className='w-full flex items-center justify-between border-b border-border/10 pb-4 mb-6'>
        <div className='flex items-center gap-1.5'>
          <span className='font-sans font-semibold text-lg tracking-tight text-foreground/95'>
            Diglossify
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className='p-2 rounded-xl hover:bg-muted/40 border border-border/20 text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-200 cursor-pointer'
          aria-label='Toggle theme'
        >
          {theme === 'light'
            ? (
              <Moon className='size-4' />
              )
            : (
              <Sun className='size-4' />
              )}
        </button>
      </header>

      <div className='flex-1 flex flex-col justify-center'>
        <Suspense fallback={
          <div className='flex items-center justify-center min-h-[300px]'>
            <div className='animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary' role='status'>
              <span className='sr-only'>Loading...</span>
            </div>
          </div>
        }
        >
          <TranslationContainer />
        </Suspense>
      </div>
    </div>
  )
}

export default App
