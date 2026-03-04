import { useTranslation } from './hooks/useTranslation'
import { useStore } from './hooks/useStore'
import { LanguageSelector } from './components/LanguageSelector'
import { TextArea } from './components/TextArea'
import { ArrowsIcons } from './components/Icons'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { AUTO_LANGUAGE } from '../../shared/constants/constants'
import { SectionTypeConst } from '../../shared/types/types'

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

  const canInterchange = fromLang !== AUTO_LANGUAGE && fromLang !== toLang && !error

  return (
    <Container fluid>
      <h2 className='text-center my-4'>Translate with AI</h2>

      <Row className='mb-3 align-items-center justify-content-between'>
        <Col xs={5} md={5}>
          <LanguageSelector
            type={SectionTypeConst.FROM}
            value={fromLang}
            onChange={setFromLang}
          />
        </Col>

        <Col xs={2} md={2} className='d-flex justify-content-center align-items-center'>
          <Button
            variant='link'
            disabled={!canInterchange}
            onClick={interchangeLanguages}
          >
            <ArrowsIcons />
          </Button>
        </Col>

        <Col xs={5} md={5}>
          <LanguageSelector
            type={SectionTypeConst.TO}
            value={toLang}
            onChange={setToLang}
          />
        </Col>
      </Row>

      <Row className='justify-content-between'>
        <Col xs={12} md={5} className='mb-3 mb-md-0'>
          <TextArea
            type={SectionTypeConst.FROM}
            value={fromText}
            onChange={setFromText}
          />
        </Col>

        <Col xs={12} md={5}>
          <TextArea
            loading={translationLoading}
            type={SectionTypeConst.TO}
            value={translatedText || result}
            onChange={setResult}
            valueFromLang={fromLang}
            valueToLang={toLang}
          />
        </Col>
      </Row>

      {error && (
        <Row className='mt-3'>
          <Col xs={12}>
            <div className='alert alert-danger' role='alert'>
              {error}
            </div>
          </Col>
        </Row>
      )}
    </Container>
  )
}
