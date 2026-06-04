import { useTranslation } from './hooks/useTranslation'
import { useStore } from './hooks/useStore'
import { LanguageSelector } from './components/LanguageSelector'
import { TextArea } from './components/TextArea'
import { ArrowsIcons } from './components/Icons'
import { AUTO_LANGUAGE } from './constants'
import { SectionTypeConst } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { Mic, Square } from 'lucide-react'
import { useCallback } from 'react'

export function TranslationContainer () {
  const {
    fromLang,
    toLang,
    fromText,
    result,
    interchangeLanguages,
    setFromLang,
    setToLang,
    setFromText,
    setResult
  } = useStore()

  const { translatedText, error, loading: translationLoading } = useTranslation({ fromLang, toLang, fromText })

  const handleAudioResult = useCallback((text: string, translatedText: string) => {
    setFromText(text)
    setResult(translatedText)
  }, [setFromText, setResult])

  const {
    isRecording,
    status,
    error: audioError,
    startRecording,
    stopRecording
  } = useAudioRecorder({ onResult: handleAudioResult })

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording(fromLang, toLang)
    }
  }

  const activeError = error || audioError
  const canInterchange = fromLang !== AUTO_LANGUAGE && fromLang !== toLang && !activeError

  return (
    <div className='w-full max-w-4xl mx-auto'>
      <Card className='border border-border/30 rounded-lg bg-card/60 shadow-sm overflow-hidden transition-all duration-300'>
        <CardHeader className='text-center pb-2 pt-6'>
          <CardTitle className='text-2xl md:text-3xl font-medium font-sans text-foreground/90 tracking-tight mt-2'>
            What would you like to translate today?
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6 p-6'>
          <div className='grid grid-cols-12 items-center gap-2'>
            <div className='col-span-5'>
              <LanguageSelector
                type={SectionTypeConst.FROM}
                value={fromLang}
                onChange={setFromLang}
              />
            </div>

            <div className='col-span-2 flex justify-center items-center'>
              <Button
                variant='ghost'
                size='icon'
                disabled={!canInterchange}
                onClick={interchangeLanguages}
                aria-label='Swap languages'
                className='h-9 w-9 rounded-lg border border-border/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-200 disabled:opacity-20 disabled:bg-transparent disabled:border-transparent disabled:text-muted-foreground cursor-pointer'
              >
                <ArrowsIcons />
              </Button>
            </div>

            <div className='col-span-5'>
              <LanguageSelector
                type={SectionTypeConst.TO}
                value={toLang}
                onChange={setToLang}
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='flex flex-col min-h-[245px] p-4 bg-transparent border border-border/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200 rounded-lg'>
              <div className='flex-1'>
                <TextArea
                  type={SectionTypeConst.FROM}
                  value={fromText}
                  onChange={setFromText}
                />
              </div>
              <div className='flex items-center justify-between pt-2 border-t border-border/10 mt-2 h-[38px]'>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={handleMicClick}
                    className={`p-2 rounded-full border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                      isRecording
                        ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse-record'
                        : 'bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Translate by voice'}
                    aria-label={isRecording ? 'Stop recording' : 'Translate by voice'}
                  >
                    {isRecording ? <Square className='size-3.5' /> : <Mic className='size-3.5' />}
                  </button>
                  {status !== 'idle' && status !== 'recording' && (
                    <span className='text-xs text-muted-foreground animate-pulse font-medium'>
                      {status === 'transcribing' && 'Transcribing audio...'}
                      {status === 'translating' && 'Translating speech...'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className='flex flex-col min-h-[245px] p-4 bg-transparent border border-border/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200 rounded-lg'>
              <div className='flex-1'>
                <TextArea
                  loading={translationLoading || status === 'transcribing' || status === 'translating'}
                  type={SectionTypeConst.TO}
                  value={translatedText || result}
                  onChange={setResult}
                  valueFromLang={fromLang}
                  valueToLang={toLang}
                />
              </div>
              <div className='h-[38px] border-t border-transparent pt-2 mt-2 flex items-center justify-end'>
                {/* Visual alignment spacer */}
              </div>
            </div>
          </div>

          {activeError && (
            <div className='bg-red-500/5 text-red-500 text-sm p-4 rounded-xl border border-red-500/10 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 animate-in fade-in duration-300 font-medium' role='alert'>
              {activeError === 'Text to translate cannot be empty'
                ? "Oops, it looks like you haven't written anything. Give us something to translate, please."
                : activeError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
