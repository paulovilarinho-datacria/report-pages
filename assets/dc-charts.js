/* Data Cria Charts · v1 · código próprio da Data Cria.
   Gramática editorial inspirada nos princípios do lieflat-charts (referência, sem reutilizar código):
   marca fina, unidade contável, rótulo só no pico/destaque, um protagonista laranja, base com ticks,
   rodapé em versalete, entrada rápida sem quique, replay ao clicar e respeito a prefers-reduced-motion. */
(function(g){
'use strict';
const NS='http://www.w3.org/2000/svg';
const el=(p,t,a={})=>{const n=document.createElementNS(NS,t);for(const k in a)if(a[k]!=null)n.setAttribute(k,a[k]);p.appendChild(n);return n};
const txt=(p,a,s)=>{const n=el(p,'text',a);n.textContent=s;return n};
const nf0=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}),nf1=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
const compact=v=>v==null?'—':Math.abs(v)>=1e6?nf1.format(v/1e6)+' mi':Math.abs(v)>=1e4?nf0.format(v/1e3)+' mil':Math.abs(v)>=1e3?nf1.format(v/1e3)+' mil':nf1.format(v);
const reduced=()=>g.matchMedia&&g.matchMedia('(prefers-reduced-motion: reduce)').matches;
const anim=(n,cls,delay)=>{if(!n||reduced())return n;n.classList.add(cls);if(delay)n.style.animationDelay=delay+'ms';return n};
const niceUnit=(max,maxMarks)=>{const raw=max/Math.max(1,maxMarks),p=10**Math.floor(Math.log10(raw||1)),q=raw/p;return(q<=1?1:q<=2?2:q<=2.5?2.5:q<=5?5:10)*p};

/* tooltip único por página */
let tipEl=null;
function tip(html,x,y){if(!tipEl){tipEl=document.createElement('div');tipEl.className='dcc-tip';tipEl.setAttribute('role','tooltip');document.body.appendChild(tipEl)}
  if(html==null){tipEl.hidden=true;return}tipEl.innerHTML=html;tipEl.hidden=false;
  const w=tipEl.offsetWidth,h=tipEl.offsetHeight;tipEl.style.left=Math.max(8,Math.min(x+12,innerWidth-w-8))+'px';tipEl.style.top=Math.max(8,y-h-12>8?y-h-12:y+16)+'px'}
g.addEventListener&&g.addEventListener('scroll',()=>tip(null),{passive:true});

/* reveal: desenha ao entrar na tela; clique no gráfico repete a animação; resize redesenha sem animar */
function reveal(host,render){let shown=false,still=false;const run=()=>{host.classList.toggle('dcc-still',still);render(still)};
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!shown){shown=true;run();still=true;io.disconnect()}},{threshold:.2});io.observe(host);
  host.addEventListener('click',e=>{if(e.target.closest('[data-i],button,a,select,input'))return;still=false;run();still=true});
  if(g.ResizeObserver){let w=host.clientWidth;new ResizeObserver(()=>{if(shown&&Math.abs(host.clientWidth-w)>2){w=host.clientWidth;still=true;run()}}).observe(host)}
  return{redraw:(animate)=>{still=!animate;if(shown)run();still=true}}}

function bindHits(svg,items,onTip,onSelect){svg.querySelectorAll('[data-i]').forEach(n=>{const i=+n.dataset.i;
  const show=e=>{const r=n.getBoundingClientRect();tip(onTip(i),e&&e.clientX?e.clientX:r.left+r.width/2,e&&e.clientY?e.clientY:r.top)};
  n.addEventListener('pointermove',show);n.addEventListener('pointerleave',()=>tip(null));n.addEventListener('focus',()=>show());n.addEventListener('blur',()=>tip(null));
  if(onSelect){n.addEventListener('click',()=>onSelect(i));n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(i)}})}})}

