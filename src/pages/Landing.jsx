import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { QUESTIONS } from '../lib/questions'
import styles from './Landing.module.css'

/* Hook: revela elementos com .reveal quando entram na viewport */
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

/* Parallax de cursor: os glows do fundo seguem suavemente o mouse (desktop).
   No celular (sem cursor) eles flutuam sozinhos. Respeita reduced-motion. */
function useParallax() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const g1 = document.querySelector(`.${styles.glowOne}`)
    const g2 = document.querySelector(`.${styles.glowTwo}`)
    if (!g1 && !g2) return

    const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    // Alvos e posições atuais (para suavizar o movimento com easing)
    let targetX = 0, targetY = 0
    let curX1 = 0, curY1 = 0, curX2 = 0, curY2 = 0
    let raf = null

    function animate() {
      // easing: aproxima suavemente a posição atual do alvo
      curX1 += (targetX * 60 - curX1) * 0.06
      curY1 += (targetY * 60 - curY1) * 0.06
      curX2 += (targetX * -45 - curX2) * 0.06
      curY2 += (targetY * -45 - curY2) * 0.06
      if (g1) g1.style.transform = `translate3d(${curX1}px, ${curY1}px, 0)`
      if (g2) g2.style.transform = `translate3d(${curX2}px, ${curY2}px, 0)`
      raf = window.requestAnimationFrame(animate)
    }

    function onMouseMove(e) {
      // -0.5 a 0.5 relativo ao centro da tela
      targetX = e.clientX / window.innerWidth - 0.5
      targetY = e.clientY / window.innerHeight - 0.5
    }

    if (hasMouse) {
      window.addEventListener('mousemove', onMouseMove, { passive: true })
      animate()
    } else {
      // celular: flutuação automática suave em loop
      let t = 0
      function float() {
        t += 0.008
        targetX = Math.sin(t) * 0.5
        targetY = Math.cos(t * 0.7) * 0.5
        curX1 += (targetX * 40 - curX1) * 0.05
        curY1 += (targetY * 40 - curY1) * 0.05
        curX2 += (targetX * -30 - curX2) * 0.05
        curY2 += (targetY * -30 - curY2) * 0.05
        if (g1) g1.style.transform = `translate3d(${curX1}px, ${curY1}px, 0)`
        if (g2) g2.style.transform = `translate3d(${curX2}px, ${curY2}px, 0)`
        raf = window.requestAnimationFrame(float)
      }
      float()
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])
}

// Data oficial do 1º dia de prova do ENEM 2026, conforme edital do INEP
// (divulgado em 22/05/2026): aplicação em 08 e 15/11/2026.
const ENEM_2026 = new Date('2026-11-08T00:00:00-03:00')

