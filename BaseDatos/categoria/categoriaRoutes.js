const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
  user: "postgres",
  host: "rc-piscina.co5uocrswzze.us-east-2.rds.amazonaws.com",
  database: "rcpiscina",
  password: "root1234",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Middleware para processar requisições JSON
router.use(express.json());

// lista do categorias

router.get("/listaCategorias", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT categoria, subcategoria1, subcategoria2 FROM productos"
    );

    const listaCategorias = {};

    result.rows.forEach((row) => {
      const categoria = row.categoria;
      const subcategoria1 = row.subcategoria1;
      const subcategoria2 = row.subcategoria2;

      if (!listaCategorias[categoria]) {
        listaCategorias[categoria] = {};
      }

      if (!listaCategorias[categoria][subcategoria1]) {
        listaCategorias[categoria][subcategoria1] = {};
      }

      if (!listaCategorias[categoria][subcategoria1][subcategoria2]) {
        listaCategorias[categoria][subcategoria1][subcategoria2] = [];
      }

      // Adiciona valores específicos se não estiverem presentes
      // Aqui você pode adicionar lógica para adicionar valores específicos se necessário
      // Por enquanto, estamos apenas adicionando subcategoria2 se não estiver presente
      if (
        !listaCategorias[categoria][subcategoria1][subcategoria2].includes(
          subcategoria2
        )
      ) {
        listaCategorias[categoria][subcategoria1][subcategoria2].push(
          subcategoria2
        );
      }
    });

    res.json(listaCategorias);
  } catch (error) {
    console.error("Erro ao obter dados do banco de dados", error);
    res.status(500).send("Erro interno do servidor");
  }
});

// categorias e um produto
router.get("/categorias", async (req, res) => {
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

module.exports = router;
