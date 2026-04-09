require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key_123';

// CORS configuration (allow localhost:4200 and production URL)
const allowedOrigins = ['http://localhost:4200', process.env.FRONTEND_URL];
app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'tareas_db',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
    connection.release();

    // Inicializar tabla de administradores si no existe
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS administradores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `;
    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error al crear tabla administradores:', err);
            return;
        }

        // Auto-Seeding
        db.query('SELECT COUNT(*) AS count FROM administradores', async (err, results) => {
            if (err) {
                console.error('Error checking administradores:', err);
                return;
            }
            if (results[0].count === 0) {
                console.log('La tabla de administradores está vacía, creando usuario por defecto "admin"...');
                try {
                    const hashedPassword = await bcrypt.hash('admin123', 10);
                    db.query('INSERT INTO administradores (username, password) VALUES (?, ?)', ['admin', hashedPassword], (err) => {
                        if (err) console.error('Error auto-seeding admin:', err);
                        else console.log('Usuario administrador "admin" creado con éxito.');
                    });
                } catch (error) {
                    console.error('Error hashing password for auto-seeding:', error);
                }
            }
        });
    });
});

// Middleware JWT
function verificarAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token no proveído' });
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Formato de token inválido' });
    }
    const token = parts[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.admin = decoded;
        next();
    });
}

// --- Rutas Auth y Admin ---

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan credenciales' });
    }

    db.query('SELECT * FROM administradores WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const admin = results[0];
        const pwdMatch = await bcrypt.compare(password, admin.password);
        if (!pwdMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: admin.id, username: admin.username }, SECRET_KEY, { expiresIn: '12h' });
        res.json({ token, username: admin.username });
    });
});

// Crear nuevo administrador
app.post('/admin', verificarAuth, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO administradores (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El nombre de usuario ya existe' });
                return res.status(500).json(err);
            }
            res.json({ mensaje: 'Administrador creado correctamente' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Error procesando la solicitud' });
    }
});

// Actualizar perfil (contraseña) del logueado
app.put('/admin/perfil', verificarAuth, async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Falta la nueva contraseña' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('UPDATE administradores SET password = ? WHERE id = ?', [hashedPassword, req.admin.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Perfil actualizado correctamente' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Error procesando la solicitud' });
    }
});

// Listar todos los administradores
app.get('/admin', verificarAuth, (req, res) => {
    db.query('SELECT id, username FROM administradores', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Eliminar un administrador
app.delete('/admin/:id', verificarAuth, (req, res) => {
    const { id } = req.params;
    
    // Opcional: Impedir que el admin se elimine a sí mismo
    if (parseInt(id) === req.admin.id) {
        return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta activa' });
    }

    db.query('DELETE FROM administradores WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Administrador eliminado correctamente' });
    });
});

// --- Rutas Tareas ---

// GET: Obtener tareas (PÚBLICO)
app.get('/tareas', (req, res) => {
    const { idUsuario } = req.query; 
    let sql = 'SELECT * FROM tareas';
    let parametros = [];

    if (idUsuario) {
        sql += ' WHERE idUsuario = ?';
        parametros.push(idUsuario);
    }

    db.query(sql, parametros, (err, results) => {
        if (err) {
            console.error('Error GET:', err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

// POST: Crear nueva tarea (PROTEGIDO)
app.post('/tareas', verificarAuth, (req, res) => {
    const { titulo, resumen, expira, idUsuario } = req.body;

    const sql = `
        INSERT INTO tareas (titulo, resumen, expira, idUsuario, completada)
        VALUES (?, ?, ?, ?, 0)
    `;

    db.query(sql, [titulo, resumen, expira, idUsuario], (err) => {
        if (err) {
            console.error('Error INSERT:', err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: 'Tarea creada correctamente' });
    });
});

// PUT: Marcar tarea como completada (PROTEGIDO)
app.put('/tareas/:id', verificarAuth, (req, res) => {
    const { id } = req.params;

    const sql = 'UPDATE tareas SET completada = 1 WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error UPDATE:', err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: 'Tarea completada correctamente' });
    });
});

// DELETE: Eliminar tarea (PROTEGIDO)
app.delete('/tareas/:id', verificarAuth, (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM tareas WHERE id = ?';

    db.query(sql, [id], (err) => {
        if (err) {
            console.error('Error DELETE:', err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: 'Tarea eliminada correctamente' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});