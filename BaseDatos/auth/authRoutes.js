const express = require("express");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const { v4: uuid } = require("uuid");

const chaveSecreta = "suaChaveSecreta";

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

router.post("/newuser", async (req, res) => {
  try {
    const { nombre, correo, password_user } = req.body;

    const id_user = uuid();
    const data_user = new Date().toISOString();

    if (!nombre || !correo || !password_user) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });
    }

    const result = await pool.query(
      "INSERT INTO data_user (id_user, nombre, correo, password_user, data_user) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id_user, nombre, correo, password_user, data_user]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar um novo usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { correo, password_user } = req.body;

    const userResult = await pool.query(
      "SELECT id_user FROM data_user WHERE correo = $1 AND password_user = $2",
      [correo, password_user]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const userId = userResult.rows[0].id_user;
    const token = renewToken(userId, chaveSecreta);

    res.cookie("token", token, { maxAge: 1200000, httpOnly: true }); // Atualiza o tempo máximo do cookie para 20 minutos

    res.json({ success: true, token });
  } catch (error) {
    console.error("Erro durante o login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token ausente' });
  }

  jwt.verify(token.split(' ')[1], chaveSecreta, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    req.userId = decoded.userId;
    next();
  });
}

// Middleware para verificar o token
function checkToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token ausente' });
  }

  jwt.verify(token, chaveSecreta, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    req.userId = decoded.userId;
    next();
  });
}

// Exemplo de uso em uma rota protegida
router.get('/rotaProtegida', verifyToken, async (req, res) => {
  try {
    // Aqui você pode buscar as informações adicionais (nombre, correo, fecha) no banco de dados
    // ou de qualquer outra fonte, com base no req.userId ou em alguma lógica específica.

    const { nombre, correo, data_user } = await obterInformacoesAdicionais(req.userId);

    // Agora você pode incluir essas informações na resposta
    res.json({
      success: true,
      message: 'Rota protegida alcançada',
      userId: req.userId,
      nombre,
      correo,
      data_user,
    });
  } catch (error) {
    console.error('Erro ao obter informações adicionais:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

function renewToken(userId, chaveSecreta) {
  const expiresIn = 1200; // 20 minutos em segundos
  const token = jwt.sign(
    { userId, exp: Math.floor(Date.now() / 1000) + expiresIn },
    chaveSecreta
  );
  return token;
}

async function obterInformacoesAdicionais(userId) {
  // Implemente a lógica para obter informações adicionais do usuário com base no userId.
  // Por exemplo, você pode usar seu pool de conexão do PostgreSQL para fazer uma consulta.

  // Exemplo usando o pool de conexão que você configurou
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT nombre, correo, data_user FROM data_user WHERE id_user = $1', [userId]);

    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      throw new Error('Usuário não encontrado');
    }
  } catch (error) {
    console.error('Erro ao obter informações adicionais do usuário:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = router;
