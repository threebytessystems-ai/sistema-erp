/* ===================== RECEBIMENTO ===================== */
RENDERERS.recebimento = function (c) {
  pageHead(c, 'Recebimento', 'O almoxarifado confirma a entrega do que foi pedido. Material recebido entra no estoque automaticamente; serviço é registrado como executado.');
  if (!pode('registrar_recebimento')) c.insertAdjacentHTML('beforeend', bloqueioAcao('registrar_recebimento'));
  const pend = data.pedido.filter(p => p.status === 'Aprovado' && !p.recebido);
  const lista = div(c, '');
  if (!pend.length) {
    lista.innerHTML = `<div class="empty-state"><h3>Nada a receber</h3><p>Pedidos aprovados pela diretoria aparecem aqui para conferência de entrega.</p></div>`;
  } else {
    lista.innerHTML = pend.slice().reverse().map((p,ix) => `
      <div class="doc-card anim-in" style="animation-delay:${ix*60}ms">
        <div class="doc-head">
          <div class="doc-head-left"><span class="mono">${esc(p.numero)}</span><strong>${esc(p.fornecedor)}</strong><span class="tag">${esc(p.area)}</span></div>
          <div class="doc-head-right"><span class="badge ${statusBadge(p.status)}">${esc(p.status)}</span><span class="doc-date">${esc(p.criadoEm)}</span></div>
        </div>
        <div class="doc-items">${p.itens.map(i=>`<div class="doc-item-row"><span class="tag">${i.tipo==='material'?'Material':'Serviço'}</span><span>${esc(i.nome)}</span><span class="mono">${esc(i.qtd)} ${esc(i.unidade||'')}</span>${i.espec?`<span class="doc-item-espec">${esc(i.espec)}</span>`:''}</div>`).join('')}</div>
        ${pode('registrar_recebimento')?`<div class="doc-actions"><button class="btn btn-primary" data-rec="${p.id}">Confirmar recebimento total</button><button class="btn btn-ghost" data-div="${p.id}">Registrar divergência</button></div>`:''}
      </div>`).join('');
    lista.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => {
      const p = data.pedido.find(x => x.id === Number(b.dataset.rec));
      p.recebido = true; p.status = 'Recebido'; p.recebidoEm = hoje();
      logar(p, 'Recebimento confirmado pelo almoxarifado');
      data.recebimento.push({ id: Date.now(), pedidoId: p.id, pedidoNumero: p.numero, data: hoje(), responsavel: usuarioAtual().nome, divergencia: '' });
      // entrada no estoque para materiais
      p.itens.filter(i => i.tipo === 'material').forEach(i => {
        let est = data.estoque.find(e => e.itemId === i.itemId);
        if (!est) { est = { itemId: i.itemId, nome: i.nome, unidade: i.unidade, saldo: 0 }; data.estoque.push(est); }
        est.saldo += num(i.qtd);
        data.movEstoque.push({ id: Date.now()+Math.random(), itemId: i.itemId, nome: i.nome, tipo: 'Entrada', qtd: num(i.qtd), origem: p.numero, data: hoje(), quem: usuarioAtual().nome });
      });
      const r = data.requisicao.find(x => x.id === p.reqId);
      if (r) logar(r, 'Material/serviço recebido');
      save(); renderAll();
    });
    lista.querySelectorAll('[data-div]').forEach(b => b.onclick = () => {
      const p = data.pedido.find(x => x.id === Number(b.dataset.div));
      const txt = prompt('Descreva a divergência encontrada:');
      if (!txt) return;
      logar(p, 'Divergência no recebimento — ' + txt);
      data.recebimento.push({ id: Date.now(), pedidoId: p.id, pedidoNumero: p.numero, data: hoje(), responsavel: usuarioAtual().nome, divergencia: txt });
      save(); renderAll();
    });
  }

  const hist = div(c, '');
  if (data.recebimento.length) {
    hist.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Histórico de recebimentos</h1></div>
      <div class="table-wrap"><table><thead><tr><th class="mono">Pedido</th><th>Data</th><th>Responsável</th><th>Divergência</th></tr></thead>
      <tbody>${data.recebimento.slice().reverse().map(r=>`<tr><td class="mono">${esc(r.pedidoNumero)}</td><td>${esc(r.data)}</td><td>${esc(r.responsavel)}</td><td>${r.divergencia?esc(r.divergencia):'<span class="badge ok">sem divergência</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  }
};
