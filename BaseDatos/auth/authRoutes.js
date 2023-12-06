const express = require("express");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const { v4: uuid } = require("uuid");

const chaveSecreta = "suaChaveSecreta";

const router = express.Router();

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
    const token = generateToken(userId, chaveSecreta);

    res.cookie("token", token, { maxAge: 3600000, httpOnly: true });

    res.json({ success: true, token });
  } catch (error) {
    console.error("Erro durante o login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/rotaProtegida", verifyToken, (req, res) => {
  const userId = req.userId;
  res.json({ message: "Rota protegida acessada com sucesso", userId });
});

function generateToken(userId, chaveSecreta) {
  const expiresIn = 3600;
  const token = jwt.sign(
    { userId, exp: Math.floor(Date.now() / 1000) + expiresIn },
    chaveSecreta
  );
  return token;
}

function verifyToken(req, res, next) {
  if (!req.cookies || !req.cookies.token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const token = req.cookies.token;

  jwt.verify(token, "suaChaveSecreta", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }

    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: "Token expirado" });
    }

    req.userId = decoded.userId;
    next();
  });
}

module.exports = router;
