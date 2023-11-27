# backend_rc

## API de Produtos

Esta é uma API simples em Node.js usando Express e PostgreSQL para gerenciar produtos.

### Configuração

Certifique-se de ter o Node.js e o PostgreSQL instalados em sua máquina. Clone este repositório e instale as dependências usando:

```bash```
npm install

Crie um banco de dados PostgreSQL e ajuste as configurações de conexão no arquivo `app.js.`

## Rotas

## Listar Produtos

### Listar produtos em ordem ascendente

GET http://3.133.167.240:3000/api/productosAs

### Listar produtos em ordem descendente

GET http://3.133.167.240:3000/api/productosDes

## Listar Categorias

GET http://3.133.167.240:3000/api/listaCategorias

## Listar Produtos por Categoria

GET http://3.133.167.240:3000/api/categorias

## Pesquisar Produto por ID

GET http://3.133.167.240:3000/api/productos/:id

## Listar Produtos com Filtros e Paginação

GET http://3.133.167.240:3000/api/productos?categoria=exemplo&subcategoria1=exemplo1&subcategoria2=exemplo2&page=1&limit=10

## Criar um Novo Produto

POST http://3.133.167.240:3000/api/newprodutos

{
  "nombre": "Produto Novo",
  "descripcion": "Descrição do Produto Novo",
  "imagen": "url_da_imagem",
  "categoria": "Nova Categoria",
  "subcategoria1": "Nova Subcategoria 1",
  "subcategoria2": "Nova Subcategoria 2"
}

## Atualizar um Produto por ID

PUT http://3.133.167.240:3000/api/updateprodutos/:id

{
  "nombre": "Produto Atualizado",
  "descripcion": "Descrição do Produto Atualizado",
  "imagen": "url_da_imagem_atualizada",
  "categoria": "Categoria Atualizada",
  "subcategoria1": "Subcategoria 1 Atualizada",
  "subcategoria2": "Subcategoria 2 Atualizada"
}

## Excluir um Produto por ID

DELETE http://3.133.167.240:3000/api/deleteprodutos/:id
