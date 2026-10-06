/* ===================== BUSCA GLOBAL ===================== */
function indiceBusca() {
  const ix = [];
  const add = (cond, tipo, label, sub, modulo) => { if (cond) ix.push({ tipo, label, sub, modulo }); };
  if (podeAbrir('fornecedor')) data.fornecedor.forEach(f => add(1,'Fornecedor', f.nome, f.cnpj, 'fornecedor'));
  if (podeAbrir('material'))   data.material.forEach(m => add(1,'Material', m.nome, m.codigo, 'material'));
  if (podeAbrir('servico'))    data.servico.forEach(s => add(1,'Serviço', s.nome, s.nbs, 'servico'));
  if (podeAbrir('centrocusto'))data.centroCusto.forEach(cc => add(1,'Centro de custo', cc.codigo, cc.nome, 'centrocusto'));
  const u = usuarioAtual();
  const soMinhas = !temPerfil(['compras','admin','dir_fin','gestor_area','contabil','financeiro']);
  data.requisicao.filter(r => soMinhas ? r.solicitante === u.nome : true).forEach(r => add(1,'Requisição', r.numero, r.area + ' · ' + r.status, 'requisicao'));
  if (podeAbrir('pedido'))     data.pedido.forEach(p => add(1,'Pedido', p.numero, p.fornecedor, 'pedido'));
  if (podeAbrir('fiscal'))     data.nf.forEach(n => add(1,'NF', 'NF ' + n.numero, n.fornecedor, 'fiscal'));
  if (podeAbrir('financeiro')) data.pagamento.forEach(p => add(1,'Título', 'NF ' + p.nfNumero, p.fornecedor + ' · ' + p.status, 'financeiro'));
  if (podeAbrir('frota'))      data.veiculo.forEach(v => add(1,'Veículo', v.placa, v.modelo, 'frota'));
  if (podeAbrir('infra'))      data.chamado.forEach(ch => add(1,'Chamado', ch.numero, ch.titulo, 'infra'));
  return ix;
}

function setupBusca() {
  const input = document.getElementById('global-search');
  const res = document.getElementById('search-results');
  const hide = () => { res.style.display = 'none'; res.innerHTML = ''; };
  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return hide();
    const m = indiceBusca().filter(r => (r.label+' '+(r.sub||'')).toLowerCase().includes(q)).slice(0, 9);
    if (!m.length) res.innerHTML = `<div class="search-empty">Nada encontrado para "${esc(input.value.trim())}"</div>`;
    else {
      res.innerHTML = m.map((x,i)=>`<button class="search-result-item" data-i="${i}"><span class="srl-type">${esc(x.tipo)}</span>${esc(x.label)}${x.sub?` · ${esc(x.sub)}`:''}</button>`).join('');
      res.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        state = { modulo: m[Number(b.dataset.i)].modulo };
        input.value = ''; hide(); renderAll();
      });
    }
    res.style.display = 'block';
  };
  document.addEventListener('click', e => { if (!e.target.closest('#search-wrap')) hide(); });
}

