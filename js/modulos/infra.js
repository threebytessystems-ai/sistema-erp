/* ===================== INFRAESTRUTURA ===================== */
RENDERERS.infra = function (c) {
  pageHead(c, 'Infraestrutura', 'Ativos e chamados das bases. Um chamado que exige compra vira requisição e entra no mesmo fluxo de aprovação.');
  if (!pode('gerir_infra')) c.insertAdjacentHTML('beforeend', bloqueioAcao('gerir_infra'));

  const kpis = div(c, 'kpi-row');
  kpis.innerHTML = `
    <div class="kpi"><div class="kpi-label">Ativos cadastrados</div><div class="kpi-value accent">${data.ativoInfra.length}</div></div>
    <div class="kpi"><div class="kpi-label">Chamados abertos</div><div class="kpi-value">${data.chamado.filter(x=>x.status==='Aberto').length}</div></div>
    <div class="kpi"><div class="kpi-label">Em andamento</div><div class="kpi-value">${data.chamado.filter(x=>x.status==='Em andamento').length}</div></div>
    <div class="kpi"><div class="kpi-label">Concluídos</div><div class="kpi-value">${data.chamado.filter(x=>x.status==='Concluído').length}</div></div>`;

  const bar = div(c, 'module-bar');
  if (pode('gerir_infra')) bar.innerHTML = `<button class="btn btn-primary" id="i-cham">Abrir chamado</button><button class="btn btn-ghost" id="i-ativo">Novo ativo</button>`;
  const panel = div(c, ''); panel.style.display = 'none';

  const sec = div(c, '');
  sec.innerHTML = `<div class="page-head" style="margin-bottom:12px"><h1 style="font-size:15px">Chamados</h1></div>`;
  const lista = div(c, '');
  if (!data.chamado.length) lista.innerHTML = `<div class="empty-state"><h3>Nenhum chamado</h3><p>Abra um chamado para registrar um problema de infraestrutura.</p></div>`;
  else lista.innerHTML = data.chamado.slice().reverse().map((ch,ix) => `
    <div class="doc-card anim-in" style="animation-delay:${ix*60}ms">
      <div class="doc-head">
        <div class="doc-head-left"><span class="mono">${esc(ch.numero)}</span><strong>${esc(ch.titulo)}</strong><span class="tag">${esc(ch.ativo)}</span><span class="tag">${esc(ch.base)}</span></div>
        <div class="doc-head-right"><span class="badge ${statusBadge(ch.status)}">${esc(ch.status)}</span><span class="doc-date">${esc(ch.criadoEm)}</span></div>
      </div>
      <div class="doc-note">${esc(ch.descricao)}${ch.reqNumero?`<br><strong>Requisição gerada:</strong> ${esc(ch.reqNumero)}`:''}</div>
      ${pode('gerir_infra')&&ch.status!=='Concluído'?`<div class="doc-actions">
        ${ch.status==='Aberto'?`<button class="btn btn-ghost" data-and="${ch.id}">Marcar em andamento</button>`:''}
        <button class="btn btn-primary" data-fim="${ch.id}">Concluir</button>
        ${!ch.reqNumero?`<button class="btn btn-ghost" data-req="${ch.id}">Gerar requisição</button>`:''}
      </div>`:''}
    </div>`).join('');
  lista.querySelectorAll('[data-and]').forEach(b => b.onclick = () => { const ch = data.chamado.find(x=>x.id===Number(b.dataset.and)); ch.status='Em andamento'; save(); renderAll(); });
  lista.querySelectorAll('[data-fim]').forEach(b => b.onclick = () => { const ch = data.chamado.find(x=>x.id===Number(b.dataset.fim)); ch.status='Concluído'; save(); renderAll(); });
  lista.querySelectorAll('[data-req]').forEach(b => b.onclick = () => {
    const ch = data.chamado.find(x=>x.id===Number(b.dataset.req));
    ch.reqNumero = criarReqDeOrigem('Infraestrutura', `${ch.titulo} — ${ch.descricao}`, '');
    save(); renderAll();
  });

  const at = div(c, '');
  at.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Ativos</h1></div>
    <div class="table-wrap"><table><thead><tr><th>Ativo</th><th>Tipo</th><th>Base</th><th>Status</th></tr></thead>
    <tbody>${data.ativoInfra.map(a=>`<tr><td>${esc(a.nome)}</td><td>${esc(a.tipo)}</td><td>${esc(a.base)}</td><td><span class="badge ${a.status==='Operando'?'ok':'warn'}">${esc(a.status)}</span></td></tr>`).join('')}</tbody></table></div>`;

  if (!pode('gerir_infra')) return;
  document.getElementById('i-cham').onclick = () => {
    panel.className = 'form-panel'; panel.style.display = 'grid';
    panel.innerHTML = `<div class="form-panel-title">Abrir chamado</div>
      <div class="field"><label>Título</label><input id="c-tit" type="text" placeholder="Gerador não parte"></div>
      <div class="field"><label>Ativo</label><select id="c-ativo">${data.ativoInfra.map(a=>`<option>${esc(a.nome)}</option>`).join('')}</select></div>
      <div class="field"><label>Base</label><input id="c-base" type="text" value="Osasco"></div>
      <div class="field"><label>Prioridade</label><select id="c-prio"><option>Normal</option><option>Alta</option><option>Crítica</option></select></div>
      <div class="field full"><label>Descrição</label><textarea id="c-desc"></textarea></div>
      <div class="form-actions"><button class="btn btn-primary" id="c-save">Abrir</button><button class="btn btn-ghost" id="c-cancel">Cancelar</button></div>`;
    panel.querySelector('#c-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
    panel.querySelector('#c-save').onclick = () => {
      const tit = panel.querySelector('#c-tit').value.trim();
      if (!tit) return;
      data.chamadoCounter++;
      data.chamado.push({ id: Date.now(), numero: 'CH-' + String(data.chamadoCounter).padStart(4,'0'), titulo: tit,
        ativo: panel.querySelector('#c-ativo').value, base: panel.querySelector('#c-base').value.trim(),
        prioridade: panel.querySelector('#c-prio').value, descricao: panel.querySelector('#c-desc').value.trim(),
        status: 'Aberto', criadoEm: hoje(), reqNumero: '' });
      save(); renderAll();
    };
  };
  document.getElementById('i-ativo').onclick = () => {
    panel.className = 'form-panel'; panel.style.display = 'grid';
    panel.innerHTML = `<div class="form-panel-title">Novo ativo</div>
      <div class="field"><label>Nome</label><input id="at-nome" type="text"></div>
      <div class="field"><label>Tipo</label><select id="at-tipo"><option>Equipamento</option><option>Instalação</option><option>TI</option></select></div>
      <div class="field"><label>Base</label><input id="at-base" type="text" value="Osasco"></div>
      <div class="field"><label>Status</label><select id="at-status"><option>Operando</option><option>Parado</option></select></div>
      <div class="form-actions"><button class="btn btn-primary" id="at-save">Salvar</button><button class="btn btn-ghost" id="at-cancel">Cancelar</button></div>`;
    panel.querySelector('#at-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
    panel.querySelector('#at-save').onclick = () => {
      const n = panel.querySelector('#at-nome').value.trim();
      if (!n) return;
      data.ativoInfra.push({ id: Date.now(), nome: n, tipo: panel.querySelector('#at-tipo').value, base: panel.querySelector('#at-base').value.trim(), status: panel.querySelector('#at-status').value });
      save(); renderAll();
    };
  };
};

