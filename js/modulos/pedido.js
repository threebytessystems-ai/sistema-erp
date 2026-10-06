/* ===================== PEDIDO DE COMPRA ===================== */
function gerarPedido(cotId) {
  const cot = data.cotacao.find(x => x.id === cotId);
  const r = data.requisicao.find(x => x.id === cot.reqId);
  const prop = cot.propostas.find(p => p.fornecedorId === cot.vencedorId);
  prop._reqId = r.id;
  const f = data.fornecedor.find(x => x.id === cot.vencedorId);
  const total = totalProposta(prop);
  data.pedCounter++;
  const aprovado = num(r.valorAprovado || 0);
  const excesso = aprovado ? total - aprovado : 0;
  const ped = {
    id: Date.now(), numero: 'PC-' + String(data.pedCounter).padStart(4,'0'),
    cotacaoId: cot.id, reqId: r.id, reqNumero: r.numero, area: r.area, ccId: r.ccId,
    fornecedorId: f.id, fornecedor: f.nome, cnpj: f.cnpj,
    itens: r.itens.map((it,ix) => ({ ...it, unit: prop.itens[ix].unit, total: num(prop.itens[ix].unit) * num(it.qtd) })),
    frete: prop.frete, cond: prop.cond, prazo: prop.prazo,
    valorTotal: String(total).replace('.',','),
    valorAprovado: String(aprovado),
    excesso: excesso > 0 ? excesso : 0,
    excessoPct: aprovado ? (excesso / aprovado * 100).toFixed(1) : '0',
    // qualquer diferença vira observação; só acima da tolerância sobe para a controladoria
    revisarControladoria: excesso > TOLERANCIA_EXCESSO,
    excessoRevisado: false, excessoAutorizado: false,
    status: total > ALCADA_DIRETORIA ? 'Aguardando aprovação' : 'Aprovado',
    exigeDiretoria: total > ALCADA_DIRETORIA,
    recebido: false, nfLancada: false, criadoEm: hoje(), historico: [],
  };
  if (excesso > 0) {
    ped.obsValor = `Cotação R$ ${brl(total)} contra verba liberada de R$ ${brl(aprovado)} — diferença de R$ ${brl(excesso)} (${ped.excessoPct}%).`;
    logar(ped, 'Valor acima da verba liberada em R$ ' + brl(excesso));
    if (ped.revisarControladoria) logar(ped, 'Acima da tolerância de R$ ' + brl(TOLERANCIA_EXCESSO) + ' — enviado para revisão da controladoria');
  } else if (aprovado) {
    ped.obsValor = `Cotação R$ ${brl(total)} dentro da verba liberada de R$ ${brl(aprovado)} (economia de R$ ${brl(aprovado-total)}).`;
  }
  logar(ped, 'Pedido gerado a partir da ' + cot.numero + ' (R$ ' + brl(total) + ')');
  if (!ped.exigeDiretoria) logar(ped, 'Aprovado automaticamente — abaixo da alçada de R$ ' + brl(ALCADA_DIRETORIA));
  data.pedido.push(ped);
  r.status = 'Pedido gerado'; r.pedidoNumero = ped.numero;
  logar(r, 'Pedido ' + ped.numero + ' gerado');
  save();
  state = { modulo: 'pedido' }; renderAll();
}

RENDERERS.pedido = function (c) {
  pageHead(c, 'Pedidos de compra', `Pedido gerado a partir da cotação vencedora. Acima de R$ ${brl(ALCADA_DIRETORIA)} só vale depois do aval do diretor financeiro; abaixo disso é aprovado automaticamente.`);
  if (!pode('aprovar_pedido')) c.insertAdjacentHTML('beforeend', `<div class="lock-note">Aprovação de pedido é restrita a ${ACOES.aprovar_pedido.map(p=>PERFIS[p]).join(' ou ')}. Você pode consultar os pedidos normalmente.</div>`);
  const lista = div(c, '');
  if (!data.pedido.length) {
    lista.innerHTML = `<div class="empty-state"><h3>Nenhum pedido de compra</h3><p>Pedidos aparecem aqui quando Compras converte uma cotação concluída.</p></div>`;
    return;
  }
  lista.innerHTML = data.pedido.slice().reverse().map((p,ix) => {
    const cc = ccPorId(p.ccId);
    const acoes = (p.status === 'Aguardando aprovação' && pode('aprovar_pedido'))
      ? `<button class="btn btn-primary" data-ok="${p.id}">Aprovar pedido</button><button class="btn btn-ghost" data-no="${p.id}">Reprovar</button>` : '';
    return `<div class="doc-card anim-in" style="animation-delay:${ix*60}ms">
      <div class="doc-head">
        <div class="doc-head-left"><span class="mono">${esc(p.numero)}</span><strong>${esc(p.fornecedor)}</strong>
          <span class="tag">${esc(p.reqNumero)} · ${esc(cc?cc.codigo:'')}</span>
          ${p.exigeDiretoria?'<span class="badge warn">acima da alçada</span>':'<span class="badge neutral">dentro da alçada</span>'}
          ${p.revisarControladoria?`<span class="excess-star" title="Acima da verba liberada">*</span><span class="badge bad">${p.excessoRevisado?(p.excessoAutorizado?'excesso autorizado':'excesso devolvido'):'aguarda controladoria'}</span>`:''}</div>
        <div class="doc-head-right"><span class="badge ${statusBadge(p.status)}">${esc(p.status)}</span><span class="doc-date">${esc(p.criadoEm)}</span></div>
      </div>
      <div class="doc-items">${p.itens.map(i=>`<div class="doc-item-row"><span class="tag">${i.tipo==='material'?'Material':'Serviço'}</span><span>${esc(i.nome)}</span><span class="mono">${esc(i.qtd)} × R$ ${brl(num(i.unit))}</span><span class="mono" style="margin-left:auto">R$ ${brl(i.total)}</span></div>`).join('')}</div>
      <div class="totals">
        <div>Frete<b>R$ ${brl(num(p.frete))}</b></div>
        <div>Total do pedido<b>R$ ${brl(num(p.valorTotal))}</b></div>
        <div>Condição<b style="font-size:13px">${esc(p.cond)}</b></div>
        <div>Prazo<b style="font-size:13px">${esc(p.prazo)}</b></div>
      </div>
      ${p.obsValor?`<div class="doc-note ${p.excesso>0?'warnbox':''}">${p.excesso>0?'<strong>Observação de valor:</strong> ':'<strong>Observação:</strong> '}${esc(p.obsValor)}${p.revisarControladoria&&!p.excessoRevisado?' <strong>Aguardando verificação da controladoria.</strong>':''}</div>`:''}
      ${acoes?`<div class="doc-actions">${acoes}</div>`:''}
      ${p.historico&&p.historico.length?`<div class="hist">${p.historico.slice(-4).map(h=>`<div class="hist-row"><b>${esc(h.quando)}</b> ${esc(h.quem)} — ${esc(h.texto)}</div>`).join('')}</div>`:''}
    </div>`;
  }).join('');
  lista.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => {
    const p = data.pedido.find(x => x.id === Number(b.dataset.ok));
    p.status = 'Aprovado'; logar(p, 'Pedido aprovado pelo diretor financeiro');
    save(); renderAll();
  });
  lista.querySelectorAll('[data-no]').forEach(b => b.onclick = () => {
    const p = data.pedido.find(x => x.id === Number(b.dataset.no));
    const motivo = prompt('Motivo da reprovação:') || 'sem motivo informado';
    p.status = 'Reprovado'; logar(p, 'Pedido reprovado — ' + motivo);
    save(); renderAll();
  });
};

