# Ability ERP — protótipo

Protótipo navegável de um ERP focado no **ciclo de suprimentos de ponta a ponta**:
requisição → liberação de verba → cotação → pedido de compra → recebimento → nota fiscal → contas a pagar.

Feito em HTML, CSS e JavaScript puro — sem framework, sem build, sem dependências.

## Como rodar

Basta abrir o `index.html` no navegador. Para evitar qualquer restrição do navegador com arquivos locais, prefira um servidor simples:

```bash
# Python
python -m http.server 8000
# ou Node
npx serve .
```

Depois acesse `http://localhost:8000`.

> Os dados ficam no `localStorage` do navegador. Para recomeçar do zero, entre como **Administrador** → *Usuários e perfis* → **Zerar dados do protótipo**.

## Testando os perfis

Na barra lateral, em **Logado como**, troque o usuário para ver o sistema pela ótica de cada área. Cada perfil enxerga só os módulos e ações da sua função (ex.: o solicitante não consegue liberar a própria verba nem lançar nota).

| Perfil | O que faz |
|---|---|
| Solicitante | Abre requisições |
| Controladoria | Libera verba e revisa excessos de cotação |
| Compras | Cota, escolhe vencedor e gera pedido |
| Diretor financeiro | Aprova pedidos acima da alçada (R$ 10.000) |
| Almoxarifado | Confirma recebimento e controla estoque |
| Contábil / Fiscal | Lança NF e calcula tributos |
| Financeiro | Programa e dá baixa nos pagamentos |
| Frota / Infraestrutura | Operação; podem gerar requisições automaticamente |
| Administrador | Acesso total e gestão de usuários |

## Estrutura

```
ability-erp/
├── index.html              # casca da aplicação (layout + ordem dos scripts)
├── css/
│   ├── base.css            # tokens de cor (claro/escuro), layout e componentes
│   ├── animacoes.css       # transições e animações
│   ├── controladoria.css   # cards de centro de custo
│   └── graficos.css        # gráficos e responsividade
├── js/
│   ├── core/
│   │   ├── icones.js       # SVGs reutilizados
│   │   ├── permissoes.js   # perfis, acesso por módulo e por ação
│   │   ├── dados.js        # dados iniciais, localStorage e utilitários
│   │   ├── navegacao.js    # menu lateral, roteamento e renderAll()
│   │   └── busca.js        # busca global da barra superior
│   ├── modulos/            # uma tela por arquivo
│   │   ├── cadastros.js    # motor genérico (fornecedor, material, serviço, CC, cond. pgto)
│   │   ├── requisicao.js
│   │   ├── orcamento.js    # controladoria — verba
│   │   ├── cotacao.js
│   │   ├── pedido.js
│   │   ├── recebimento.js
│   │   ├── fiscal.js
│   │   ├── financeiro.js
│   │   ├── indicadores.js
│   │   ├── almoxarifado.js
│   │   ├── frota.js
│   │   ├── infra.js
│   │   ├── usuarios.js
│   │   └── inicio.js
│   └── app.js              # ponto de entrada
└── assets/img/             # coloque aqui o logo.png
```

Os scripts são clássicos (não módulos ES) e compartilham o escopo global, por isso **a ordem no `index.html` importa**: `core/` primeiro, depois os módulos, e `app.js` por último.

## Observações

- As alíquotas do módulo fiscal são genéricas e servem só para demonstrar a mecânica — não usar como cálculo tributário real.
- Protótipo sem back-end nem autenticação: a troca de usuário é livre de propósito, para demonstração.
