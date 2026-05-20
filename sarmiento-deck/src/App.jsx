import { useState, useEffect, useCallback, Fragment } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────

const C = {
  deep:          '#1B3A5C',
  clinica:       '#2563A8',
  optica:        '#D4820A',
  farmacia:      '#4A7C59',
  clinicaLight:  '#7CADDA',
  opticaLight:   '#E8A742',
  farmaciaLight: '#88B292',
  paper:         '#FAFAFA',
  cream:         '#F0EEEB',
  ink:           '#1B3A5C',
  inkSoft:       'rgba(27,58,92,0.62)',
  inkMute:       'rgba(27,58,92,0.42)',
  inkFaint:      'rgba(27,58,92,0.20)',
  ruleSoft:      'rgba(27,58,92,0.08)',
  ruleMid:       'rgba(27,58,92,0.14)',
  paperSoft:     'rgba(255,255,255,0.78)',
  paperMute:     'rgba(255,255,255,0.50)',
  paperFaint:    'rgba(255,255,255,0.28)',
  paperGhost:    'rgba(255,255,255,0.14)',
  ruleDark:      'rgba(255,255,255,0.08)',
};

const F = { serif:'Cormorant Garamond', sans:'Plus Jakarta Sans' };

// Spacing scale
const S = { xs:4, sm:8, md:12, lg:16, xl:24, x2:32, x3:48, x4:64, x5:96, x6:128 };

