import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import styles from './Ativar.module.css'

export default function Ativar() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError('')
    setSuccess('')

    if (!password || !confirmarSenha) {
      setError('Preencha os dois campos de senha.')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await signUp(email, password)
      if (signUpError) throw signUpError

      const novoUserId = data?.user?.id
      if (novoUserId) {
        await supabase
          .from('acessos')
          .update({ user_id: novoUserId })
          .eq('email', email)
          .eq('status', 'pago')
          .is('user_id', null)
      }

      setSuccess('Conta ativada! Redirecionando para o app...')
      setTimeout(() => navigate('/app/questoes'), 1200)
    } catch (err) {
      setError(traduzErro(err.message))
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true"></div>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoMark}>
            <i className="ti ti-school" aria-hidden="true"></i>
          </div>
          <h1 className={styles.title}>Ative sua conta</h1>
          <p className={styles.subtitle}>Pagamento confirmado! Crie sua senha para acessar.</p>
        </div>

        {!email ? (
          <div className={styles.error}>
            <i className="ti ti-alert-circle" aria-hidden="true"></i>
            <span>Link inválido ou incompleto. <Link to="/pagamento">Voltar para o pagamento</Link>.</span>
          </div>
        ) : (
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>E-mail</label>
              <input className={styles.input} type="email" value={email} disabled />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Crie uma senha</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Confirme a senha</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className={styles.error}>
                <i className="ti ti-alert-circle" aria-hidden="true"></i> {error}
              </div>
            )}
            {success && (
              <div className={styles.success}>
                <i className="ti ti-circle-check" aria-hidden="true"></i> {success}
              </div>
            )}

            <button className={styles.submit} onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span className={styles.dots}>Ativando<span>.</span><span>.</span><span>.</span></span>
              ) : 'Ativar minha conta'}
            </button>
          </div>
        )}

        <p className={styles.footer}>
          <i className="ti ti-infinity" aria-hidden="true"></i>
          Acesso completo até o ENEM
        </p>
      </div>
    </div>
  )
}

function traduzErro(msg = '') {
  const m = (msg || '').toLowerCase()
  if (m.includes('already registered')) return 'Esse e-mail já tem uma conta. Faça login normalmente.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.'
  return msg || 'Algo deu errado. Tente novamente.'
}
