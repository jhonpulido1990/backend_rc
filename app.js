const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const { Pool } = require("pg");

const produtosRoutes = require("./BaseDatos/productos/produtosRoutes");
const categoriaRoutes = require("./BaseDatos/categoria/categoriaRoutes");
const authRoutes = require("./BaseDatos/auth/authRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Use o middleware cors para todas as rotas
app.use(cookieParser()); // Use o middleware cookie-parser
app.use(express.json()); // Middleware para processar requisições JSON


// Configuração do pool de conexão com o PostgreSQL
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

app.set("pool", pool);

pool.connect((error) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log("conectado");
});


app.use("/api/productos", produtosRoutes); // Usa as rotas dos produtos
app.use("/api/categoria", categoriaRoutes); // Usa as rotas das categorias
app.use("/api/auth", authRoutes);

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
