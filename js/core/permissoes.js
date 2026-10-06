/* ===================== PERFIS E PERMISSÕES ===================== */
const PERFIS = {
  solicitante:  'Solicitante',
  controladoria:'Controladoria',
  compras:      'Compras',
  governanca:   'Governança de cadastros',
  contabil:     'Contábil / Fiscal',
  financeiro:   'Financeiro',
  dir_fin:      'Diretor financeiro',
  almox:        'Almoxarifado',
  infra:        'Infraestrutura',
  frota:        'Frota',
  admin:        'Administrador',
};

// Quem pode ABRIR cada módulo
const ACESSO_MODULO = {
  inicio:       ['*'],
  requisicao:   ['*'],
  orcamento:    ['controladoria','dir_fin','admin'],
  cotacao:      ['compras','admin'],
  pedido:       ['compras','dir_fin','admin'],
  recebimento:  ['almox','compras','admin'],
  fiscal:       ['contabil','admin'],
  financeiro:   ['financeiro','contabil','dir_fin','admin'],
  fornecedor:   ['governanca','compras','admin'],
  material:     ['governanca','compras','admin'],
  servico:      ['governanca','compras','admin'],
  centrocusto:  ['governanca','admin'],
  condpgto:     ['governanca','financeiro','admin'],
  almoxarifado: ['almox','admin'],
  frota:        ['frota','admin'],
  infra:        ['infra','admin'],
  indicadores:  ['controladoria','dir_fin','admin','compras'],
  usuarios:     ['admin'],
};

// Quem pode EXECUTAR cada ação-chave
const ACOES = {
  criar_requisicao:    ['*'],
  aprovar_orcamento:   ['controladoria','dir_fin','admin'],
  lancar_cotacao:      ['compras','admin'],
  gerar_pedido:        ['compras','admin'],
  aprovar_pedido:      ['dir_fin','admin'],
  registrar_recebimento:['almox','admin'],
  lancar_nf:           ['contabil','admin'],
  liberar_pagamento:   ['financeiro','admin'],
  baixar_pagamento:    ['financeiro','admin'],
  editar_cadastro:     ['governanca','admin'],
  mov_estoque:         ['almox','admin'],
  gerir_frota:         ['frota','admin'],
  gerir_infra:         ['infra','admin'],
  revisar_excesso:     ['controladoria','dir_fin','admin'],
};

// Alçada: pedido acima deste valor exige diretor financeiro
const ALCADA_DIRETORIA = 10000;

function temPerfil(lista) {
  if (!lista) return false;
  if (lista.includes('*')) return true;
  const u = usuarioAtual();
  return u.perfis.some(p => lista.includes(p));
}
function podeAbrir(moduloId) { return temPerfil(ACESSO_MODULO[moduloId]); }
function pode(acao) { return temPerfil(ACOES[acao]); }

