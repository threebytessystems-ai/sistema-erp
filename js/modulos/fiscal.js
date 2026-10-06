/* ===================== FISCAL / CONTÁBIL =====================
   Alíquotas padrão editáveis em cada lançamento.
   Material: ICMS, IPI, PIS, COFINS (crédito).
   Serviço: ISS + retenções na fonte (IRRF, INSS, CSLL/PIS/COFINS).
*/
const ALIQ_PADRAO = {
  material: { icms: 18, ipi: 0, pis: 1.65, cofins: 7.6 },
  servico:  { iss: 5, irrf: 1.5, inss: 11, csllPisCofins: 4.65 },
};

function calcularTributos(tipo, valorBruto, aliq) {
  const vb = num(valorBruto);
  const out = { base: vb, detalhes: [], retido: 0, creditos: 0, liquido: vb };
  if (tipo === 'material') {
    const ipi = vb * num(aliq.ipi)/100;
    const baseIcms = vb;
    const icms = baseIcms * num(aliq.icms)/100;
    const pis = vb * num(aliq.pis)/100;
    const cofins = vb * num(aliq.cofins)/100;
    out.detalhes = [
      { nome:'IPI', aliq:aliq.ipi, valor:ipi, tipo:'soma' },
      { nome:'ICMS', aliq:aliq.icms, valor:icms, tipo:'credito' },
      { nome:'PIS', aliq:aliq.pis, valor:pis, tipo:'credito' },
      { nome:'COFINS', aliq:aliq.cofins, valor:cofins, tipo:'credito' },
    ];
    out.creditos = icms + pis + cofins;
    out.total = vb + ipi;
    out.liquido = vb + ipi;
  } else {
    const iss = vb * num(aliq.iss)/100;
    const irrf = vb * num(aliq.irrf)/100;
    const inss = vb * num(aliq.inss)/100;
    const csll = vb * num(aliq.csllPisCofins)/100;
    out.detalhes = [
      { nome:'ISS', aliq:aliq.iss, valor:iss, tipo:'destacado' },
      { nome:'IRRF retido', aliq:aliq.irrf, valor:irrf, tipo:'retencao' },
      { nome:'INSS retido', aliq:aliq.inss, valor:inss, tipo:'retencao' },
      { nome:'CSLL/PIS/COFINS retido', aliq:aliq.csllPisCofins, valor:csll, tipo:'retencao' },
    ];
    out.retido = irrf + inss + csll;
    out.total = vb;
    out.liquido = vb - out.retido;
  }
  return out;
}

