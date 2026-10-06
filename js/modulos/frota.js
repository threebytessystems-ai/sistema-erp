/* ===================== FROTA ===================== */
RENDERERS.frota = function (c) {
  pageHead(c, 'Frota', 'Veículos, manutenções e abastecimentos. Uma manutenção registrada aqui pode virar requisição direto no ciclo de compras.');
  if (!pode('gerir_frota')) c.insertAdjacentHTML('beforeend', bloqueioAcao('gerir_frota'));

  const kpis = div(c, 'kpi-row');
  kpis.innerHTML = `
    <div class="kpi"><div class="kpi-label">Veículos</div><div class="kpi-value accent">${data.veiculo.length}</div></div>
    <div class="kpi"><div class="kpi-label">Em manutenção</div><div class="kpi-value">${data.veiculo.filter(v=>v.status==='Em manutenção').length}</div></div>
    <div class="kpi"><div class="kpi-label">Manutenções registradas</div><div class="kpi-value">${data.manutencao.length}</div></div>
    <div class="kpi"><div class="kpi-label">Gasto com combustível</div><div class="kpi-value">R$ ${brl(data.abastecimento.reduce((s,a)=>s+num(a.valor),0))}</div></div>`;

  const bar = div(c, 'module-bar');
  if (pode('gerir_frota')) {
    bar.innerHTML = `<button class="btn btn-primary" id="f-veic">Novo veículo</button>
      <button class="btn btn-ghost" id="f-man">Registrar manutenção</button>
      <button class="btn btn-ghost" id="f-abast">Registrar abastecimento</button>`;
  }
  const panel = div(c, ''); panel.style.display = 'none';

  const tab = div(c, 'table-wrap');
  tab.innerHTML = `<table><thead><tr><th class="mono">Placa</th><th>Modelo</th><th>Base</th><th class="num">KM</th><th>Status</th><th></th></tr></thead><tbody>
    ${data.veiculo.map(v=>`<tr><td class="mono">${esc(v.placa)}</td><td>${esc(v.modelo)}</td><td>${esc(v.base)}</td><td class="num">${esc(v.km)}</td>
    <td><span class="badge ${v.status==='Ativo'?'ok':'warn'}">${esc(v.status)}</span></td>
    <td>${pode('gerir_frota')?`<div class="row-actions"><button class="icon-btn danger" data-rmv="${v.id}">${ICON_TRASH}</button></div>`:''}</td></tr>`).join('')}
  </tbody></table>`;
  tab.querySelectorAll('[data-rmv]').forEach(b => b.onclick = () => {
    data.veiculo = data.veiculo.filter(v => v.id !== Number(b.dataset.rmv)); save(); renderAll();
  });

  if (data.manutencao.length) {
    const m = div(c, '');
    m.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Manutenções</h1></div>
      <div class="table-wrap"><table><thead><tr><th class="mono">Placa</th><th>Tipo</th><th>Descrição</th><th>Data</th><th class="num">Custo</th><th>Requisição</th></tr></thead>
      <tbody>${data.manutencao.slice().reverse().map(x=>`<tr><td class="mono">${esc(x.placa)}</td><td>${esc(x.tipo)}</td><td>${esc(x.descricao)}</td><td>${esc(x.data)}</td><td class="num">R$ ${brl(num(x.custo))}</td><td class="mono">${x.reqNumero?esc(x.reqNumero):'—'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  if (data.abastecimento.length) {
    const a = div(c, '');
    a.innerHTML = `<div class="page-head" style="margin:24px 0 12px"><h1 style="font-size:15px">Abastecimentos</h1></div>
      <div class="table-wrap"><table><thead><tr><th class="mono">Placa</th><th>Data</th><th class="num">Litros</th><th class="num">Valor</th><th class="num">KM</th></tr></thead>
      <tbody>${data.abastecimento.slice().reverse().map(x=>`<tr><td class="mono">${esc(x.placa)}</td><td>${esc(x.data)}</td><td class="num">${brl(num(x.litros))}</td><td class="num">R$ ${brl(num(x.valor))}</td><td class="num">${esc(x.km)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  if (!pode('gerir_frota')) return;
  document.getElementById('f-veic').onclick = () => {
    panel.className = 'form-panel'; panel.style.display = 'grid';
    panel.innerHTML = `<div class="form-panel-title">Novo veículo</div>
      <div class="field"><label>Placa</label><input id="v-placa" type="text" placeholder="ABC-1D23"></div>
      <div class="field"><label>Modelo</label><input id="v-modelo" type="text"></div>
      <div class="field"><label>Base</label><input id="v-base" type="text" value="Osasco"></div>
      <div class="field"><label>KM atual</label><input id="v-km" type="text"></div>
      <div class="field"><label>Status</label><select id="v-status"><option>Ativo</option><option>Em manutenção</option><option>Inativo</option></select></div>
      <div class="form-actions"><button class="btn btn-primary" id="v-save">Salvar</button><button class="btn btn-ghost" id="v-cancel">Cancelar</button></div>`;
    panel.querySelector('#v-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
    panel.querySelector('#v-save').onclick = () => {
      const placa = panel.querySelector('#v-placa').value.trim();
      if (!placa) return;
      data.veiculo.push({ id: Date.now(), placa, modelo: panel.querySelector('#v-modelo').value.trim(), base: panel.querySelector('#v-base').value.trim(), km: panel.querySelector('#v-km').value.trim(), status: panel.querySelector('#v-status').value });
      save(); renderAll();
    };
  };
  document.getElementById('f-man').onclick = () => {
    panel.className = 'form-panel'; panel.style.display = 'grid';
    panel.innerHTML = `<div class="form-panel-title">Registrar manutenção</div>
      <div class="field"><label>Veículo</label><select id="m-veic">${data.veiculo.map(v=>`<option value="${v.id}">${esc(v.placa)} — ${esc(v.modelo)}</option>`).join('')}</select></div>
      <div class="field"><label>Tipo</label><select id="m-tipo"><option>Preventiva</option><option>Corretiva</option><option>Revisão</option></select></div>
      <div class="field full"><label>Descrição</label><input id="m-desc" type="text" placeholder="Troca de óleo e filtros"></div>
      <div class="field"><label>Custo estimado (R$)</label><input id="m-custo" type="text" placeholder="0,00"></div>
      <div class="field"><label>Gerar requisição de compra?</label><select id="m-req"><option value="nao">Não, só registrar</option><option value="sim">Sim, abrir requisição</option></select></div>
      <div class="form-actions"><button class="btn btn-primary" id="m-save">Salvar</button><button class="btn btn-ghost" id="m-cancel">Cancelar</button></div>`;
    panel.querySelector('#m-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
    panel.querySelector('#m-save').onclick = () => {
      const v = data.veiculo.find(x => x.id === Number(panel.querySelector('#m-veic').value));
      const desc = panel.querySelector('#m-desc').value.trim();
      if (!v || !desc) return;
      const reg = { id: Date.now(), veiculoId: v.id, placa: v.placa, tipo: panel.querySelector('#m-tipo').value, descricao: desc, custo: panel.querySelector('#m-custo').value.trim() || '0', data: hoje(), reqNumero: '' };
      if (panel.querySelector('#m-req').value === 'sim') reg.reqNumero = criarReqDeOrigem('Frota', `Manutenção ${reg.tipo} do veículo ${v.placa}: ${desc}`, reg.custo);
      if (reg.tipo === 'Corretiva') v.status = 'Em manutenção';
      data.manutencao.push(reg); save(); renderAll();
    };
  };
  document.getElementById('f-abast').onclick = () => {
    panel.className = 'form-panel'; panel.style.display = 'grid';
    panel.innerHTML = `<div class="form-panel-title">Registrar abastecimento</div>
      <div class="field"><label>Veículo</label><select id="a-veic">${data.veiculo.map(v=>`<option value="${v.id}">${esc(v.placa)}</option>`).join('')}</select></div>
      <div class="field"><label>Litros</label><input id="a-litros" type="text"></div>
      <div class="field"><label>Valor total (R$)</label><input id="a-valor" type="text"></div>
      <div class="field"><label>KM no abastecimento</label><input id="a-km" type="text"></div>
      <div class="form-actions"><button class="btn btn-primary" id="a-save">Salvar</button><button class="btn btn-ghost" id="a-cancel">Cancelar</button></div>`;
    panel.querySelector('#a-cancel').onclick = () => { panel.style.display='none'; panel.className=''; };
    panel.querySelector('#a-save').onclick = () => {
      const v = data.veiculo.find(x => x.id === Number(panel.querySelector('#a-veic').value));
      if (!v) return;
      const km = panel.querySelector('#a-km').value.trim();
      data.abastecimento.push({ id: Date.now(), veiculoId: v.id, placa: v.placa, litros: panel.querySelector('#a-litros').value.trim(), valor: panel.querySelector('#a-valor').value.trim(), km, data: hoje() });
      if (km) v.km = km;
      save(); renderAll();
    };
  };
};

/* Cria uma requisição a partir de Frota ou Infra */
function criarReqDeOrigem(area, justificativa, custoEstimado) {
  const cc = data.centroCusto.find(x => x.area === area) || data.centroCusto[0];
  data.reqCounter++;
  const numero = 'RM-' + String(data.reqCounter).padStart(4,'0');
  const novo = {
    id: Date.now()+Math.random(), numero, solicitante: usuarioAtual().nome, area,
    ccId: cc ? cc.id : null, urgencia: 'Normal', justificativa,
    observacao: 'Requisição gerada automaticamente pelo módulo de ' + area,
    itens: [{ tipo: 'servico', itemId: null, nome: justificativa.slice(0,60), qtd: '1', unidade: '', precoRef: custoEstimado || '', espec: '' }],
    status: 'Aguardando verba', criadoEm: hoje(), historico: [],
  };
  logar(novo, 'Requisição aberta automaticamente pelo módulo de ' + area);
  data.requisicao.push(novo);
  return numero;
}

