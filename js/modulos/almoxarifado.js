/* ===================== ALMOXARIFADO ===================== */
RENDERERS.almoxarifado = function (c) {
  pageHead(c, 'Almoxarifado', 'Saldo de estoque alimentado automaticamente pelos recebimentos. As saídas são registradas aqui quando o material é entregue para a área.');
  if (!pode('mov_estoque')) c.insertAdjacentHTML('beforeend', bloqueioAcao('mov_estoque'));

  const kpis = div(c, 'kpi-row');
  kpis.innerHTML = `
    <div class="kpi"><div class="kpi-label">Itens com saldo</div><div class="kpi-value accent">${data.estoque.filter(e=>e.saldo>0).length}</div></div>
    <div class="kpi"><div class="kpi-label">Movimentações</div><div class="kpi-value">${data.movEstoque.length}</div></div>
    <div class="kpi"><div class="kpi-label">Entradas</div><div class="kpi-value">${data.movEstoque.filter(m=>m.tipo==='Entrada').length}</div></div>
    <div class="kpi"><div class="kpi-label">Saídas</div><div class="kpi-value">${data.movEstoque.filter(m=>m.tipo==='Saída').length}</div></div>`;

  const sec = div(c, '');
  sec.innerHTML = `<div class="page-head" style="margin-bottom:12px"><h1 style="font-size:15px">Saldo em estoque</h1></div>`;
  const tab = div(c, '');
  if (!data.estoque.length) {
    tab.innerHTML = `<div class="empty-state"><h3>Estoque vazio</h3><p>Materiais entram aqui automaticamente quando um recebimento é confirmado.</p></div>`;
  } else {
    tab.className = 'table-wrap';
    tab.innerHTML = `<table><thead><tr><th>Material</th><th class="num">Saldo</th><th>Un</th><th></th></tr></thead><tbody>
      ${data.estoque.map(e=>`<tr><td>${esc(e.nome)}</td><td class="num">${brl(e.saldo)}</td><td>${esc(e.unidade||'')}</td>
      <td>${pode('mov_estoque')&&e.saldo>0?`<div class="row-actions"><button class="btn btn-ghost btn-sm" data-out="${e.itemId}">Registrar saída</button></div>`:''}</td></tr>`).join('')}
    </tbody></table>`;
    tab.querySelectorAll('[data-out]').forEach(b => b.onclick = () => {
      const est = data.estoque.find(e => e.itemId === Number(b.dataset.out));
      const q = prompt(`Quantidade de saída de "${est.nome}" (saldo ${brl(est.saldo)}):`);
      if (!q) return;
      const qn = num(q);
      if (qn <= 0 || qn > est.saldo) { alert('Quantidade inválida para o saldo disponível.'); return; }
      const destino = prompt('Destino / área que está retirando:') || 'não informado';
      est.saldo -= qn;
      data.movEstoque.push({ id: Date.now(), itemId: est.itemId, nome: est.nome, tipo: 'Saída', qtd: qn, origem: destino, data: hoje(), quem: usuarioAtual().nome });
      save(); renderAll();
    });
  }

  if (data.movEstoque.length) {
    const h = div(c, '');
    h.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Movimentações</h1></div>
      <div class="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Material</th><th class="num">Qtd</th><th>Origem / destino</th><th>Responsável</th></tr></thead>
      <tbody>${data.movEstoque.slice().reverse().slice(0,30).map(m=>`<tr><td>${esc(m.data)}</td><td><span class="badge ${m.tipo==='Entrada'?'ok':'info'}">${esc(m.tipo)}</span></td><td>${esc(m.nome)}</td><td class="num">${brl(m.qtd)}</td><td>${esc(m.origem)}</td><td>${esc(m.quem)}</td></tr>`).join('')}</tbody></table></div>`;
  }
};