/* 1 · LINHA FINA — série mensal. um ponto = um mês; vazado = cobertura parcial; mês sem dado vira marca no chão, nunca zero */
function line(svg,o){
  const P=o.points,H=o.height||260,W=svg.clientWidth||svg.parentNode.clientWidth||640,L=8,R=o.right||48,T=30,B=34,pw=W-L-R,ph=H-T-B;
  const vals=P.map(p=>p.value).filter(v=>v!=null),max=Math.max(...vals,0)||1;
  const X=i=>L+(P.length<2?pw/2:pw*i/(P.length-1)),Y=v=>T+ph-v/max*ph;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);svg.innerHTML='';
  // chão com tick por mês (barcode floor); rótulos espaçados
  el(svg,'line',{x1:L,x2:W-R,y1:T+ph+8,y2:T+ph+8,class:'dcc-floor'});
  const every=P.length<=8?1:P.length<=14?2:3;
  P.forEach((p,i)=>{const major=i%every===0||i===P.length-1;el(svg,'line',{x1:X(i),x2:X(i),y1:T+ph+8,y2:T+ph+(major?14:11),class:'dcc-tick'+(major?' major':'')});
    if(major)txt(svg,{x:X(i),y:H-6,'text-anchor':i===0&&P.length>1?'start':i===P.length-1&&P.length>1?'end':'middle',class:'dcc-axis'},p.short||p.label)});
  // linha (quebra onde falta dado)
  let seg=[];const segs=[];P.forEach((p,i)=>{if(p.value==null){if(seg.length)segs.push(seg);seg=[]}else seg.push([X(i),Y(p.value)])});if(seg.length)segs.push(seg);
  segs.forEach(s=>{if(s.length>1)anim(el(svg,'path',{d:s.map((a,j)=>(j?'L':'M')+a[0].toFixed(1)+' '+a[1].toFixed(1)).join(' '),class:'dcc-hair',pathLength:1}),'draw')});
  const peak=vals.length?P.findIndex(p=>p.value===Math.max(...vals)):-1,focus=o.focus??P.length-1;
  P.forEach((p,i)=>{const gi=el(svg,'g',{'data-i':i,tabindex:0,role:'button','aria-label':o.aria?o.aria(i):p.label});
    el(gi,'rect',{x:X(i)-Math.max(6,pw/P.length/2),y:T-20,width:Math.max(12,pw/P.length),height:ph+28,fill:'transparent'});
    if(p.value==null){anim(el(gi,'circle',{cx:X(i),cy:T+ph+8,r:2.5,class:'dcc-dot hollow'}),'pop',300+i*12);return}
    const hero=i===focus;if(hero)el(gi,'circle',{cx:X(i),cy:Y(p.value),r:9,class:'dcc-ring on',opacity:.0});
    anim(el(gi,'circle',{cx:X(i),cy:Y(p.value),r:hero?5:(p.partial?3:2.6),class:'dcc-dot'+(hero?' hero':p.partial?' hollow':'')}),'pop',400+i*12)});
  const label=(i,cls)=>{const p=P[i];if(!p||p.value==null)return;const x=X(i),right=x>W-R-30,left=x<L+30;
    anim(txt(svg,{x:right?x+8:left?x-2:x,y:Y(p.value)-12,'text-anchor':right?'start':left?'start':'middle',class:'dcc-val'+(cls?' '+cls:'')},(o.fmt||compact)(p.value)),'fade',900)};
  if(peak>=0&&peak!==focus)label(peak);label(focus,'hero');
  (o.notes||[]).forEach(n=>{const i=n.i;if(P[i]?.value==null)return;anim(txt(svg,{x:X(i),y:Y(P[i].value)-24,'text-anchor':'middle',class:'dcc-note'},n.text),'fade',1000)});
  bindHits(svg,P,o.tip||(i=>`<b>${P[i].label}</b><br>${P[i].value==null?'sem dado':(o.fmt||compact)(P[i].value)}`),o.onSelect);
}