function useDiasAteEnem() {
  const hoje = new Date()
  const diff = ENEM_2026.getTime() - hoje.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ── Por que o método tradicional falha ──
const FALHAS_METODO_TRADICIONAL = [
  {
    icon: 'ti-device-tv',
    titulo: 'Vídeo-aula é estudar no piloto automático',
    desc: 'Você assiste, entende na hora e esquece na prova. Assistir alguém resolver não treina o seu raciocínio, só o de quem está explicando.',
  },
  {
    icon: 'ti-help-circle',
    titulo: 'Errar sem saber por quê',
    desc: 'Você marca a errada, olha o gabarito, sente aquele aperto e segue pra próxima. No fim, o mesmo tipo de erro se repete questão após questão.',
  },
  {
    icon: 'ti-compass-off',
    titulo: 'Simulado sem direção nenhuma',
    desc: 'Você faz simulado atrás de simulado, mas ninguém aponta qual matéria, ou qual tipo de questão, está te derrubando de verdade.',
  },
]

// ── Mecanismo único: como a correção por IA funciona, passo a passo ──
const MECANISMO = [
  {
    numero: '1',
    titulo: 'Você resolve a questão real',
    desc: 'Do jeito que vai encarar na prova: sem cola, sem vídeo explicando antes, só você e o enunciado.',
  },
  {
    numero: '2',
    titulo: 'A IA identifica onde o raciocínio quebrou',
    desc: 'Não é só "você errou". É "você confundiu isso com aquilo", o padrão exato por trás da resposta errada.',
  },
  {
    numero: '3',
    titulo: 'Você recebe uma explicação feita pro seu erro',
    desc: 'Não um texto genérico que todo mundo lê igual. Uma explicação que fala diretamente com o que travou você.',
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
  { numero: '2', titulo: 'Resolva questões reais', desc: 'Por área, em simulado cronometrado, ou revisando o que você já errou antes.' },
  { numero: '3', titulo: 'Veja onde você trava', desc: 'Cada erro vira uma explicação sua. Seu desempenho por assunto fica visível o tempo todo.' },
]

const OBJECOES = [
  {
    icon: 'ti-device-tv',
    pergunta: 'É melhor que assistir vídeo-aula?',
    resposta: 'Vídeo-aula você assiste passivo e esquece na semana seguinte. Aqui você resolve, erra e a IA corrige o seu raciocínio na hora. Você aprende fazendo, que é como a prova cobra.',
  },
  {
    icon: 'ti-target-arrow',
    pergunta: 'Funciona pro meu vestibular?',
    resposta: 'Se você vai prestar ENEM, FUVEST, UNICAMP ou UFU, as questões são as mesmas que caem na sua prova, organizadas por área e assunto pra você filtrar o que importa.',
  },
  {
    icon: 'ti-cash',
    pergunta: 'R$39,90 vale a pena?',
    resposta: 'É menos que uma pizza, uma vez só. Uma aula particular custa isso por hora. Um cursinho, centenas por mês. Aqui você paga uma vez e usa até o dia da prova.',
  },
]

// ── Prova social ──────────────────────────────────────────────────────────
// Estrutura pronta para depoimentos reais. Fica vazia (e a seção inteira
// some da página) até alguém preencher com dados verdadeiros. Nunca
// inventar nome, nota ou depoimento aqui.
//
// Formato esperado de cada item:
// {
//   nome: 'Nome do aluno (ou só o primeiro nome, com autorização)',
//   contexto: 'ex: "Aprovado em Medicina, FUVEST 2026"',
//   texto: 'Depoimento real, na íntegra ou resumido com autorização.',
//   foto: '/depoimentos/nome.jpg', // opcional
// }
const DEPOIMENTOS = []

function ProvaSocial() {
  if (DEPOIMENTOS.length === 0) return null
  return (
    <section className={`${styles.section} ${styles.reveal}`}>
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>Quem já usa</span>
        <h2 className={styles.sectionTitle}>Resultado de quem resolveu com a AprovAI</h2>
      </div>
      <div className={styles.depoimentosGrid}>
        {DEPOIMENTOS.map((d, i) => (
          <div className={styles.depoimentoCard} key={d.nome + i}>
            {d.foto && <img src={d.foto} alt={d.nome} className={styles.depoimentoFoto} />}
            <p className={styles.depoimentoTexto}>&ldquo;{d.texto}&rdquo;</p>
            <div className={styles.depoimentoAutor}>
              <strong>{d.nome}</strong>
              <span>{d.contexto}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const SOBRE_E_FAQ = [
  {
    q: 'Como funciona o teste grátis?',
    a: 'Você libera 20 questões completas, com explicação por IA em cada uma, sem pagar nada e sem cadastrar cartão. É pra você sentir como o app funciona antes de decidir.',
  },
  {
    q: 'Como funciona a explicação por IA?',
    a: 'Depois que você responde, a IA gera uma explicação da questão focada no ponto que costuma confundir. Se você errou, ela mostra onde o raciocínio escorregou, não repete o mesmo texto pra todo mundo.',
  },
  {
    q: 'De quais provas são as questões?',
    a: 'Questões reais de ENEM e dos principais vestibulares (FUVEST, UNICAMP, UFU), separadas por área do conhecimento e por assunto.',
  },
  {
    q: 'Preciso pagar todo mês?',
    a: 'Não. Você paga uma única vez e o acesso é vitalício, seu pra sempre. Sem mensalidade, sem renovação automática, sem surpresa na fatura.',
  },
  {
    q: 'Como eu pago?',
    a: 'Por PIX (aprovação na hora) ou cartão de crédito. Assim que o pagamento é confirmado, seu acesso é liberado automaticamente.',
  },
  {
    q: 'A AprovAI é 100% online?',
    a: 'Sim. Você estuda direto do navegador, no computador ou no celular, a qualquer hora. Não precisa instalar nada.',
  },
]

export default function Landing() {
  useScrollReveal()
  useParallax()
  const totalQuestoes = QUESTIONS.length
  const anoRef = useRef(new Date().getFullYear())
  const diasAteEnem = useDiasAteEnem()

  return (
    <div className={styles.page}>
      <div className={styles.animatedBg} aria-hidden="true"></div>
      <div className={styles.glowOne} aria-hidden="true"></div>
      <div className={styles.glowTwo} aria-hidden="true"></div>

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
            <Link to="/teste" className={styles.navCta}>Testar grátis</Link>
          </div>
        </div>
      </nav>

      {/* ============================================================
          1-2. DOR + IDENTIFICAÇÃO
          A headline nomeia a dor central (treinar muito sem confiança
          no resultado). A subheadline explica a causa real do problema
          antes de qualquer menção ao produto.
          ============================================================ */}
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.heroBadge}>ENEM · FUVEST · UNICAMP · UFU</span>
          <h1 className={styles.heroTitle}>
            Você estuda horas <span className={styles.heroTitleAccent}>e ainda não confia na sua nota.</span>
          </h1>
          <p className={styles.heroSub}>
            O problema não é falta de esforço. É que ninguém mostra exatamente <strong className={styles.heroSubHighlight}>onde</strong> seu
            raciocínio quebra. O AprovAI usa IA para analisar cada questão e explicar seus
            erros de forma prática.
          </p>
          <span className={styles.heroPitch}>Pague uma vez. Estude para sempre.</span>
          <div className={styles.heroActions}>
            <Link to="/teste" className={styles.btnPrimary}>
              <i className="ti ti-gift" aria-hidden="true"></i> Resolver minhas primeiras questões gratuitas
            </Link>
          </div>
          <div className={styles.heroTrust}>
            <span><i className="ti ti-check" aria-hidden="true"></i> {totalQuestoes}+ questões reais</span>
            <span><i className="ti ti-check" aria-hidden="true"></i> Explicação por IA</span>
            <span><i className="ti ti-check" aria-hidden="true"></i> Pagamento único</span>
          </div>
        </div>

        {/* PC + celular na frente */}
        <div className={styles.heroDevices}>
          <div className={styles.laptop}>
            <div className={styles.laptopScreen}>
              <div className={styles.appTopbar}>
                <span className={styles.appLogo}>Aprov<span>AI</span></span>
                <div className={styles.appTabs}>
                  <span className={styles.appTabActive}>Questões</span>
                  <span>Simulado</span>
                  <span>Revisão</span>
                  <span>Desempenho</span>
                </div>
                <i className="ti ti-user-circle" aria-hidden="true"></i>
              </div>
              <div className={styles.laptopBody}>
                <div className={styles.laptopCard}>
                  <div className={styles.appBadges}>
                    <span className={styles.appBadgeProva}>ENEM 2019</span>
                    <span className={styles.appBadgeAreaBlue}>Matemática</span>
                    <span className={styles.appBadgeAssunto}>Funções</span>
                  </div>
                  <p className={styles.laptopEnunciado}>
                    Uma função quadrática modela a trajetória de um projétil lançado do solo. Qual a altura máxima atingida?
                  </p>
                  <div className={styles.appOptions}>
                    <div className={styles.appOption}><span className={styles.appLetra}>A</span><span>12 metros</span></div>
                    <div className={`${styles.appOption} ${styles.appOptionCorrect}`}><span className={styles.appLetraCorrect}>B</span><span>20 metros</span><i className="ti ti-check" aria-hidden="true"></i></div>
                    <div className={styles.appOption}><span className={styles.appLetra}>C</span><span>25 metros</span></div>
                    <div className={styles.appOption}><span className={styles.appLetra}>D</span><span>40 metros</span></div>
                  </div>
                </div>
                <div className={styles.laptopExplain}>
                  <div className={styles.appExplainHead}>
                    <i className="ti ti-sparkles" aria-hidden="true"></i>
                    <span>Explicação da IA</span>
                    <span className={styles.appResultOk}><i className="ti ti-circle-check" aria-hidden="true"></i> Você acertou</span>
                  </div>
                  <p className={styles.appExplainText}>
                    A altura máxima está no vértice da parábola. Como o coeficiente de t² é negativo, ela abre pra baixo. Use t = -b/2a para achar o instante do topo e substitua na função para obter 20 metros.
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.laptopBase}></div>
          </div>
        </div>
      </header>

      {/* ============================================================
          FOMO real: só dados verificáveis (contagem real de questões +
          contagem regressiva pra data oficial do ENEM 2026, divulgada
          pelo INEP). Nada de contador falso ou vaga inventada.
          ============================================================ */}
      <section className={`${styles.statsSection} ${styles.reveal}`}>
        <div className={`${styles.statsBar} ${styles.statsBarWide}`}>
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
          <div className={styles.statDivider}></div>
          <div className={styles.stat}>
            <div className={`${styles.statValue} ${styles.statValueUrgent}`}>{diasAteEnem}</div>
            <div className={styles.statLabel}>Dias até o ENEM 2026</div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. POR QUE O MÉTODO TRADICIONAL FALHA
          Ponte entre a dor (seção anterior) e o mecanismo único (a
          seguir): mostra que o problema é estrutural, do jeito que se
          estuda, e não uma falha pessoal do visitante.
          ============================================================ */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Por que você trava</span>
          <h2 className={styles.sectionTitle}>O jeito que todo mundo estuda tem um problema</h2>
        </div>
        <div className={styles.objecoesGrid}>
          {FALHAS_METODO_TRADICIONAL.map((f, i) => (
            <div className={`${styles.objecaoCard} ${styles.reveal}`} key={f.titulo} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className={styles.objecaoIcon}><i className={`ti ${f.icon}`} aria-hidden="true"></i></div>
              <h3 className={styles.objecaoPergunta}>{f.titulo}</h3>
              <p className={styles.objecaoResposta}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          4. MECANISMO ÚNICO
          O coração da página: por que a AprovAI é estruturalmente
          diferente, não só "mais uma plataforma com IA". Explicado como
          processo de 3 passos pra ficar concreto, não abstrato.
          ============================================================ */}
      <section className={`${styles.section} ${styles.mecanismoSection}`}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Por que a AprovAI é diferente</span>
          <h2 className={styles.sectionTitle}>A IA não corrige a questão. Ela corrige o seu raciocínio.</h2>
          <p className={styles.sectionSub}>
            Qualquer plataforma te diz se acertou. A diferença está no que acontece quando você erra.
          </p>
        </div>
        <div className={styles.mecanismoGrid}>
          {MECANISMO.map((m, i) => (
            <div key={m.numero} className={styles.mecanismoStep}>
              <div className={`${styles.passoCard} ${styles.reveal}`} style={{ transitionDelay: `${i * 90}ms` }}>
                <div className={styles.passoNumero}>{m.numero}</div>
                <h3 className={styles.passoTitulo}>{m.titulo}</h3>
                <p className={styles.passoDesc}>{m.desc}</p>
              </div>
              {i < MECANISMO.length - 1 && (
                <i className={`ti ti-arrow-right ${styles.mecanismoArrow}`} aria-hidden="true"></i>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* TESTE GRÁTIS */}
      <section className={`${styles.freeSection} ${styles.reveal}`}>
        <div className={styles.freeCard}>
          <div className={styles.freeIcon}><i className="ti ti-gift" aria-hidden="true"></i></div>
          <div className={styles.freeContent}>
            <h2 className={styles.freeTitle}>20 questões grátis pra você sentir a diferença</h2>
            <p className={styles.freeDesc}>
              Sem cadastrar cartão, sem período de teste que vira cobrança sem avisar. Resolva,
              erre, e veja a explicação apontando exatamente onde você travou, antes de decidir
              qualquer coisa.
            </p>
            <Link to="/teste" className={styles.btnPrimary}>
              <i className="ti ti-player-play" aria-hidden="true"></i> Descobrir meus pontos fracos
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. DEMONSTRAÇÃO DO PRODUTO
          ============================================================ */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Na prática</span>
          <h2 className={styles.sectionTitle}>Em três passos você já está estudando de verdade</h2>
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

      {/* ============================================================
          6. BENEFÍCIOS
          ============================================================ */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>O que muda no seu estudo</span>
          <h2 className={styles.sectionTitle}>Feito pra você errar menos na prova de verdade</h2>
        </div>
        <div className={styles.featuresGrid}>
          {[
            {
              icon: 'ti-message-chatbot',
              title: 'A IA corrige o seu erro, não só a questão',
              desc: 'Errou? Você recebe na hora uma explicação feita pro seu erro específico. Entende onde travou o raciocínio, sem decorar a resposta certa.',
            },
            {
              icon: 'ti-clock-play',
              title: 'Treine sob a pressão do dia da prova',
              desc: 'Monte simulados cronometrados com o número de questões que quiser. Chega no dia da prova sem sentir o relógio como inimigo.',
            },
            {
              icon: 'ti-refresh-dot',
              title: 'Seus erros viram um plano de estudo',
              desc: 'Toda questão errada fica separada num modo de revisão. Você volta nelas até o assunto virar automático, sem adivinhar onde focar.',
            },
            {
              icon: 'ti-chart-bar',
              title: 'Saiba onde você está perdendo pontos',
              desc: 'Sua taxa de acerto por área e por assunto, sempre à vista. Estude o que realmente vai puxar sua nota pra cima.',
            },
          ].map((f, i) => (
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

      {/* ÁREAS */}
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
      </section>

      {/* Prova social: só aparece quando houver depoimentos reais cadastrados */}
      <ProvaSocial />

      {/* ANCORAGEM DE PREÇO */}
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

      {/* OBJEÇÕES */}
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

      {/* GARANTIAS / SEM PEGADINHA */}
      <section className={`${styles.trustStrip} ${styles.reveal}`}>
        <div className={styles.trustItem}>
          <i className="ti ti-shield-check" aria-hidden="true"></i>
          <div>
            <strong>Pagamento único</strong>
            <span>Sem assinatura, sem renovação automática. Você paga uma vez e pronto.</span>
          </div>
        </div>
        <div className={styles.trustItem}>
          <i className="ti ti-file-certificate" aria-hidden="true"></i>
          <div>
            <strong>Questões oficiais</strong>
            <span>Questões reais das provas do ENEM e dos principais vestibulares.</span>
          </div>
        </div>
        <div className={styles.trustItem}>
          <i className="ti ti-gift" aria-hidden="true"></i>
          <div>
            <strong>Teste antes de pagar</strong>
            <span>20 questões grátis, sem cartão. Você só paga se gostar.</span>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. VISUALIZAÇÃO DO FUTURO (future pacing)
          Antes do CTA/oferta final, faz o visitante imaginar o próprio
          progresso, sem prometer aprovação, só o resultado plausível
          de usar o produto: clareza sobre pontos fracos e menos
          insegurança na hora de resolver prova.
          ============================================================ */}
      <section className={`${styles.section} ${styles.reveal}`}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>Daqui a algumas semanas</span>
          <h2 className={styles.sectionTitle}>Dá pra chegar no dia da prova sabendo onde você está</h2>
        </div>
        <div className={styles.futuroGrid}>
          <div className={styles.futuroCard}>
            <i className="ti ti-chart-arrows-vertical" aria-hidden="true"></i>
            <p>Você abre o app e sabe, sem achismo, quais matérias ainda te derrubam e quais já viraram automáticas.</p>
          </div>
          <div className={styles.futuroCard}>
            <i className="ti ti-mood-check" aria-hidden="true"></i>
            <p>Resolve uma prova antiga e sente a diferença: menos trava no meio da questão, mais clareza no raciocínio.</p>
          </div>
          <div className={styles.futuroCard}>
            <i className="ti ti-target-arrow" aria-hidden="true"></i>
            <p>Chega mais perto da prova sabendo exatamente onde vale a pena gastar sua última semana de estudo.</p>
          </div>
        </div>
      </section>

      {/* ============================================================
          OFERTA / PREÇO com promoção
          ============================================================ */}
      <section id="precos" className={`${styles.pricingSection} ${styles.reveal}`}>
        <div className={styles.pricingCard}>
          <span className={styles.promoBadge}><i className="ti ti-flame" aria-hidden="true"></i> Oferta de lançamento</span>
          <div className={styles.pricingPromo}>
            <span className={styles.pricingFrom}>de R$69,90 por</span>
            <div className={styles.pricingValue}>
              <span className={styles.pricingCurrency}>R$</span>39,90
            </div>
          </div>
          <p className={styles.pricingSub}>Preço promocional para os primeiros assinantes. Pagamento único, sem mensalidade.</p>
          <ul className={styles.pricingList}>
            <li><i className="ti ti-check" aria-hidden="true"></i> Todas as questões e áreas liberadas</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Explicações ilimitadas por IA</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Simulados cronometrados ilimitados</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Revisão de erros e acompanhamento de desempenho</li>
            <li><i className="ti ti-check" aria-hidden="true"></i> Sem mensalidade, sem renovação</li>
          </ul>
          <Link to="/pagamento" className={styles.pricingCta}>
            <i className="ti ti-rocket" aria-hidden="true"></i> Garantir meu acesso vitalício
          </Link>
          <span className={styles.pricingSafe}>PIX aprovado na hora ou cartão de crédito</span>
        </div>
      </section>

      {/* ============================================================
          8. CTA FINAL
          ============================================================ */}
      <section className={`${styles.finalCta} ${styles.reveal}`}>
        <h2 className={styles.finalTitle}>Comece grátis. Descubra onde você trava.</h2>
        <p className={styles.finalSub}>20 questões sem pagar nada. Se fizer sentido pra você, o acesso vitalício custa R$39,90.</p>
        <Link to="/teste" className={styles.btnPrimary}>
          <i className="ti ti-gift" aria-hidden="true"></i> Resolver minhas primeiras questões
        </Link>
      </section>

      {/* ============================================================
          9. FAQ (inclui as perguntas sobre o que é a plataforma, que
          antes viviam numa seção "Sobre" separada e redundante)
          ============================================================ */}
      <section className={styles.section}>
        <div className={`${styles.sectionHead} ${styles.reveal}`}>
          <span className={styles.eyebrow}>Antes de começar</span>
          <h2 className={styles.sectionTitle}>Perguntas frequentes</h2>
        </div>
        <div className={styles.faqList}>
          {SOBRE_E_FAQ.map((item, i) => (
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

      {/* QUEM SOMOS */}
      <section className={`${styles.quemSomos} ${styles.reveal}`}>
        <div className={styles.quemSomosInner}>
          <span className={styles.quemSomosEyebrow}>Quem faz a AprovAI</span>
          <p className={styles.quemSomosText}>
            A AprovAI é feita por um estudante da UFU, pra estudantes. Sem curso gravado
            que você nunca termina, sem mensalidade que não para de vir. Só questões reais,
            a IA explicando cada erro e você evoluindo no seu ritmo até o dia da prova.
          </p>
        </div>
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
