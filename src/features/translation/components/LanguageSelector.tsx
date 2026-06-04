import { AUTO_LANGUAGE, SUPPORTED_LANGUAGES } from '../constants'
import type { fromLanguage, Language } from '../types'
import { Globe, Languages } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = { type: 'from', value: fromLanguage, onChange: (lang: fromLanguage) => void } |
    { type: 'to', value: Language, onChange: (lang: Language) => void }

export const LanguageSelector = ({ onChange, type, value } : Props) => {
  const handleValueChange = (val: string) => {
    onChange(val as Language)
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className='w-full rounded-sm border border-border/80 bg-card hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40 shadow-sm transition-all duration-300 h-10'>
        <SelectValue placeholder='Select language' />
      </SelectTrigger>
      <SelectContent className='rounded-none'>
        {type === 'from' && (
          <SelectItem value={AUTO_LANGUAGE}>
            <span className='flex items-center gap-2'>
              <Globe className='size-4 text-muted-foreground/80' />
              <span>Detect language</span>
            </span>
          </SelectItem>
        )}
        {Object.entries(SUPPORTED_LANGUAGES).map(([key, literal]) => (
          <SelectItem key={key} value={key}>
            <span className='flex items-center gap-2'>
              <Languages className='size-4 text-muted-foreground/80' />
              <span>{literal}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