RENDERERS.fiscal = function (c) {
  pageHead(c, 'NF e tributos', 'O contábil lança a nota contra o pedido recebido, confere se o valor bate e calcula os impostos. Só depois disso a nota vira título no contas a pagar.');
  c.insertAdjacentHTML('beforeend', `<div class="disclaimer">As alíquotas abaixo são padrões genéricos e servem para demonstrar a mecânica do módulo. Antes de valer como número real, o regime tributário da Ability, o CFOP de cada operação e as regras de retenção precisam ser conferidos pela contabilidade de vocês.</div>`);
  if (!pode('lancar_nf')) c.insertAdjacentHTML('beforeend', bloqueioAcao('lancar_nf'));

  const pend = data.pedido.filter(p => p.recebido && !p.nfLancada);
  const sec = div(c, '');
  sec.innerHTML = `<div class="page-head" style="margin-bottom:12px"><h1 style="font-size:15px">Pedidos recebidos aguardando nota</h1></div>`;
  const lista = div(c, '');
  const panel = div(c, ''); panel.style.display = 'none';
  if (!pend.length) lista.innerHTML = `<div class="empty-state"><h3>Nenhuma nota pendente</h3><p>Pedidos aparecem aqui depois que o almoxarifado confirma o recebimento.</p></div>`;
  else lista.innerHTML = pend.slice().reverse().map((p,ix) => `
    <div class="doc-card anim-in" style="animation-delay:${ix*60}ms">
      <div class="doc-head">
        <div class="doc-head-left"><span class="mono">${esc(p.numero)}</span><strong>${esc(p.fornecedor)}</strong><span class="tag">${esc(p.cnpj)}</span></div>
        <div class="doc-head-right"><span class="badge ok">Recebido ${esc(p.recebidoEm||'')}</span></div>
      </div>
      <div class="totals"><div>Valor do pedido<b>R$ ${brl(num(p.valorTotal))}</b></div><div>Condição<b style="font-size:13px">${esc(p.cond)}</b></div></div>
      ${p.obsDivergencia?`<div class="doc-note warnbox"><strong>Devolvida anteriormente:</strong> ${esc(p.obsDivergencia)}</div>`:''}
      ${pode('lancar_nf')?`<div class="doc-actions"><button class="btn btn-primary" data-nf="${p.id}">Lançar nota fiscal</button></div>`:''}
    </div>`).join('');
  lista.querySelectorAll('[data-nf]').forEach(b => b.onclick = () => formNF(panel, Number(b.dataset.nf)));

  const sec2 = div(c, '');
  sec2.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Notas lançadas</h1></div>`;
  const lista2 = div(c, '');
  if (!data.nf.length) lista2.innerHTML = `<div class="empty-state"><h3>Nenhuma nota lançada</h3><p>Notas conferidas aparecem aqui e seguem automaticamente para o contas a pagar.</p></div>`;
  else lista2.innerHTML = data.nf.slice().reverse().map((n,ix) => `
    <div class="doc-card anim-in" style="animation-delay:${ix*60}ms">
      <div class="doc-head">
        <div class="doc-head-left"><span class="mono">NF ${esc(n.numero)}/${esc(n.serie)}</span><strong>${esc(n.fornecedor)}</strong><span class="tag">${esc(n.pedidoNumero)}</span><span class="tag">${n.tipo==='material'?'Material':'Serviço'}</span></div>
        <div class="doc-head-right"><span class="badge ${n.divergente?'warn':'ok'}">${n.divergente?'Com divergência':'Conferida'}</span><span class="doc-date">emissão ${esc(n.emissao)}</span></div>
      </div>
      <div class="tax-grid">${n.calc.detalhes.map(d=>`<div class="tax-box"><div class="lbl">${esc(d.nome)} · ${esc(d.aliq)}%</div><div class="val">R$ ${brl(d.valor)}</div></div>`).join('')}</div>
      <div class="totals">
        <div>Valor bruto<b>R$ ${brl(num(n.valorBruto))}</b></div>
        ${n.calc.retido?`<div>Retenções<b>− R$ ${brl(n.calc.retido)}</b></div>`:''}
        ${n.calc.creditos?`<div>Créditos a recuperar<b>R$ ${brl(n.calc.creditos)}</b></div>`:''}
        <div>Valor a pagar<b>R$ ${brl(n.calc.liquido)}</b></div>
        <div>Vencimento<b style="font-size:13px">${esc(n.vencimento)}</b></div>
      </div>
      ${n.obs?`<div class="doc-note">${esc(n.obs)}</div>`:''}
      ${n.divergente && !n.tratada ? `
        <div class="doc-note warnbox"><strong>Divergência:</strong> NF de R$ ${brl(num(n.valorBruto))} contra pedido de R$ ${brl(num((data.pedido.find(p=>p.id===n.pedidoId)||{}).valorTotal))}. Decida como tratar antes de seguir para o pagamento.</div>
        ${pode('lancar_nf')?`<div class="doc-actions">
          <button class="btn btn-primary" data-segue="${n.id}">Seguir com observação</button>
          <button class="btn btn-ghost" data-devolve="${n.id}">Devolver para Compras</button>
        </div>`:''}` : ''}
      ${n.divergente && n.tratada ? `<div class="doc-note"><strong>Divergência tratada:</strong> ${esc(n.tratamento)}</div>` : ''}
    </div>`).join('');

  lista2.querySelectorAll('[data-segue]').forEach(b => b.onclick = () => {
    const n = data.nf.find(x => x.id === Number(b.dataset.segue));
    const just = prompt('Justificativa para seguir com a divergência:') || 'divergência aceita pelo contábil';
    n.tratada = true; n.tratamento = 'Seguiu com observação — ' + just;
    logar(n, n.tratamento);
    const pg = data.pagamento.find(p => p.nfId === n.id);
    if (pg) logar(pg, 'Liberado para pagamento mesmo com divergência — ' + just);
    save(); renderAll();
  });
  lista2.querySelectorAll('[data-devolve]').forEach(b => b.onclick = () => {
    const n = data.nf.find(x => x.id === Number(b.dataset.devolve));
    const motivo = prompt('Motivo da devolução para Compras:') || 'valor divergente do pedido';
    // cancela o título e devolve o pedido para Compras tratar com o fornecedor
    data.pagamento = data.pagamento.filter(p => p.nfId !== n.id);
    data.nf = data.nf.filter(x => x.id !== n.id);
    const p = data.pedido.find(x => x.id === n.pedidoId);
    if (p) {
      p.nfLancada = false; p.status = 'Recebido';
      p.obsDivergencia = 'NF ' + n.numero + ' devolvida pelo contábil — ' + motivo;
      logar(p, 'NF ' + n.numero + ' devolvida para Compras — ' + motivo);
    }
    save(); renderAll();
  });
};

function formNF(panel, pedId) {
  const p = data.pedido.find(x => x.id === pedId);
  const tipo = p.itens.some(i => i.tipo === 'servico') ? 'servico' : 'material';
  const aliq = Object.assign({}, ALIQ_PADRAO[tipo]);
  panel.className = 'form-panel'; panel.style.display = 'grid';
  const condDias = (data.condPgto.find(cp => cp.nome === p.cond) || { dias: '0' }).dias;
  const venc = new Date(Date.now() + num(condDias)*86400000).toLocaleDateString('pt-BR');

  const campos = tipo === 'material'
    ? [['icms','ICMS %'],['ipi','IPI %'],['pis','PIS %'],['cofins','COFINS %']]
    : [['iss','ISS %'],['irrf','IRRF retido %'],['inss','INSS retido %'],['csllPisCofins','CSLL/PIS/COFINS retido %']];

  panel.innerHTML = `
    <div class="form-panel-title">Lançar NF do pedido ${esc(p.numero)} — ${esc(p.fornecedor)}</div>
    <div class="field"><label>Número da NF</label><input type="text" id="nf-num" placeholder="123456"><div class="field-error" data-e="num"></div></div>
    <div class="field"><label>Série</label><input type="text" id="nf-serie" value="1"></div>
    <div class="field"><label>Data de emissão</label><input type="text" id="nf-emis" value="${hoje()}"></div>
    <div class="field"><label>Valor bruto da NF (R$)</label><input type="text" id="nf-valor" value="${brl(num(p.valorTotal))}"><div class="field-error" data-e="valor"></div></div>
    <div class="field"><label>Vencimento (${esc(p.cond)})</label><input type="text" id="nf-venc" value="${venc}"></div>
    <div class="field"><label>Natureza</label><input type="text" value="${tipo === 'material' ? 'Compra de material' : 'Prestação de serviço'}" disabled></div>
    <div class="form-panel-title sep">Alíquotas aplicadas</div>
    ${campos.map(([k,l]) => `<div class="field"><label>${l}</label><input type="text" data-a="${k}" value="${aliq[k]}"></div>`).join('')}
    <div class="field full" id="nf-preview"></div>
    <div class="field full"><label>Observação do lançamento</label><input type="text" id="nf-obs" placeholder="Ex: nota com divergência de frete"></div>
    <div class="form-actions"><button class="btn btn-primary" id="nf-save">Lançar nota e gerar título</button><button class="btn btn-ghost" id="nf-cancel">Cancelar</button></div>`;

  function lerAliq() { const o = {}; panel.querySelectorAll('[data-a]').forEach(i => o[i.dataset.a] = i.value.trim()); return o; }
  function preview() {
    const vb = panel.querySelector('#nf-valor').value;
    const calc = calcularTributos(tipo, vb, lerAliq());
    const divergente = Math.abs(num(vb) - num(p.valorTotal)) > 0.01;
    panel.querySelector('#nf-preview').innerHTML = `
      ${divergente ? `<div class="lock-note">Valor da NF (R$ ${brl(num(vb))}) diferente do pedido (R$ ${brl(num(p.valorTotal))}). A nota pode ser lançada, mas fica marcada como divergente para conferência.</div>` : ''}
      <div class="tax-grid">${calc.detalhes.map(d=>`<div class="tax-box"><div class="lbl">${d.nome} · ${d.aliq}%</div><div class="val">R$ ${brl(d.valor)}</div></div>`).join('')}</div>
      <div class="totals">
        <div>Valor bruto<b>R$ ${brl(num(vb))}</b></div>
        ${calc.retido?`<div>Total retido<b>− R$ ${brl(calc.retido)}</b></div>`:''}
        ${calc.creditos?`<div>Créditos a recuperar<b>R$ ${brl(calc.creditos)}</b></div>`:''}
        <div>Líquido a pagar<b>R$ ${brl(calc.liquido)}</b></div>
      </div>`;
  }
  preview();
  panel.querySelector('#nf-valor').oninput = preview;
  panel.querySelectorAll('[data-a]').forEach(i => i.oninput = preview);
  panel.querySelector('#nf-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
  panel.querySelector('#nf-save').onclick = () => {
    const numero = panel.querySelector('#nf-num').value.trim();
    const vb = panel.querySelector('#nf-valor').value.trim();
    panel.querySelectorAll('.field-error').forEach(e=>e.textContent='');
    let ok = true;
    if (!numero) { panel.querySelector('[data-e="num"]').textContent = 'Informe o número da NF.'; ok = false; }
    if (!num(vb)) { panel.querySelector('[data-e="valor"]').textContent = 'Informe o valor.'; ok = false; }
    if (!ok) return;
    const calc = calcularTributos(tipo, vb, lerAliq());
    data.nfCounter++;
    const nf = {
      id: Date.now(), numero, serie: panel.querySelector('#nf-serie').value.trim() || '1',
      pedidoId: p.id, pedidoNumero: p.numero, fornecedorId: p.fornecedorId, fornecedor: p.fornecedor,
      tipo, valorBruto: vb, aliq: lerAliq(), calc,
      emissao: panel.querySelector('#nf-emis').value.trim(),
      vencimento: panel.querySelector('#nf-venc').value.trim(),
      obs: panel.querySelector('#nf-obs').value.trim(),
      divergente: Math.abs(num(vb) - num(p.valorTotal)) > 0.01,
      ccId: p.ccId, historico: [],
    };
    logar(nf, 'NF lançada pelo contábil');
    data.nf.push(nf);
    p.nfLancada = true; p.status = 'NF lançada';
    logar(p, 'NF ' + numero + ' lançada — líquido R$ ' + brl(calc.liquido));
    data.pagamento.push({
      id: Date.now()+1, nfId: nf.id, nfNumero: numero, fornecedor: p.fornecedor,
      valor: String(calc.liquido), vencimento: nf.vencimento, status: 'A programar',
      forma: '', ccId: p.ccId, historico: [],
    });
    save(); panel.style.display='none'; panel.className=''; renderAll();
  };
}