/* 2 · ESCADA DE TRAÇOS — barras horizontais feitas de unidades contáveis. um traço = `unit` */
function rungs(host,o){
  const rows=o.rows,gap=o.gap||3,maxMarks=o.maxMarks||90,rh=o.rungH||16,sh=rh+6;
  const max=Math.max(...rows.map(r=>(r.parts||[{v:r.value||0}]).reduce((s,p)=>s+(p.v||0),0)),1);
  const unit=o.unit||niceUnit(max,maxMarks);host.innerHTML='';host.classList.add('dcc-rows');
  const one=g.matchMedia&&g.matchMedia('(max-width:560px)').matches,avail=(host.clientWidth||600)-(one?0:216)-(o.labelW||170);
  const most=Math.max(...rows.map(r=>Math.round(Math.max(r.track||0,(r.parts||[{v:r.value||0}]).reduce((s,p)=>s+(p.v||0),0))/unit)),1),step=Math.max(2,Math.min(gap,avail/most));
  rows.forEach((r,ri)=>{const row=document.createElement('div');row.className='dcc-row'+(r.small?' is-small':'')+(r.hero?' is-hero':'');
    if(r.dataset)for(const k in r.dataset)row.dataset[k]=r.dataset[k];
    row.innerHTML=`<div class="dcc-row-label">${r.label}${r.sub?`<small>${r.sub}</small>`:''}</div>`;
    const svg=el(row,'svg',{height:sh,role:'img','aria-label':r.aria||r.label});svg.style.height=sh+'px';const parts=r.parts||[{v:r.value||0,cls:r.hero?'hero':r.small?'soft':''}];
    let k=0;parts.forEach(p=>{const n=Math.round((p.v||0)/unit);for(let j=0;j<n;j++,k++)anim(el(svg,'line',{x1:k*step+.5,x2:k*step+.5,y1:3,y2:3+rh,class:'dcc-rung'+(p.cls?' '+p.cls:'')}),'fade',ri*100+k*4)});
    if(r.track){const n=Math.round(r.track/unit);for(;k<n;k++)el(svg,'line',{x1:k*step+.5,x2:k*step+.5,y1:3,y2:3+rh,class:'dcc-rung soft'})}
    anim(txt(svg,{x:k*step+8,y:3+rh/2+4,class:'dcc-val'+(r.hero?' hero':'')},r.display??compact(r.value)),'fade',ri*100+400);
    svg.style.width=(k*step+(o.labelW||170))+'px';svg.style.maxWidth='100%';row.appendChild(svg);host.appendChild(row)});
  return unit}

/* 3 · HALTERES — real × estimado. vazado = estimativa; cheio = real; laranja = protagonista. escala comum */
function dumbbell(svg,o){
  const R=o.rows,rowH=o.rowH||64,W=svg.clientWidth||svg.parentNode.clientWidth||640,narrow=W<560,L=0,Rp=narrow?92:70,T=20,H=T+R.length*rowH+30,pw=W-L-Rp,max=o.max,X=v=>L+v/max*pw;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);svg.innerHTML='';
  el(svg,'line',{x1:L,x2:L+pw,y1:H-24,y2:H-24,class:'dcc-floor'});
  (o.ticks||[]).forEach(t=>{el(svg,'line',{x1:X(t),x2:X(t),y1:H-24,y2:H-18,class:'dcc-tick major'});txt(svg,{x:X(t),y:H-6,'text-anchor':t===0?'start':'middle',class:'dcc-axis'},o.tickFmt?o.tickFmt(t):compact(t))});
  if(o.ticks){const st=(o.ticks[1]-o.ticks[0])/5;for(let v=0;v<=max+1e-9;v+=st)el(svg,'line',{x1:X(v),x2:X(v),y1:H-24,y2:H-21,class:'dcc-tick'})}
  R.forEach((r,i)=>{const y=T+i*rowH+rowH/2,gi=el(svg,'g',{'data-i':i,tabindex:0,role:'img','aria-label':r.aria||r.label});
    el(gi,'rect',{x:0,y:y-rowH/2,width:W,height:rowH,fill:'transparent'});
    txt(gi,{x:L,y:y-16,class:'dcc-axis'},r.label);
    anim(el(gi,'line',{x1:X(r.est),x2:X(r.actual),y1:y,y2:y,class:'dcc-hair',pathLength:1}),'draw',i*120);
    anim(el(gi,'circle',{cx:X(r.est),cy:y,r:4,class:'dcc-dot hollow'}),'pop',i*120);
    anim(el(gi,'circle',{cx:X(r.actual),cy:y,r:r.hero?6:4.5,class:'dcc-dot'+(r.hero?' hero':'')}),'pop',i*120+500);
    anim(txt(gi,{x:X(r.actual)+10,y:y+4,class:'dcc-val'+(r.hero?' hero':'')},r.display||compact(r.actual)),'fade',i*120+700);
    const note=narrow&&r.noteShort?r.noteShort:r.note;if(note)anim(txt(gi,{x:X(r.actual)+10,y:y+18,class:'dcc-note'},note),'fade',i*120+800)});
  bindHits(svg,R,o.tip||(i=>`<b>${R[i].label}</b>`))}

