import { Suspense, lazy } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'

// Lazy loading del contenedor de traducción para mejor rendimiento
const TranslationContainer = lazy(() => import('./features/translation/TranslationContainer').then(mod => ({
  default: mod.TranslationContainer
})))

function App () {
  return (
    <Suspense fallback={
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    }
    >
      <TranslationContainer />
    </Suspense>
  )
}

export default App
