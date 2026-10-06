/* ===================== GRÁFICOS (SVG inline, sem biblioteca) ===================== */
const PALETA = ['#C8102E','#2F6F8F','#6B8E23','#B8860B','#7A5FA3','#2E8B7A','#A0522D','#4A5568'];

function barrasHorizontais(dados, opts) {
  opts = opts || {};
  if (!dados.length) return `<div class="chart-empty">Sem dados ainda.</div>`;
  const max = Math.max(...dados.map(d => d.valor), 1);
  return `<div class="hbars">${dados.map((d,i) => {
    const pct = (d.valor / max) * 100;
    return `<div class="hbar-row anim-in" style="animation-delay:${i*70}ms">
      <div class="hbar-label" title="${esc(d.rotulo)}">${esc(d.rotulo)}</div>
      <div class="hbar-track"><div class="hbar-fill" style="--w:${pct}%;background:${d.cor||PALETA[i%PALETA.length]}"></div></div>
      <div class="hbar-val">${opts.money ? 'R$ '+brl(d.valor) : brl(d.valor)}</div>
    </div>`;
  }).join('')}</div>`;
}

function barrasAgrupadas(dados) {
  if (!dados.length) return `<div class="chart-empty">Sem dados ainda.</div>`;
  const max = Math.max(...dados.flatMap(d => [d.orcamento, d.realizado + d.previsto]), 1);
  return `<div class="hbars">${dados.map((d,i) => {
    const pR = (d.realizado/max)*100, pP = (d.previsto/max)*100, pO = (d.orcamento/max)*100;
    const estouro = (d.realizado + d.previsto) > d.orcamento;
    return `<div class="gbar anim-in" style="animation-delay:${i*70}ms">
      <div class="gbar-head"><strong>${esc(d.rotulo)}</strong>
        <span class="${estouro?'neg':''}">R$ ${brl(d.realizado+d.previsto)} de R$ ${brl(d.orcamento)}</span></div>
      <div class="gbar-track">
        <div class="gbar-limit" style="left:${pO}%" title="Orçamento"></div>
        <div class="gbar-seg real" style="--w:${pR}%"></div>
        <div class="gbar-seg prev" style="--w:${pP}%;left:${pR}%"></div>
      </div>
    </div>`;
  }).join('')}
  <div class="chart-legend"><span><i class="dot real"></i>Realizado</span><span><i class="dot prev"></i>Previsto</span><span><i class="dot lim"></i>Teto do orçamento</span></div></div>`;
}

function rosca(dados) {
  const total = dados.reduce((s,d)=>s+d.valor,0);
  if (!total) return `<div class="chart-empty">Sem dados ainda.</div>`;
  let acc = 0; const R = 54, C = 2*Math.PI*R;
  const segs = dados.map((d,i) => {
    const frac = d.valor/total, dash = frac*C;
    const seg = `<circle class="donut-seg" r="${R}" cx="70" cy="70" fill="none"
      stroke="${PALETA[i%PALETA.length]}" stroke-width="22"
      stroke-dasharray="${dash} ${C-dash}" stroke-dashoffset="${-acc}"
      style="--dash:${dash};--gap:${C-dash};animation-delay:${i*120}ms"><title>${esc(d.rotulo)}: R$ ${brl(d.valor)}</title></circle>`;
    acc += dash; return seg;
  }).join('');
  return `<div class="donut-wrap">
    <svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Distribuição por categoria">
      <g transform="rotate(-90 70 70)">${segs}</g>
    </svg>
    <div class="donut-legend">${dados.map((d,i)=>`<div class="anim-in" style="animation-delay:${i*70}ms"><i class="dot" style="background:${PALETA[i%PALETA.length]}"></i>
      <span>${esc(d.rotulo)}</span><b>R$ ${brl(d.valor)}</b><em>${((d.valor/total)*100).toFixed(0)}%</em></div>`).join('')}</div>
  </div>`;
}

function chartCard(c, titulo, sub, conteudo, delay) {
  const box = document.createElement('div');
  box.className = 'chart-card anim-in';
  box.style.animationDelay = (delay||0)+'ms';
  box.innerHTML = `<div class="chart-head"><h3>${esc(titulo)}</h3>${sub?`<p>${esc(sub)}</p>`:''}</div>${conteudo}`;
  c.appendChild(box);
  return box;
}

/* --------- agregações --------- */
function gastoPorArea() {
  const m = {};
  data.pedido.filter(p => ['Aprovado','Recebido','NF lançada','Pago'].includes(p.status))
    .forEach(p => { m[p.area] = (m[p.area]||0) + num(p.valorTotal); });
  return Object.entries(m).map(([rotulo,valor]) => ({rotulo,valor})).sort((a,b)=>b.valor-a.valor);
}
function gastoPorFornecedor() {
  const m = {};
  data.pedido.filter(p => ['Aprovado','Recebido','NF lançada','Pago'].includes(p.status))
    .forEach(p => { m[p.fornecedor] = (m[p.fornecedor]||0) + num(p.valorTotal); });
  return Object.entries(m).map(([rotulo,valor]) => ({rotulo,valor})).sort((a,b)=>b.valor-a.valor).slice(0,8);
}
function gastoPorCategoria() {
  const m = { 'Material': 0, 'Serviço': 0 };
  data.pedido.filter(p => ['Aprovado','Recebido','NF lançada','Pago'].includes(p.status))
    .forEach(p => p.itens.forEach(i => { m[i.tipo==='material'?'Material':'Serviço'] += num(i.total); }));
  return Object.entries(m).filter(([,v])=>v>0).map(([rotulo,valor]) => ({rotulo,valor}));
}
function orcamentoPorCC() {
  return data.centroCusto.map(cc => ({
    rotulo: cc.codigo + ' — ' + cc.nome,
    orcamento: num(cc.orcamento), realizado: consumoCC(cc.id), previsto: previstoCC(cc.id),
  }));
}
function consumoMateriais() {
  const m = {};
  data.movEstoque.filter(x => x.tipo === 'Saída').forEach(x => { m[x.nome] = (m[x.nome]||0) + x.qtd; });
  return Object.entries(m).map(([rotulo,valor]) => ({rotulo,valor})).sort((a,b)=>b.valor-a.valor).slice(0,8);
}
function requisicoesPorArea() {
  const m = {};
  data.requisicao.forEach(r => { m[r.area] = (m[r.area]||0) + 1; });
  return Object.entries(m).map(([rotulo,valor]) => ({rotulo,valor})).sort((a,b)=>b.valor-a.valor);
}

