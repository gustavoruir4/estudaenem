import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

export function usePagamentoGuard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }

    let ativo = true
    setChecking(true)

    supabase
      .from('acessos')
      .select('status, user_id')
      .eq('email', user.email)
      .single()
      .then(({ data }) => {
        if (!ativo) return
        if (!data || data.status !== 'pago') {
          navigate('/pagamento')
        } else if (!data.user_id) {
          // Autoconserta o vínculo caso a conta tenha sido criada fora do fluxo /ativar
          supabase.from('acessos').update({ user_id: user.id }).eq('email', user.email)
        }
        setChecking(false)
      })

    return () => { ativo = false }
  }, [user, navigate])

  return { checking }
}