// Type scale — 5 sizes for TEXT (ornamental numbers are inline, separately tuned)
// All max values calibrated for fixed 1920×1080 canvas
const T = {
  display:    'clamp(56px, 8.5vw, 152px)',  // Hero italic (cover/closing — DOMINATES)
  title:      'clamp(36px, 5vw, 84px)',     // Slide title italic remate
  titleLead:  'clamp(16px, 1.8vw, 28px)',   // Caps lead before title
  subtitle:   'clamp(22px, 2.6vw, 36px)',   // Card titles, intro pulls
  body:       'clamp(16px, 1.8vw, 24px)',   // All reading content
  caption:    'clamp(13px, 1.4vw, 18px)',   // Labels, fine print
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,300;1,400;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{width:100%;height:100%;overflow:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
  @keyframes fu{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fi{from{opacity:0}to{opacity:1}}
  @keyframes fs{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes fsc{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
  @keyframes lw{from{transform:scaleX(0);opacity:0}to{transform:scaleX(1);opacity:1}}
  .fu{animation:fu 0.85s cubic-bezier(.2,.7,0,1.08) both}
  .fi{animation:fi 0.7s ease both}
  .fs{animation:fs 0.8s cubic-bezier(.2,.7,0,1.08) both}
  .fsc{animation:fsc 0.7s cubic-bezier(.2,.7,0,1.08) both}
  .lw{animation:lw 0.8s cubic-bezier(.2,.7,0,1.08) both;transform-origin:left}
  .d0{animation-delay:0s}.d1{animation-delay:.08s}.d2{animation-delay:.2s}
  .d3{animation-delay:.32s}.d4{animation-delay:.44s}.d5{animation-delay:.56s}
  .d6{animation-delay:.68s}.d7{animation-delay:.8s}.d8{animation-delay:.92s}
`;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────

const Dots = ({ size=8, gap, style={} }) => (
  <div style={{ display:'flex', gap:gap||size*0.85, alignItems:'center', lineHeight:0, ...style }}>
    {[C.clinica, C.optica, C.farmacia].map((c,i) => (
      <div key={i} style={{ width:size, height:size, borderRadius:'50%', background:c }}/>
    ))}
  </div>
);

const Accent = ({ width=44, height=2, color=C.optica, style={}, className='' }) => (
  <div className={className} style={{ width, height, background:color, borderRadius:1, ...style }}/>
);

// Eyebrow — small caps label at top of content
const Eyebrow = ({ children, color=C.clinica, dark, style={} }) => (
  <div style={{
    fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
    letterSpacing:'0.18em', textTransform:'uppercase',
    color: dark ? color : color,
    ...style,
  }}>{children}</div>
);

// Ornament — massive italic numbers used as graphic anchors
const Ornament = ({ children, color=C.clinica, size='big', opacity=1, style={} }) => {
  const sizeMap = {
    hero: 'clamp(140px, 22vw, 320px)',
    big:  'clamp(80px, 12vw, 200px)',
    mid:  'clamp(64px, 9vw, 144px)',
    sm:   'clamp(48px, 7vw, 96px)',
  };
  return (
    <div style={{
      fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
      fontSize:sizeMap[size], lineHeight:1,
      letterSpacing:'-0.04em',
      color, opacity,
      userSelect:'none',
      ...style,
    }}>{children}</div>
  );
};

// Headline — sans bold caps lead + serif italic remate (the deck's signature)
const Headline = ({ lead, remate, dark, align='left', heroRemate=false }) => (
  <div style={{ lineHeight:1, textAlign:align }}>
    {lead && (
      <div style={{
        fontFamily:F.sans, fontWeight:700,
        fontSize:T.titleLead, lineHeight:1.2,
        letterSpacing:'0.04em', textTransform:'uppercase',
        color: dark ? C.paperMute : C.inkSoft,
        marginBottom: remate ? S.lg : 0,
      }}>{lead}</div>
    )}
    {remate && (
      <div style={{
        fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
        fontSize: heroRemate ? T.display : T.title,
        lineHeight: heroRemate ? 0.95 : 1.04,
        letterSpacing:'-0.025em',
        color: dark ? '#fff' : C.ink,
      }}>{remate}</div>
    )}
  </div>
);

const Body = ({ children, dark, style={} }) => (
  <p style={{
    fontFamily:F.sans, fontSize:T.body, lineHeight:1.6, fontWeight:400,
    color: dark ? C.paperSoft : C.inkSoft,
    ...style,
  }}>{children}</p>
);

const Caption = ({ children, dark, style={} }) => (
  <p style={{
    fontFamily:F.sans, fontSize:T.caption, lineHeight:1.5, fontWeight:500,
    color: dark ? C.paperMute : C.inkMute,
    ...style,
  }}>{children}</p>
);

const Pull = ({ children, dark, style={} }) => (
  <p style={{
    fontFamily:F.serif, fontStyle:'italic', fontWeight:500,
    fontSize:T.subtitle, lineHeight:1.3, letterSpacing:'-0.01em',
    color: dark ? C.paperSoft : C.ink,
    ...style,
  }}>{children}</p>
);

const SlideTag = ({ n, total, dark }) => (
  <div style={{
    fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
    letterSpacing:'0.14em', textTransform:'uppercase',
    color: dark ? C.paperMute : C.inkMute,
  }}>
    {String(n).padStart(2,'0')}
    <span style={{ opacity:0.5, margin:'0 6px' }}>/</span>
    {String(total).padStart(2,'0')}
  </div>
);

// ─── FRAMES ───────────────────────────────────────────────────────────

const Frame = ({ dark, children, style={}, pad=true }) => (
  <div style={{
    width:'100%', height:'100%',
    background: dark ? C.deep : C.paper,
    backgroundImage: dark ? GRAIN : 'none',
    position:'relative', overflow:'hidden',
    display:'flex', flexDirection:'column',
    padding: pad ? 'clamp(40px, 5.5vw, 88px)' : 0,
    ...style,
  }}>{children}</div>
);

// TopBar — eyebrow on left, slide tag on right (used in most slides)
const TopBar = ({ eyebrow, color, n, total, dark }) => (
  <div className="fi" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
    {eyebrow ? <Eyebrow color={color} dark={dark}>{eyebrow}</Eyebrow> : <div/>}
    <SlideTag n={n} total={total} dark={dark} />
  </div>
);

// BottomBar — pull quote on left, dots on right (used as slide closer)
const BottomBar = ({ children, dark, dots=true }) => (
  <div className="fu d6" style={{
    paddingTop:S.lg, marginTop:S.xl,
    borderTop: `1px solid ${dark ? C.ruleDark : C.ruleSoft}`,
    display:'flex', justifyContent:'space-between', alignItems:'center', gap:S.x2,
  }}>
    <Pull dark={dark} style={{ flex:1, color: dark ? C.paperMute : undefined }}>
      {children}
    </Pull>
    {dots && <Dots size={7} style={{ flexShrink:0 }}/>}
  </div>
);

// ═══ SLIDES ════════════════════════════════════════════════════════════
const TOTAL = 21;

// ── S01 · COVER ───────────────────────────────────────────────────────
function S01() {
  return (
    <Frame dark>
      {/* Top metadata */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div className="fi d1" style={{
          fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
          letterSpacing:'0.2em', color:C.paperFaint, textTransform:'uppercase',
        }}>Propuesta integral · Marca y comunicación</div>
        <SlideTag n={1} total={TOTAL} dark />
      </div>

      {/* HERO — anchored bottom-left, generous empty space above */}
      <div style={{ flex:1, display:'flex', alignItems:'flex-end' }}>
        <div style={{ maxWidth:'min(900px, 88%)', paddingBottom:S.x2 }}>
          <Accent className="lw d2" width={64} style={{ marginBottom:S.x2 }} />
          <div className="fu d3" style={{
            fontFamily:F.sans, fontWeight:700,
            fontSize:'clamp(16px, 1.8vw, 28px)',
            color:C.paperMute, letterSpacing:'0.16em',
            textTransform:'uppercase', marginBottom:S.xl,
          }}>Todo lo que necesitás.</div>
          <div className="fu d4" style={{
            fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
            fontSize:T.display, lineHeight:0.95,
            letterSpacing:'-0.03em', color:'#fff',
          }}>
            En una sola<br/>dirección.
          </div>
        </div>
      </div>

      {/* Bottom row — brand list + city */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:S.xl }}>
        <div className="fu d6" style={{ display:'flex', alignItems:'center', gap:S.x2 }}>
          <Dots size={9} gap={10}/>
          <div style={{ width:1, height:24, background:C.paperGhost }}/>
          <div style={{ display:'flex', gap:S.lg, flexWrap:'wrap' }}>
            {['Clínica', 'Óptica', 'Farmacia'].map((u,i) => (
              <span key={i} style={{
                fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
                color:C.paperMute, letterSpacing:'0.06em',
              }}>{u}</span>
            ))}
          </div>
        </div>
        <div className="fu d7" style={{
          fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
          color:C.paperFaint, letterSpacing:'0.18em', textTransform:'uppercase',
        }}>Formosa · 2026</div>
      </div>
    </Frame>
  );
}

// ── S02 · LO QUE ENCONTRAMOS ──────────────────────────────────────────
function S02() {
  const items = [
    'Más de 14 especialidades médicas bajo un mismo techo. Diagnóstico, laboratorio, internación. Todo.',
    'Tres negocios complementarios que se refuerzan naturalmente entre sí.',
    'Una trayectoria y un nombre que Formosa ya conoce y respeta.',
  ];
  return (
    <div style={{ width:'100%', height:'100%', display:'grid', gridTemplateColumns:'minmax(280px, 42%) 1fr' }}>
      {/* LEFT — dark column with HUGE italic statement */}
      <div style={{
        background:C.deep, backgroundImage:GRAIN,
        padding:'clamp(40px, 5.5vw, 88px)',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
      }}>
        <SlideTag n={2} total={TOTAL} dark />

        <div>
          <Accent className="lw d1" width={48} style={{ marginBottom:S.xl }} />
          <div className="fu d2" style={{
            fontFamily:F.sans, fontWeight:700,
            fontSize:'clamp(16px, 1.8vw, 26px)',
            color:C.paperMute, letterSpacing:'0.16em',
            textTransform:'uppercase', marginBottom:S.md,
          }}>Lo que</div>
          <div className="fu d3" style={{
            fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
            fontSize:'clamp(56px, 8vw, 116px)',
            color:'#fff', lineHeight:0.95,
            letterSpacing:'-0.025em',
          }}>encontramos.</div>
        </div>

        <Dots className="fu d4" size={9} gap={10}/>
      </div>

      {/* RIGHT — content */}
      <div style={{
        background:C.paper,
        padding:'clamp(48px, 6vw, 104px)',
        display:'flex', flexDirection:'column', justifyContent:'center',
        gap:S.x2,
      }}>
        <Pull className="fu d2" style={{ fontSize:'clamp(26px, 3vw, 44px)', maxWidth:'92%' }}>
          "Sarmiento tiene algo que muy pocos<br/>pueden ofrecer en Formosa."
        </Pull>

        <div style={{ marginTop:S.lg }}>
          {items.map((item, i) => (
            <div key={i} className={`fu d${i+3}`} style={{
              display:'grid', gridTemplateColumns:'clamp(80px, 9vw, 130px) 1fr',
              gap:S.x2, alignItems:'center',
              padding:`${S.x2}px 0`,
              borderTop: i === 0 ? `1px solid ${C.ruleSoft}` : 'none',
              borderBottom: `1px solid ${C.ruleSoft}`,
            }}>
              <Ornament color={C.clinica} size="mid" opacity={0.65}>
                {String(i+1).padStart(2,'0')}
              </Ornament>
              <Body>{item}</Body>
            </div>
          ))}
        </div>

        <div className="fu d6" style={{ marginTop:S.lg }}>
          <Accent width={40} style={{ marginBottom:S.md }} />
          <Pull style={{ fontSize:'clamp(22px, 2.4vw, 30px)' }}>
            "Nuestra tarea es que esto se vea."
          </Pull>
        </div>
      </div>
    </div>
  );
}

// ── S03 · LA OPORTUNIDAD ──────────────────────────────────────────────
function S03() {
  const items = [
    { n:'01', color:C.clinica,  title:'Presencia digital',
      body:'Todavía no refleja la dimensión real de la clínica. La web no convierte, las redes son inconsistentes.',
      tag:'Web · Redes · SEO' },
    { n:'02', color:C.optica,   title:'Especialidades',
      body:'Son el mayor diferencial y aún no están comunicadas. Más de 14 áreas que el paciente no sabe que existen.',
      tag:'Comunicación' },
    { n:'03', color:C.farmacia, title:'El ecosistema',
      body:'La óptica y la farmacia pueden capitalizar mucho más la confianza que genera la clínica.',
      tag:'Cross-marca' },
  ];
  return (
    <Frame>
      <TopBar eyebrow="La oportunidad" color={C.optica} n={3} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.lg, marginBottom:S.xl, maxWidth:'min(820px, 90%)' }}>
        <Headline lead="La oportunidad está ahí." remate="Solo falta el sistema." />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        {items.map((item, i) => (
          <div key={i} className={`fu d${i+3}`} style={{
            display:'grid',
            gridTemplateColumns:'clamp(100px, 12vw, 180px) 1fr auto',
            gap:'clamp(20px, 2.5vw, 40px)', alignItems:'center',
            padding:`${S.lg}px 0`,
            borderTop: `1px solid ${C.ruleSoft}`,
            borderBottom: i === items.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
          }}>
            <Ornament color={item.color} size="mid" opacity={0.7}>{item.n}</Ornament>
            <div style={{ maxWidth:'min(580px, 92%)' }}>
              <div style={{
                fontFamily:F.sans, fontSize:T.subtitle, fontWeight:700,
                color:C.ink, marginBottom:S.sm,
                letterSpacing:'-0.015em',
              }}>{item.title}</div>
              <Body>{item.body}</Body>
            </div>
            {/* Right-anchored tag — visual balance + functional context */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:S.sm }}>
              <div style={{
                fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
                letterSpacing:'0.16em', textTransform:'uppercase',
                color:item.color,
              }}>{item.tag}</div>
              <Accent width={32} color={item.color} />
            </div>
          </div>
        ))}
      </div>

      <BottomBar>"De eso se trata este trabajo."</BottomBar>
    </Frame>
  );
}

// ── S04 · TRANSFORMACIÓN ──────────────────────────────────────────────
function S04() {
  const rows = [
    ['Una clínica',              'El referente de salud integral de Formosa'],
    ['Tres negocios separados',  'Un ecosistema que trabaja junto'],
    ['Presencia dispersa',       'Confianza antes de la primera consulta'],
  ];
  return (
    <div style={{ width:'100%', height:'100%', display:'flex' }}>
      {/* LEFT — dark statement */}
      <div style={{
        flex:'0 0 44%', background:C.deep, backgroundImage:GRAIN,
        padding:'clamp(40px, 5.5vw, 88px)',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
      }}>
        <SlideTag n={4} total={TOTAL} dark />
        <div style={{ maxWidth:'95%' }}>
          <Accent className="lw d1" width={48} style={{ marginBottom:S.xl }} />
          <div className="fu d2" style={{
            fontFamily:F.sans, fontWeight:700,
            fontSize:'clamp(16px, 1.8vw, 26px)',
            color:C.paperMute, letterSpacing:'0.16em',
            textTransform:'uppercase', marginBottom:S.md,
          }}>Estamos construyendo una marca.</div>
          <div className="fu d3" style={{
            fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
            fontSize:'clamp(40px, 6vw, 84px)',
            color:'#fff', lineHeight:0.98,
            letterSpacing:'-0.025em',
          }}>Haciendo visible<br/>lo que existe.</div>
        </div>
        <Dots className="fu d4" size={9} gap={10}/>
      </div>

      {/* RIGHT — comparison */}
      <div style={{
        flex:1, background:C.cream,
        padding:'clamp(40px, 5.5vw, 88px)',
        display:'flex', flexDirection:'column', justifyContent:'center',
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', columnGap:S.x2, marginBottom:S.lg }}>
          {['Hoy', 'Con el sistema'].map((h, i) => (
            <div key={i} style={{
              fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
              letterSpacing:'0.18em', textTransform:'uppercase',
              paddingBottom:S.md,
              color: i === 0 ? C.inkMute : C.clinica,
              borderBottom: `2px solid ${i === 0 ? C.ruleMid : C.clinica}`,
            }}>{h}</div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={i} className={`fu d${i+2}`} style={{
            display:'grid', gridTemplateColumns:'1fr 1fr', columnGap:S.x2,
            padding:`${S.lg}px 0`,
            borderBottom:`1px solid ${C.ruleSoft}`,
          }}>
            <div style={{ fontFamily:F.sans, fontSize:T.body, color:C.inkMute }}>
              {row[0]}
            </div>
            <div style={{
              fontFamily:F.sans, fontSize:T.body, fontWeight:600, color:C.ink,
              display:'flex', alignItems:'center', gap:S.md,
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:C.farmacia, flexShrink:0 }}/>
              {row[1]}
            </div>
          </div>
        ))}
        <div className="fu d5" style={{ marginTop:S.x2 }}>
          <Accent width={40} style={{ marginBottom:S.md }} />
          <Pull style={{ fontSize:'clamp(22px, 2.4vw, 32px)' }}>
            "Todo lo que necesitás.<br/>En una sola dirección."
          </Pull>
        </div>
      </div>
    </div>
  );
}

// ── S05 · EL AÑO 1 · COMO SE VE SARMIENTO EN 12 MESES ────────────────
function Year1() {
  const milestones = [
    {
      time:'2', label:'Mes 2', title:'Bases construidas',
      color:C.clinica, light:C.clinicaLight,
      items:[
        'Identidad de las 4 marcas entregada',
        'Landing page con gestor de turnos en producción',
        'Señalética entregada para implementación',
        'Sistema de trabajo operativo',
      ],
    },
    {
      time:'6', label:'Mes 6', title:'Sistema en marcha',
      color:C.optica, light:C.opticaLight,
      items:[
        '3 cuentas con varios meses de contenido',
        'Web posicionando en búsquedas locales',
        'Audiencia inicial construida',
        'Primeras métricas mensuales estables',
      ],
    },
    {
      time:'12', label:'Mes 12', title:'Resultados consolidados',
      color:C.farmacia, light:C.farmaciaLight,
      items:[
        'Audiencia establecida en las 3 cuentas',
        'Reconocimiento del nombre en Formosa',
        'Flujo constante de consultas digitales',
        'Base lista para la nueva clínica',
      ],
    },
  ];

  return (
    <Frame>
      <TopBar eyebrow="El año 1" color={C.clinica} n={5} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.lg, marginBottom:S.xl, maxWidth:'min(900px, 92%)' }}>
        <Headline lead="Cómo se ve Sarmiento" remate="dentro de 12 meses." />
      </div>

      {/* Timeline: 3 milestones in horizontal columns */}
      <div style={{
        flex:1,
        display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
        columnGap:'clamp(32px, 4vw, 64px)',
      }}>
        {milestones.map((m, i) => (
          <div key={i} className={`fu d${i+3}`} style={{
            display:'flex', flexDirection:'column',
            paddingTop:S.lg,
            borderTop:`1px solid ${C.ruleSoft}`,
          }}>
            <Ornament color={m.light} size="mid" opacity={0.65} style={{ marginBottom:S.lg }}>
              {m.time}
            </Ornament>

            <div style={{
              fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
              letterSpacing:'0.16em', textTransform:'uppercase',
              color:m.color, marginBottom:S.xs,
            }}>{m.label}</div>

            <div style={{
              fontFamily:F.sans, fontWeight:700,
              fontSize:T.subtitle, color:C.ink,
              letterSpacing:'-0.015em', lineHeight:1.15,
              marginBottom:S.lg,
            }}>{m.title}</div>

            <div style={{ display:'flex', flexDirection:'column', gap:S.sm }}>
              {m.items.map((item, j) => (
                <div key={j} style={{ display:'flex', gap:S.sm, alignItems:'flex-start' }}>
                  <div style={{
                    width:5, height:5, borderRadius:'50%',
                    background:m.color, flexShrink:0, marginTop:10,
                  }}/>
                  <Body style={{ lineHeight:1.5 }}>{item}</Body>
                </div>
              ))}
            </div>

            <Accent width={28} color={m.color} style={{ marginTop:S.lg }} />
          </div>
        ))}
      </div>

      <BottomBar>"Los hitos son direccionales. Los tiempos se ajustan al ritmo de Sarmiento."</BottomBar>
    </Frame>
  );
}

// ── S06 · BRAND SYSTEM PARA SALUD · NUESTRO MÉTODO ────────────────────
function Method() {
  const principles = [
    { n:'01', color:C.clinicaLight,   accent:C.clinica,  title:'Confianza antes que deseo',
      body:'La salud se elige con confianza, no con aspiración. La marca tiene que generar seguridad, no envidia.' },
    { n:'02', color:C.opticaLight,    accent:C.optica,   title:'Sistema antes que estética',
      body:'La arquitectura sostiene todo lo demás. Primero ordenamos cómo se relacionan las marcas, después diseñamos.' },
    { n:'03', color:C.farmaciaLight,  accent:C.farmacia, title:'Coherencia sin uniformidad',
      body:'Cada unidad con voz propia, todas con una misma marca. Clínica, óptica y farmacia no son lo mismo.' },
    { n:'04', color:C.clinicaLight,   accent:C.clinica,  title:'Lenguaje médico, código humano',
      body:'Autoridad técnica con calidez real. No hablamos como hospital frío ni como anuncio de bienestar.' },
  ];
  return (
    <Frame dark>
      <TopBar eyebrow="El método" color={C.opticaLight} n={6} total={TOTAL} dark />

      <div className="fu d2" style={{ marginTop:S.lg, marginBottom:S.lg, maxWidth:'min(960px, 92%)' }}>
        <div style={{
          fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
          fontSize:T.title, lineHeight:1.05,
          letterSpacing:'-0.025em', color:'#fff',
        }}>Brand System para Salud.</div>
      </div>

      <div className="fu d3" style={{
        fontFamily:F.sans, fontSize:T.body, fontWeight:400,
        color:C.paperMute, lineHeight:1.5,
        maxWidth:'min(720px, 86%)',
        marginBottom:S.xl,
      }}>
        Un método de marca para ecosistemas de salud con múltiples unidades.
      </div>

      {/* 2x2 grid of principles */}
      <div style={{
        flex:1,
        display:'grid',
        gridTemplateColumns:'1fr 1fr',
        gridTemplateRows:'1fr 1fr',
        columnGap:'clamp(32px, 4vw, 64px)',
        rowGap:S.lg,
      }}>
        {principles.map((p, i) => (
          <div key={i} className={`fu d${i+4}`} style={{
            display:'grid',
            gridTemplateColumns:'clamp(56px, 6.5vw, 88px) 1fr',
            gap:S.lg, alignItems:'flex-start',
            borderTop:`1px solid ${C.ruleDark}`,
            paddingTop:S.lg,
          }}>
            <Ornament color={p.color} size="sm" opacity={0.85}>{p.n}</Ornament>
            <div>
              <div style={{
                fontFamily:F.sans, fontWeight:700,
                fontSize:T.subtitle, color:'#fff',
                marginBottom:S.sm, letterSpacing:'-0.015em',
                lineHeight:1.15,
              }}>{p.title}</div>
              <Body dark>{p.body}</Body>
              <Accent width={28} color={p.accent} style={{ marginTop:S.md }} />
            </div>
          </div>
        ))}
      </div>

      <BottomBar dark>"El método que sostiene a Sarmiento."</BottomBar>
    </Frame>
  );
}

// ── S06 · LA PROPUESTA ────────────────────────────────────────────────
function S05() {
  const items = [
    { n:'01', label:'Identidad Visual',  sub:'Marca madre + 3 unidades',  color:C.clinica,  light:C.clinicaLight },
    { n:'02', label:'Web',                sub:'Landing que convierte',     color:C.optica,   light:C.opticaLight },
    { n:'03', label:'Redes Sociales',    sub:'3 cuentas con criterio',     color:C.farmacia, light:C.farmaciaLight },
    { n:'04', label:'Contenido',          sub:'Sistema mensual',           color:C.clinica,  light:C.clinicaLight },
    { n:'05', label:'Espacio Físico',    sub:'Señalética y cartelería',    color:C.optica,   light:C.opticaLight },
    { n:'06', label:'Método',             sub:'Ciclo sin fricciones',      color:C.farmacia, light:C.farmaciaLight },
  ];
  return (
    <Frame dark>
      <TopBar eyebrow="La propuesta" color={C.opticaLight} n={7} total={TOTAL} dark />

      <div className="fu d2" style={{ marginTop:S.lg, marginBottom:S.xl, maxWidth:'min(820px, 92%)' }}>
        <Headline lead="Un sistema completo." remate="Construido para durar." dark />
      </div>

      {/* Open grid — no container box, divisions through subtle horizontal rules */}
      <div style={{
        flex:1,
        display:'grid',
        gridTemplateColumns:'repeat(3, 1fr)',
        gridTemplateRows:'1fr 1fr',
        columnGap:'clamp(24px, 3vw, 56px)',
        rowGap:0,
      }}>
        {items.map((item, i) => (
          <div key={i} className={`fsc d${i+1}`} style={{
            padding:`${S.lg}px 0`,
            display:'flex', flexDirection:'column', justifyContent:'space-between',
            gap:S.md,
            borderTop: `1px solid ${C.ruleDark}`,
            borderBottom: i >= 3 ? `1px solid ${C.ruleDark}` : 'none',
            position:'relative', minWidth:0,
          }}>
            <Ornament color={item.light} size="mid" opacity={0.85}>{item.n}</Ornament>

            <div>
              <div style={{
                fontFamily:F.sans, fontWeight:700,
                fontSize:T.subtitle, color:'#fff',
                marginBottom:S.xs, letterSpacing:'-0.015em',
              }}>{item.label}</div>
              <Caption dark>{item.sub}</Caption>
              <Accent width={32} color={item.color} style={{ marginTop:S.md }} />
            </div>
          </div>
        ))}
      </div>

      <BottomBar dark>"Cada pieza conecta con las demás. Nada existe por separado."</BottomBar>
    </Frame>
  );
}

// ── S06 · ARQUITECTURA DE MARCA ───────────────────────────────────────
function S06() {
  const units = [
    { label:'Clínica Sarmiento',   color:C.clinica,  tag:'Autoridad médica' },
    { label:'Centro Óptico',       color:C.optica,   tag:'Visión y estilo' },
    { label:'Farmacia',             color:C.farmacia, tag:'Salud y bienestar' },
  ];
  return (
    <Frame>
      <TopBar eyebrow="Arquitectura de marca" n={8} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x2, maxWidth:'min(820px, 90%)' }}>
        <Headline lead="Una marca madre." remate="Tres identidades propias." />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0 }}>
        {/* Parent */}
        <div className="fsc d2" style={{
          background:C.deep, borderRadius:14,
          padding:`${S.lg}px ${S.x3}px`,
          boxShadow:'0 16px 48px rgba(27,58,92,0.22)',
          textAlign:'center',
        }}>
          <div style={{
            fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
            fontSize:'clamp(36px, 4.5vw, 64px)',
            color:'#fff', lineHeight:1,
            letterSpacing:'-0.02em',
          }}>Sarmiento</div>
          <div style={{
            fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
            color:C.paperMute, letterSpacing:'0.18em',
            textTransform:'uppercase', marginTop:S.sm,
          }}>Marca madre institucional</div>
        </div>

        {/* Connector */}
        <div className="fi d3" style={{ width:'72%', position:'relative', height:S.x2 }}>
          <div style={{
            position:'absolute', top:0, left:'16.66%', right:'16.66%',
            height:1, background:C.ruleMid,
          }}/>
          {[0,1,2].map(i => (
            <div key={i} style={{
              position:'absolute', top:0, left:`${16.66 + i*33.33}%`,
              width:1, height:S.x2, background:C.ruleMid,
            }}/>
          ))}
        </div>

        {/* Units */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:S.lg, width:'100%' }}>
          {units.map((u, i) => (
            <div key={i} className={`fu d${i+3}`} style={{
              background:'#fff',
              border:`1px solid ${C.ruleSoft}`,
              borderTop:`4px solid ${u.color}`,
              borderRadius:14,
              padding:'clamp(20px, 2.6vw, 32px)',
              boxShadow:'0 6px 24px rgba(27,58,92,0.06)',
            }}>
              <div style={{
                width:40, height:40, borderRadius:10,
                background:`${u.color}15`,
                display:'flex', alignItems:'center', justifyContent:'center',
                marginBottom:S.lg,
              }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background:u.color }}/>
              </div>
              <div style={{
                fontFamily:F.sans, fontWeight:700,
                fontSize:T.subtitle, color:C.ink,
                marginBottom:S.sm, letterSpacing:'-0.015em',
              }}>{u.label}</div>
              <div style={{
                fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
                color:u.color, letterSpacing:'0.14em',
                textTransform:'uppercase',
              }}>{u.tag}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomBar>"Una arquitectura que sostiene todo lo demás."</BottomBar>
    </Frame>
  );
}

// ── S08 · POR QUÉ EXISTE SARMIENTO ────────────────────────────────────
function S07() {
  const items = [
    { n:'01', color:C.clinicaLight,   accent:C.clinica,  title:'Autoridad compartida',
      body:'Cuando la clínica construye reputación, esa confianza se transfiere a la óptica y a la farmacia. La marca trabaja para los tres.' },
    { n:'02', color:C.opticaLight,    accent:C.optica,   title:'Escalabilidad',
      body:'Si en el futuro suman una nueva unidad, el sistema ya tiene lugar. No hay que reconstruir nada.' },
    { n:'03', color:C.farmaciaLight,  accent:C.farmacia, title:'Coherencia sin uniformidad',
      body:'Cada unidad tiene su propia voz. Sarmiento es el hilo que las conecta sin que ninguna pierda identidad.' },
  ];
  return (
    <Frame dark>
      <TopBar eyebrow="Por qué existe Sarmiento" color={C.opticaLight} n={9} total={TOTAL} dark />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x3, maxWidth:'min(820px, 92%)' }}>
        <Headline lead="Una marca madre" remate="Tres voces propias." dark />
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:S.lg, alignItems:'stretch' }}>
        {items.map((item, i) => (
          <div key={i} className={`fsc d${i+3}`} style={{
            background:'rgba(255,255,255,0.035)',
            border:'1px solid rgba(255,255,255,0.06)',
            borderTop:`4px solid ${item.accent}`,
            borderRadius:14,
            padding:'clamp(28px, 3.2vw, 40px)',
            display:'flex', flexDirection:'column',
            gap:S.lg, position:'relative', overflow:'hidden',
          }}>
            {/* Ornament number — anchors the top */}
            <Ornament color={item.color} size="big" opacity={0.78}>{item.n}</Ornament>

            {/* Title + body — flows naturally after number */}
            <div style={{ marginTop:S.md }}>
              <div style={{
                fontFamily:F.sans, fontWeight:700,
                fontSize:T.subtitle, color:'#fff',
                marginBottom:S.md, letterSpacing:'-0.015em',
              }}>{item.title}</div>
              <Body dark>{item.body}</Body>
            </div>

            <Accent width={32} color={item.accent} style={{ marginTop:'auto' }} />
          </div>
        ))}
      </div>

      <BottomBar dark>"Las hace más grandes a las tres."</BottomBar>
    </Frame>
  );
}

// ── S09 · SISTEMA VISUAL ──────────────────────────────────────────────
function S08() {
  const palette = [
    { color:C.deep,     name:'Sarmiento', hex:'#1B3A5C' },
    { color:C.clinica,  name:'Clínica',   hex:'#2563A8' },
    { color:C.optica,   name:'Óptica',    hex:'#D4820A' },
    { color:C.farmacia, name:'Farmacia',  hex:'#4A7C59' },
    { color:C.cream,    name:'Neutro',    hex:'#F0EEEB', light:true },
  ];
  return (
    <div style={{ width:'100%', height:'100%', display:'flex' }}>
      {/* LEFT — color block treatment */}
      <div style={{
        flex:'0 0 46%', background:C.deep, backgroundImage:GRAIN,
        padding:'clamp(40px, 5.5vw, 76px)',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
      }}>
        <div>
          <SlideTag n={10} total={TOTAL} dark />
          <div className="fu d1" style={{ marginTop:S.xl }}>
            <Eyebrow color={C.opticaLight} dark>Sistema visual</Eyebrow>
            <div style={{
              fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
              fontSize:'clamp(84px, 12.5vw, 168px)',
              color:'#fff', lineHeight:0.9,
              letterSpacing:'-0.03em', marginTop:S.lg,
            }}>Color.</div>
          </div>
        </div>

        <div className="fu d2" style={{ display:'flex', flexDirection:'column', gap:S.sm }}>
          {palette.map((p, i) => (
            <div key={i} style={{
              height:'clamp(44px, 5.5vw, 60px)',
              background:p.color, borderRadius:10,
              border: p.light ? `1px solid ${C.ruleSoft}` : 'none',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:`0 ${S.lg}px`,
              boxShadow: p.light ? 'none' : `0 4px 18px ${p.color}44`,
            }}>
              <span style={{
                fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
                color: p.light ? C.inkSoft : 'rgba(255,255,255,0.82)',
              }}>{p.name}</span>
              <span style={{
                fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
                color: p.light ? C.inkMute : 'rgba(255,255,255,0.5)',
                letterSpacing:'0.08em',
              }}>{p.hex}</span>
            </div>
          ))}
        </div>
        <Dots className="fu d3" size={9} gap={10}/>
      </div>

      {/* RIGHT — typography */}
      <div style={{
        flex:1, background:C.paper,
        padding:'clamp(40px, 5.5vw, 88px)',
        display:'flex', flexDirection:'column', justifyContent:'center',
        gap:S.xl,
      }}>
        <Eyebrow>Tipografía</Eyebrow>

        <div className="fu d2" style={{
          background:C.cream, borderRadius:14,
          padding:'clamp(24px, 3vw, 40px)',
        }}>
          <div style={{ marginBottom:S.sm, lineHeight:1 }}>
            <span style={{
              fontFamily:F.sans, fontWeight:800,
              fontSize:'clamp(28px, 3.4vw, 46px)',
              color:C.ink, letterSpacing:'-0.025em',
              textTransform:'uppercase',
            }}>SARMIENTO </span>
            <span style={{
              fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
              fontSize:'clamp(32px, 4vw, 58px)',
              color:C.ink, letterSpacing:'-0.02em',
            }}>salud.</span>
          </div>
          <Caption>Plus Jakarta 800 + Cormorant Garamond italic</Caption>
        </div>

        <div className="fu d3" style={{
          background:C.cream, borderRadius:14,
          padding:'clamp(20px, 2.6vw, 32px)',
        }}>
          <div style={{
            fontFamily:F.sans, fontWeight:500,
            fontSize:'clamp(18px, 2.1vw, 28px)',
            color:C.ink, marginBottom:S.xs,
          }}>Clínica · Óptica · Farmacia</div>
          <Caption>Plus Jakarta 500 — UI y cuerpo</Caption>
        </div>

        <div className="fu d4" style={{ marginTop:S.md }}>
          <div style={{ height:1, background:C.ruleSoft, marginBottom:S.lg }}/>
          <Eyebrow>Concepto visual</Eyebrow>
          <Pull style={{ marginTop:S.md, fontSize:'clamp(26px, 3.2vw, 42px)' }}>
            "Real. Limpio. Humano."
          </Pull>
          <Body style={{ marginTop:S.sm }}>
            Fotografía real. Espacios reales. Equipo médico real. Sin stock genérico.
          </Body>
        </div>
      </div>
    </div>
  );
}

// ── S10 · WEB ─────────────────────────────────────────────────────────
function S09() {
  const rows = [
    ['3 páginas estáticas',          'Estructura completa de conversión'],
    ['Sin SEO',                       'Visible en Google para búsquedas locales'],
    ['Sin turnos online',             'CTA en cada sección'],
    ['14 especialidades invisibles',  'Grilla navegable de especialidades'],
    ['No optimizado para mobile',     'Mobile-first'],
  ];
  return (
    <Frame>
      <TopBar eyebrow="Web" color={C.clinica} n={11} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x3, maxWidth:'min(820px, 90%)' }}>
        <Headline lead="Un sitio que trabaja" remate="mientras la clínica atiende." />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', columnGap:S.x2, marginBottom:S.md }}>
          {['Situación actual', 'Nueva landing'].map((h, i) => (
            <div key={i} style={{
              fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
              letterSpacing:'0.18em', textTransform:'uppercase',
              paddingBottom:S.md,
              color: i === 0 ? C.inkMute : C.clinica,
              borderBottom:`2px solid ${i === 0 ? C.ruleMid : C.clinica}`,
            }}>{h}</div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={i} className={`fu d${i+2}`} style={{
            display:'grid', gridTemplateColumns:'1fr 1fr', columnGap:S.x2,
            borderBottom:`1px solid ${C.ruleSoft}`,
          }}>
            <div style={{
              fontFamily:F.sans, fontSize:T.body, color:C.inkMute,
              padding:`${S.md}px 0`,
            }}>{row[0]}</div>
            <div style={{
              fontFamily:F.sans, fontSize:T.body, fontWeight:600, color:C.ink,
              padding:`${S.md}px 0`,
              display:'flex', alignItems:'center', gap:S.md,
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:C.farmacia, flexShrink:0 }}/>
              {row[1]}
            </div>
          </div>
        ))}
      </div>

      <BottomBar>"El 80% del tráfico en salud llega desde el celular."</BottomBar>
    </Frame>
  );
}

// ── S11 · REDES SOCIALES ──────────────────────────────────────────────
function S10() {
  const units = [
    { name:'Clínica Sarmiento',         color:C.clinica,  light:C.clinicaLight,  tag:'Autoridad médica',
      content:'Especialidades · Equipo · Tecnología · Salud preventiva',
      freq:'4 posts + 5 stories' },
    { name:'Centro Óptico Sarmiento',   color:C.optica,   light:C.opticaLight,   tag:'Visión y estilo',
      content:'Productos · Tendencias · Consejos · Conexión con clínica',
      freq:'4 posts + 4 stories' },
    { name:'Farmacia Sarmiento',         color:C.farmacia, light:C.farmaciaLight, tag:'Salud y bienestar',
      content:'Salud cotidiana · Productos · Recordatorios · Tratamientos',
      freq:'3 posts + 3 stories' },
  ];
  return (
    <Frame dark>
      <TopBar eyebrow="Redes sociales" color={C.clinicaLight} n={12} total={TOTAL} dark />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x2, maxWidth:'min(820px, 92%)' }}>
        <Headline lead="Tres cuentas." remate="Un solo sistema." dark />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:S.md, justifyContent:'center' }}>
        {units.map((u, i) => (
          <div key={i} className={`fs d${i+3}`} style={{
            display:'grid', gridTemplateColumns:'auto 1fr auto',
            gap:'clamp(20px, 2.6vw, 36px)', alignItems:'center',
            padding:'clamp(20px, 2.6vw, 30px) clamp(24px, 3vw, 36px)',
            background:'rgba(255,255,255,0.035)',
            borderRadius:14,
            borderLeft:`4px solid ${u.color}`,
          }}>
            <Ornament color={u.light} size="sm" opacity={0.9}>{String(i+1).padStart(2,'0')}</Ornament>
            <div>
              <div style={{ display:'flex', gap:S.md, alignItems:'center', marginBottom:S.xs, flexWrap:'wrap' }}>
                <div style={{
                  fontFamily:F.sans, fontWeight:700,
                  fontSize:T.subtitle, color:'#fff',
                  letterSpacing:'-0.015em',
                }}>{u.name}</div>
                <div style={{
                  fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
                  letterSpacing:'0.14em', textTransform:'uppercase',
                  color:u.light, background:`${u.color}22`,
                  padding:'4px 10px', borderRadius:99,
                }}>{u.tag}</div>
              </div>
              <Caption dark>{u.content}</Caption>
            </div>
            <div style={{
              fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
              color:u.light, whiteSpace:'nowrap',
              background:`${u.color}18`,
              padding:`${S.sm}px ${S.md}px`, borderRadius:8,
            }}>{u.freq}</div>
          </div>
        ))}
      </div>

      <BottomBar dark>"Las redes son donde el paciente decide si confía antes de llamar."</BottomBar>
    </Frame>
  );
}

// ── S12 · CONTENIDO (Sistema temático) ────────────────────────────────
function S11() {
  const units = [
    { name:'Clínica',   color:C.clinica,  tag:'Educativo',
      post:'Post educativo + reel del médico explicando qué incluye un control general.' },
    { name:'Óptica',    color:C.optica,   tag:'Conversacional',
      post:'"¿Cuándo fue tu último control visual?" CTA directo a turno de oftalmología.' },
    { name:'Farmacia',  color:C.farmacia, tag:'Informativo',
      post:'Los análisis de rutina que deberían ser hábito. Story con recordatorio.' },
  ];
  return (
    <Frame>
      <TopBar eyebrow="Contenido" color={C.clinica} n={13} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x2, maxWidth:'min(820px, 92%)' }}>
        <Headline lead="Tres cuentas." remate="Una misma historia." />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:S.xl }}>
        {/* Theme block */}
        <div className="fu d3">
          <div style={{ display:'flex', alignItems:'center', gap:S.lg, marginBottom:S.lg }}>
            <Eyebrow>Semana temática</Eyebrow>
            <div style={{ flex:1, height:1, background:C.ruleSoft }}/>
          </div>
          <Pull style={{ fontSize:'clamp(32px, 4vw, 56px)', maxWidth:'90%' }}>
            "Cuidá tu salud antes de que sea urgente."
          </Pull>
        </div>

        {/* Three coordinated posts */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:S.lg, position:'relative' }}>
          {/* Top connecting line */}
          <div className="lw d4" style={{
            position:'absolute', top:-S.lg, left:'16.66%', right:'16.66%',
            height:1, background:C.ruleMid,
          }}/>
          {units.map((u, i) => (
            <div key={i} className={`fu d${i+4}`} style={{
              background:C.cream, borderRadius:14,
              padding:'clamp(20px, 2.6vw, 32px)',
              borderTop:`4px solid ${u.color}`,
              display:'flex', flexDirection:'column', gap:S.md,
              position:'relative',
            }}>
              <div style={{
                position:'absolute', top:-S.lg, left:'50%',
                width:1, height:S.lg, background:C.ruleMid,
              }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{
                  fontFamily:F.sans, fontWeight:700,
                  fontSize:T.subtitle, color:C.ink,
                  letterSpacing:'-0.015em',
                }}>{u.name}</div>
                <div style={{
                  fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
                  letterSpacing:'0.14em', textTransform:'uppercase',
                  color:u.color, background:`${u.color}18`,
                  padding:'4px 10px', borderRadius:99,
                }}>{u.tag}</div>
              </div>
              <Body>{u.post}</Body>
            </div>
          ))}
        </div>
      </div>

      <BottomBar>"El mismo tema, tres ángulos. Coherencia sin repetición."</BottomBar>
    </Frame>
  );
}

// ── S13 · ESPACIO FÍSICO ──────────────────────────────────────────────
function S12() {
  const blocks = [
    { n:'01', color:C.clinica,  title:'Fachada y acceso',
      body:'Cartelería exterior, horarios, identidad visible desde la calle. El primer contacto empieza antes de entrar.' },
    { n:'02', color:C.optica,   title:'Interior y señalética',
      body:'Recepción, consultorios, pasillos. Cada espacio comunica que estás en el lugar correcto.' },
    { n:'03', color:C.farmacia, title:'El ecosistema visible',
      body:'Que quien entra a la clínica sepa que existe la óptica. El espacio activa el flujo que las redes no pueden hacer solas.' },
  ];
  return (
    <Frame>
      <TopBar eyebrow="Espacio físico" color={C.farmacia} n={14} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x3, maxWidth:'min(820px, 90%)' }}>
        <Headline lead="La marca no vive" remate="solo en la pantalla." />
      </div>

      {/* Horizontal journey: 01 → 02 → 03 */}
      <div style={{
        flex:1,
        display:'grid', gridTemplateColumns:'1fr auto 1fr auto 1fr',
        alignItems:'center', gap:0,
      }}>
        {blocks.map((b, i) => (
          <Fragment key={i}>
            <div className={`fu d${i+3}`} style={{
              display:'flex', flexDirection:'column', gap:S.md,
              padding:`${S.xl}px 0`,
            }}>
              <Ornament color={b.color} size="big" opacity={0.6} style={{ marginBottom:S.sm }}>
                {b.n}
              </Ornament>
              <div style={{
                fontFamily:F.sans, fontWeight:700,
                fontSize:T.subtitle, color:C.ink,
                letterSpacing:'-0.015em',
                marginTop:S.sm,
              }}>{b.title}</div>
              <Body>{b.body}</Body>
              <Accent width={28} color={b.color} style={{ marginTop:S.sm }} />
            </div>
            {i < blocks.length - 1 && (
              <div className={`fi d${i+4}`} style={{
                padding:`0 clamp(12px, 2vw, 32px)`,
                fontFamily:F.serif, fontStyle:'italic',
                fontSize:'clamp(28px, 3.5vw, 48px)',
                color:C.inkFaint, fontWeight:300,
                userSelect:'none',
              }}>→</div>
            )}
          </Fragment>
        ))}
      </div>

      <BottomBar>"La señalética bien pensada es la mejor vendedora que no cobra sueldo."</BottomBar>
    </Frame>
  );
}

// ── S14 · MÉTODO DE TRABAJO ───────────────────────────────────────────
function S13() {
  const steps = [
    { label:'Semana 1',       title:'Planificación', items:['Reunión mensual','Calendario del mes','Brief creativo'], color:C.clinicaLight },
    { label:'Semanas 2–4',    title:'Ejecución',     items:['Producción de piezas','Aprobación en 48 hs','Publicación programada'], color:C.opticaLight },
  ];
  const rules = [
    'Una propuesta fundamentada, no opciones para elegir.',
    'Sin respuesta en 48 hs, la pieza se aprueba.',
    'Máximo una ronda de ajustes por pieza.',
  ];
  return (
    <div style={{ width:'100%', height:'100%', background:C.deep, backgroundImage:GRAIN, display:'grid', gridTemplateColumns:'1fr 1fr' }}>
      {/* LEFT */}
      <div style={{
        padding:'clamp(40px, 5.5vw, 76px)',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        borderRight:`1px solid ${C.ruleDark}`,
      }}>
        <SlideTag n={15} total={TOTAL} dark />
        <div className="fu d1">
          <Eyebrow color={C.opticaLight} dark>Método de trabajo</Eyebrow>
          <div style={{ marginTop:S.md }}>
            <Headline lead="Un sistema que funciona" remate="sin que lo empujen." dark />
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:S.md }}>
          {steps.map((s, i) => (
            <div key={i} className={`fu d${i+2}`} style={{
              background:'rgba(255,255,255,0.04)', borderRadius:12,
              padding:'clamp(18px, 2.2vw, 24px)',
              borderLeft:`4px solid ${s.color}`,
            }}>
              <div style={{
                fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
                letterSpacing:'0.16em', textTransform:'uppercase',
                color:s.color, marginBottom:S.xs,
              }}>{s.label}</div>
              <div style={{
                fontFamily:F.sans, fontWeight:700,
                fontSize:T.subtitle, color:'#fff',
                marginBottom:S.md, letterSpacing:'-0.015em',
              }}>{s.title}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:S.xs }}>
                {s.items.map((item, j) => (
                  <div key={j} style={{ display:'flex', gap:S.sm, alignItems:'center' }}>
                    <div style={{ width:4, height:4, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                    <div style={{ fontFamily:F.sans, fontSize:T.body, color:C.paperMute }}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Dots size={9} gap={10} className="fu d4"/>
      </div>

      {/* RIGHT */}
      <div style={{
        padding:'clamp(40px, 5.5vw, 76px)',
        display:'flex', flexDirection:'column', justifyContent:'center',
      }}>
        <Eyebrow color={C.clinicaLight} dark>Reglas del sistema</Eyebrow>
        <div style={{ marginTop:S.xl }}>
          {rules.map((r, i) => (
            <div key={i} className={`fu d${i+3}`} style={{
              display:'grid', gridTemplateColumns:'clamp(72px, 9vw, 120px) 1fr',
              gap:S.xl, alignItems:'center',
              padding:`${S.lg}px 0`,
              borderBottom: i < rules.length - 1 ? `1px solid ${C.ruleDark}` : 'none',
            }}>
              <Ornament color="rgba(255,255,255,0.42)" size="sm" opacity={1}>
                {String(i+1).padStart(2,'0')}
              </Ornament>
              <Body dark>{r}</Body>
            </div>
          ))}
        </div>
        <div className="fu d7" style={{ marginTop:S.x2 }}>
          <Accent width={40} style={{ marginBottom:S.md }} />
          <Pull dark style={{ fontSize:'clamp(22px, 2.4vw, 32px)', color:C.paperSoft }}>
            "Cero fricción.<br/>Una conversación al mes."
          </Pull>
        </div>
      </div>
    </div>
  );
}

// ── S15 · ENTREGABLES ─────────────────────────────────────────────────
function S14() {
  const sections = [
    { title:'Identidad Visual', color:C.clinica,  items:['4 logos + Sarmiento','Manual de marca','Firmas + Favicon'] },
    { title:'Web',               color:C.optica,   items:['Diseño + Desarrollo','SEO básico','Mobile-first'] },
    { title:'Redes Sociales',   color:C.farmacia, items:['3 perfiles optimizados','Plantillas + Calendario','Gestión mensual'] },
    { title:'Contenido',         color:C.clinica,  items:['Diseño de piezas','Reels y Stories','Copys por unidad'] },
    { title:'Espacio Físico',   color:C.optica,   items:['Señalética','Artes finales','Supervisión'] },
    { title:'Método',            color:C.farmacia, items:['Reunión mensual','Flujo de aprobación','Métricas'] },
  ];
  return (
    <Frame>
      <TopBar eyebrow="Entregables" n={16} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x2, maxWidth:'min(820px, 90%)' }}>
        <Headline lead="Todo lo que incluye" remate="el sistema." />
      </div>

      {/* Checklist layout — each row: number + title + inline pills */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        {sections.map((s, i) => (
          <div key={i} className={`fu d${i+2}`} style={{
            display:'grid',
            gridTemplateColumns:'clamp(44px, 5vw, 64px) clamp(240px, 26vw, 340px) 1fr',
            gap:'clamp(16px, 2vw, 32px)', alignItems:'center',
            padding:`${S.lg}px 0`,
            borderTop: i === 0 ? `1px solid ${C.ruleSoft}` : 'none',
            borderBottom: `1px solid ${C.ruleSoft}`,
          }}>
            {/* Number */}
            <div style={{
              fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
              fontSize:'clamp(32px, 3.6vw, 52px)',
              color:s.color, opacity:0.6,
              lineHeight:1, letterSpacing:'-0.03em',
            }}>{String(i+1).padStart(2,'0')}</div>

            {/* Section title */}
            <div style={{
              fontFamily:F.sans, fontWeight:700,
              fontSize:T.subtitle, color:C.ink,
              letterSpacing:'-0.015em',
            }}>{s.title}</div>

            {/* Inline pills */}
            <div style={{ display:'flex', gap:S.sm, flexWrap:'wrap' }}>
              {s.items.map((item, j) => (
                <div key={j} style={{
                  fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
                  color:C.inkSoft,
                  background:C.cream,
                  padding:`6px ${S.md}px`,
                  borderRadius:99,
                  border:`1px solid ${C.ruleSoft}`,
                }}>{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomBar>"Nada existe por separado."</BottomBar>
    </Frame>
  );
}

// ── S16 · BREATHER · LA PROMESA ───────────────────────────────────────
function S15() {
  return (
    <Frame>
      {/* Top metadata */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div className="fi d1" style={{
          fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
          letterSpacing:'0.2em', color:C.inkMute, textTransform:'uppercase',
        }}>Nuestra promesa</div>
        <SlideTag n={17} total={TOTAL} />
      </div>

      {/* HERO — anchored center-left, dominant */}
      <div style={{ flex:1, display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:'min(1280px, 92%)' }}>
          {/* Decorative italic number */}
          <div className="fu d2" style={{
            fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
            fontSize:'clamp(56px, 7vw, 104px)',
            color:C.optica, opacity:0.4,
            lineHeight:1, letterSpacing:'-0.04em',
            marginBottom:S.lg,
          }}>15</div>

          <Accent className="lw d3" width={88} style={{ marginBottom:S.x2 }} />

          <div className="fu d4" style={{
            fontFamily:F.sans, fontWeight:700,
            fontSize:'clamp(18px, 2.2vw, 32px)',
            color:C.inkSoft, letterSpacing:'0.14em',
            textTransform:'uppercase', marginBottom:S.x2,
          }}>Ustedes se dedican a la salud.</div>

          <div className="fu d5" style={{
            fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
            fontSize:T.display, lineHeight:0.95,
            letterSpacing:'-0.03em', color:C.ink,
          }}>
            Nosotros a que<br/>eso se vea.
          </div>
        </div>
      </div>

      {/* Bottom — three dots + line, echoing cover */}
      <div className="fu d6" style={{
        display:'flex', alignItems:'center', gap:S.x2,
        paddingTop:S.lg,
        borderTop:`1px solid ${C.ruleSoft}`,
      }}>
        <Dots size={10} gap={11}/>
        <div style={{
          fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
          letterSpacing:'0.16em', textTransform:'uppercase',
          color:C.inkMute,
        }}>Clínica · Óptica · Farmacia</div>
        <div style={{ flex:1, height:1, background:C.ruleSoft }}/>
        <div style={{
          fontFamily:F.sans, fontSize:T.caption, fontWeight:600,
          letterSpacing:'0.18em', textTransform:'uppercase',
          color:C.inkFaint,
        }}>Antes de la inversión</div>
      </div>
    </Frame>
  );
}

// ── S17 · LA INVERSIÓN ────────────────────────────────────────────────
function S16() {
  return (
    <Frame dark>
      <TopBar eyebrow="La inversión" color={C.opticaLight} n={18} total={TOTAL} dark />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x2, maxWidth:'min(820px, 92%)' }}>
        <Headline lead="Una inversión con" remate="retorno concreto." dark />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:S.xl, flex:1 }}>
        {[
          {
            color:C.opticaLight, accent:C.optica, label:'Setup · Pago único',
            items:[
              { title:'Identidad visual completa', sub:'4 logos, manual, paleta y tipografía. La base que sostiene todo lo demás.' },
              { title:'Landing page con gestor de turnos', sub:'Diseño + desarrollo + SEO + reserva online integrada. Donde el paciente decide si confía antes de llamar.' },
              { title:'Señalética — diseño', sub:'Lo que la marca dice cuando nadie la está mirando.' },
              { title:'Sistema de trabajo inicial', sub:'Flujo de aprobaciones, plantillas, calendario base.' },
            ],
            price:'3.800', unit:'USD',
            terms:[['50%','Al inicio'],['30%','Al aprobar identidad'],['20%','Al entregar la web']],
          },
          {
            color:C.farmaciaLight, accent:C.farmacia, label:'Retainer · Mensual',
            items:[
              { title:'3 cuentas — gestión y contenido', sub:'Producción mensual de posts, reels y stories para clínica, óptica y farmacia.' },
              { title:'Calendario + reunión + métricas', sub:'Una reunión mensual con plan completo. Sin emails sueltos.' },
              { title:'Flujo de aprobación incluido', sub:'Aprobación en 48 hs por defecto. Sin idas y vueltas.' },
            ],
            price:'750', unit:'USD/mes',
            terms:[['Pago adelantado','Cada mes']],
          },
        ].map((card, ci) => (
          <div key={ci} className={`fu d${ci+3}`} style={{
            background:'rgba(255,255,255,0.04)', borderRadius:16,
            padding:'clamp(28px, 3.2vw, 40px)',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
            borderTop:`4px solid ${card.accent}`,
            position:'relative', overflow:'hidden',
          }}>
            {/* TOP: label + items with explanations */}
            <div>
              <div style={{
                fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
                letterSpacing:'0.18em', textTransform:'uppercase',
                color:card.color, marginBottom:S.xl,
              }}>{card.label}</div>

              <div style={{ display:'flex', flexDirection:'column', gap:S.lg }}>
                {card.items.map((item, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'14px 1fr', gap:S.md, alignItems:'flex-start' }}>
                    <div style={{
                      width:6, height:6, borderRadius:'50%',
                      background:card.color, marginTop:10,
                    }}/>
                    <div>
                      <div style={{
                        fontFamily:F.sans, fontWeight:600,
                        fontSize:T.body, color:'#fff',
                        marginBottom:2, letterSpacing:'-0.01em',
                      }}>{item.title}</div>
                      <div style={{
                        fontFamily:F.sans, fontWeight:400,
                        fontSize:T.caption, color:C.paperMute,
                        lineHeight:1.5,
                      }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM: price + integrated payment terms */}
            <div>
              <div style={{ marginTop:S.xl, paddingTop:S.lg, borderTop:`1px solid ${C.ruleDark}` }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:S.md, flexWrap:'wrap' }}>
                  <div style={{
                    fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
                    fontSize:'clamp(64px, 9vw, 144px)',
                    color:'#fff', lineHeight:0.9,
                    letterSpacing:'-0.04em',
                  }}>{card.price}</div>
                  <div style={{
                    fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
                    letterSpacing:'0.16em', textTransform:'uppercase',
                    color:card.color,
                  }}>{card.unit}</div>
                </div>
              </div>

              {/* Payment terms — inside the card */}
              <div style={{
                marginTop:S.lg, paddingTop:S.lg,
                borderTop:`1px solid ${C.ruleDark}`,
                display:'flex', gap:S.x2, flexWrap:'wrap',
              }}>
                {card.terms.map(([pct, label], ti) => (
                  <div key={ti} style={{ flex:'1 1 auto', minWidth:0 }}>
                    <div style={{
                      fontFamily:F.serif, fontStyle:'italic', fontWeight:500,
                      fontSize:'clamp(22px, 2.4vw, 32px)',
                      color:'#fff', lineHeight:0.95,
                    }}>{pct}</div>
                    <div style={{
                      fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
                      color:C.paperMute, marginTop:S.xs,
                    }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Caption className="fu d6" dark style={{ marginTop:S.lg }}>
        * Facturación en ARS al tipo de cambio MEP del día de vencimiento.
      </Caption>
    </Frame>
  );
}


// ── S19 · LAS GARANTÍAS · CÓMO ASEGURAMOS EL RESULTADO ────────────────
function Guarantees() {
  const guarantees = [
    {
      n:'01',
      title:'Total propiedad desde el día 1',
      body:'Identidad, web, archivos, accesos y contraseñas son tuyos desde el primer entregable. Si decidís seguir solo, te llevás todo. No hay nada "rehén".',
      color:C.clinicaLight, accent:C.clinica,
    },
    {
      n:'02',
      title:'Derecho a cancelar entre hitos',
      body:'Cada hito del Setup es un punto de decisión. Aprobás la identidad antes de pasar a la web. Si algo no funciona en el camino, lo conversamos: ajustamos juntos o tomamos otro rumbo.',
      color:C.opticaLight, accent:C.optica,
    },
    {
      n:'03',
      title:'Programa 1 a 1',
      body:'Sarmiento forma parte de nuestro Programa 1 a 1: nos enfocamos exclusivamente en el crecimiento de un proyecto a la vez. Sin clientes paralelos. Tu resultado es nuestra única métrica.',
      color:C.farmaciaLight, accent:C.farmacia,
    },
  ];

  return (
    <Frame dark>
      <TopBar eyebrow="Las garantías" color={C.opticaLight} n={19} total={TOTAL} dark />

      <div className="fu d2" style={{ marginTop:S.lg, marginBottom:S.xl, maxWidth:'min(900px, 92%)' }}>
        <Headline lead="Cómo te aseguramos" remate="el resultado." dark />
      </div>

      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        justifyContent:'center',
      }}>
        {guarantees.map((g, i) => (
          <div key={i} className={`fu d${i+3}`} style={{
            display:'grid',
            gridTemplateColumns:'clamp(60px, 7vw, 90px) 1fr',
            gap:'clamp(20px, 2.5vw, 36px)',
            alignItems:'flex-start',
            padding:`${S.lg}px 0`,
            borderTop:`1px solid ${C.ruleDark}`,
            borderBottom: i === guarantees.length - 1 ? `1px solid ${C.ruleDark}` : 'none',
          }}>
            <div style={{
              fontFamily:F.serif, fontStyle:'italic',
              fontSize:'clamp(36px, 4.5vw, 60px)',
              color:g.color, opacity:0.75,
              lineHeight:1, fontWeight:400,
            }}>{g.n}</div>

            <div>
              <div style={{
                fontFamily:F.sans, fontWeight:700,
                fontSize:T.subtitle, color:'#fff',
                marginBottom:S.sm, letterSpacing:'-0.015em',
                lineHeight:1.15,
              }}>{g.title}</div>
              <Body dark style={{ maxWidth:'min(820px, 94%)' }}>{g.body}</Body>
              <Accent width={28} color={g.accent} style={{ marginTop:S.md }} />
            </div>
          </div>
        ))}
      </div>

      <BottomBar dark>"La seguridad no es una promesa. Es estructura."</BottomBar>
    </Frame>
  );
}


// ── S18 · PRÓXIMOS PASOS ──────────────────────────────────────────────
function S17() {
  const phases = [
    { n:'01', period:'Mes 1',    title:'Fundamentos',       color:C.clinica,  items:['Kick-off y relevamiento','Identidad visual','Manual de marca'] },
    { n:'02', period:'Mes 2',    title:'Activación digital', color:C.optica,   items:['Landing page','Perfiles optimizados','Primeras piezas'] },
    { n:'03', period:'Mes 2–3',  title:'Espacio físico',    color:C.farmacia, items:['Señalética','Artes finales','Aplicación en local'] },
    { n:'04', period:'Mes 3+',   title:'Escala',             color:C.clinica,  items:['Sistema mensual','Métricas','Nueva clínica'] },
  ];
  return (
    <Frame>
      <TopBar eyebrow="Próximos pasos" n={20} total={TOTAL} />

      <div className="fu d2" style={{ marginTop:S.xl, marginBottom:S.x2, maxWidth:'min(820px, 90%)' }}>
        <Headline lead="Qué pasa si" remate="arrancamos hoy." />
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:S.lg }}>
        {phases.map((p, i) => (
          <div key={i} className={`fu d${i+3}`} style={{
            display:'flex', flexDirection:'column', justifyContent:'center',
            borderTop:`4px solid ${p.color}`,
            paddingTop:S.x2,
          }}>
            <Ornament color={p.color} size="big" opacity={0.5} style={{ marginBottom:S.xl }}>
              {p.n}
            </Ornament>
            <div style={{
              fontFamily:F.sans, fontSize:T.caption, fontWeight:700,
              letterSpacing:'0.16em', textTransform:'uppercase',
              color:p.color, marginBottom:S.xs,
            }}>{p.period}</div>
            <div style={{
              fontFamily:F.sans, fontWeight:700,
              fontSize:T.subtitle, color:C.ink,
              marginBottom:S.lg, letterSpacing:'-0.015em',
            }}>{p.title}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:S.sm }}>
              {p.items.map((item, j) => (
                <div key={j} style={{ display:'flex', gap:S.sm, alignItems:'flex-start' }}>
                  <div style={{ width:4, height:4, borderRadius:'50%', background:p.color, flexShrink:0, marginTop:8 }}/>
                  <Body style={{ fontSize:T.caption, lineHeight:1.5 }}>{item}</Body>
                </div>
              ))}
            </div>
            <Accent width={28} color={p.color} style={{ marginTop:S.lg }} />
          </div>
        ))}
      </div>

      <BottomBar>"La nueva clínica está en camino. Este es el momento de construir la base."</BottomBar>
    </Frame>
  );
}

// ── S19 · CIERRE ──────────────────────────────────────────────────────
function S18() {
  return (
    <Frame dark>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <SlideTag n={21} total={TOTAL} dark />
        <div style={{
          fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
          letterSpacing:'0.2em', textTransform:'uppercase',
          color:C.paperFaint,
        }}>Propuesta comercial</div>
      </div>

      {/* HERO — mirror of cover but centered */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', maxWidth:'min(900px, 92%)' }}>
          <Accent className="lw d1" width={64} style={{ margin:'0 auto', marginBottom:S.x2 }} />

          <div className="fu d2" style={{
            fontFamily:F.sans, fontWeight:700,
            fontSize:'clamp(16px, 1.8vw, 28px)',
            color:C.paperMute, letterSpacing:'0.16em',
            textTransform:'uppercase', marginBottom:S.xl,
          }}>Todo lo que necesitás.</div>

          <div className="fu d3" style={{
            fontFamily:F.serif, fontStyle:'italic', fontWeight:400,
            fontSize:T.display, lineHeight:0.95,
            letterSpacing:'-0.03em', color:'#fff',
          }}>En una sola dirección.</div>

          <div className="fu d4" style={{
            width:200, height:1, margin:`${S.x3}px auto`,
            background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}/>

          <Dots className="fu d5" style={{ justifyContent:'center' }} size={10} gap={11}/>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:S.xl }}>
        <div className="fu d6" style={{ display:'flex', gap:S.lg, flexWrap:'wrap' }}>
          {['Clínica', 'Óptica', 'Farmacia'].map((u, i) => (
            <span key={i} style={{
              fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
              color:C.paperMute, letterSpacing:'0.06em',
            }}>{u}</span>
          ))}
        </div>
        <div className="fu d7" style={{ display:'flex', gap:S.lg, flexWrap:'wrap' }}>
          {['kaysercamilaa@gmail.com', '+54 9 3704 67-4244'].map((c, i) => (
            <span key={i} style={{
              fontFamily:F.sans, fontSize:T.caption, fontWeight:500,
              color:C.paperFaint, letterSpacing:'0.06em',
            }}>{c}</span>
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────

function Nav({ cur, total, onNext, onPrev, visible }) {
  const [hoverL, setHoverL] = useState(false);
  const [hoverR, setHoverR] = useState(false);

  const base = {
    position:'fixed', top:'50%', transform:'translateY(-50%)',
    zIndex:100, width:40, height:40, borderRadius:'50%',
    border:'1px solid rgba(255,255,255,0.12)',
    backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
    color:'rgba(255,255,255,0.85)',
    fontSize:16, lineHeight:1, fontFamily:F.sans, fontWeight:300,
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 24px rgba(0,0,0,0.22)',
    padding:0,
    transition:'opacity 0.4s ease, background 0.22s, transform 0.22s cubic-bezier(.2,.7,0,1.1)',
  };

  const prevD = cur === 0;
  const nextD = cur === total - 1;
  const showL = visible && !prevD;
  const showR = visible && !nextD;

  return (
    <>
      <button onClick={onPrev}
        onMouseEnter={() => setHoverL(true)}
        onMouseLeave={() => setHoverL(false)}
        disabled={prevD} aria-label="Anterior"
        style={{
          ...base, left:20,
          opacity: showL ? 1 : 0,
          background: hoverL ? 'rgba(15,25,40,0.7)' : 'rgba(15,25,40,0.4)',
          cursor: showL ? 'pointer' : 'default',
          pointerEvents: showL ? 'auto' : 'none',
          transform: hoverL ? 'translateY(-50%) translateX(-2px)' : 'translateY(-50%)',
        }}
      >←</button>
      <button onClick={onNext}
        onMouseEnter={() => setHoverR(true)}
        onMouseLeave={() => setHoverR(false)}
        disabled={nextD} aria-label="Siguiente"
        style={{
          ...base, right:20,
          opacity: showR ? 1 : 0,
          background: hoverR ? 'rgba(15,25,40,0.7)' : 'rgba(15,25,40,0.4)',
          cursor: showR ? 'pointer' : 'default',
          pointerEvents: showR ? 'auto' : 'none',
          transform: hoverR ? 'translateY(-50%) translateX(2px)' : 'translateY(-50%)',
        }}
      >→</button>
    </>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────

const SLIDES = [S01, S02, S03, S04, Year1, Method, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, Guarantees, S17, S18];

export default function App() {
  const [cur, setCur] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const [scale, setScale] = useState(1);
  const [printMode, setPrintMode] = useState(false);
  const total = SLIDES.length;

  const go = useCallback((i) => { setCur(i); setAnimKey(k => k + 1); }, []);
  const next = useCallback(() => { if (cur < total - 1) go(cur + 1); }, [cur, go, total]);
  const prev = useCallback(() => { if (cur > 0) go(cur - 1); }, [cur, go]);

  // Detect ?print=1 URL param for PDF export mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setPrintMode(params.get('print') === '1');
    }
  }, []);

  // Scale the 1920x1080 canvas to fit any viewport (letterbox if not 16:9)
  useEffect(() => {
    if (printMode) return;
    const updateScale = () => {
      const sw = window.innerWidth / 1920;
      const sh = window.innerHeight / 1080;
      setScale(Math.min(sw, sh));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [printMode]);

  // Keyboard navigation
  useEffect(() => {
    if (printMode) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, printMode]);

  // Nav auto-hide
  useEffect(() => {
    if (printMode) return;
    let timer;
    const reveal = () => {
      setNavVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setNavVisible(false), 2000);
    };
    reveal();
    window.addEventListener('mousemove', reveal);
    window.addEventListener('touchstart', reveal);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reveal);
      window.removeEventListener('touchstart', reveal);
    };
  }, [printMode]);

  // ─── PRINT MODE ───────────────────────────────────────────────────
  // For PDF export. Open URL with ?print=1 then Chrome → Print → Save as PDF
  // Paper size: 1920×1080 px (or custom 50.8×28.575cm). Margins: None.
  if (printMode) {
    return (
      <>
        <style>{FONTS}</style>
        <style>{`
          @page { size: 1920px 1080px; margin: 0; }
          @media print { body { margin: 0; } .print-slide { break-after: page; page-break-after: always; } }
          body { background: #000; }
        `}</style>
        <div style={{ background:'#000' }}>
          {SLIDES.map((SlideFn, i) => (
            <div key={i} className="print-slide" style={{
              width:1920, height:1080, position:'relative', overflow:'hidden',
              breakAfter:'page', pageBreakAfter:'always',
            }}>
              <SlideFn />
            </div>
          ))}
        </div>
      </>
    );
  }

  // ─── LIVE PRESENTATION MODE ───────────────────────────────────────
  const Slide = SLIDES[cur];

  return (
    <div style={{
      width:'100vw', height:'100vh', overflow:'hidden',
      background:'#000',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <style>{FONTS}</style>

      {/* Fixed 1920×1080 canvas, scaled proportionally */}
      <div style={{
        width:1920, height:1080,
        transform:`scale(${scale})`,
        transformOrigin:'center',
        position:'relative',
        flexShrink:0,
      }}>
        <div key={animKey} className="fi" style={{ width:'100%', height:'100%' }}>
          <Slide />
        </div>
      </div>

      <Nav cur={cur} total={total} onNext={next} onPrev={prev} visible={navVisible} />
    </div>
  );
}