/* 4 · FAIXA DE PONTOS — um ponto = um registro; linha tracejada = mediana; empates empilham */
function strip(svg,o){
  const V=o.values,H=o.height||110,W=svg.clientWidth||svg.parentNode.clientWidth||480,L=6,R=6,max=o.max||Math.max(...V.map(v=>v.value)),X=v=>L+v/max*(W-L-R),base=H-30;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);svg.innerHTML='';
  el(svg,'line',{x1:L,x2:W-R,y1:base+8,y2:base+8,class:'dcc-floor'});
  (o.ticks||[]).forEach(t=>{el(svg,'line',{x1:X(t),x2:X(t),y1:base+8,y2:base+13,class:'dcc-tick major'});txt(svg,{x:X(t),y:H-4,'text-anchor':t===0?'start':'middle',class:'dcc-axis'},o.tickFmt?o.tickFmt(t):compact(t))});
  if(o.median!=null){el(svg,'line',{x1:X(o.median),x2:X(o.median),y1:14,y2:base+8,class:'dcc-guide'});txt(svg,{x:X(o.median)+5,y:16,class:'dcc-note'},o.medianLabel||('mediana · '+compact(o.median)))}
  const seen={};V.forEach((v,i)=>{const n=seen[v.value]=(seen[v.value]||0)+1,cy=base-(n-1)*10;const gi=el(svg,'g',{'data-i':i,tabindex:0,role:'img','aria-label':v.aria||compact(v.value)});
    anim(el(gi,'circle',{cx:X(v.value),cy,r:v.hero?5.5:3.5,class:'dcc-dot'+(v.hero?' hero':v.hollow?' hollow':'')}),'pop',i*14);
    if(v.label)anim(txt(svg,{x:X(v.value),y:v.labelBelow?base+24:cy-12,'text-anchor':X(v.value)>W-60?'end':'middle',class:v.hero?'dcc-val hero':'dcc-note'},v.label),'fade',600)});
  bindHits(svg,V,o.tip||(i=>V[i].aria||compact(V[i].value)))}

