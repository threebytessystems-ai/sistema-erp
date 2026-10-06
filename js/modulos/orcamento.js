/* ===================== VALIDAÇÃO DE VERBA ===================== */
/* ===================== CONTROLADORIA — VERBA ===================== */
function estimativaReq(r) { return r.itens.reduce((s,i) => s + num(i.precoRef) * num(i.qtd), 0); }

// Previsto a gastar: verba já liberada que ainda não virou pedido + pedidos em andamento
function previstoCC(ccId) {
  const liberadas = data.requisicao.filter(r => r.ccId === ccId && ['Verba aprovada','Em cotação','Cotação concluída'].includes(r.status))
    .reduce((s,r) => s + num(r.valorAprovado || estimativaReq(r)), 0);
  const emAprovacao = data.pedido.filter(p => p.ccId === ccId && p.status === 'Aguardando aprovação')
    .reduce((s,p) => s + num(p.valorTotal), 0);
  return liberadas + emAprovacao;
}

RENDERERS.orcamento = function (c) {
  pageHead(c, 'Controladoria — verba', 'A controladoria confere se o centro de custo comporta a requisição antes de ela ir para cotação, e acompanha o quanto já está comprometido mas ainda não foi gasto.');
  if (!pode('aprovar_orcamento')) c.insertAdjacentHTML('beforeend', bloqueioAcao('aprovar_orcamento'));

  /* ---- Painel orçamentário: realizado + previsto ---- */
  const sec0 = div(c, '');
  sec0.innerHTML = `<div class="page-head" style="margin-bottom:11px"><h1 style="font-size:15px">Posição orçamentária</h1></div>`;
  const painel = div(c, 'cc-grid');
  data.centroCusto.forEach((cc, ix) => {
    const orc = num(cc.orcamento);
    const realizado = consumoCC(cc.id);
    const previsto = previstoCC(cc.id);
    const livre = orc - realizado - previsto;
    const pR = orc ? Math.min(100,(realizado/orc)*100) : 0;
    const pP = orc ? Math.min(100-pR,(previsto/orc)*100) : 0;
    const box = document.createElement('div');
    box.className = 'cc-card anim-in';
    box.style.animationDelay = (ix*60)+'ms';
    box.innerHTML = `
      <div class="cc-head"><strong>${esc(cc.codigo)}</strong><span>${esc(cc.nome)}</span></div>
      <div class="cc-main ${livre<0?'neg':''}">R$ ${brl(livre)}</div>
      <div class="cc-sub">livre de R$ ${brl(orc)}</div>
      <div class="budget-bar dual"><div class="seg real" style="width:${pR}%"></div><div class="seg prev" style="width:${pP}%"></div></div>
      <div class="cc-legend">
        <span><i class="dot real"></i>Realizado R$ ${brl(realizado)}</span>
        <span><i class="dot prev"></i>Previsto R$ ${brl(previsto)}</span>
      </div>`;
    painel.appendChild(box);
  });

  /* ---- Excessos de cotação para revisar ---- */
  const excessos = data.pedido.filter(p => p.revisarControladoria && !p.excessoRevisado);
  if (excessos.length) {
    const se = div(c, '');
    se.innerHTML = `<div class="page-head" style="margin:24px 0 11px"><h1 style="font-size:15px">Cotações acima do valor liberado <span class="badge bad">${excessos.length}</span></h1>
      <p>A cotação fechou acima do que foi aprovado na verba, com diferença superior a R$ ${brl(TOLERANCIA_EXCESSO)}. Confirme se o gasto adicional está autorizado.</p></div>`;
    const le = div(c, '');
    le.innerHTML = excessos.slice().reverse().map((p,ix) => `
      <div class="doc-card alert anim-in" style="animation-delay:${ix*60}ms">
        <div class="doc-head">
          <div class="doc-head-left"><span class="excess-star">*</span><span class="mono">${esc(p.numero)}</span><strong>${esc(p.fornecedor)}</strong><span class="tag">${esc(p.reqNumero)} · ${esc(p.area)}</span></div>
          <div class="doc-head-right"><span class="badge bad">+ R$ ${brl(p.excesso)}</span></div>
        </div>
        <div class="totals">
          <div>Verba liberada<b>R$ ${brl(num(p.valorAprovado))}</b></div>
          <div>Cotação fechada<b>R$ ${brl(num(p.valorTotal))}</b></div>
          <div>Diferença<b style="color:var(--accent)">+ R$ ${brl(p.excesso)} (${p.excessoPct}%)</b></div>
        </div>
        ${pode('revisar_excesso')?`<div class="doc-actions"><button class="btn btn-primary" data-exok="${p.id}">Autorizar gasto adicional</button><button class="btn btn-ghost" data-exno="${p.id}">Devolver para Compras renegociar</button></div>`:''}
      </div>`).join('');
    le.querySelectorAll('[data-exok]').forEach(b => b.onclick = () => {
      const p = data.pedido.find(x=>x.id===Number(b.dataset.exok));
      p.excessoRevisado = true; p.excessoAutorizado = true;
      logar(p, 'Gasto adicional de R$ ' + brl(p.excesso) + ' autorizado pela controladoria');
      save(); renderAll();
    });
    le.querySelectorAll('[data-exno]').forEach(b => b.onclick = () => {
      const p = data.pedido.find(x=>x.id===Number(b.dataset.exno));
      const motivo = prompt('Orientação para Compras:') || 'renegociar valor';
      p.excessoRevisado = true; p.excessoAutorizado = false;
      p.status = 'Reprovado';
      logar(p, 'Devolvido para Compras pela controladoria — ' + motivo);
      const cot = data.cotacao.find(x => x.id === p.cotacaoId);
      if (cot) { cot.vencedorId = null; logar(cot, 'Reaberta para renegociação a pedido da controladoria'); }
      const r = data.requisicao.find(x => x.id === p.reqId);
      if (r) { r.status = 'Em cotação'; logar(r, 'Cotação reaberta — valor acima da verba liberada'); }
      save(); renderAll();
    });
  }

  /* ---- Fila de liberação de verba ---- */
  const sec = div(c, '');
  const pend = data.requisicao.filter(r => r.status === 'Aguardando verba');
  sec.innerHTML = `<div class="page-head" style="margin:24px 0 11px"><h1 style="font-size:15px">Aguardando liberação de verba${pend.length?` <span class="badge warn">${pend.length}</span>`:''}</h1></div>`;
  const lista = div(c, '');
  if (!pend.length) {
    lista.innerHTML = `<div class="empty-state"><h3>Nenhuma requisição aguardando verba</h3><p>Tudo validado por aqui.</p></div>`;
  } else {
    lista.innerHTML = pend.slice().reverse().map((r,ix) => {
      const cc = ccPorId(r.ccId);
      const estimado = estimativaReq(r);
      const disponivel = cc ? num(cc.orcamento) - consumoCC(cc.id) - previstoCC(cc.id) : 0;
      const alerta = estimado > disponivel
        ? `<div class="lock-note">Estimativa de R$ ${brl(estimado)} acima do saldo livre de R$ ${brl(disponivel)} em ${esc(cc?cc.codigo:'—')} (já descontando o previsto). Liberar aqui vai estourar o centro de custo.</div>` : '';
      const acoes = pode('aprovar_orcamento')
        ? `<button class="btn btn-primary" data-ok="${r.id}">Liberar verba</button><button class="btn btn-ghost" data-no="${r.id}">Reprovar</button>` : '';
      return cardReq(r, { extra: alerta, acoes, delay: ix*60 });
    }).join('');
    lista.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => {
      const r = data.requisicao.find(x => x.id === Number(b.dataset.ok));
      const est = estimativaReq(r);
      const entrada = prompt('Valor de verba a liberar para esta requisição (R$):', brl(est));
      if (entrada === null) return;
      r.valorAprovado = String(num(entrada) || est);
      r.status = 'Verba aprovada';
      logar(r, 'Verba de R$ ' + brl(num(r.valorAprovado)) + ' liberada pela controladoria');
      save(); renderAll();
    });
    lista.querySelectorAll('[data-no]').forEach(b => b.onclick = () => {
      const r = data.requisicao.find(x => x.id === Number(b.dataset.no));
      const motivo = prompt('Motivo da reprovação:') || 'sem motivo informado';
      r.status = 'Verba reprovada'; logar(r, 'Verba reprovada — ' + motivo);
      save(); renderAll();
    });
  }

  /* ---- Verba liberada ainda não gasta ---- */
  const comp = data.requisicao.filter(r => ['Verba aprovada','Em cotação','Cotação concluída'].includes(r.status));
  if (comp.length) {
    const sc = div(c, '');
    sc.innerHTML = `<div class="page-head" style="margin:24px 0 11px"><h1 style="font-size:15px">Previsto a ser gasto</h1>
      <p>Verba já liberada por você que ainda não virou pedido aprovado. Total comprometido: <strong>R$ ${brl(comp.reduce((s,r)=>s+num(r.valorAprovado||estimativaReq(r)),0))}</strong>.</p></div>`;
    const tc = div(c, 'table-wrap anim-in');
    tc.innerHTML = `<table><thead><tr><th class="mono">Req.</th><th>Área</th><th class="mono">CC</th><th>Etapa atual</th><th class="num">Verba liberada</th><th class="num">Cotação atual</th></tr></thead><tbody>
      ${comp.slice().reverse().map(r => {
        const cc = ccPorId(r.ccId);
        const cot = data.cotacao.find(x => x.reqId === r.id);
        let atual = '—';
        if (cot && cot.vencedorId) {
          const p = cot.propostas.find(x=>x.fornecedorId===cot.vencedorId); p._reqId = r.id;
          const tot = totalProposta(p); const dif = tot - num(r.valorAprovado||0);
          atual = `R$ ${brl(tot)}${dif>0?` <span class="badge bad">+${brl(dif)}</span>`:dif<0?` <span class="badge ok">−${brl(-dif)}</span>`:''}`;
        }
        return `<tr><td class="mono">${esc(r.numero)}</td><td>${esc(r.area)}</td><td class="mono">${esc(cc?cc.codigo:'')}</td>
          <td><span class="badge ${statusBadge(r.status)}">${esc(r.status)}</span></td>
          <td class="num">R$ ${brl(num(r.valorAprovado||estimativaReq(r)))}</td><td class="num">${atual}</td></tr>`;
      }).join('')}
    </tbody></table>`;
  }
};
const TOLERANCIA_EXCESSO = 50;

