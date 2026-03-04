import { Form } from 'react-bootstrap'
import { AUTO_LANGUAGE, SUPPORTED_LANGUAGES } from '../../../shared/constants/constants'
import type { fromLanguage, Language } from '../../../shared/types/types'

type Props = { type: 'from', value: fromLanguage, onChange: (lang: fromLanguage) => void } |
    { type: 'to', value: Language, onChange: (lang: Language) => void }

export const LanguageSelector = ({ onChange, type, value } : Props) => {
  const handleChange = (e : React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as Language)
  }
  return (
    <Form.Select aria-label='Language selector' onChange={handleChange} value={value}>
      {type === 'from' && <option value={AUTO_LANGUAGE}>Detectar idioma</option>}
      {Object.entries(SUPPORTED_LANGUAGES).map(([key, literal]) => (
        <option key={key} value={key}>
          {literal as string}
        </option>
      ))}
    </Form.Select>
  )
}
