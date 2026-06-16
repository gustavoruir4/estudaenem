import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import styles from './Historico.module.css'

export default function Historico() {
  const { user } = useAuth()
  const [respostas, setRespostas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('respostas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRespostas(data || [])
        setLoading(false)
      })
  }, [user])

  if (loading) return <div className={styles.loading}>Carregando...</div>

  if (respostas.length === 0) {
    return (
      <div className={styles.empty}>
        <i className="ti ti-history" style={{fontSize:'2.5rem',color:'#d1d5db'}} aria-hidden="true"></i>
        <p>Seu histórico de questões aparecerá aqui.</p>
      </div>
    )
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Histórico de respostas</h2>
        <span className={styles.count}>{respostas.length} questões</span>
      </div>
      <div className={styles.block}>
        {respostas.map((r, i) => (
          <div className={styles.item} key={r.id || i}>
            <div className={styles.itemInfo}>
              <div className={styles.itemAssunto}>{r.assunto}</div>
              <div className={styles.itemMeta}>{r.area} · {r.prova} {r.ano} · {formatDate(r.created_at)}</div>
            </div>
            <div>
              {r.correta
                ? <span className={`${styles.badge} ${styles.badgeGreen}`}><i className="ti ti-check" aria-hidden="true"></i> Acerto</span>
                : <span className={`${styles.badge} ${styles.badgeRed}`}><i className="ti ti-x" aria-hidden="true"></i> Erro</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