/* 5 · CURVAS — séries contínuas (retenção). protagonista laranja; contexto na escada de cinzas; rótulo no fim da linha */
function curves(svg,o){
  const S=o.series,H=o.height||280,W=svg.clientWidth||svg.parentNode.clientWidth||640,narrow=W<560,L=34,R=narrow?10:o.right||130,T=22,B=30,pw=W-L-R,ph=H-T-B;
  const X=x=>L+x/o.xMax*pw,Y=y=>T+ph-y/o.yMax*ph;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);svg.innerHTML='';
  (o.yTicks||[]).forEach(t=>{el(svg,'line',{x1:L-6,x2:L-2,y1:Y(t),y2:Y(t),class:'dcc-tick major'});txt(svg,{x:L-9,y:Y(t)+3,'text-anchor':'end',class:'dcc-axis'},o.yFmt?o.yFmt(t):t)});
  el(svg,'line',{x1:L,x2:L+pw,y1:T+ph+6,y2:T+ph+6,class:'dcc-floor'});
  const minor=o.xMinor||o.xMax/20;for(let x=0;x<=o.xMax+1e-6;x+=minor)el(svg,'line',{x1:X(x),x2:X(x),y1:T+ph+6,y2:T+ph+9,class:'dcc-tick'});
  (o.xTicks||[]).forEach((t,j,a)=>{el(svg,'line',{x1:X(t),x2:X(t),y1:T+ph+6,y2:T+ph+12,class:'dcc-tick major'});txt(svg,{x:X(t),y:H-4,'text-anchor':j===0?'start':j===a.length-1?'end':'middle',class:'dcc-axis'},o.xFmt?o.xFmt(t):t)});
  (o.marks||[]).forEach(m=>{el(svg,'line',{x1:X(m.x),x2:X(m.x),y1:T-6,y2:T+ph+6,class:'dcc-guide'});txt(svg,{x:m.anchor==='end'?X(m.x)-4:X(m.x)+4,y:T-8,'text-anchor':m.anchor||'start',class:'dcc-note'},m.text)});
  const order=[...S].sort((a,b)=>(a.hero?1:0)-(b.hero?1:0));
  order.forEach((s,k)=>{const d=s.pts.map((p,j)=>(j?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
    const p=anim(el(svg,'path',{d,class:'dcc-hair',pathLength:1,style:`stroke:${s.hero?'var(--dcc-hero)':s.color||'var(--dcc-ink-4)'};stroke-width:${s.hero?1.75:1}`}),'draw',k*150);
    const last=s.pts.at(-1);if(!narrow&&o.endLabels!==false)anim(txt(svg,{x:X(last[0])+6,y:Y(last[1])+(s.dy||0)+3,class:s.hero?'dcc-val hero':'dcc-note'},s.end||s.name),'fade',900)});
  (o.notes||[]).forEach(n=>{const flip=X(n.x)>W*.55&&narrow;anim(el(svg,'circle',{cx:X(n.x),cy:Y(n.y),r:4,class:'dcc-dot hero'}),'pop',1000);anim(txt(svg,{x:flip?X(n.x)-8:X(n.x)+8,y:Y(n.y)-10,'text-anchor':flip?'end':'start',class:'dcc-val hero'},narrow&&n.short?n.short:n.text),'fade',1100)});
  if(o.onHover){const hit=el(svg,'rect',{x:L,y:T,width:pw,height:ph,fill:'transparent'}),cur=el(svg,'line',{x1:0,x2:0,y1:T,y2:T+ph,stroke:'var(--dcc-ink)','stroke-width':1,opacity:0});
    hit.addEventListener('pointermove',e=>{const b=svg.getBoundingClientRect(),sx=Math.max(L,Math.min(L+pw,(e.clientX-b.left)/b.width*W));cur.setAttribute('x1',sx);cur.setAttribute('x2',sx);cur.setAttribute('opacity',.35);o.onHover((sx-L)/pw*o.xMax)});
    hit.addEventListener('pointerleave',()=>cur.setAttribute('opacity',0))}}

/* 6 · COLUNAS DE TRAÇOS — colunas verticais feitas de traços horizontais (contáveis). opcional: linha de mediana */
function columns(svg,o){
  const C=o.cols,H=o.height||160,W=svg.clientWidth||svg.parentNode.clientWidth||320,B=o.labels===false?6:22,T=o.valueLabels===false?6:20,ph=H-T-B,step=o.step||4;
  const max=Math.max(...C.map(c=>c.value)),unit=o.unit||niceUnit(max,Math.floor(ph/step)),cw=W/C.length,bw=Math.min(o.barW||28,cw*.62);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('height',H);svg.innerHTML='';
  el(svg,'line',{x1:0,x2:W,y1:T+ph+.5,y2:T+ph+.5,class:'dcc-floor'});
  C.forEach((c,i)=>{const x=i*cw+(cw-bw)/2,n=Math.round(c.value/unit);for(let j=0;j<n;j++){const y=T+ph-(j+1)*step+1;anim(el(svg,'line',{x1:x,x2:x+bw,y1:y,y2:y,class:'dcc-rung'+(c.hero?' hero':'')}),'fade',i*100+j*12)}
    if(o.valueLabels!==false)anim(txt(svg,{x:x+bw/2,y:T+ph-n*step-9,'text-anchor':'middle',class:'dcc-val'+(c.hero?' hero':'')},c.display||compact(c.value)),'fade',i*100+500);
    if(c.note)anim(txt(svg,{x:x+bw/2,y:T+ph-n*step-23,'text-anchor':'middle',class:'dcc-note'},c.note),'fade',i*100+600);
    if(o.labels!==false)txt(svg,{x:x+bw/2,y:H-4,'text-anchor':'middle',class:'dcc-axis'},c.label)});
  if(o.median!=null){const y=T+ph-o.median/unit*step;el(svg,'line',{x1:0,x2:W,y1:y,y2:y,class:'dcc-guide'})}
  return unit}

g.DCC={line,rungs,dumbbell,strip,curves,columns,reveal,tip,compact,niceUnit};
})(typeof window!=='undefined'?window:globalThis);
