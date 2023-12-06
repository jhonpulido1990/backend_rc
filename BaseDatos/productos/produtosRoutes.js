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

// listado do produtos

router.get("/productosAs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos ORDER BY Id ASC;");
    const produtos = result.rows;
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

router.get("/productosDes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM productos ORDER BY Id DESC;"
    );
    const produtos = result.rows;
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

// pesquisa por produto pela id

router.get("/api/productosId/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM productos WHERE id = $1", [
      productId,
    ]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Retorna o primeiro produto encontrado
    } else {
      res.status(404).send("Produto não encontrado");
    }
  } catch (error) {
    console.error("Erro ao obter dados do banco de dados", error);
    res.status(500).send("Erro interno do servidor");
  }
});

// Rota para obter produtos com paginação, filtros e total de produtos

router.get("/api/productos", async (req, res) => {
  try {
    const {
      categoria,
      subcategoria1,
      subcategoria2,
      page = 1,
      limit = 10,
    } = req.query;

    let dataQuery = "SELECT * FROM productos WHERE 1=1";
    let countQuery = "SELECT COUNT(*) FROM productos";

    const values = [];

    if (categoria) {
      dataQuery += " AND categoria = $1";
      countQuery += " WHERE categoria = $1";
      values.push(categoria);
    }

    if (subcategoria1) {
      dataQuery += " AND subcategoria1 = $2";
      countQuery += countQuery.includes("WHERE")
        ? " AND subcategoria1 = $2"
        : " WHERE subcategoria1 = $2";
      values.push(subcategoria1);
    }

    if (subcategoria2) {
      dataQuery += " AND subcategoria2 = $3";
      countQuery += countQuery.includes("WHERE")
        ? " AND subcategoria2 = $3"
        : " WHERE subcategoria2 = $3";
      values.push(subcategoria2);
    }

    const offset = (page - 1) * limit;

    // Consulta para obter dados paginados
    const dataResult = await pool.query(
      dataQuery + ` OFFSET $${values.length + 1} LIMIT $${values.length + 2}`,
      [...values, offset, limit]
    );
    const produtos = dataResult.rows;

    // Consulta para obter o número total de registros
    const countResult = await pool.query(countQuery, values);
    const totalRecords = countResult.rows[0].count;

    res.json({ produtos, totalRecords });
  } catch (error) {
    console.error("Erro na consulta:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

// filtro para categoria e nombre
router.get("/api/filtroProducto", async (req, res) => {
  try {
    const { termoPesquisa, page = 1, limit = 10 } = req.query;

    const query = `
      SELECT *, 
      COUNT(*) OVER() AS totalRecords
      FROM productos 
      WHERE 
        categoria ILIKE $1 OR
        nombre ILIKE $2
      OFFSET $3 LIMIT $4
    `;

    const offset = (page - 1) * limit;

    const result = await pool.query(query, [
      `%${termoPesquisa}%`,
      `%${termoPesquisa}%`,
      offset,
      limit,
    ]);
    const produtos = result.rows;
    const totalRecords =
      result.rows.length > 0 ? result.rows[0].totalrecords : 0;

    res.json({ produtos, totalRecords });
  } catch (error) {
    console.error("Erro na consulta:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

// Rota para criar um novo produto
router.post("/api/newprodutos", async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      imagen,
      categoria,
      subcategoria1,
      subcategoria2,
    } = req.body;

    const result = await pool.query(
      "INSERT INTO productos (nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar um novo produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para atualizar um produto pelo ID
router.put("/api/updateprodutos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      imagen,
      categoria,
      subcategoria1,
      subcategoria2,
    } = req.body;

    const result = await pool.query(
      "UPDATE productos SET nombre = $1, descripcion = $2, imagen = $3, categoria = $4, subcategoria1 = $5, subcategoria2 = $6 WHERE id = $7 RETURNING *",
      [nombre, descripcion, imagen, categoria, subcategoria1, subcategoria2, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Produto não encontrado" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Erro ao atualizar o produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para excluir um produto pelo ID
router.delete("/api/deleteprodutos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM productos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Produto não encontrado" });
    } else {
      res.json({ message: "Produto excluído com sucesso" });
    }
  } catch (error) {
    console.error("Erro ao excluir o produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;