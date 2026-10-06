/* ===================== MOTOR GENÉRICO DE CADASTRO ===================== */
const UNIDADES = ['UN','KG','L','M','CX','PC'];
const SEGMENTOS = ['Empreiteiro','Serviço PLIN','Material PLIN','Material PLEX'];
const STATUS_FORN = ['Homologado','Em análise','Bloqueado'];
const UFS = ['SP','RJ','MG','DF','RS','SC','MT','GO','PR','BA','PE','CE'];
const NBS_OPTIONS = [
  '1.2001.10.00 — Serviços de manutenção e reparação de produtos metálicos, exceto maquinários e equipamentos',
  '1.2301.22.00 — Serviços médicos especializados',
  '1.1101.90.00 — Arrendamento mercantil operacional ou locação de máquinas e equipamentos, sem operador',
  '1.1801.21.00 — Serviços de fornecimento de mão de obra terceirizada, exceto temporária',
  '1.0101.22.00 — Serviços de construção de edificações comerciais',
  '1.0905.50.00 — Serviços de consultoria financeira',
];

const CADASTROS = {
  fornecedor: {
    label: 'Fornecedores', item: 'fornecedor', store: 'fornecedor',
    desc: 'Base de fornecedores homologados. Só fornecedor homologado pode ser escolhido como vencedor de cotação.',
    busca: ['nome','cnpj'], buscaLabel: 'Buscar por razão social ou CNPJ',
    campos: [
      { k:'nome', l:'Razão social', req:true, col:'Razão social' },
      { k:'cnpj', l:'CNPJ', mask:'cnpj', req:true, mono:true, col:'CNPJ' },
      { k:'segmento', l:'Segmento', tipo:'select', opts:SEGMENTOS, col:'Segmento' },
      { k:'uf', l:'UF', tipo:'select', opts:UFS, col:'UF' },
      { k:'contato', l:'E-mail de contato', col:'Contato' },
      { k:'status', l:'Homologação', tipo:'select', opts:STATUS_FORN, badge:'forn', col:'Status' },
    ],
  },
  material: {
    label: 'Materiais', item: 'material', store: 'material',
    desc: 'Catálogo de materiais. É daqui que a área solicitante escolhe o item, sem digitar descrição técnica.',
    busca: ['nome','codigo','ncm'], buscaLabel: 'Buscar por nome, código ou NCM',
    campos: [
      { k:'nome', l:'Nome do material', req:true, col:'Material' },
      { k:'codigo', l:'Código', req:true, mono:true, col:'Código' },
      { k:'ncm', l:'NCM', mask:'ncm', mono:true, col:'NCM' },
      { k:'cest', l:'CEST', mask:'cest', mono:true, col:'CEST' },
      { k:'unidade', l:'Unidade', tipo:'select', opts:UNIDADES, col:'Un' },
      { k:'categoria', l:'Categoria', tipo:'select', opts:['Material PLIN','Material PLEX'], col:'Categoria' },
      { k:'precoRef', l:'Preço de referência (R$)', mono:true, col:'Preço ref.', num:true },
    ],
  },
  servico: {
    label: 'Serviços', item: 'serviço', store: 'servico',
    desc: 'Catálogo padronizado de serviços por categoria, subcategoria e código NBS.',
    busca: ['nome','nbs','categoria'], buscaLabel: 'Buscar por nome, categoria ou NBS',
    campos: [
      { k:'nome', l:'Nome do serviço', req:true, col:'Serviço' },
      { k:'categoria', l:'Categoria', req:true, col:'Categoria' },
      { k:'subcategoria', l:'Subcategoria', col:'Subcategoria' },
      { k:'nbs', l:'Código NBS', tipo:'datalist', opts:NBS_OPTIONS, mono:true, col:'NBS' },
      { k:'precoRef', l:'Preço de referência (R$)', mono:true, col:'Preço ref.', num:true },
    ],
  },
  centrocusto: {
    label: 'Centros de custo', item: 'centro de custo', store: 'centroCusto',
    desc: 'Cada requisição consome a verba de um centro de custo. É isso que o gestor da área valida antes da cotação.',
    busca: ['codigo','nome','area'], buscaLabel: 'Buscar por código, nome ou área',
    campos: [
      { k:'codigo', l:'Código', req:true, mono:true, col:'Código' },
      { k:'nome', l:'Nome', req:true, col:'Nome' },
      { k:'area', l:'Área responsável', req:true, col:'Área' },
      { k:'orcamento', l:'Orçamento anual (R$)', mono:true, col:'Orçamento', num:true },
    ],
  },
  condpgto: {
    label: 'Condições de pagamento', item: 'condição', store: 'condPgto',
    desc: 'Prazos usados nas cotações e no vencimento das notas fiscais.',
    busca: ['nome'], buscaLabel: 'Buscar condição',
    campos: [
      { k:'nome', l:'Descrição', req:true, col:'Condição' },
      { k:'dias', l:'Prazo em dias', req:true, mono:true, col:'Dias' },
    ],
  },
};

