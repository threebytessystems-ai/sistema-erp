/* ===================== COTAÇÃO ===================== */
RENDERERS.cotacao = function (c) {
  pageHead(c, 'Cotações', 'Compras lança o preço de cada fornecedor para a requisição liberada e escolhe o vencedor. Só fornecedor homologado pode vencer.');
  if (!pode('lancar_cotacao')) c.insertAdjacentHTML('beforeend', bloqueioAcao('lancar_cotacao'));

  const aCotar = data.requisicao.filter(r => ['Verba aprovada','Em cotação'].includes(r.status));
  const sec1 = div(c, '');
  sec1.innerHTML = `<div class="page-head" style="margin-bottom:12px"><h1 style="font-size:15px">Aguardando cotação</h1></div>`;
  const lista1 = div(c, '');
  if (!aCotar.length) {
    lista1.innerHTML = `<div class="empty-state"><h3>Nada para cotar</h3><p>Requisições aparecem aqui depois que o gestor da área libera a verba.</p></div>`;
  } else {
    lista1.innerHTML = aCotar.slice().reverse().map((r,ix) => {
      const cot = data.cotacao.find(x => x.reqId === r.id);
      const acoes = pode('lancar_cotacao')
        ? `<button class="btn btn-primary" data-cot="${r.id}">${cot ? 'Continuar cotação' : 'Iniciar cotação'}</button>` : '';
      return cardReq(r, { acoes, delay: ix*60 });
    }).join('');
  }
  const painel = div(c, ''); painel.style.display = 'none';
  lista1.querySelectorAll('[data-cot]').forEach(b => b.onclick = () => formCotacao(painel, Number(b.dataset.cot)));

  const sec2 = div(c, '');
  sec2.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Cotações concluídas</h1></div>`;
  const lista2 = div(c, '');
  const concl = data.cotacao.filter(x => x.vencedorId);
  if (!concl.length) lista2.innerHTML = `<div class="empty-state"><h3>Nenhuma cotação concluída</h3><p>Ao escolher o vencedor, a cotação aparece aqui pronta para virar pedido.</p></div>`;
  else lista2.innerHTML = concl.slice().reverse().map((cot,ix) => {
    const r = data.requisicao.find(x => x.id === cot.reqId);
    const venc = data.fornecedor.find(f => f.id === cot.vencedorId);
    const prop = cot.propostas.find(p => p.fornecedorId === cot.vencedorId);
    const total = totalProposta(prop);
    const jaTemPedido = data.pedido.some(p => p.cotacaoId === cot.id);
    const acoes = (pode('gerar_pedido') && !jaTemPedido)
      ? `<button class="btn btn-primary" data-ped="${cot.id}">Gerar pedido de compra</button>` : '';
    return `<div class="doc-card anim-in" style="animation-delay:${ix*60}ms">
      <div class="doc-head">
        <div class="doc-head-left"><span class="mono">${esc(cot.numero)}</span><strong>${esc(venc?venc.nome:'—')}</strong><span class="tag">${esc(r?r.numero:'')}</span></div>
        <div class="doc-head-right"><span class="badge ok">Vencedor definido</span><span class="doc-date">${esc(cot.criadoEm)}</span></div>
      </div>
      <div class="doc-items">${(prop?prop.itens:[]).map((it,ix)=>`<div class="doc-item-row"><span>${esc(r?r.itens[ix].nome:'')}</span><span class="mono">${esc(r?r.itens[ix].qtd:'')} × R$ ${brl(num(it.unit))}</span><span class="mono" style="margin-left:auto">R$ ${brl(num(it.unit)*num(r?r.itens[ix].qtd:0))}</span></div>`).join('')}</div>
      <div class="doc-note"><strong>Total:</strong> R$ ${brl(total)} · <strong>Prazo:</strong> ${esc(prop?prop.prazo:'')} · <strong>Condição:</strong> ${esc(prop?prop.cond:'')}${jaTemPedido?' · <strong>Pedido já gerado</strong>':''}</div>
      ${acoes ? `<div class="doc-actions">${acoes}</div>` : ''}
    </div>`;
  }).join('');
  lista2.querySelectorAll('[data-ped]').forEach(b => b.onclick = () => gerarPedido(Number(b.dataset.ped)));
};

function totalProposta(prop) {
  if (!prop) return 0;
  const r = data.requisicao.find(x => x.id === prop._reqId);
  let total = 0;
  prop.itens.forEach((it, ix) => {
    const qtd = r ? num(r.itens[ix].qtd) : 0;
    total += num(it.unit) * qtd;
  });
  return total + num(prop.frete);
}

function formCotacao(panel, reqId) {
  const r = data.requisicao.find(x => x.id === reqId);
  if (!r) return;
  let cot = data.cotacao.find(x => x.reqId === reqId);
  if (!cot) {
    data.cotCounter++;
    cot = { id: Date.now(), numero: 'COT-' + String(data.cotCounter).padStart(4,'0'), reqId, propostas: [], vencedorId: null, criadoEm: hoje(), historico: [] };
    data.cotacao.push(cot);
    r.status = 'Em cotação'; logar(r, 'Cotação ' + cot.numero + ' iniciada por Compras');
    save();
  }
  panel.className = 'form-panel'; panel.style.display = 'grid';
  const homologados = data.fornecedor.filter(f => f.status === 'Homologado');
  const condOpts = data.condPgto.map(cp => `<option>${esc(cp.nome)}</option>`).join('');

  function draw() {
    const propHtml = cot.propostas.map((p, pi) => {
      const f = data.fornecedor.find(x => x.id === p.fornecedorId);
      p._reqId = r.id;
      const total = totalProposta(p);
      const isVenc = cot.vencedorId === p.fornecedorId;
      return `<div class="quote-col ${isVenc?'winner':''}">
        <h4>${esc(f?f.nome:'—')} ${isVenc?'<span class="badge ok">vencedor</span>':''}</h4>
        ${p.itens.map((it,ix) => `<div class="doc-item-row"><span style="flex:1">${esc(r.itens[ix].nome)} <span class="mono">(${esc(r.itens[ix].qtd)})</span></span><span class="mono">R$ ${brl(num(it.unit))}</span></div>`).join('')}
        <div class="doc-item-row" style="margin-top:7px;padding-top:7px;border-top:1px solid var(--border)"><span>Frete</span><span class="mono" style="margin-left:auto">R$ ${brl(num(p.frete))}</span></div>
        <div class="doc-item-row"><strong>Total</strong><strong class="mono" style="margin-left:auto">R$ ${brl(total)}</strong></div>
        <div class="doc-item-row"><span class="doc-item-espec">${esc(p.prazo)} · ${esc(p.cond)}</span></div>
        ${pode('lancar_cotacao') && !cot.vencedorId ? `<div style="margin-top:9px;display:flex;gap:6px"><button class="btn btn-primary btn-sm" data-win="${pi}">Escolher vencedor</button><button class="btn btn-ghost btn-sm" data-rmp="${pi}">Remover</button></div>` : ''}
      </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="form-panel-title">${esc(cot.numero)} — cotação da ${esc(r.numero)} (${esc(r.area)})</div>
      <div class="field full">${cot.propostas.length ? `<div class="quote-grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">${propHtml}</div>` : '<div class="doc-note">Nenhuma proposta lançada ainda.</div>'}</div>
      ${(!cot.vencedorId && pode('lancar_cotacao')) ? `
        <div class="form-panel-title sep">Lançar proposta de fornecedor</div>
        <div class="field"><label>Fornecedor homologado</label><select id="q-forn">${homologados.length?homologados.map(f=>`<option value="${f.id}">${esc(f.nome)}</option>`).join(''):'<option value="">Nenhum homologado</option>'}</select></div>
        <div class="field"><label>Prazo de entrega</label><input type="text" id="q-prazo" placeholder="Ex: 10 dias úteis"></div>
        <div class="field"><label>Condição de pagamento</label><select id="q-cond">${condOpts}</select></div>
        <div class="field"><label>Frete (R$)</label><input type="text" id="q-frete" placeholder="0,00"></div>
        ${r.itens.map((it,ix)=>`<div class="field"><label>${esc(it.nome)} — valor unitário (R$)</label><input type="text" data-unit="${ix}" placeholder="0,00"></div>`).join('')}
        <div class="field-error full" data-e="q"></div>
        <div class="form-actions"><button class="btn btn-primary" id="q-add">Adicionar proposta</button><button class="btn btn-ghost" id="q-close">Fechar</button></div>
      ` : `<div class="form-actions"><button class="btn btn-ghost" id="q-close">Fechar</button></div>`}`;

    const close = panel.querySelector('#q-close');
    if (close) close.onclick = () => { panel.style.display='none'; panel.className=''; };

    const addBtn = panel.querySelector('#q-add');
    if (addBtn) addBtn.onclick = () => {
      const fid = Number(panel.querySelector('#q-forn').value);
      const err = panel.querySelector('[data-e="q"]');
      err.textContent = '';
      if (!fid) { err.textContent = 'Selecione um fornecedor homologado.'; return; }
      if (cot.propostas.some(p => p.fornecedorId === fid)) { err.textContent = 'Esse fornecedor já tem proposta nesta cotação.'; return; }
      const itensProp = r.itens.map((_,ix) => ({ unit: panel.querySelector(`[data-unit="${ix}"]`).value.trim() || '0' }));
      if (itensProp.every(i => num(i.unit) === 0)) { err.textContent = 'Informe ao menos um valor unitário.'; return; }
      cot.propostas.push({
        fornecedorId: fid, itens: itensProp,
        prazo: panel.querySelector('#q-prazo').value.trim() || 'a combinar',
        cond: panel.querySelector('#q-cond').value,
        frete: panel.querySelector('#q-frete').value.trim() || '0',
        _reqId: r.id,
      });
      logar(cot, 'Proposta lançada: ' + (data.fornecedor.find(f=>f.id===fid)||{}).nome);
      save(); draw();
    };

    panel.querySelectorAll('[data-win]').forEach(b => b.onclick = () => {
      const p = cot.propostas[Number(b.dataset.win)];
      cot.vencedorId = p.fornecedorId;
      r.status = 'Cotação concluída';
      const f = data.fornecedor.find(x => x.id === p.fornecedorId);
      logar(cot, 'Vencedor definido: ' + (f?f.nome:'') + ' — R$ ' + brl(totalProposta(p)));
      logar(r, 'Cotação concluída, vencedor ' + (f?f.nome:''));
      save(); panel.style.display='none'; panel.className=''; renderAll();
    });
    panel.querySelectorAll('[data-rmp]').forEach(b => b.onclick = () => {
      cot.propostas.splice(Number(b.dataset.rmp),1); save(); draw();
    });
  }
  draw();
}

