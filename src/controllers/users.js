import connection from "../database/database.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

async function login(req, res) {
  try {
    {
      const { email, password } = req.body;

      const result = await connection.query(
        `
              SELECT * FROM users
              WHERE email = $1
          `,
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        res.status(409).send("Usuário não encontrado");
        return;
      }

      if (bcrypt.compareSync(password, user.password)) {
        const token = uuid();
        await connection.query("INSERT INTO sessions (user_id, token) VALUES ($1, $2);", [
          user.id,
          token,
        ]);
        res.status(201).send(token);
      } else {
        res.status(401).send("Email ou senha incorretos!");
      }
    }
  } catch (error) {
    res.status(420).send(error);
  }
}

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    const emailExists = await connection.query(`SELECT email FROM users WHERE $1;`, [email]);

    if (emailExists) {
      res.status(409).send("Email já cadastrado");
      return;
    }
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = await connection.query(
      `
          INSERT INTO users
          (name, email, password)
          VALUES ($1, $2, $3)
      `,
      [name, email, passwordHash]
    );

    res.status(201).send(result);
  } catch (error) {
    res.status(error);
  }
}

export { login, signup };