function applyMask(input) {
  const kind = input.dataset.mask;
  if (!kind) return;
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g,'');
    if (kind === 'cnpj') {
      v = v.slice(0,14).replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');
    } else if (kind === 'ncm') {
      v = v.slice(0,8).replace(/^(\d{4})(\d)/,'$1.$2').replace(/^(\d{4})\.(\d{2})(\d)/,'$1.$2.$3');
    } else if (kind === 'cest') {
      v = v.slice(0,7).replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3');
    }
    input.value = v;
  });
}

function badgeCls(tipo, valor) {
  if (tipo === 'forn') return valor === 'Homologado' ? 'ok' : valor === 'Bloqueado' ? 'bad' : 'warn';
  return 'neutral';
}

function renderCadastro(cadKey, c) {
  const cad = CADASTROS[cadKey];
  pageHead(c, cad.label, cad.desc);
  const editavel = pode('editar_cadastro');
  if (!editavel) c.insertAdjacentHTML('beforeend', `<div class="lock-note">Você está em modo consulta. Alterações de cadastro são restritas a ${ACOES.editar_cadastro.map(p=>PERFIS[p]).join(' ou ')}.</div>`);

  const bar = div(c, 'module-bar');
  const search = document.createElement('input');
  search.className = 'filter-input'; search.placeholder = cad.buscaLabel;
  bar.appendChild(search);
  if (editavel) {
    const add = document.createElement('button');
    add.className = 'btn btn-primary'; add.textContent = `Novo ${cad.item}`;
    add.style.marginLeft = 'auto';
    bar.appendChild(add);
    add.onclick = () => { if (form.style.display !== 'none') { form.style.display='none'; form.className=''; } else abrirFormCad(cadKey, form, null, tabela, search); };
  }
  const form = div(c, ''); form.style.display = 'none';
  const tabela = div(c, '');
  search.oninput = () => tabelaCad(cadKey, tabela, form, search.value.trim().toLowerCase(), search);
  tabelaCad(cadKey, tabela, form, '', search);
}

