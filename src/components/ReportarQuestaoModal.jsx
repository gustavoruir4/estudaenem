import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './ReportarQuestaoModal.module.css'

export default function ReportarQuestaoModal({ questaoId, onClose }) {
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function handleEnviar() {
    if (!mensagem.trim() || enviando) return
    setEnviando(true)
    setErro('')
    const { error } = await supabase.from('reportes').insert({
      questao_id: questaoId,
      mensagem: mensagem.trim(),
    })
    setEnviando(false)
    if (error) {
      setErro('Não foi possível enviar. Tente novamente.')
      return
    }
    setEnviado(true)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose} aria-label="Fechar">
          <i className="ti ti-x" aria-hidden="true"></i>
        </button>

        {enviado ? (
          <div className={styles.success}>
            <i className="ti ti-circle-check" aria-hidden="true"></i>
            <p>Reporte enviado. Obrigado por ajudar a melhorar as questões!</p>
            <button className={styles.btnPrimary} onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <h3 className={styles.title}>Reportar questão</h3>
            <p className={styles.subtitle}>
              Descreva o problema: enunciado com erro, gabarito incorreto, opção ambígua, etc.
            </p>
            <textarea
              className={styles.textarea}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva o problema..."
              rows={4}
              autoFocus
            />
            {erro && <p className={styles.erro}>{erro}</p>}
            <div className={styles.actions}>
              <button className={styles.btnGhost} onClick={onClose}>Cancelar</button>
              <button
                className={styles.btnPrimary}
                onClick={handleEnviar}
                disabled={!mensagem.trim() || enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
