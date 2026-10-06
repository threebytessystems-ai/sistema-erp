/* ===================== FLUXO DE STATUS =====================
   Requisição: Rascunho -> Aguardando verba -> Verba aprovada -> Em cotação
               -> Cotação concluída -> Pedido gerado -> (segue no pedido)
   Pedido: Aguardando aprovação -> Aprovado -> Recebido -> NF lançada -> Pago
*/
const URGENCIAS = ['Normal','Urgente','Crítica'];

function statusBadge(s) {
  const map = {
    'Rascunho':'neutral','Aguardando verba':'warn','Verba reprovada':'bad','Verba aprovada':'info',
    'Em cotação':'info','Cotação concluída':'info','Pedido gerado':'ok','Cancelada':'bad',
    'Aguardando aprovação':'warn','Aprovado':'ok','Reprovado':'bad','Recebido':'ok',
    'NF lançada':'ok','Aberto':'warn','Em andamento':'info','Concluído':'ok',
    'A programar':'warn','Programado':'info','Pago':'ok',
  };
  return map[s] || 'neutral';
}

function ccPorId(id) { return data.centroCusto.find(cc => cc.id === id); }
function consumoCC(ccId) {
  // consome quando o pedido já foi aprovado
  return data.pedido.filter(p => p.ccId === ccId && ['Aprovado','Recebido','NF lançada','Pago'].includes(p.status))
                    .reduce((s,p) => s + num(p.valorTotal), 0);
}

/* ===================== REQUISIÇÃO ===================== */
RENDERERS.requisicao = function (c) {
  pageHead(c, 'Requisições', 'Qualquer área pode abrir uma requisição escolhendo itens já cadastrados. Ela só avança depois que o gestor da área libera a verba do centro de custo.');
  const u = usuarioAtual();
  const bar = div(c, 'module-bar');
  const search = document.createElement('input');
  search.className = 'filter-input'; search.placeholder = 'Buscar por número, área ou item';
  bar.appendChild(search);
  const add = document.createElement('button');
  add.className = 'btn btn-primary'; add.textContent = 'Nova requisição'; add.style.marginLeft = 'auto';
  bar.appendChild(add);
  const form = div(c, ''); form.style.display = 'none';
  const lista = div(c, '');
  add.onclick = () => { if (form.style.display !== 'none') { form.style.display='none'; form.className=''; } else formReq(form, lista, null, search); };
  search.oninput = () => listaReq(lista, form, search);
  listaReq(lista, form, search);
};

