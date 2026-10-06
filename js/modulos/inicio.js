/* ===================== INÍCIO ===================== */
RENDERERS.inicio = function (c) {
  const u = usuarioAtual();
  pageHead(c, 'Olá, ' + u.nome.split(' ')[0], `Você está no ERP como <strong>${u.perfis.map(p=>PERFIS[p]).join(', ')}</strong>. Abaixo só aparece o que o seu perfil pode acessar — troque de usuário na barra lateral para ver como cada área enxerga o sistema.`);

  // Minhas pendências
  const pend = [];
  if (pode('aprovar_orcamento')) { const n = data.requisicao.filter(r=>r.status==='Aguardando verba').length; if (n) pend.push({ n, t:'requisição(ões) aguardando sua liberação de verba', m:'orcamento' }); }
  if (pode('lancar_cotacao'))    { const n = data.requisicao.filter(r=>r.status==='Verba aprovada').length; if (n) pend.push({ n, t:'requisição(ões) liberadas para cotar', m:'cotacao' }); }
  if (pode('gerar_pedido'))      { const n = data.cotacao.filter(x=>x.vencedorId && !data.pedido.some(p=>p.cotacaoId===x.id)).length; if (n) pend.push({ n, t:'cotação(ões) prontas para virar pedido', m:'cotacao' }); }
  if (pode('aprovar_pedido'))    { const n = data.pedido.filter(p=>p.status==='Aguardando aprovação').length; if (n) pend.push({ n, t:'pedido(s) acima da alçada aguardando seu aval', m:'pedido' }); }
  if (pode('registrar_recebimento')) { const n = data.pedido.filter(p=>p.status==='Aprovado'&&!p.recebido).length; if (n) pend.push({ n, t:'pedido(s) aguardando recebimento', m:'recebimento' }); }
  if (pode('lancar_nf'))         { const n = data.pedido.filter(p=>p.recebido&&!p.nfLancada).length; if (n) pend.push({ n, t:'pedido(s) recebidos aguardando nota fiscal', m:'fiscal' }); }
  if (pode('liberar_pagamento')) { const n = data.pagamento.filter(p=>p.status!=='Pago').length; if (n) pend.push({ n, t:'título(s) em aberto no contas a pagar', m:'financeiro' }); }
  if (pode('gerir_infra'))       { const n = data.chamado.filter(x=>x.status==='Aberto').length; if (n) pend.push({ n, t:'chamado(s) de infraestrutura abertos', m:'infra' }); }

  if (pend.length) {
    const box = div(c, '');
    box.innerHTML = `<div class="page-head" style="margin-bottom:11px"><h1 style="font-size:15px">Suas pendências</h1></div>`;
    const grid = div(c, 'option-grid');
    pend.forEach(p => {
      const b = document.createElement('button');
      b.className = 'option-card';
      b.innerHTML = `<span class="tag">pendente</span><h3 style="font-family:var(--font-mono);font-size:22px">${p.n}</h3><p>${p.t}</p>`;
      b.onclick = () => { state = { modulo: p.m }; renderAll(); };
      grid.appendChild(b);
    });
  }

  // Indicadores do ciclo
  const ind = div(c, '');
  ind.innerHTML = `<div class="page-head" style="margin:20px 0 11px"><h1 style="font-size:15px">Ciclo de ponta a ponta</h1></div>`;
  const kpis = div(c, 'kpi-row');
  const emAberto = data.requisicao.filter(r => !['Pedido gerado','Cancelada','Verba reprovada'].includes(r.status)).length;
  const pagoTotal = data.pagamento.filter(p=>p.status==='Pago').reduce((s,p)=>s+num(p.valor),0);
  kpis.innerHTML = `
    <div class="kpi"><div class="kpi-label">Requisições em andamento</div><div class="kpi-value accent">${emAberto}</div></div>
    <div class="kpi"><div class="kpi-label">Cotações abertas</div><div class="kpi-value">${data.cotacao.filter(x=>!x.vencedorId).length}</div></div>
    <div class="kpi"><div class="kpi-label">Pedidos emitidos</div><div class="kpi-value">${data.pedido.length}</div></div>
    <div class="kpi"><div class="kpi-label">Notas lançadas</div><div class="kpi-value">${data.nf.length}</div></div>
    <div class="kpi"><div class="kpi-label">Pago a fornecedores</div><div class="kpi-value">R$ ${brl(pagoTotal)}</div></div>`;

  // Trilha do fluxo
  const trilha = div(c, '');
  const etapas = [
    ['Requisição', data.requisicao.length],
    ['Verba liberada', data.requisicao.filter(r=>['Verba aprovada','Em cotação','Cotação concluída','Pedido gerado'].includes(r.status)).length],
    ['Cotação', data.cotacao.length],
    ['Pedido', data.pedido.length],
    ['Recebimento', data.pedido.filter(p=>p.recebido).length],
    ['NF', data.nf.length],
    ['Pagamento', data.pagamento.filter(p=>p.status==='Pago').length],
  ];
  const maxE = Math.max(...etapas.map(e=>e[1]),1);
  trilha.innerHTML = `<div class="chart-card anim-in" style="margin-bottom:26px"><div class="funil">
    ${etapas.map((e,i)=>`<div class="funil-step anim-in" style="animation-delay:${i*70}ms">
      <div class="funil-bar"><div class="funil-fill" style="--h:${(e[1]/maxE)*100}%"></div></div>
      <div class="funil-n">${e[1]}</div><div class="funil-l">${e[0]}</div>
    </div>`).join('')}
  </div></div>`;

  // Módulos acessíveis
  GRUPOS.filter(g => g.id !== 'geral').forEach(g => {
    const vis = g.modulos.filter(m => podeAbrir(m.id));
    if (!vis.length) return;
    const h = div(c, '');
    h.innerHTML = `<div class="page-head" style="margin-bottom:11px"><h1 style="font-size:15px">${esc(g.label)}</h1></div>`;
    const grid = div(c, 'option-grid');
    vis.forEach(m => {
      const b = document.createElement('button');
      b.className = 'option-card';
      const p = pendencias(m.id);
      b.innerHTML = `${p?`<span class="tag" style="background:var(--accent-soft);color:var(--accent-soft-ink)">${p} pendente(s)</span>`:'<span class="tag">liberado</span>'}<h3>${esc(m.label)}</h3><p>${esc(m.desc||'')}</p>`;
      b.onclick = () => { state = { modulo: m.id }; renderAll(); };
      grid.appendChild(b);
    });
  });
};

