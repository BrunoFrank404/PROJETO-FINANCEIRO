const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Verifica se JWT_SECRET existe
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'seu_jwt_secret_super_seguro_aqui') {
    console.error('❌ ERRO: JWT_SECRET não configurado!');
    console.log('📝 Configure o JWT_SECRET no arquivo .env');
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao banco de dados
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite.');
        initializeDatabase();
    }
});

// Inicializar tabelas
function initializeDatabase() {
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      monthly_income DECIMAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_recurring BOOLEAN DEFAULT 0,
      user_id INTEGER,
      is_default BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount DECIMAL NOT NULL,
      category_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      is_recurring BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES expense_categories (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

    // Inserir categorias padrão
    const defaultCategories = [
        'Gasolina', 'Água', 'Energia', 'Gás', 'Condomínio',
        'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'
    ];

    defaultCategories.forEach(category => {
        db.run(
            'INSERT OR IGNORE INTO expense_categories (name, is_default) VALUES (?, 1)',
            [category]
        );
    });
}

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Rotas de Autenticação
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email já cadastrado' });
                    }
                    return res.status(500).json({ error: 'Erro interno do servidor' });
                }

                const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
                res.status(201).json({
                    message: 'Usuário criado com sucesso',
                    token,
                    user: { id: this.lastID, name, email }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (!user) {
                return res.status(400).json({ error: 'Credenciais inválidas' });
            }

            try {
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return res.status(400).json({ error: 'Credenciais inválidas' });
                }

                const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
                res.json({
                    message: 'Login realizado com sucesso',
                    token,
                    user: { id: user.id, name: user.name, email: user.email }
                });
            } catch (error) {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    );
});

// Rotas de Gastos
app.get('/api/expenses', authenticateToken, (req, res) => {
    const { month, year } = req.query;
    let query = `
    SELECT e.*, ec.name as category_name 
    FROM expenses e 
    JOIN expense_categories ec ON e.category_id = ec.id 
    WHERE e.user_id = ?
  `;
    let params = [req.user.id];

    if (month && year) {
        query += ' AND strftime("%m", e.date) = ? AND strftime("%Y", e.date) = ?';
        params.push(month.toString().padStart(2, '0'), year.toString());
    }

    query += ' ORDER BY e.date DESC';

    db.all(query, params, (err, expenses) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar gastos' });
        }
        res.json(expenses);
    });
});

app.post('/api/expenses', authenticateToken, (req, res) => {
    const { description, amount, category_id, date, is_recurring } = req.body;

    if (!description || !amount || !category_id || !date) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    db.run(
        'INSERT INTO expenses (description, amount, category_id, user_id, date, is_recurring) VALUES (?, ?, ?, ?, ?, ?)',
        [description, parseFloat(amount), category_id, req.user.id, date, is_recurring ? 1 : 0],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao adicionar gasto' });
            }

            // Buscar o gasto recém-criado com informações da categoria
            db.get(
                `SELECT e.*, ec.name as category_name 
         FROM expenses e 
         JOIN expense_categories ec ON e.category_id = ec.id 
         WHERE e.id = ?`,
                [this.lastID],
                (err, expense) => {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao buscar gasto' });
                    }
                    res.status(201).json(expense);
                }
            );
        }
    );
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { description, amount, category_id, date, is_recurring } = req.body;

    db.run(
        'UPDATE expenses SET description = ?, amount = ?, category_id = ?, date = ?, is_recurring = ? WHERE id = ? AND user_id = ?',
        [description, parseFloat(amount), category_id, date, is_recurring ? 1 : 0, id, req.user.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar gasto' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Gasto não encontrado' });
            }
            res.json({ message: 'Gasto atualizado com sucesso' });
        }
    );
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run(
        'DELETE FROM expenses WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao excluir gasto' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Gasto não encontrado' });
            }
            res.json({ message: 'Gasto excluído com sucesso' });
        }
    );
});

// Rotas de Categorias
app.get('/api/categories', authenticateToken, (req, res) => {
    db.all(
        `SELECT * FROM expense_categories WHERE is_default = 1 OR user_id = ? OR user_id IS NULL`,
        [req.user.id],
        (err, categories) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar categorias' });
            }
            res.json(categories);
        }
    );
});

app.post('/api/categories', authenticateToken, (req, res) => {
    const { name, is_recurring } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    db.run(
        'INSERT INTO expense_categories (name, is_recurring, user_id) VALUES (?, ?, ?)',
        [name, is_recurring ? 1 : 0, req.user.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar categoria' });
            }
            res.status(201).json({
                id: this.lastID,
                name,
                is_recurring: is_recurring ? 1 : 0,
                user_id: req.user.id
            });
        }
    );
});

// Rota para resumo mensal
app.get('/api/summary', authenticateToken, (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
    }

    const query = `
    SELECT 
      ec.name as category,
      SUM(e.amount) as total,
      COUNT(e.id) as count
    FROM expenses e
    JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.user_id = ? 
      AND strftime("%m", e.date) = ? 
      AND strftime("%Y", e.date) = ?
    GROUP BY ec.name
    ORDER BY total DESC
  `;

    db.all(
        query,
        [req.user.id, month.toString().padStart(2, '0'), year.toString()],
        (err, summary) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar resumo' });
            }

            // Calcular total geral
            const total = summary.reduce((sum, item) => sum + parseFloat(item.total), 0);

            res.json({
                summary,
                total: total.toFixed(2),
                month: parseInt(month),
                year: parseInt(year)
            });
        }
    );
});

// Rota para atualizar renda mensal
app.put('/api/user/income', authenticateToken, (req, res) => {
    const { monthly_income } = req.body;

    db.run(
        'UPDATE users SET monthly_income = ? WHERE id = ?',
        [parseFloat(monthly_income), req.user.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar renda' });
            }
            res.json({ message: 'Renda mensal atualizada com sucesso' });
        }
    );
});

// Rota para obter dados do usuário
app.get('/api/user', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, name, email, monthly_income FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar usuário' });
            }
            res.json(user);
        }
    );
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
});