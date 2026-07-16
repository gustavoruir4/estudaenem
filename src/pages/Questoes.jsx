import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { usePagamentoGuard } from '../lib/usePagamentoGuard'
import { supabase } from '../lib/supabase'
import { QUESTIONS, AREAS, PROVAS } from '../lib/questions'
import { derivarMateria, MATERIAS_POR_AREA } from '../lib/materias'
import styles from './Questoes.module.css'

// ── Shuffle determinístico (usa uma seed p/ manter a ordem estável na sessão) ──
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleSeeded(arr, seed) {
  const a = [...arr]
  const rand = mulberry32(seed)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function capitalizar(texto) {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function limparTexto(texto) {
  return texto
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/^===+$/gm, '')
    .replace(/^\|(.+)\|$/gm, (match, inner) => {
      const cols = inner.split('|').map(c => c.trim()).filter(c => c && !c.match(/^-+$/))
      if (cols.length === 0) return ''
      if (cols.length === 1) return cols[0]
      return '• ' + cols.join(' – ')
    })
    .replace(/^\|[-|:\s]+\|$/gm, '')
    .replace(/^[-–]\s+/gm, '• ')
    .replace(/^>\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function ExplicacaoTexto({ texto, className }) {
  const ref = useRef(null)
  const limpo = limparTexto(texto)

  useEffect(() => {
    if (!ref.current) return
    const tryRender = () => {
      if (window.renderMathInElement) {
        window.renderMathInElement(ref.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        })
      } else {
        setTimeout(tryRender, 100)
      }
    }
    tryRender()
  }, [limpo])

  const paragrafos = limpo.split('\n\n').filter(p => p.trim())

  return (
    <div className={className} ref={ref}>
      {paragrafos.map((p, i) => {
        const linhas = p.split('\n').filter(l => l.trim())
        if (linhas.length > 1) {
          return (
            <div key={i} style={{ marginBottom: i < paragrafos.length - 1 ? '0.85rem' : 0 }}>
              {linhas.map((linha, j) => (
                <p key={j} style={{ marginBottom: j < linhas.length - 1 ? '0.35rem' : 0 }}>{linha}</p>
              ))}
            </div>
          )
        }
        return (
          <p key={i} style={{ marginBottom: i < paragrafos.length - 1 ? '0.85rem' : 0 }}>{p}</p>
        )
      })}
    </div>
  )
}

async function getExplanation(question) {
  const { data: cached } = await supabase
    .from('explicacoes')
    .select('explicacao')
    .eq('question_id', question.id)
    .single()

  if (cached?.explicacao) return cached.explicacao

  const opcaoCorreta = question.opcoes.find(o => o.letra === question.correta)

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explicacao`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        question_id: question.id,
        enunciado: question.enunciado,
        correta: question.correta,
        opcao_correta_texto: opcaoCorreta?.texto || '',
      })
    }
  )

  const data = await res.json()
  const explicacao = data.explicacao || ''

  if (explicacao) {
    await supabase.from('explicacoes').insert({ question_id: question.id, explicacao })
  }

  return explicacao
}

const AREA_ICONS = {
  'Matemática': 'ti-math-symbols',
  'Ciências da Natureza': 'ti-flask',
  'Ciências Humanas': 'ti-books',
  'Linguagens': 'ti-language',
}

function getSessionSeed() {
  const KEY = 'aprovai_quiz_seed'
  let seed = sessionStorage.getItem(KEY)
  if (!seed) {
    seed = String(Math.floor(Math.random() * 2 ** 31))
    sessionStorage.setItem(KEY, seed)
  }
  return Number(seed)
}

function novaSeed() {
  const seed = Math.floor(Math.random() * 2 ** 31)
  sessionStorage.setItem('aprovai_quiz_seed', String(seed))
  return seed
}

// Anos disponíveis, derivados das questões
const ANOS_DISPONIVEIS = [...new Set(QUESTIONS.map(q => q.ano))].sort((a, b) => b - a)

// Pré-computa a matéria de cada questão uma vez
const QUESTOES_COM_MATERIA = QUESTIONS.map(q => ({
  ...q,
  materia: derivarMateria(q.assunto, q.area),
}))

export default function Questoes() {
  const { user } = useAuth()
  const { acesso } = usePagamentoGuard()
  const isTrial = acesso.tipo === 'trial'

  // ── Filtros de múltipla seleção (arrays de valores selecionados; vazio = todos) ──
  const [areasSel, setAreasSel] = useState([])       // ex: ['Matemática']
  const [materiasSel, setMateriasSel] = useState([]) // ex: ['Física', 'Química']
  const [anosSel, setAnosSel] = useState([])         // ex: [2022, 2021]
  const [provasSel, setProvasSel] = useState([])     // ex: ['ENEM']
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [respondidas, setRespondidas] = useState(new Set())
  const [finished, setFinished] = useState(false)
  const [sessionStats, setSessionStats] = useState({ acertos: 0, erros: 0 })

  const [pularRespondidas, setPularRespondidas] = useState(
    () => localStorage.getItem('aprovai_pular_respondidas') !== 'false'
  )
  const [historico, setHistorico] = useState(new Set())
  const [histLoading, setHistLoading] = useState(true)
  const [seed, setSeed] = useState(() => getSessionSeed())

  const [trialUsadas, setTrialUsadas] = useState(acesso.usadas || 0)
  const [trialEsgotado, setTrialEsgotado] = useState(false)

  useEffect(() => {
    if (acesso.tipo === 'trial') {
      setTrialUsadas(acesso.usadas || 0)
      if ((acesso.usadas || 0) >= 20) setTrialEsgotado(true)
    }
  }, [acesso.tipo, acesso.usadas])

  useEffect(() => {
    let ativo = true
    async function carregarHistorico() {
      if (!user) { setHistLoading(false); return }
      const { data } = await supabase
        .from('respostas')
        .select('question_id')
        .eq('user_id', user.id)
      if (ativo) {
        setHistorico(new Set((data || []).map(r => r.question_id)))
        setHistLoading(false)
      }
    }
    carregarHistorico()
    return () => { ativo = false }
  }, [user])

  useEffect(() => {
    localStorage.setItem('aprovai_pular_respondidas', String(pularRespondidas))
  }, [pularRespondidas])

  // Matérias disponíveis: se áreas estão selecionadas, mostra só as dessas áreas
  const materiasDisponiveis = useMemo(() => {
    const areasBase = areasSel.length > 0 ? areasSel : AREAS.filter(a => a !== 'Todas')
    const lista = []
    areasBase.forEach(a => {
      (MATERIAS_POR_AREA[a] || []).forEach(m => {
        if (!lista.includes(m)) lista.push(m)
      })
    })
    return lista
  }, [areasSel])

  // Aplica todos os filtros (todos em modo múltipla seleção; vazio = sem restrição)
  const baseFiltrada = useMemo(() => {
    return QUESTOES_COM_MATERIA.filter(q => {
      if (areasSel.length > 0 && !areasSel.includes(q.area)) return false
      if (materiasSel.length > 0 && !materiasSel.includes(q.materia)) return false
      if (anosSel.length > 0 && !anosSel.includes(q.ano)) return false
      if (provasSel.length > 0 && !provasSel.includes(q.prova)) return false
      return true
    })
  }, [areasSel, materiasSel, anosSel, provasSel])

  const filteredQs = useMemo(() => {
    let qs = baseFiltrada
    if (pularRespondidas) {
      qs = qs.filter(q => !historico.has(q.id))
    }
    return shuffleSeeded(qs, seed)
  }, [baseFiltrada, pularRespondidas, historico, seed])

  const q = filteredQs[qIndex] || null
  const total = filteredQs.length
  const feitas = respondidas.size

  const totalGeral = baseFiltrada.length
  const jaRespondidasGeral = useMemo(
    () => baseFiltrada.filter(q => historico.has(q.id)).length,
    [baseFiltrada, historico]
  )

  const totalFiltrosAtivos = areasSel.length + materiasSel.length + anosSel.length + provasSel.length

  async function handleAnswer() {
    if (!selected || !q) return

    if (isTrial) {
      if (trialEsgotado || trialUsadas >= 20) {
        setTrialEsgotado(true)
        return
      }
      const { data: novoTotal, error } = await supabase.rpc('usar_questao_trial')
      if (!error && typeof novoTotal === 'number') {
        setTrialUsadas(novoTotal)
        if (novoTotal >= 20) setTrialEsgotado(true)
      }
    }

    const isCorrect = selected === q.correta
    setAnswered(true)
    setRespondidas(prev => new Set([...prev, q.id]))
    setHistorico(prev => new Set([...prev, q.id]))
    setSessionStats(prev => ({
      acertos: prev.acertos + (isCorrect ? 1 : 0),
      erros: prev.erros + (isCorrect ? 0 : 1),
    }))

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

    setAiLoading(true)
    try {
      const text = await getExplanation(q)
      setAiText(text || 'Não foi possível gerar a explicação.')
    } catch {
      setAiText('Não foi possível gerar a explicação. Tente novamente.')
    }
    setAiLoading(false)
  }

  function nextQuestion() {
    if (isTrial && trialUsadas >= 20) {
      setTrialEsgotado(true)
      return
    }
    const novasRespondidas = new Set([...respondidas, q.id])
    const proxIndex = filteredQs.findIndex(x => !novasRespondidas.has(x.id))
    setSelected(null)
    setAnswered(false)
    setAiText('')
    setAiLoading(false)
    if (proxIndex === -1) {
      setFinished(true)
      return
    }
    setQIndex(proxIndex)
  }

  const resetSession = useCallback(() => {
    setRespondidas(new Set())
    setQIndex(0)
    setSelected(null)
    setAnswered(false)
    setAiText('')
    setFinished(false)
    setSessionStats({ acertos: 0, erros: 0 })
  }, [])

  // Alterna um valor num array de seleção
  function toggleSel(setter, valor) {
    setter(prev => prev.includes(valor) ? prev.filter(v => v !== valor) : [...prev, valor])
    resetSession()
  }

  // Ao mexer nas áreas, remove matérias que não pertencem mais
  function toggleArea(a) {
    setAreasSel(prev => {
      const novo = prev.includes(a) ? prev.filter(v => v !== a) : [...prev, a]
      // limpa matérias órfãs
      const permitidas = new Set()
      const base = novo.length > 0 ? novo : AREAS.filter(x => x !== 'Todas')
      base.forEach(area => (MATERIAS_POR_AREA[area] || []).forEach(m => permitidas.add(m)))
      setMateriasSel(ms => ms.filter(m => permitidas.has(m)))
      return novo
    })
    resetSession()
  }

  function limparFiltros() {
    setAreasSel([])
    setMateriasSel([])
    setAnosSel([])
    setProvasSel([])
    resetSession()
  }

  function togglePular() {
    setPularRespondidas(prev => !prev)
    resetSession()
  }

  async function resetarProgresso() {
    const ok = window.confirm(
      'Isso vai apagar todas as suas respostas salvas e liberar as questões de novo. Seu desempenho será zerado. Deseja continuar?'
    )
    if (!ok) return
    if (user) {
      await supabase.from('respostas').delete().eq('user_id', user.id)
    }
    setHistorico(new Set())
    setSeed(novaSeed())
    resetSession()
  }

  if (isTrial && trialEsgotado && !answered) {
    return (
      <div className={styles.finishWrap}>
        <div className={styles.finishCard}>
          <div className={styles.finishIcon}><i className="ti ti-lock" aria-hidden="true"></i></div>
          <h2 className={styles.finishTitle}>Você usou suas 20 questões grátis!</h2>
          <p className={styles.finishSub}>
            Esperamos que tenha gostado. Para continuar estudando sem limites, garanta o acesso vitalício.
          </p>
          <div className={styles.finishStats}>
            <div className={styles.finishStat}>
              <div className={styles.finishStatValue} style={{ color: 'var(--purple-bright)' }}>∞</div>
              <div className={styles.finishStatLabel}>Questões</div>
            </div>
            <div className={styles.finishDivider}></div>
            <div className={styles.finishStat}>
              <div className={styles.finishStatValue} style={{ color: 'var(--green-text)' }}>R$39,90</div>
              <div className={styles.finishStatLabel}>Uma vez só</div>
            </div>
            <div className={styles.finishDivider}></div>
            <div className={styles.finishStat}>
              <div className={styles.finishStatValue} style={{ color: 'var(--purple-bright)' }}>IA</div>
              <div className={styles.finishStatLabel}>Ilimitada</div>
            </div>
          </div>
          <p className={styles.finishMsg}>Acesso vitalício, sem mensalidade. Passou ou não passou, o app continua seu.</p>
          <Link to="/pagamento" className={styles.btnPrimary}>
            <i className="ti ti-rocket" aria-hidden="true"></i> Garantir acesso vitalício
          </Link>
        </div>
      </div>
    )
  }

  if (finished) {
    const respTotal = sessionStats.acertos + sessionStats.erros
    const pct = respTotal > 0 ? Math.round((sessionStats.acertos / respTotal) * 100) : 0
    const zerouTudo = pularRespondidas && total === 0
    return (
      <div className={styles.finishWrap}>
        <div className={styles.finishCard}>
          <div className={styles.finishIcon}><i className="ti ti-confetti" aria-hidden="true"></i></div>
          <h2 className={styles.finishTitle}>
            {zerouTudo ? 'Você já respondeu todas as questões desse filtro!' : 'Você completou essa rodada!'}
          </h2>
          <p className={styles.finishSub}>
            {zerouTudo
              ? 'Troque os filtros, desligue "pular respondidas" ou resete o progresso para revisar.'
              : 'Veja seu desempenho nessa rodada'}
          </p>
          {!zerouTudo && (
            <div className={styles.finishStats}>
              <div className={styles.finishStat}>
                <div className={styles.finishStatValue} style={{ color: 'var(--green-text)' }}>{sessionStats.acertos}</div>
                <div className={styles.finishStatLabel}>Acertos</div>
              </div>
              <div className={styles.finishDivider}></div>
              <div className={styles.finishStat}>
                <div className={styles.finishStatValue} style={{ color: 'var(--red-text)' }}>{sessionStats.erros}</div>
                <div className={styles.finishStatLabel}>Erros</div>
              </div>
              <div className={styles.finishDivider}></div>
              <div className={styles.finishStat}>
                <div className={styles.finishStatValue} style={{ color: 'var(--purple-bright)' }}>{pct}%</div>
                <div className={styles.finishStatLabel}>Aproveitamento</div>
              </div>
            </div>
          )}
          {!zerouTudo && pct >= 70 && <p className={styles.finishMsg}>Excelente desempenho! Continue assim 🚀</p>}
          {!zerouTudo && pct >= 50 && pct < 70 && <p className={styles.finishMsg}>Bom resultado! Revise os temas que errou 📚</p>}
          {!zerouTudo && pct < 50 && <p className={styles.finishMsg}>Não desanime! Revise os conteúdos e tente de novo 💪</p>}
          <div className={styles.finishActions}>
            <button className={styles.btnPrimary} onClick={() => { setSeed(novaSeed()); resetSession() }}>
              <i className="ti ti-refresh" aria-hidden="true"></i> Nova rodada
            </button>
            <button className={styles.btnGhost} onClick={resetarProgresso}>
              <i className="ti ti-trash" aria-hidden="true"></i> Resetar progresso
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {isTrial && (
        <div className={styles.trialBanner}>
          <i className="ti ti-gift" aria-hidden="true"></i>
          <span>Teste grátis: <strong>{Math.max(0, 20 - trialUsadas)}</strong> de 20 questões restantes</span>
          <Link to="/pagamento" className={styles.trialUpgrade}>Liberar tudo por R$39,90</Link>
        </div>
      )}

      <div className={styles.sessionBar}>
        <label className={styles.switchWrap} title="Quando ligado, você não vê de novo as questões que já respondeu">
          <input type="checkbox" className={styles.switchInput} checked={pularRespondidas} onChange={togglePular} />
          <span className={styles.switchTrack}><span className={styles.switchThumb}></span></span>
          <span className={styles.switchLabel}>Pular questões que já respondi</span>
        </label>
        <button className={styles.sessionAction} onClick={resetarProgresso} title="Apaga suas respostas salvas e libera todas de novo">
          <i className="ti ti-trash" aria-hidden="true"></i> Resetar progresso
        </button>
      </div>

      {/* ── Filtros avançados ── */}
      <div className={styles.filterPanel}>
        <button className={styles.filterToggle} onClick={() => setFiltrosAbertos(o => !o)}>
          <span className={styles.filterToggleLeft}>
            <i className="ti ti-adjustments-horizontal" aria-hidden="true"></i>
            Filtros
            {totalFiltrosAtivos > 0 && <span className={styles.filterCount}>{totalFiltrosAtivos}</span>}
          </span>
          <i className={`ti ti-chevron-${filtrosAbertos ? 'up' : 'down'}`} aria-hidden="true"></i>
        </button>

        {filtrosAbertos && (
          <div className={styles.filterBody}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Área</span>
              <div className={styles.chips}>
                {AREAS.filter(a => a !== 'Todas').map(a => (
                  <button
                    key={a}
                    className={`${styles.chip} ${areasSel.includes(a) ? styles.chipActive : ''}`}
                    onClick={() => toggleArea(a)}
                  >
                    <i className={`ti ${AREA_ICONS[a] || 'ti-book'}`} aria-hidden="true"></i> {a}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Matéria</span>
              <div className={styles.chips}>
                {materiasDisponiveis.map(m => (
                  <button
                    key={m}
                    className={`${styles.chip} ${materiasSel.includes(m) ? styles.chipActive : ''}`}
                    onClick={() => toggleSel(setMateriasSel, m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Ano</span>
              <div className={styles.chips}>
                {ANOS_DISPONIVEIS.map(ano => (
                  <button
                    key={ano}
                    className={`${styles.chip} ${anosSel.includes(ano) ? styles.chipActive : ''}`}
                    onClick={() => toggleSel(setAnosSel, ano)}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            </div>

            {PROVAS.filter(p => p !== 'Todas').length > 1 && (
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Prova</span>
                <div className={styles.chips}>
                  {PROVAS.filter(p => p !== 'Todas').map(p => (
                    <button
                      key={p}
                      className={`${styles.chip} ${provasSel.includes(p) ? styles.chipActive : ''}`}
                      onClick={() => toggleSel(setProvasSel, p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {totalFiltrosAtivos > 0 && (
              <button className={styles.filterClear} onClick={limparFiltros}>
                <i className="ti ti-x" aria-hidden="true"></i> Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {totalGeral > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(jaRespondidasGeral / totalGeral) * 100}%` }}></div>
          </div>
          <span className={styles.progressText}><strong>{jaRespondidasGeral}</strong> de {totalGeral} concluídas</span>
        </div>
      )}

      {histLoading ? (
        <div className={styles.empty}>
          <i className="ti ti-loader-2" aria-hidden="true"></i>
          <p>Carregando seu progresso...</p>
        </div>
      ) : !q ? (
        <div className={styles.empty}>
          <i className="ti ti-mood-empty" aria-hidden="true"></i>
          {pularRespondidas && jaRespondidasGeral > 0 && totalGeral > 0 ? (
            <>
              <p>Você já respondeu todas as questões desse filtro!</p>
              <p className={styles.emptyHint}>Desligue "pular questões que já respondi" para revisar, ou resete o progresso.</p>
              <button className={styles.btnGhost} onClick={resetarProgresso} style={{ marginTop: '0.75rem' }}>
                <i className="ti ti-trash" aria-hidden="true"></i> Resetar progresso
              </button>
            </>
          ) : (
            <>
              <p>Nenhuma questão encontrada com esses filtros.</p>
              {totalFiltrosAtivos > 0 && (
                <button className={styles.btnGhost} onClick={limparFiltros} style={{ marginTop: '0.75rem' }}>
                  <i className="ti ti-x" aria-hidden="true"></i> Limpar filtros
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${styles.badgeProva}`}>
              <i className="ti ti-calendar" aria-hidden="true"></i> {q.prova} {q.ano}
            </span>
            <span className={styles.badgeArea} data-area={q.area}>
              <i className={`ti ${AREA_ICONS[q.area] || 'ti-book'}`} aria-hidden="true"></i> {q.materia}
            </span>
            <span className={styles.badgeAssunto}>{q.assunto}</span>
          </div>

          <p className={styles.enunciado}>{capitalizar(q.enunciado)}</p>

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
                <button
                  key={op.letra}
                  className={cls}
                  onClick={() => !answered && setSelected(op.letra)}
                  disabled={answered}
                >
                  <span className={styles.letra}>{op.letra}</span>
                  <span className={styles.opText}>{capitalizar(op.texto)}</span>
                  {answered && op.letra === q.correta && (
                    <i className={`ti ti-check ${styles.opIcon}`} style={{ color: 'var(--green-text)' }} aria-hidden="true"></i>
                  )}
                  {answered && op.letra === selected && op.letra !== q.correta && (
                    <i className={`ti ti-x ${styles.opIcon}`} style={{ color: 'var(--red-text)' }} aria-hidden="true"></i>
                  )}
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={styles.explicacaoBox}>
              <div className={styles.explicacaoHeader}>
                <i className="ti ti-sparkles" aria-hidden="true"></i>
                <span>Explicação da IA</span>
                {selected === q.correta ? (
                  <span className={`${styles.resultTag} ${styles.resultOk}`}>
                    <i className="ti ti-circle-check" aria-hidden="true"></i> Você acertou
                  </span>
                ) : (
                  <span className={`${styles.resultTag} ${styles.resultErr}`}>
                    <i className="ti ti-circle-x" aria-hidden="true"></i> Você errou
                  </span>
                )}
              </div>
              {aiLoading ? (
                <div className={styles.dots}>Carregando explicação<span>.</span><span>.</span><span>.</span></div>
              ) : (
                <ExplicacaoTexto texto={aiText} className={styles.aiText} />
              )}
            </div>
          )}

          <div className={styles.actions}>
            {!answered ? (
              <button className={styles.btnPrimary} onClick={handleAnswer} disabled={!selected}>Confirmar resposta</button>
            ) : (
              <button className={styles.btnPrimary} onClick={nextQuestion}>
                {isTrial && trialUsadas >= 20 ? (
                  <>Ver planos <i className="ti ti-arrow-right" aria-hidden="true"></i></>
                ) : (
                  <>Próxima questão <i className="ti ti-arrow-right" aria-hidden="true"></i></>
                )}
              </button>
            )}
            <span className={styles.counter}>{feitas} / {total}</span>
          </div>
        </div>
      )}
    </div>
  )
}