function abrirFormCad(cadKey, panel, editId, tabela, search) {
  const cad = CADASTROS[cadKey];
  const rec = editId ? data[cad.store].find(r => r.id === editId) : null;
  panel.className = 'form-panel'; panel.style.display = 'grid';
  const campos = cad.campos.map(f => {
    const v = rec ? (rec[f.k] || '') : '';
    if (f.tipo === 'select') {
      return `<div class="field"><label>${f.l}</label><select data-k="${f.k}">${f.opts.map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select><div class="field-error"></div></div>`;
    }
    if (f.tipo === 'datalist') {
      const lid = `dl-${cadKey}-${f.k}`;
      return `<div class="field"><label>${f.l}</label><input type="text" data-k="${f.k}" list="${lid}" placeholder="Digite para buscar..." value="${esc(v)}"><datalist id="${lid}">${f.opts.map(o=>`<option value="${esc(o)}">`).join('')}</datalist><div class="field-error" data-e="${f.k}"></div></div>`;
    }
    return `<div class="field"><label>${f.l}</label><input type="text" data-k="${f.k}" ${f.mask?`data-mask="${f.mask}"`:''} value="${esc(v)}"><div class="field-error" data-e="${f.k}"></div></div>`;
  }).join('');
  panel.innerHTML = `<div class="form-panel-title">${editId ? 'Editando' : 'Novo'} ${cad.item}</div>${campos}
    <div class="form-actions"><button class="btn btn-primary" id="cad-save">Salvar</button><button class="btn btn-ghost" id="cad-cancel">Cancelar</button></div>`;
  panel.querySelectorAll('input[data-mask]').forEach(applyMask);
  panel.querySelector('#cad-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
  panel.querySelector('#cad-save').onclick = () => {
    let ok = true; const vals = {};
    cad.campos.forEach(f => {
      const el = panel.querySelector(`[data-k="${f.k}"]`);
      const v = el.value.trim();
      const err = panel.querySelector(`[data-e="${f.k}"]`);
      if (err) err.textContent = '';
      if (f.req && !v) { if (err) err.textContent = 'Campo obrigatório.'; ok = false; }
      if (f.mask === 'cnpj' && v.replace(/\D/g,'').length !== 14) { if (err) err.textContent = 'CNPJ incompleto.'; ok = false; }
      vals[f.k] = v;
    });
    if (!ok) return;
    if (editId) Object.assign(rec, vals);
    else data[cad.store].push(Object.assign({ id: Date.now() }, vals));
    save();
    panel.style.display='none'; panel.className='';
    tabelaCad(cadKey, tabela, panel, search.value.trim().toLowerCase(), search);
    renderNav();
  };
}

function tabelaCad(cadKey, wrap, form, q, search) {
  const cad = CADASTROS[cadKey];
  let itens = data[cad.store];
  if (q) itens = itens.filter(i => cad.busca.some(k => String(i[k]||'').toLowerCase().includes(q)));
  if (itens.length === 0) {
    wrap.className = '';
    wrap.innerHTML = `<div class="empty-state"><h3>${q ? 'Nenhum resultado' : `Nenhum ${cad.item} cadastrado`}</h3><p>${q ? `Nada encontrado para "${esc(q)}".` : `Use "Novo ${cad.item}" para começar.`}</p></div>`;
    return;
  }
  const editavel = pode('editar_cadastro');
  wrap.className = 'table-wrap';
  const ths = cad.campos.map(f => `<th class="${f.num?'num':f.mono?'mono':''}">${f.col}</th>`).join('');
  const rows = itens.map(i => {
    const tds = cad.campos.map(f => {
      if (f.badge) return `<td><span class="badge ${badgeCls(f.badge, i[f.k])}">${esc(i[f.k])}</span></td>`;
      return `<td class="${f.num?'num':f.mono?'mono':''}">${esc(i[f.k])}</td>`;
    }).join('');
    return `<tr>${tds}<td>${editavel ? `<div class="row-actions"><button class="icon-btn" data-ed="${i.id}">${ICON_EDIT}</button><button class="icon-btn danger" data-rm="${i.id}">${ICON_TRASH}</button></div>` : ''}</td></tr>`;
  }).join('');
  wrap.innerHTML = `<table><thead><tr>${ths}<th></th></tr></thead><tbody>${rows}</tbody></table>`;
  wrap.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => abrirFormCad(cadKey, form, Number(b.dataset.ed), wrap, search));
  wrap.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    data[cad.store] = data[cad.store].filter(r => r.id !== Number(b.dataset.rm));
    save(); tabelaCad(cadKey, wrap, form, q, search); renderNav();
  });
}

Object.keys(CADASTROS).forEach(k => { RENDERERS[k] = (c) => renderCadastro(k, c); });