RENDERERS.indicadores = function (c) {
  pageHead(c, 'Indicadores', 'Onde o dinheiro está sendo comprometido e consumido. Tudo calculado a partir dos pedidos aprovados e das movimentações reais do sistema.');

  const totalAprovado = data.pedido.filter(p=>['Aprovado','Recebido','NF lançada','Pago'].includes(p.status)).reduce((s,p)=>s+num(p.valorTotal),0);
  const totalPrevisto = data.centroCusto.reduce((s,cc)=>s+previstoCC(cc.id),0);
  const totalOrc = data.centroCusto.reduce((s,cc)=>s+num(cc.orcamento),0);
  const economia = data.pedido.filter(p=>num(p.valorAprovado)>0).reduce((s,p)=>s+(num(p.valorAprovado)-num(p.valorTotal)),0);
  const kpis = div(c, 'kpi-row');
  kpis.innerHTML = `
    <div class="kpi anim-in"><div class="kpi-label">Comprometido (realizado)</div><div class="kpi-value accent">R$ ${brl(totalAprovado)}</div></div>
    <div class="kpi anim-in" style="animation-delay:60ms"><div class="kpi-label">Previsto a gastar</div><div class="kpi-value">R$ ${brl(totalPrevisto)}</div></div>
    <div class="kpi anim-in" style="animation-delay:120ms"><div class="kpi-label">Orçamento total</div><div class="kpi-value">R$ ${brl(totalOrc)}</div></div>
    <div class="kpi anim-in" style="animation-delay:180ms"><div class="kpi-label">${economia>=0?'Economia nas cotações':'Excedente nas cotações'}</div><div class="kpi-value" style="color:${economia>=0?'var(--ok-ink)':'var(--accent)'}">R$ ${brl(Math.abs(economia))}</div></div>`;

  const grid = div(c, 'chart-grid');
  chartCard(grid, 'Orçamento por centro de custo', 'Realizado e previsto contra o teto de cada CC', barrasAgrupadas(orcamentoPorCC()), 0);
  chartCard(grid, 'Gasto por área', 'Pedidos aprovados, por área solicitante', barrasHorizontais(gastoPorArea(), {money:true}), 70);
  chartCard(grid, 'Material x Serviço', 'Como o gasto se divide entre os dois tipos', rosca(gastoPorCategoria()), 140);
  chartCard(grid, 'Gasto por fornecedor', 'Concentração de compras — top 8', barrasHorizontais(gastoPorFornecedor(), {money:true}), 210);
  chartCard(grid, 'Volume de requisições por área', 'Quem mais demanda compras', barrasHorizontais(requisicoesPorArea()), 280);
  chartCard(grid, 'Consumo de materiais', 'Saídas do almoxarifado por item — top 8', barrasHorizontais(consumoMateriais()), 350);

  // Tabela de desvios
  const desvios = data.pedido.filter(p => num(p.valorAprovado) > 0);
  if (desvios.length) {
    const s = div(c, '');
    s.innerHTML = `<div class="page-head" style="margin:26px 0 11px"><h1 style="font-size:15px">Verba liberada x cotação fechada</h1>
      <p>Diferença entre o que a controladoria liberou e o que Compras efetivamente fechou. Acima de R$ ${brl(TOLERANCIA_EXCESSO)} sobe com asterisco para revisão.</p></div>`;
    const t = div(c, 'table-wrap anim-in');
    t.innerHTML = `<table><thead><tr><th class="mono">Pedido</th><th>Área</th><th>Fornecedor</th><th class="num">Liberado</th><th class="num">Fechado</th><th class="num">Diferença</th><th>Situação</th></tr></thead><tbody>
      ${desvios.slice().reverse().map(p => {
        const dif = num(p.valorTotal) - num(p.valorAprovado);
        return `<tr><td class="mono">${p.revisarControladoria?'<span class="excess-star">*</span>':''}${esc(p.numero)}</td><td>${esc(p.area)}</td><td>${esc(p.fornecedor)}</td>
          <td class="num">R$ ${brl(num(p.valorAprovado))}</td><td class="num">R$ ${brl(num(p.valorTotal))}</td>
          <td class="num" style="color:${dif>0?'var(--accent)':'var(--ok-ink)'}">${dif>0?'+':'−'} R$ ${brl(Math.abs(dif))}</td>
          <td>${p.revisarControladoria ? (p.excessoRevisado ? (p.excessoAutorizado?'<span class="badge ok">autorizado</span>':'<span class="badge bad">devolvido</span>') : '<span class="badge warn">aguarda revisão</span>') : (dif>0?'<span class="badge neutral">dentro da tolerância</span>':'<span class="badge ok">dentro da verba</span>')}</td></tr>`;
      }).join('')}
    </tbody></table>`;
  }
};
