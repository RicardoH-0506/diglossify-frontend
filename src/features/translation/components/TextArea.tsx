import { type SectionType, type fromLanguage, type Language, SectionTypeConst } from '../types'
import { Textarea } from '@/components/ui/textarea'

interface TextAreaProps {
  loading?: boolean
  type: SectionType
  value: string
  valueFromLang?: fromLanguage
  valueToLang?: Language
  onChange: (value: string) => void
}

type PlaceholderProps = {
  type: SectionType
  loading?: boolean
  valueFromLang?: fromLanguage
  valueToLang?: Language
}

const getPlaceholder = ({ type, loading, valueFromLang, valueToLang }: PlaceholderProps) => {
  if (type === SectionTypeConst.FROM) return 'Type something to translate...'
  if (valueFromLang === valueToLang) return 'Choose different languages'
  if (loading === true) return 'Translating...'

  return 'Translation'
}

export function TextArea ({ type, loading, value, valueFromLang, valueToLang, onChange }: TextAreaProps) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event?.target.value)
  }

  return (
    <Textarea
      autoFocus={type === SectionTypeConst.FROM}
      disabled={type === SectionTypeConst.TO}
      placeholder={getPlaceholder({ type, loading, valueFromLang, valueToLang })}
      className='min-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent px-2 py-2 text-base md:text-lg focus-visible:ring-transparent disabled:opacity-100 disabled:bg-transparent disabled:cursor-text'
      value={value}
      onChange={handleChange}
    />
  )
}
