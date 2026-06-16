import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('Email ou senha incorretos.')
      else navigate('/questoes')
    } else {
      if (password.length < 6) { setError('A senha precisa ter ao menos 6 caracteres.'); setLoading(false); return }
      const { error } = await signUp(email, password, nome)
      if (error) setError(error.message)
      else setSuccess('Conta criada! Verifique seu email para confirmar e depois faça login.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <i className="ti ti-school" aria-hidden="true" style={{fontSize:'28px',color:'#185FA5'}}></i>
          <div className={styles.logoText}>Estuda<span>ENEM</span></div>
          <p className={styles.sub}>Questões de provas reais com correção e explicação por IA</p>
        </div>

        <div className={styles.tabs}>
          <button className={mode==='login' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Entrar</button>
          <button className={mode==='signup' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Criar conta</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label>Nome</label>
              <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
          )}
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Senha</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <div className={styles.error}><i className="ti ti-alert-circle" aria-hidden="true"></i> {error}</div>}
          {success && <div className={styles.successMsg}><i className="ti ti-circle-check" aria-hidden="true"></i> {success}</div>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
