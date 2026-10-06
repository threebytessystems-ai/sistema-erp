/* ===================== USUÁRIOS E PERFIS ===================== */
RENDERERS.usuarios = function (c) {
  pageHead(c, 'Usuários e perfis', 'Matriz de quem pode fazer o quê. Cada perfil libera só os módulos e as ações da sua função — é isso que impede a área solicitante de aprovar a própria verba ou lançar nota.');
  const bar = div(c, 'module-bar');
  bar.innerHTML = `<button class="btn btn-primary" id="u-novo">Novo usuário</button>
    <button class="btn btn-ghost" id="u-reset" style="margin-left:auto">Zerar dados do protótipo</button>`;
  const panel = div(c, ''); panel.style.display = 'none';

  const tab = div(c, 'table-wrap');
  tab.innerHTML = `<table><thead><tr><th>Nome</th><th>Área</th><th>Perfis</th><th></th></tr></thead><tbody>
    ${data.usuarios.map(u=>`<tr><td>${esc(u.nome)}</td><td>${esc(u.area)}</td>
      <td>${u.perfis.map(p=>`<span class="tag">${esc(PERFIS[p]||p)}</span>`).join(' ')}</td>
      <td><div class="row-actions"><button class="icon-btn" data-ed="${u.id}">${ICON_EDIT}</button>${u.id!==data.usuarioAtualId?`<button class="icon-btn danger" data-rm="${u.id}">${ICON_TRASH}</button>`:''}</div></td></tr>`).join('')}
  </tbody></table>`;

  const matriz = div(c, '');
  matriz.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Matriz de acesso por módulo</h1></div>
    <div class="table-wrap"><table><thead><tr><th>Módulo</th><th>Perfis com acesso</th></tr></thead><tbody>
    ${GRUPOS.flatMap(g=>g.modulos).map(m=>`<tr><td>${esc(m.label)}</td><td>${(ACESSO_MODULO[m.id]||[]).includes('*')?'<span class="badge ok">Todas as áreas</span>':(ACESSO_MODULO[m.id]||[]).map(p=>`<span class="tag">${esc(PERFIS[p]||p)}</span>`).join(' ')}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Matriz de ações críticas</h1></div>
    <div class="table-wrap"><table><thead><tr><th>Ação</th><th>Quem pode executar</th></tr></thead><tbody>
    ${Object.entries(ACOES).map(([k,v])=>`<tr><td>${esc(k.replace(/_/g,' '))}</td><td>${v.includes('*')?'<span class="badge ok">Todas as áreas</span>':v.map(p=>`<span class="tag">${esc(PERFIS[p]||p)}</span>`).join(' ')}</td></tr>`).join('')}
    </tbody></table></div>`;

  function formUser(editId) {
    const u = editId ? data.usuarios.find(x => x.id === editId) : null;
    panel.className = 'form-panel'; panel.style.display = 'grid';
    panel.innerHTML = `<div class="form-panel-title">${u?'Editando usuário':'Novo usuário'}</div>
      <div class="field"><label>Nome</label><input id="u-nome" type="text" value="${esc(u?u.nome:'')}"></div>
      <div class="field"><label>Área</label><input id="u-area" type="text" value="${esc(u?u.area:'')}"></div>
      <div class="field full"><label>Perfis</label><div style="display:flex;flex-wrap:wrap;gap:9px;padding:4px 0">
        ${Object.entries(PERFIS).map(([k,l])=>`<label style="display:flex;align-items:center;gap:5px;font-size:12.5px"><input type="checkbox" data-p="${k}" style="width:auto" ${u&&u.perfis.includes(k)?'checked':''}> ${esc(l)}</label>`).join('')}
      </div></div>
      <div class="form-actions"><button class="btn btn-primary" id="u-save">Salvar</button><button class="btn btn-ghost" id="u-cancel">Cancelar</button></div>`;
    panel.querySelector('#u-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
    panel.querySelector('#u-save').onclick = () => {
      const nome = panel.querySelector('#u-nome').value.trim();
      if (!nome) return;
      const perfis = Array.from(panel.querySelectorAll('[data-p]:checked')).map(i => i.dataset.p);
      if (u) Object.assign(u, { nome, area: panel.querySelector('#u-area').value.trim(), perfis });
      else data.usuarios.push({ id: Date.now(), nome, area: panel.querySelector('#u-area').value.trim(), perfis });
      save(); renderAll();
    };
  }
  document.getElementById('u-novo').onclick = () => formUser(null);
  tab.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => formUser(Number(b.dataset.ed)));
  tab.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    data.usuarios = data.usuarios.filter(u => u.id !== Number(b.dataset.rm)); save(); renderAll();
  });
  document.getElementById('u-reset').onclick = () => {
    if (!confirm('Isso apaga todas as requisições, cotações, pedidos, notas e pagamentos de teste. Continuar?')) return;
    localStorage.removeItem(STORE_KEY); data = load(); state = { modulo: 'inicio' }; renderAll();
  };
};
