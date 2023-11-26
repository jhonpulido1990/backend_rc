const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "rc-piscina.co5uocrswzze.us-east-2.rds.amazonaws.com",
  database: "rcpiscina",
  password: "root1234",
  port: 5432,
  ssl: {
            rejectUnauthorized: false
        }
});

// Middleware para processar requisições JSON
app.use(express.json());

pool.connect((error) => {
    if (error) {
        console.log(error)
        return;
    }
    console.log('conectado')
})

// listado do productos

app.get("/api/productosAs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos ORDER BY Id ASC;");
    const produtos = result.rows;
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

app.get("/api/productosDes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos ORDER BY Id DESC;");
    const produtos = result.rows;
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

// lista do categorias

app.get('/api/listaCategorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT categoria, subcategoria1, subcategoria2 FROM productos');

    const listaCategorias = {};

    result.rows.forEach((row) => {
      const categoria = row.categoria;
      const subcategoria1 = row.subcategoria1;
      const subcategoria2 = row.subcategoria2;

      if (!listaCategorias[categoria]) {
        listaCategorias[categoria] = {};
      }

      if (!listaCategorias[categoria][subcategoria1]) {
        listaCategorias[categoria][subcategoria1] = [];
      }

      // Adiciona subcategoria2 apenas se não estiver presente
      if (!listaCategorias[categoria][subcategoria1].includes(subcategoria2)) {
        listaCategorias[categoria][subcategoria1].push(subcategoria2);
      }
    });

    res.json(listaCategorias);
  } catch (error) {
    console.error('Erro ao obter dados do banco de dados', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// categorias e um produto
app.get("/api/categorias", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (categoria) * 
      FROM productos 
      ORDER BY categoria, id
    `);

    const produtosPorCategoria = result.rows;
    res.json(produtosPorCategoria);
  } catch (error) {
    console.error("Erro ao buscar produtos por categoria:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

// categorias e um produto
/* app.get('/api/produtosPorCategoria', async (req, res) => {
  try {
    const query = `
      SELECT categoria, 
             MIN(id) AS id,
             MIN(nombre) AS nombre,
             MIN(descripcion) AS descripcion,
             MIN(imagen) AS imagen,
             MIN(subcategoria1) AS subcategoria1,
             MIN(subcategoria2) AS subcategoria2
      FROM productos
      GROUP BY categoria;
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter dados do banco de dados', error);
    res.status(500).send('Erro interno do servidor');
  }
}); */

// pesquisa por produto pela id

app.get('/api/productosId/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [productId]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Retorna o primeiro produto encontrado
    } else {
      res.status(404).send('Produto não encontrado');
    }
  } catch (error) {
    console.error('Erro ao obter dados do banco de dados', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para obter produtos com paginação e filtros
app.get('/api/productos', async (req, res) => {
  try {
    const { categoria, subcategoria1, subcategoria2, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM productos WHERE 1=1';
    const values = [];

    if (categoria) {
      query += ' AND categoria = $1';
      values.push(categoria);
    }

    if (subcategoria1) {
      query += ' AND subcategoria1 = $2';
      values.push(subcategoria1);
    }

    if (subcategoria2) {
      query += ' AND subcategoria2 = $3';
      values.push(subcategoria2);
    }

    const offset = (page - 1) * limit;

    const result = await pool.query(query + ` OFFSET $${values.length + 1} LIMIT $${values.length + 2}`, [...values, offset, limit]);
    const produtos = result.rows;

    res.json(produtos);
  } catch (error) {
    console.error('Erro na consulta:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para criar um novo produto
app.post('/api/newprodutos', async (req, res) => {
  try {
    const { nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2 } = req.body;

    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar um novo produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar um produto pelo ID
app.put('/api/updateprodutos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2 } = req.body;

    const result = await pool.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, imagen = $3, categoria = $4, subcategoria1 = $5, subcategoria2 = $6 WHERE id = $7 RETURNING *',
      [nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Erro ao atualizar o produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para excluir um produto pelo ID
app.delete('/api/deleteprodutos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Produto não encontrado' });
    } else {
      res.json({ message: 'Produto excluído com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao excluir o produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
