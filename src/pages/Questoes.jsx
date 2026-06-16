import { useState, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { QUESTIONS, AREAS, PROVAS } from '../lib/questions'
import styles from './Questoes.module.css'

async function fetchAIExplanation(question) {
  const opcaoCorreta = question.opcoes.find(o => o.letra === question.correta)
  const prompt = `Você é um professor especialista em ENEM. A questão é:

"${question.enunciado}"

A alternativa correta é ${question.correta}: "${opcaoCorreta?.texto}".

Explique de forma didática e direta em 3 a 4 frases por que essa é a resposta certa, qual o conceito envolvido e por que as outras alternativas estão erradas. Responda em português brasileiro.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

export default function Questoes() {
  const { user } = useAuth()
  const [areaFilter, setAreaFilter] = useState('Todas')
  const [provaFilter, setProvaFilter] = useState('Todas')
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const filteredQs = QUESTIONS.filter(q =>
    (areaFilter === 'Todas' || q.area === areaFilter) &&
    (provaFilter === 'Todas' || q.prova === provaFilter)
  )
  const q = filteredQs[qIndex] || null

  async function handleAnswer() {
    if (!selected || !q) return
    const isCorrect = selected === q.correta
    setAnswered(true)

    if (user) {
      await supabase.from('respostas').insert({
        user_id: user.id,
        question_id: q.id,
        area: q.area,
        assunto: q.assunto,
        prova: q.prova,
        ano: q.ano,
        correta: isCorrect,
        resposta_dada: selected,
      })
    }

    if (!isCorrect) {
      setAiLoading(true)
      try {
        const text = await fetchAIExplanation(q)
        setAiText(text)
      } catch {
        setAiText('Não foi possível gerar a explicação. Tente novamente.')
      }
      setAiLoading(false)
    }
  }

  function nextQuestion() {
    setSelected(null)
    setAnswered(false)
    setAiText('')
    setAiLoading(false)
    setQIndex(i => (i + 1) % filteredQs.length)
  }

  function handleFilterArea(a) {
    setAreaFilter(a)
    setQIndex(0)
    setSelected(null)
    setAnswered(false)
    setAiText('')
  }
  function handleFilterProva(p) {
    setProvaFilter(p)
    setQIndex(0)
    setSelected(null)
    setAnswered(false)
    setAiText('')
  }

  return (
    <div>
      <div className={styles.filters}>
        {AREAS.map(a => (
          <button key={a} className={`${styles.pill} ${areaFilter === a ? styles.pillActive : ''}`} onClick={() => handleFilterArea(a)}>{a}</button>
        ))}
      </div>
      <div className={styles.filters} style={{ marginTop: '8px' }}>
        {PROVAS.map(p => (
          <button key={p} className={`${styles.pill} ${provaFilter === p ? styles.pillActive : ''}`} onClick={() => handleFilterProva(p)}>{p}</button>
        ))}
      </div>

      {!q ? (
        <div className={styles.empty}>
          <i className="ti ti-mood-empty" style={{fontSize:'2.5rem',color:'#d1d5db'}} aria-hidden="true"></i>
          <p>Nenhuma questão encontrada com esses filtros.</p>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${styles.badgeBlue}`}>{q.prova} {q.ano}</span>
            <span className={`${styles.badge} ${styles.badgeGray}`}>{q.area}</span>
            <span className={`${styles.badge} ${styles.badgeGreen}`}>{q.assunto}</span>
          </div>

          <p className={styles.enunciado}>{q.enunciado}</p>

          <div className={styles.options}>
            {q.opcoes.map(op => {
              let cls = styles.option
              if (answered) {
                if (op.letra === q.correta) cls += ` ${styles.optionCorrect}`
                else if (op.letra === selected) cls += ` ${styles.optionWrong}`
              } else if (op.letra === selected) {
                cls += ` ${styles.optionSelected}`
              }
              return (
                <button key={op.letra} className={cls} onClick={() => !answered && setSelected(op.letra)} disabled={answered}>
                  <span className={styles.letra}>{op.letra}</span>
                  <span>{op.texto}</span>
                  {answered && op.letra === q.correta && <i className="ti ti-check" style={{marginLeft:'auto',color:'#1D9E75'}} aria-hidden="true"></i>}
                  {answered && op.letra === selected && op.letra !== q.correta && <i className="ti ti-x" style={{marginLeft:'auto',color:'#E24B4A'}} aria-hidden="true"></i>}
                </button>
              )
            })}
          </div>

          {answered && selected === q.correta && (
            <div className={styles.successBanner}>
              <i className="ti ti-circle-check" aria-hidden="true"></i> Correto! Boa resposta.
            </div>
          )}

          {answered && selected !== q.correta && (
            <div className={styles.aiBox}>
              <div className={styles.aiHeader}>
                <i className="ti ti-sparkles" aria-hidden="true"></i> Explicação da IA
              </div>
              {aiLoading ? (
                <div className={styles.dots}>
                  Gerando explicação<span>.</span><span>.</span><span>.</span>
                </div>
              ) : (
                <p className={styles.aiText}>{aiText}</p>
              )}
            </div>
          )}

          <div className={styles.actions}>
            {!answered ? (
              <button className={styles.btn} onClick={handleAnswer} disabled={!selected}>Confirmar resposta</button>
            ) : (
              <button className={styles.btn} onClick={nextQuestion}>Próxima questão →</button>
            )}
            <span className={styles.counter}>{qIndex + 1} / {filteredQs.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