function formReq(panel, lista, editId, search) {
  const req = editId ? data.requisicao.find(r => r.id === editId) : null;
  panel.className = 'form-panel'; panel.style.display = 'grid';
  let itens = req ? req.itens.map(i => Object.assign({}, i)) : [];
  const u = usuarioAtual();
  const ccOpts = data.centroCusto.map(cc => `<option value="${cc.id}" ${req && req.ccId === cc.id ? 'selected':''}>${esc(cc.codigo)} — ${esc(cc.nome)}</option>`).join('');

  panel.innerHTML = `
    <div class="form-panel-title">${req ? 'Editando ' + esc(req.numero) : 'Nova requisição'}</div>
    <div class="field"><label>Solicitante</label><input type="text" value="${esc(u.nome)}" disabled></div>
    <div class="field"><label>Área</label><input type="text" id="r-area" value="${esc(req ? req.area : u.area)}"><div class="field-error" data-e="area"></div></div>
    <div class="field"><label>Centro de custo</label><select id="r-cc">${ccOpts}</select></div>
    <div class="field"><label>Urgência</label><select id="r-urg">${URGENCIAS.map(x=>`<option ${req&&req.urgencia===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="field full"><label>Justificativa</label><textarea id="r-just" placeholder="Por que esse material/serviço é necessário">${esc(req ? req.justificativa : '')}</textarea><div class="field-error" data-e="just"></div></div>
    <div class="field full"><label>Observação (opcional)</label><input type="text" id="r-obs" value="${esc(req ? (req.observacao||'') : '')}" placeholder="Detalhe extra para Compras"></div>

    <div class="form-panel-title sep">Itens da requisição</div>
    <div class="field"><label>Tipo</label><select id="r-tipo"><option value="material">Material</option><option value="servico">Serviço</option></select></div>
    <div class="field"><label>Item do catálogo</label><select id="r-item"></select></div>
    <div class="field"><label>Quantidade</label><input type="text" id="r-qtd" placeholder="1"></div>
    <div class="field" id="r-espec-wrap"><label>Especificações (opcional)</label><input type="text" id="r-espec" placeholder="Cor, medida, marca..."></div>
    <div class="field full"><button class="btn btn-ghost" id="r-add" type="button">+ Adicionar item</button></div>
    <div class="field full" id="r-itens"></div>
    <div class="field-error full" data-e="itens"></div>
    <div class="form-actions">
      <button class="btn btn-primary" id="r-save">${req ? 'Salvar e reenviar para validação' : 'Enviar para validação de verba'}</button>
      <button class="btn btn-ghost" id="r-cancel">Cancelar</button>
    </div>`;

  const tipoSel = panel.querySelector('#r-tipo');
  const itemSel = panel.querySelector('#r-item');
  const especWrap = panel.querySelector('#r-espec-wrap');
  function fill() {
    const list = tipoSel.value === 'material' ? data.material : data.servico;
    itemSel.innerHTML = list.length ? list.map(i => `<option value="${i.id}">${esc(i.nome)}${i.codigo?` (${esc(i.codigo)})`:''}</option>`).join('') : '<option value="">Nenhum cadastrado</option>';
    especWrap.style.display = tipoSel.value === 'material' ? 'flex' : 'none';
  }
  fill(); tipoSel.onchange = fill;

  function drawItens() {
    const w = panel.querySelector('#r-itens');
    if (!itens.length) { w.innerHTML = ''; return; }
    w.innerHTML = itens.map((it,ix) => `<div class="doc-item-row" style="padding:5px 0;border-bottom:1px solid var(--border)">
      <span class="tag">${it.tipo === 'material' ? 'Material':'Serviço'}</span><span>${esc(it.nome)}</span>
      <span class="mono">${esc(it.qtd)} ${esc(it.unidade||'')}</span>
      ${it.espec ? `<span class="doc-item-espec">${esc(it.espec)}</span>` : ''}
      <button class="icon-btn danger" data-rm="${ix}" type="button" style="margin-left:auto">${ICON_TRASH}</button></div>`).join('');
    w.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { itens.splice(Number(b.dataset.rm),1); drawItens(); });
  }
  drawItens();

  panel.querySelector('#r-add').onclick = () => {
    const list = tipoSel.value === 'material' ? data.material : data.servico;
    const item = list.find(i => i.id === Number(itemSel.value));
    if (!item) return;
    const qtdEl = panel.querySelector('#r-qtd'), especEl = panel.querySelector('#r-espec');
    itens.push({
      tipo: tipoSel.value, itemId: item.id, nome: item.nome,
      qtd: qtdEl.value.trim() || '1', unidade: item.unidade || '',
      precoRef: item.precoRef || '', espec: tipoSel.value === 'material' ? especEl.value.trim() : '',
    });
    qtdEl.value=''; especEl.value=''; drawItens();
  };
  panel.querySelector('#r-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
  panel.querySelector('#r-save').onclick = () => {
    const area = panel.querySelector('#r-area').value.trim();
    const just = panel.querySelector('#r-just').value.trim();
    panel.querySelectorAll('.field-error').forEach(e => e.textContent='');
    let ok = true;
    if (!area) { panel.querySelector('[data-e="area"]').textContent = 'Informe a área.'; ok = false; }
    if (!just) { panel.querySelector('[data-e="just"]').textContent = 'Justifique a requisição.'; ok = false; }
    if (!itens.length) { panel.querySelector('[data-e="itens"]').textContent = 'Adicione pelo menos um item.'; ok = false; }
    if (!ok) return;
    const payload = {
      area, ccId: Number(panel.querySelector('#r-cc').value),
      urgencia: panel.querySelector('#r-urg').value,
      justificativa: just, observacao: panel.querySelector('#r-obs').value.trim(),
      itens, status: 'Aguardando verba',
    };
    if (req) { Object.assign(req, payload); logar(req, 'Requisição editada e reenviada para validação de verba'); }
    else {
      data.reqCounter++;
      const novo = Object.assign({
        id: Date.now(), numero: 'RM-' + String(data.reqCounter).padStart(4,'0'),
        solicitante: usuarioAtual().nome, criadoEm: hoje(), historico: [],
      }, payload);
      logar(novo, 'Requisição criada');
      data.requisicao.push(novo);
    }
    save(); panel.style.display='none'; panel.className='';
    listaReq(lista, panel, search); renderNav();
  };
}

function cardReq(r, opts) {
  opts = opts || {};
  const cc = ccPorId(r.ccId);
  const estimado = r.itens.reduce((s,i) => s + num(i.precoRef) * num(i.qtd), 0);
  return `<div class="doc-card anim-in" style="animation-delay:${opts.delay||0}ms">
    <div class="doc-head">
      <div class="doc-head-left">
        <span class="mono">${esc(r.numero)}</span><strong>${esc(r.area)}</strong>
        <span class="tag">${cc ? esc(cc.codigo) : 'sem CC'}</span>
        ${r.urgencia !== 'Normal' ? `<span class="badge ${r.urgencia==='Crítica'?'bad':'warn'}">${esc(r.urgencia)}</span>` : ''}
      </div>
      <div class="doc-head-right">
        <span class="badge ${statusBadge(r.status)}">${esc(r.status)}</span>
        <span class="doc-date">${esc(r.criadoEm)} · ${esc(r.solicitante)}</span>
        ${opts.acoesTopo || ''}
      </div>
    </div>
    <div class="doc-items">
      ${r.itens.map(i => `<div class="doc-item-row"><span class="tag">${i.tipo==='material'?'Material':'Serviço'}</span><span>${esc(i.nome)}</span><span class="mono">${esc(i.qtd)} ${esc(i.unidade||'')}</span>${i.espec?`<span class="doc-item-espec">${esc(i.espec)}</span>`:''}${num(i.precoRef)?`<span class="mono" style="margin-left:auto">ref. R$ ${brl(num(i.precoRef)*num(i.qtd))}</span>`:''}</div>`).join('')}
    </div>
    <div class="doc-note"><strong>Justificativa:</strong> ${esc(r.justificativa)}${r.observacao?`<br><strong>Obs:</strong> ${esc(r.observacao)}`:''}${estimado?`<br><strong>Estimativa pelo preço de referência:</strong> R$ ${brl(estimado)}`:''}</div>
    ${opts.extra || ''}
    ${opts.acoes ? `<div class="doc-actions">${opts.acoes}</div>` : ''}
    ${r.historico && r.historico.length ? `<div class="hist">${r.historico.slice(-4).map(h=>`<div class="hist-row"><b>${esc(h.quando)}</b> ${esc(h.quem)} — ${esc(h.texto)}</div>`).join('')}</div>` : ''}
  </div>`;
}

function listaReq(wrap, form, search) {
  const q = (search ? search.value.trim().toLowerCase() : '');
  const u = usuarioAtual();
  // Solicitante puro vê apenas as próprias requisições
  const soMinhas = !temPerfil(['compras','admin','dir_fin','gestor_area','contabil','financeiro']);
  let itens = data.requisicao.filter(r => soMinhas ? r.solicitante === u.nome : true);
  if (q) itens = itens.filter(r => (r.numero+' '+r.area+' '+r.itens.map(i=>i.nome).join(' ')).toLowerCase().includes(q));
  if (!itens.length) {
    wrap.innerHTML = `<div class="empty-state"><h3>Nenhuma requisição${soMinhas?' sua':''}</h3><p>Use "Nova requisição" para abrir um pedido de material ou serviço.</p></div>`;
    return;
  }
  wrap.innerHTML = itens.slice().reverse().map((r,ix) => {
    const podeEditar = ['Aguardando verba','Verba reprovada'].includes(r.status) && (r.solicitante === u.nome || temPerfil(['admin']));
    const topo = podeEditar
      ? `<button class="icon-btn" data-ed="${r.id}">${ICON_EDIT}</button><button class="icon-btn danger" data-rm="${r.id}">${ICON_TRASH}</button>`
      : '';
    return cardReq(r, { acoesTopo: topo, delay: ix*60 });
  }).join('');
  wrap.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => formReq(form, wrap, Number(b.dataset.ed), search));
  wrap.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    data.requisicao = data.requisicao.filter(r => r.id !== Number(b.dataset.rm));
    save(); listaReq(wrap, form, search); renderNav();
  });
}

