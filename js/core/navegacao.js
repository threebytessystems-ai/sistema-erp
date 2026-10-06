/* ===================== ESTRUTURA DE NAVEGAÇÃO ===================== */
const GRUPOS = [
  { id: 'geral', label: '', modulos: [ { id: 'inicio', label: 'Início' } ] },
  { id: 'suprimentos', label: 'Ciclo de suprimentos', modulos: [
      { id: 'requisicao',  label: 'Requisições',        desc: 'Pedido de material ou serviço aberto por qualquer área' },
      { id: 'orcamento',   label: 'Controladoria — verba', desc: 'Controladoria confere o centro de custo, libera a verba e acompanha o previsto' },
      { id: 'cotacao',     label: 'Cotações',           desc: 'Compras levanta preços e escolhe o vencedor' },
      { id: 'pedido',      label: 'Pedidos de compra',  desc: 'OC gerada a partir da cotação, com alçada de aprovação' },
      { id: 'recebimento', label: 'Recebimento',        desc: 'Almoxarifado confirma a entrega do que foi pedido' },
  ]},
  { id: 'analise', label: 'Análise', modulos: [
      { id: 'indicadores', label: 'Indicadores', desc: 'Gráficos de gasto, consumo e orçamento por área e centro de custo' },
  ]},
  { id: 'fiscalfin', label: 'Fiscal e financeiro', modulos: [
      { id: 'fiscal',     label: 'NF e tributos',   desc: 'Lançamento da nota, conferência e cálculo de impostos' },
      { id: 'financeiro', label: 'Contas a pagar',  desc: 'Programação, liberação e baixa do pagamento ao fornecedor' },
  ]},
  { id: 'cadastros', label: 'Governança de cadastros', modulos: [
      { id: 'fornecedor',  label: 'Fornecedores',   desc: 'Base de fornecedores e homologação' },
      { id: 'material',    label: 'Materiais',      desc: 'Catálogo de materiais com NCM e CEST' },
      { id: 'servico',     label: 'Serviços',       desc: 'Catálogo de serviços com NBS' },
      { id: 'centrocusto', label: 'Centros de custo', desc: 'Centros de custo e orçamento anual' },
      { id: 'condpgto',    label: 'Condições de pagamento', desc: 'Prazos usados nas negociações' },
  ]},
  { id: 'operacao', label: 'Operação', modulos: [
      { id: 'almoxarifado', label: 'Almoxarifado', desc: 'Saldo de estoque e movimentações' },
      { id: 'frota',        label: 'Frota',        desc: 'Veículos, manutenções e abastecimentos' },
      { id: 'infra',        label: 'Infraestrutura', desc: 'Ativos e chamados que viram requisição' },
  ]},
  { id: 'admin', label: 'Administração', modulos: [
      { id: 'usuarios', label: 'Usuários e perfis', desc: 'Quem acessa o quê dentro do ERP' },
  ]},
];
function acharModulo(id) {
  for (const g of GRUPOS) { const m = g.modulos.find(m => m.id === id); if (m) return { grupo: g, modulo: m }; }
  return null;
}

let state = { modulo: 'inicio' };

/* ===================== NAVEGAÇÃO ===================== */
function pendencias(moduloId) {
  switch (moduloId) {
    case 'requisicao':  return data.requisicao.filter(r => r.status === 'Aguardando verba').length;
    case 'orcamento':   return data.requisicao.filter(r => r.status === 'Aguardando verba').length + data.pedido.filter(p => p.revisarControladoria && !p.excessoRevisado).length;
    case 'cotacao':     return data.requisicao.filter(r => r.status === 'Verba aprovada').length;
    case 'pedido':      return data.pedido.filter(p => p.status === 'Aguardando aprovação').length;
    case 'recebimento': return data.pedido.filter(p => p.status === 'Aprovado' && !p.recebido).length;
    case 'fiscal':      return data.pedido.filter(p => p.recebido && !p.nfLancada).length;
    case 'financeiro':  return data.pagamento.filter(p => p.status !== 'Pago').length;
    case 'infra':       return data.chamado.filter(c => c.status === 'Aberto').length;
    default: return 0;
  }
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  GRUPOS.forEach(g => {
    const visiveis = g.modulos.filter(m => podeAbrir(m.id));
    if (visiveis.length === 0) return;
    const grp = document.createElement('div');
    grp.className = 'nav-group';
    if (g.label) {
      const lbl = document.createElement('div');
      lbl.className = 'nav-group-label'; lbl.textContent = g.label;
      grp.appendChild(lbl);
    }
    visiveis.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'nav-item' + (state.modulo === m.id ? ' active' : '');
      btn.textContent = m.label;
      const p = pendencias(m.id);
      if (p > 0) {
        const c = document.createElement('span');
        c.className = 'nav-count hot'; c.textContent = p;
        btn.appendChild(c);
      }
      btn.addEventListener('click', () => { state = { modulo: m.id }; renderAll(); });
      grp.appendChild(btn);
    });
    nav.appendChild(grp);
  });
}

function renderUserSwitch() {
  const sel = document.getElementById('user-switch');
  sel.innerHTML = data.usuarios.map(u => `<option value="${u.id}" ${u.id === data.usuarioAtualId ? 'selected' : ''}>${esc(u.nome)} — ${esc(u.area)}</option>`).join('');
  sel.onchange = () => {
    data.usuarioAtualId = Number(sel.value);
    save();
    if (!podeAbrir(state.modulo)) state = { modulo: 'inicio' };
    renderAll();
  };
  const u = usuarioAtual();
  document.getElementById('user-roles').textContent = 'Perfis: ' + u.perfis.map(p => PERFIS[p]).join(', ');
}

function renderCrumb() {
  const found = acharModulo(state.modulo);
  const el = document.getElementById('crumb');
  if (!found || state.modulo === 'inicio') { el.innerHTML = '<b>Início</b>'; return; }
  el.innerHTML = `${esc(found.grupo.label)} &nbsp;/&nbsp; <b>${esc(found.modulo.label)}</b>`;
}

function semAcesso(c, moduloId) {
  const found = acharModulo(moduloId);
  c.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'page-head';
  head.innerHTML = `<h1>${esc(found.modulo.label)}</h1>`;
  c.appendChild(head);
  const box = document.createElement('div');
  box.className = 'empty-state';
  box.innerHTML = `<h3>Acesso restrito</h3><p>Seu perfil não tem permissão para este módulo. Liberado para: ${ACESSO_MODULO[moduloId].map(p => PERFIS[p] || p).join(', ')}.</p>`;
  c.appendChild(box);
}

function bloqueioAcao(acao) {
  return `<div class="lock-note">Somente ${ACOES[acao].map(p => PERFIS[p] || p).join(' ou ')} pode executar esta etapa. Troque o usuário na barra lateral para testar.</div>`;
}

function renderAll() {
  renderUserSwitch();
  renderNav();
  renderCrumb();
  const c = document.getElementById('content');
  const id = state.modulo;
  if (!podeAbrir(id)) return semAcesso(c, id);
  const fn = RENDERERS[id];
  if (fn) return fn(c);
  c.innerHTML = '<div class="empty-state"><h3>Módulo não encontrado</h3></div>';
}

function pageHead(c, titulo, texto) {
  c.innerHTML = '';
  const h = document.createElement('div');
  h.className = 'page-head';
  h.innerHTML = `<h1>${esc(titulo)}</h1>${texto ? `<p>${texto}</p>` : ''}`;
  c.appendChild(h);
  return h;
}
function div(c, cls) { const d = document.createElement('div'); if (cls) d.className = cls; c.appendChild(d); return d; }

const RENDERERS = {};
