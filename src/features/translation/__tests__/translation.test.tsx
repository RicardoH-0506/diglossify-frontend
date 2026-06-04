import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from 'vitest'
import { TranslationContainer } from '../TranslationContainer'

interface MockLanguageSelectorProps {
  type: 'from' | 'to'
  value: string
  onChange: (val: string) => void
}

// Mockear el componente local LanguageSelector para evitar problemas de anidamiento HTML en JSDOM
vi.mock('../components/LanguageSelector', () => {
  return {
    LanguageSelector: ({ type, value, onChange }: MockLanguageSelectorProps) => (
      <select
        data-testid={`select-${type}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {type === 'from' && <option value='auto'>Detect language</option>}
        <option value='es'>Spanish</option>
        <option value='en'>English</option>
        <option value='de'>German</option>
      </select>
    )
  }
})

describe('TranslationContainer', () => {
  let mockFetch: MockInstance<typeof globalThis.fetch>

  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch = vi.spyOn(globalThis, 'fetch')

    // Mock mediaDevices to prevent JSDOM errors
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        configurable: true,
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
          })
        }
      })
    }

    // Mock MediaRecorder using vi.stubGlobal (type-safe, auto-restored on vi.restoreAllMocks)
    const MockMediaRecorder = Object.assign(
      vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        state: 'inactive',
        ondataavailable: null,
        onstop: null,
      })),
      { isTypeSupported: vi.fn().mockReturnValue(true) }
    )
    vi.stubGlobal('MediaRecorder', MockMediaRecorder)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('debe renderizar el estado inicial correctamente', () => {
    render(<TranslationContainer />)

    // Verificar título
    expect(screen.getByText('What would you like to translate today?')).toBeInTheDocument()

    // Verificar selectores de idioma
    const sourceSelect = screen.getByTestId('select-from')
    const destSelect = screen.getByTestId('select-to')
    expect(sourceSelect).toHaveValue('auto')
    expect(destSelect).toHaveValue('en')

    // Verificar textareas
    const textareas = screen.getAllByRole('textbox')
    expect(textareas).toHaveLength(2)
    expect(textareas[0]).toHaveValue('')
    expect(textareas[0]).toHaveAttribute('placeholder', 'Type something to translate...')
    expect(textareas[1]).toHaveValue('')
    expect(textareas[1]).toBeDisabled()
    expect(textareas[1]).toHaveAttribute('placeholder', 'Translation')

    // Verificar botón de intercambio (debe estar deshabilitado porque origen es auto)
    const interchangeBtn = screen.getByLabelText('Swap languages')
    expect(interchangeBtn).toBeDisabled()
  })

  it('debe llamar a la API de traducción tras el debounce al escribir texto', async () => {
    // Mock de respuesta exitosa de la API
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translatedText: 'hello'
        }
      })
    } as Response)

    render(<TranslationContainer />)

    const textareas = screen.getAllByRole('textbox')
    const sourceTextarea = textareas[0]

    // Escribir en la entrada
    fireEvent.change(sourceTextarea, { target: { value: 'hola' } })

    // No debe llamarse a la API inmediatamente (debounce)
    expect(mockFetch).not.toHaveBeenCalled()

    // Avanzar el tiempo de forma asíncrona para procesar timers y microtasks (promesas)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    // Verificar que se llamó a la API con los parámetros correctos
    expect(mockFetch).toHaveBeenCalledTimes(1)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/translate'),
      expect.objectContaining({
        body: JSON.stringify({
          fromLang: 'auto',
          toLang: 'en',
          text: 'hola'
        })
      })
    )

    // Verificar que la traducción se muestra en el destino
    expect(textareas[1]).toHaveValue('hello')
  })

  it('debe habilitar e intercambiar los idiomas correctamente si no es automático', async () => {
    render(<TranslationContainer />)

    const sourceSelect = screen.getByTestId('select-from')
    const destSelect = screen.getByTestId('select-to')

    // Cambiar origen a español ('es')
    fireEvent.change(sourceSelect, { target: { value: 'es' } })
    expect(sourceSelect).toHaveValue('es')

    // Botón de intercambio debe estar habilitado
    const interchangeBtn = screen.getByLabelText('Swap languages')
    expect(interchangeBtn).not.toBeDisabled()

    // Intercambiar
    fireEvent.click(interchangeBtn)

    // Verificar que cambiaron
    expect(sourceSelect).toHaveValue('en')
    expect(destSelect).toHaveValue('es')
  })

  it('debe manejar errores de la API de traducción mostrando un mensaje de error', async () => {
    // Mock de respuesta de error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    } as Response)

    render(<TranslationContainer />)

    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: 'error text' } })

    // Avanzar debounce de forma asíncrona
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    // Verificar que se muestra el error
    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toHaveTextContent('HTTP error! status: 500')
  })

  it('debe limpiar el texto de traducción silenciosamente al borrar el texto origen sin mostrar error', async () => {
    // Primera traducción exitosa
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translatedText: 'hello'
        }
      })
    } as Response)

    render(<TranslationContainer />)

    const textareas = screen.getAllByRole('textbox')
    const sourceTextarea = textareas[0]

    // Escribir y traducir
    fireEvent.change(sourceTextarea, { target: { value: 'hola' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(textareas[1]).toHaveValue('hello')

    // Borrar el texto
    fireEvent.change(sourceTextarea, { target: { value: '' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    // Verificar que se vació y no hay banner de error
    expect(textareas[1]).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('debe mostrar un error de validación si los idiomas de origen y destino son iguales', async () => {
    render(<TranslationContainer />)

    const sourceSelect = screen.getByTestId('select-from')
    const destSelect = screen.getByTestId('select-to')

    // Cambiar origen a español
    fireEvent.change(sourceSelect, { target: { value: 'es' } })
    // Cambiar destino a español (ahora son iguales)
    fireEvent.change(destSelect, { target: { value: 'es' } })

    const textareas = screen.getAllByRole('textbox')
    // Escribir texto para gatillar la validación
    fireEvent.change(textareas[0], { target: { value: 'hola' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    // Verificar error de validación
    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toHaveTextContent('Source and target languages must be different')
  })
})
