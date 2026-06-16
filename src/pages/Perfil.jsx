import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import styles from './Perfil.module.css'

export default function Perfil() {
  const { user } = useAuth()
  const [respostas, setRespostas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('respostas').select('*').eq('user_id', user.id).then(({ data }) => {
      setRespostas(data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <div className={styles.loading}>Carregando...</div>

  const total = respostas.length
  const acertos = respostas.filter(r => r.correta).length
  const erros = total - acertos
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0

  const byArea = {}
  respostas.forEach(r => {
    if (!byArea[r.area]) byArea[r.area] = { c: 0, t: 0 }
    byArea[r.area].t++
    if (r.correta) byArea[r.area].c++
  })

  const byAssunto = {}
  respostas.forEach(r => {
    if (!byAssunto[r.assunto]) byAssunto[r.assunto] = { c: 0, t: 0 }
    byAssunto[r.assunto].t++
    if (r.correta) byAssunto[r.assunto].c++
  })

  const assuntosSorted = Object.entries(byAssunto).sort((a, b) => b[1].t - a[1].t)

  if (total === 0) {
    return (
      <div className={styles.empty}>
        <i className="ti ti-chart-bar" style={{fontSize:'2.5rem',color:'#d1d5db'}} aria-hidden="true"></i>
        <p>Responda algumas questões para ver suas estatísticas aqui.</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total respondidas</div>
          <div className={`${styles.statValue} ${styles.blue}`}>{total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Acertos</div>
          <div className={`${styles.statValue} ${styles.green}`}>{acertos}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Erros</div>
          <div className={`${styles.statValue} ${styles.red}`}>{erros}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Taxa de acerto</div>
          <div className={styles.statValue} style={{ color: pct >= 60 ? '#1D9E75' : '#E24B4A' }}>{pct}%</div>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.blockTitle}>Desempenho por área</div>
        {Object.entries(byArea).map(([area, { c, t }]) => {
          const p = Math.round((c / t) * 100)
          return (
            <div className={styles.barRow} key={area}>
              <div className={styles.barLabel}>{area}</div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: p + '%', background: p >= 60 ? '#1D9E75' : '#E24B4A' }}></div>
              </div>
              <div className={styles.barPct}>{p}%</div>
              <div className={styles.barCount}>{c}/{t}</div>
            </div>
          )
        })}
      </div>

      <div className={styles.block}>
        <div className={styles.blockTitle}>Desempenho por assunto</div>
        {assuntosSorted.map(([assunto, { c, t }]) => {
          const p = Math.round((c / t) * 100)
          return (
            <div className={styles.barRow} key={assunto}>
              <div className={styles.barLabel}>{assunto}</div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: p + '%', background: p >= 60 ? '#1D9E75' : '#E24B4A' }}></div>
              </div>
              <div className={styles.barPct}>{p}%</div>
              <div className={styles.barCount}>{c}/{t}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
