import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { QUESTIONS } from '../lib/questions'
import styles from './Landing.module.css'

/* ── Hook: revela elementos com .reveal quando entram na viewport ── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(`.${styles.reveal}`)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.revealVisible)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

const FEATURES = [
  {
    icon: 'ti-message-chatbot',
    title: 'A IA corrige o seu erro, não só a questão',
    desc: 'Errou? Você recebe na hora uma explicação feita pro seu erro específico — entende onde travou o raciocínio, não decora a resposta certa.',
  },
  {
    icon: 'ti-clock-play',
    title: 'Treine sob a pressão do dia da prova',
    desc: 'Monte simulados cronometrados com o número de questões que quiser. Chega no dia da prova sem sentir o relógio como inimigo.',
  },
  {
    icon: 'ti-refresh-dot',
    title: 'Seus erros viram um plano de estudo',
    desc: 'Toda questão errada fica separada num modo de revisão. Você volta nelas até o assunto virar automático — sem adivinhar onde focar.',
  },
  {
    icon: 'ti-chart-bar',
    title: 'Saiba exatamente onde você está perdendo pontos',
    desc: 'Sua taxa de acerto por área e por assunto, sempre à vista. Estude o que realmente vai puxar sua nota pra cima.',
  },
]

const AREAS = [
  { nome: 'Matemática', icone: 'ti-math-symbols', cor: 'mat' },
  { nome: 'Ciências da Natureza', icone: 'ti-flask', cor: 'nat' },
  { nome: 'Ciências Humanas', icone: 'ti-books', cor: 'hum' },
  { nome: 'Linguagens', icone: 'ti-language', cor: 'lin' },
]

const PASSOS = [
  { numero: '1', titulo: 'Crie sua conta', desc: 'Cadastro rápido com e-mail e senha. Sem cartão pra "testar grátis", sem pegadinha.' },
  { numero: '2', titulo: 'Escolha como estudar', desc: 'Pratique por área, monte um simulado cronometrado ou revise seus erros.' },
  { numero: '3', titulo: 'Evolua com a IA', desc: 'Entenda cada questão com explicações claras e veja seu desempenho subir.' },
]

const OBJECOES = [
  {
    icon: 'ti-device-tv',
    pergunta: 'É melhor que assistir vídeo-aula?',
    resposta: 'Vídeo-aula você assiste passivo e esquece na semana seguinte. Aqui você resolve, erra e a IA corrige o seu raciocínio na hora. Você aprende fazendo — que é como a prova cobra.',
  },
  {
    icon: 'ti-target-arrow',
    pergunta: 'Funciona pro meu vestibular?',
    resposta: 'Se você vai prestar ENEM, FUVEST, UNICAMP ou UFU, as questões são as mesmas que caem na sua prova — organizadas por área e assunto pra você filtrar o que importa.',
  },
  {
    icon: 'ti-cash',
    pergunta: 'R$39,90 vale a pena?',
    resposta: 'É menos que uma pizza, uma vez só. Uma aula particular custa isso por hora. Um cursinho, centenas por mês. Aqui você paga uma vez e usa até o dia da prova.',
  },
]

const FAQ = [
  {
    q: 'Preciso pagar todo mês?',
    a: 'Não. Você paga R$39,90 uma única vez e o acesso é seu até o ENEM. Sem mensalidade, sem renovação automática, sem surpresa na fatura.',
  },
  {
    q: 'Como funciona a explicação por IA?',
    a: 'Depois que você responde, a IA gera uma explicação da questão focada no ponto que costuma confundir. Se você errou, ela mostra onde o raciocínio escorregou.',
  },
  {
    q: 'De quais provas são as questões?',
    a: 'Questões reais de ENEM e dos principais vestibulares (FUVEST, UNICAMP, UFU), separadas por área do conhecimento e por assunto.',
  },
  {
    q: 'Como eu pago?',
    a: 'Por PIX (aprovação na hora) ou cartão de crédito. Assim que o pagamento é confirmado, seu acesso é liberado automaticamente.',
  },
]

export default function Landing() {
  useScrollReveal()
  const totalQuestoes = QUESTIONS.length
  const anoRef = useRef(new Date().getFullYear())

  return (
    <div className={styles.page}>
      {/* Fundo gradiente animado que cobre a página inteira */}
      <div className={styles.animatedBg} aria-hidden="true"></div>

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>
              <i className="ti ti-school" aria-hidden="true"></i>
            </span>
            <span><span style={{ color: '#FFFFFF' }}>Aprov</span><span style={{ color: '#8B5CF6' }}>AI</span></span>
          </div>
          <div className={styles.navActions}>
            <a href="#precos" className={styles.navLogin}>Preço</a>
            <Link to="/login" className={styles.navLogin}>Entrar</Link>
            <Link to="/pagamento" className={styles.navCta}>Começar agora</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.heroBadge}>ENEM · FUVEST · UNICAMP · UFU</span>
          <h1 className={styles.heroTitle}>
            Passe no vestibular estudando com IA.
            <span className={styles.heroTitleAccent}> Uma vez. Pra sempre.</span>
          </h1>
          <p className={styles.heroSub}>
            Enquanto outras plataformas <strong>complicam</strong> sua vida com mensalidade e mil
            recursos que você nunca usa, a gente te <span className={styles.heroApprove}>aprova</span> com
            o essencial — uma única vez.
          </p>
          <div className={styles.heroActions}>
            <Link to="/pagamento" className={styles.btnPrimary}>
              <i className="ti ti-rocket" aria-hidden="true"></i> Começar por R$39,90
            </Link>
            <span className={styles.heroNote}>acesso vitalício · PIX ou cartão</span>
          </div>
        </div>

        {/* iPhone com a tela real do app */}
        <div className={styles.heroPhone}>
          <div className={styles.phone}>
            <div className={styles.phoneNotch}></div>
            <div className={styles.phoneScreen}>
              <div className={styles.appHeader}>
                <span className={styles.appLogo}>Aprov<span>AI</span></span>
                <i className="ti ti-user-circle" aria-hidden="true"></i>
              </div>
              <div className={styles.appProgress}>
                <div className={styles.appProgressBar}><div className={styles.appProgressFill}></div></div>
                <span className={styles.appProgressText}><strong>8</strong> de 21</span>
              </div>
              <div className={styles.appCard}>
                <div className={styles.appBadges}>
                  <span className={styles.appBadgeProva}>ENEM 2018</span>
                  <span className={styles.appBadgeArea}>Ciências Humanas</span>
                  <span className={styles.appBadgeAssunto}>História</span>
                </div>
                <p className={styles.appEnunciado}>
                  A Revolução Industrial, iniciada na Inglaterra no século XVIII, impactou
                  diretamente a organização do trabalho ao:
                </p>
                <div className={styles.appOptions}>
                  <div className={styles.appOption}>
                    <span className={styles.appLetra}>A</span>
                    <span>reduzir a jornada de trabalho nas fábricas.</span>
                  </div>
                  <div className={`${styles.appOption} ${styles.appOptionCorrect}`}>
                    <span className={styles.appLetraCorrect}>B</span>
                    <span>substituir o trabalho artesanal pela produção mecanizada.</span>
                    <i className="ti ti-check" aria-hidden="true"></i>
                  </div>
                  <div className={styles.appOption}>
                    <span className={styles.appLetra}>C</span>
                    <span>eliminar a divisão de tarefas na indústria.</span>
                  </div>
                </div>
              </div>
              <div className={styles.appExplain}>
                <div className={styles.appExplainHead}>
                  <i className="ti ti-sparkles" aria-hidden="true"></i>
                  <span>Explicação da IA</span>
                  <span className={styles.appResultOk}><i className="ti ti-circle-check" aria-hidden="true"></i> Você acertou</span>
                </div>
                <p className={styles.appExplainText}>
                  A Revolução Industrial marcou a transição da manufatura artesanal para a
                  produção em fábricas com máquinas. O tear mecânico e a máquina a vapor
                  substituíram o trabalho manual — por isso a alternativa B está correta.
                </p>
              </div>
              <div className={styles.appFooter}>
                <span className={styles.appNext}>Próxima questão <i className="ti ti-arrow-right" aria-hidden="true"></i></span>
                <span className={styles.appCounter}>8 / 21</span>
              </div>
              <div className={styles.phoneHomeBar}></div>
            </div>
          </div>
        </div>
      </header>

      {/* ── ANCORAGEM DE PREÇO ── */}
      <section className={`${styles.section} ${styles.reveal}`}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>A conta que ninguém te mostra</span>
          <h2 className={styles.sectionTitle}>Mensalidade não combina com quem vai passar esse ano</h2>
        </div>
        <div className={styles.compareGrid}>
          <div className={styles.compareCard}>
            <span className={styles.compareLabel}>Plataforma por assinatura</span>
            <div className={styles.comparePriceOld}>R$39,90<span>/mês</span></div>
            <div className={styles.compareYear}>= R$478,80 por ano</div>
            <ul className={styles.compareList}>
              <li><i className="ti ti-x" aria-hidden="true"></i> Cancelou? Perdeu o acesso.</li>
              <li><i className="ti ti-x" aria-hidden="true"></i> Reprovou? Paga tudo de novo.</li>
              <li><i className="ti ti-x" aria-hidden="true"></i> Mil recursos que você nunca abre.</li>
            </ul>
          </div>
          <div className={`${styles.compareCard} ${styles.compareCardHighlight}`}>
            <span className={styles.compareBadge}>AprovAI</span>
            <span className={styles.compareLabel}>Acesso único</span>
            <div className={styles.comparePriceNew}>R$39,90</div>
            <div className={styles.compareYearGood}>uma vez, pra sempre</div>
            <ul className={styles.compareList}>
              <li><i className="ti ti-check" aria-hidden="true"></i> Passou? Ótimo, tarefa cumprida.</li>
              <li><i className="ti ti-check" aria-hidden="true"></i> Não passou? Continua estudando.</li>
              <li><i className="ti ti-check" aria-hidden="true"></i> Só o essencial, sem distração.</li>
            </ul>
          </div>
        </div>
        <p className={styles.compareFooter}>Mesmo número. Frequência bem diferente.</p>
      </section>

      {/* ── FEATURES (benefícios) ── */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Por que funciona</span>
          <h2 className={styles.sectionTitle}>Feito pra você errar menos na prova de verdade</h2>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div className={`${styles.featureCard} ${styles.reveal}`} key={f.title} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className={styles.featureIcon}>
                <i className={`ti ${f.icon}`} aria-hidden="true"></i>
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ÁREAS ── */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Cobertura</span>
          <h2 className={styles.sectionTitle}>Todas as áreas do ENEM e dos vestibulares</h2>
          <p className={styles.sectionSub}>Questões organizadas por área e por assunto, prontas pra filtrar.</p>
        </div>
        <div className={styles.areasGrid}>
          {AREAS.map((a, i) => (
            <div className={`${styles.areaCard} ${styles.reveal}`} data-cor={a.cor} key={a.nome} style={{ transitionDelay: `${i * 70}ms` }}>
              <i className={`ti ${a.icone}`} aria-hidden="true"></i>
              <span>{a.nome}</span>
            </div>
          ))}
        </div>
        <div className={`${styles.statsBar} ${styles.reveal}`}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{totalQuestoes}+</div>
            <div className={styles.statLabel}>Questões reais</div>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.stat}>
            <div className={styles.statValue}>4</div>
            <div className={styles.statLabel}>Vestibulares cobertos</div>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.stat}>
            <div className={styles.statValue}>24/7</div>
            <div className={styles.statLabel}>Explicações por IA</div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Como funciona</span>
          <h2 className={styles.sectionTitle}>Em três passos você já está estudando</h2>
        </div>
        <div className={styles.passosGrid}>
          {PASSOS.map((p, i) => (
            <div className={`${styles.passoCard} ${styles.reveal}`} key={p.numero} style={{ transitionDelay: `${i * 90}ms` }}>
              <div className={styles.passoNumero}>{p.numero}</div>
              <h3 className={styles.passoTitulo}>{p.titulo}</h3>
              <p className={styles.passoDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OBJEÇÕES ── */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Antes de decidir</span>
          <h2 className={styles.sectionTitle}>As dúvidas que todo mundo tem</h2>
        </div>
        <div className={styles.objecoesGrid}>
          {OBJECOES.map((o, i) => (
            <div className={`${styles.objecaoCard} ${styles.reveal}`} key={o.pergunta} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className={styles.objecaoIcon}><i className={`ti ${o.icon}`} aria-hidden="true"></i></div>
              <h3 className={styles.objecaoPergunta}>{o.pergunta}</h3>
              <p className={styles.objecaoResposta}>{o.resposta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OFERTA / PREÇO ── */}
      <section id="precos" className={`${styles.pricingSection} ${styles.reveal}`}>
        <div className={styles.pricingCard}>
          <span className={styles.pricingBadge}>Pagamento único</span>
          <div className={styles.pricingValue}>
            <span className={styles.pricingCurrency}>R$</span>39,90
          </div>
          <p className={styles.pricingSub}>Acesso completo até o ENEM. Sem mensalidade.</p>
          <ul className={styles.pricingList}>
            <li><i className="ti ti-check" aria-hidden="true"></i> Todas as questões e áreas liberadas</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Explicações ilimitadas por IA</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Simulados cronometrados ilimitados</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Revisão de erros e acompanhamento de desempenho</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Sem mensalidade, sem renovação</li>
          </ul>
          <Link to="/pagamento" className={styles.pricingCta}>
            <i className="ti ti-rocket" aria-hidden="true"></i> Garantir meu acesso
          </Link>
          <span className={styles.pricingSafe}>PIX aprovado na hora ou cartão de crédito</span>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Ainda em dúvida?</span>
          <h2 className={styles.sectionTitle}>Perguntas frequentes</h2>
        </div>
        <div className={styles.faqList}>
          {FAQ.map((item, i) => (
            <details className={`${styles.faqItem} ${styles.reveal}`} key={i} style={{ transitionDelay: `${i * 60}ms` }}>
              <summary className={styles.faqQuestion}>
                {item.q}
                <i className="ti ti-chevron-down" aria-hidden="true"></i>
              </summary>
              <p className={styles.faqAnswer}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={`${styles.finalCta} ${styles.reveal}`}>
        <h2 className={styles.finalTitle}>Um vestibular. Uma compra. Sem mensalidade.</h2>
        <p className={styles.finalSub}>Comece agora e estude com a IA até o dia da prova.</p>
        <Link to="/pagamento" className={styles.btnPrimary}>
          <i className="ti ti-rocket" aria-hidden="true"></i> Garantir meu acesso — R$39,90
        </Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span style={{ color: '#FFFFFF' }}>Aprov</span><span style={{ color: '#8B5CF6' }}>AI</span>
        </div>
        <p className={styles.footerText}>Estude com questões reais e feedback inteligente por IA.</p>
        <p className={styles.footerCopy}>© {anoRef.current} AprovAI · aprovai.net.br</p>
      </footer>
    </div>
  )
}