/* ===================== FINANCEIRO ===================== */
const FORMAS_PGTO = ['Boleto','Transferência (TED)','PIX','Cartão corporativo'];

RENDERERS.financeiro = function (c) {
  pageHead(c, 'Contas a pagar', 'Títulos gerados pelas notas fiscais lançadas. O financeiro programa a forma de pagamento, libera e dá baixa quando o fornecedor é efetivamente pago.');
  if (!pode('liberar_pagamento')) c.insertAdjacentHTML('beforeend', bloqueioAcao('liberar_pagamento'));

  const aberto = data.pagamento.filter(p => p.status !== 'Pago');
  const pago = data.pagamento.filter(p => p.status === 'Pago');
  const kpis = div(c, 'kpi-row');
  kpis.innerHTML = `
    <div class="kpi"><div class="kpi-label">Títulos em aberto</div><div class="kpi-value accent">${aberto.length}</div></div>
    <div class="kpi"><div class="kpi-label">Valor a pagar</div><div class="kpi-value">R$ ${brl(aberto.reduce((s,p)=>s+num(p.valor),0))}</div></div>
    <div class="kpi"><div class="kpi-label">Já pago</div><div class="kpi-value">R$ ${brl(pago.reduce((s,p)=>s+num(p.valor),0))}</div></div>
    <div class="kpi"><div class="kpi-label">Títulos quitados</div><div class="kpi-value">${pago.length}</div></div>`;

  const lista = div(c, '');
  if (!data.pagamento.length) {
    lista.innerHTML = `<div class="empty-state"><h3>Nenhum título</h3><p>Títulos são criados automaticamente quando o contábil lança uma nota fiscal.</p></div>`;
    return;
  }
  lista.innerHTML = data.pagamento.slice().reverse().map((p,ix) => {
    const nf = data.nf.find(n => n.id === p.nfId);
    let acoes = '';
    if (pode('liberar_pagamento')) {
      if (p.status === 'A programar') acoes = `<button class="btn btn-primary" data-prog="${p.id}">Programar pagamento</button>`;
      else if (p.status === 'Programado') acoes = `<button class="btn btn-primary" data-pay="${p.id}">Dar baixa (pago)</button><button class="btn btn-ghost" data-volta="${p.id}">Voltar para programação</button>`;
    }
    return `<div class="doc-card anim-in" style="animation-delay:${ix*60}ms">
      <div class="doc-head">
        <div class="doc-head-left"><span class="mono">NF ${esc(p.nfNumero)}</span><strong>${esc(p.fornecedor)}</strong>${p.forma?`<span class="tag">${esc(p.forma)}</span>`:''}${nf&&nf.divergente?'<span class="badge warn">NF divergente</span>':''}</div>
        <div class="doc-head-right"><span class="badge ${statusBadge(p.status)}">${esc(p.status)}</span><span class="doc-date">vence ${esc(p.vencimento)}</span></div>
      </div>
      <div class="totals">
        <div>Valor líquido<b>R$ ${brl(num(p.valor))}</b></div>
        ${nf&&nf.calc.retido?`<div>Retido na fonte<b>R$ ${brl(nf.calc.retido)}</b></div>`:''}
        ${p.pagoEm?`<div>Pago em<b style="font-size:13px">${esc(p.pagoEm)}</b></div>`:''}
      </div>
      ${acoes?`<div class="doc-actions">${acoes}</div>`:''}
      ${p.historico&&p.historico.length?`<div class="hist">${p.historico.slice(-3).map(h=>`<div class="hist-row"><b>${esc(h.quando)}</b> ${esc(h.quem)} — ${esc(h.texto)}</div>`).join('')}</div>`:''}
    </div>`;
  }).join('');

  lista.querySelectorAll('[data-prog]').forEach(b => b.onclick = () => {
    const p = data.pagamento.find(x => x.id === Number(b.dataset.prog));
    const forma = prompt('Forma de pagamento (' + FORMAS_PGTO.join(' / ') + '):', 'PIX');
    if (!forma) return;
    p.forma = forma; p.status = 'Programado';
    logar(p, 'Pagamento programado via ' + forma + ' para ' + p.vencimento);
    save(); renderAll();
  });
  lista.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => {
    const p = data.pagamento.find(x => x.id === Number(b.dataset.pay));
    p.status = 'Pago'; p.pagoEm = hoje();
    logar(p, 'Baixa registrada — fornecedor pago');
    const nf = data.nf.find(n => n.id === p.nfId);
    if (nf) { const ped = data.pedido.find(x => x.id === nf.pedidoId); if (ped) { ped.status = 'Pago'; logar(ped, 'Ciclo encerrado — fornecedor pago'); } }
    save(); renderAll();
  });
  lista.querySelectorAll('[data-volta]').forEach(b => b.onclick = () => {
    const p = data.pagamento.find(x => x.id === Number(b.dataset.volta));
    p.status = 'A programar'; p.forma = '';
    logar(p, 'Programação cancelada');
    save(); renderAll();
  });
};
