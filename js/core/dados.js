/* ===================== DADOS ===================== */
const STORE_KEY = 'ability_erp_v1';

function seed() {
  return {
    usuarios: [
      { id: 1, nome: 'Usuário Solicitante', area: 'Área Solicitante',  perfis: ['solicitante'] },
      { id: 2, nome: 'Usuário Compras',     area: 'Compras',           perfis: ['compras','governanca'] },
      { id: 3, nome: 'Diretor Financeiro',  area: 'Diretoria',         perfis: ['dir_fin'] },
      { id: 4, nome: 'Usuário Controladoria', area: 'Controladoria',   perfis: ['controladoria'] },
      { id: 5, nome: 'Usuário Contábil',    area: 'Contabilidade',     perfis: ['contabil'] },
      { id: 6, nome: 'Usuário Financeiro',  area: 'Financeiro',        perfis: ['financeiro'] },
      { id: 7, nome: 'Usuário Almoxarifado',area: 'Almoxarifado',      perfis: ['almox'] },
      { id: 8, nome: 'Usuário Frota',       area: 'Frota',             perfis: ['frota','solicitante'] },
      { id: 9, nome: 'Usuário Infra',       area: 'Infraestrutura',    perfis: ['infra','solicitante'] },
      { id: 10,nome: 'Administrador',       area: 'TI',                perfis: ['admin'] },
    ],
    usuarioAtualId: 1,
    fornecedor: [
      { id: 101, nome: 'Fornecedor Alfa Ltda', cnpj: '12.345.678/0001-90', segmento: 'Empreiteiro',  status: 'Homologado', uf: 'SP', contato: 'contato@alfa.com.br' },
      { id: 102, nome: 'Fornecedor Beta Materiais SA',        cnpj: '98.765.432/0001-10', segmento: 'Material PLIN', status: 'Homologado', uf: 'SP', contato: 'vendas@beta.com.br' },
      { id: 103, nome: 'Fornecedor Gama Serviços',   cnpj: '45.678.912/0001-33', segmento: 'Serviço PLIN',  status: 'Em análise', uf: 'RJ', contato: 'comercial@gama.com.br' },
    ],
    material: [
      { id: 201, nome: 'Capacete de segurança classe B', codigo: 'MAT-0001', ncm: '6506.10.00', cest: '28.064.00', unidade: 'UN', categoria: 'Material PLIN', precoRef: '45,00' },
      { id: 202, nome: 'Luva de raspa cano longo',       codigo: 'MAT-0002', ncm: '4203.29.00', cest: '',          unidade: 'PC', categoria: 'Material PLIN', precoRef: '28,50' },
      { id: 203, nome: 'Óleo diesel S10 (ONU 1202)',     codigo: 'MAT-0003', ncm: '2710.19.21', cest: '06.001.00', unidade: 'L',  categoria: 'Material PLEX', precoRef: '6,15' },
    ],
    servico: [
      { id: 301, nome: 'Manutenção preventiva de gerador', categoria: 'Manutenção', subcategoria: 'Equipamentos', nbs: '1.2001.10.00', precoRef: '1.200,00' },
      { id: 302, nome: 'Treinamento NR-35 trabalho em altura', categoria: 'Treinamento', subcategoria: 'SST', nbs: '1.1801.21.00', precoRef: '280,00' },
    ],
    centroCusto: [
      { id: 401, codigo: 'CC-1001', nome: 'Área Solicitante',  area: 'Área Solicitante',  orcamento: '120000,00', consumido: 0 },
      { id: 402, codigo: 'CC-2001', nome: 'Frota',             area: 'Frota',             orcamento: '350000,00', consumido: 0 },
      { id: 403, codigo: 'CC-3001', nome: 'Infraestrutura',    area: 'Infraestrutura',    orcamento: '200000,00', consumido: 0 },
    ],
    condPgto: [
      { id: 501, nome: 'À vista', dias: '0' },
      { id: 502, nome: '28 dias', dias: '28' },
      { id: 503, nome: '30/60 dias', dias: '60' },
    ],
    requisicao: [], reqCounter: 0,
    cotacao: [], cotCounter: 0,
    pedido: [], pedCounter: 0,
    recebimento: [],
    nf: [], nfCounter: 0,
    pagamento: [],
    estoque: [], movEstoque: [],
    veiculo: [
      { id: 601, placa: 'ABC-1D23', modelo: 'Fiat Fiorino', base: 'Base 01', km: '84200', status: 'Ativo' },
      { id: 602, placa: 'XYZ-4E56', modelo: 'VW Delivery',  base: 'Base 01', km: '152300', status: 'Em manutenção' },
    ],
    manutencao: [], abastecimento: [],
    ativoInfra: [
      { id: 701, nome: 'Gerador GMG 180kVA', tipo: 'Equipamento', base: 'Base 01', status: 'Operando' },
      { id: 702, nome: 'Nobreak sala técnica', tipo: 'Equipamento', base: 'Base 01', status: 'Operando' },
    ],
    chamado: [], chamadoCounter: 0,
  };
}

function load() {
  let d = seed();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) d = Object.assign(d, JSON.parse(raw));
  } catch (e) {}
  return d;
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {} }
let data = load();

function usuarioAtual() { return data.usuarios.find(u => u.id === data.usuarioAtualId) || data.usuarios[0]; }
function hoje() { return new Date().toLocaleDateString('pt-BR'); }
function agora() { return new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;          // já é número: usa direto
  let s = String(v).trim().replace(/[^0-9.,-]/g,'');
  if (s.indexOf(',') > -1) s = s.replace(/\./g,'').replace(',', '.');  // formato BR: 1.234,56
  return parseFloat(s) || 0;                                      // formato simples: 1234.56
}
function brl(v) { return (Number(v)||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function logar(doc, texto) {
  if (!doc.historico) doc.historico = [];
  doc.historico.push({ quando: agora(), quem: usuarioAtual().nome, texto });
}

