require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key_123';

// CORS configuration (allow localhost:4200 and production URL)
app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        
        let frontendUrl = (process.env.FRONTEND_URL || '').trim();
        if (frontendUrl.endsWith('/')) frontendUrl = frontendUrl.slice(0, -1);
        
        const allowedOrigins = ['http://localhost:4200', frontendUrl];
        let cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        if(allowedOrigins.indexOf(cleanOrigin) === -1){
            console.error('CORS Bloqueado. Origin:', origin, 'Esperado:', frontendUrl);
            return callback(new Error('Bloqueado por CORS'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración SSL para TiDB Cloud (requiere TLS en conexiones públicas)
const sslConfig = process.env.DB_SSL === 'true' ? {
    ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
} : {};

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tareas_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    ...sslConfig
});

// =============================================
// AUTO-HEALING: Creación automática de tablas
// =============================================
async function inicializarBaseDeDatos() {
    console.log('[Auto-Healing] Iniciando verificación de tablas...');

    // --- Tabla: administradores ---
    await new Promise((resolve, reject) => {
        const sql = `
            CREATE TABLE IF NOT EXISTS administradores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `;
        db.query(sql, async (err) => {
            if (err) { console.error('[Auto-Healing] Error al crear tabla administradores:', err); return reject(err); }
            console.log('[Auto-Healing] Tabla "administradores" verificada ✓');

            // Seed: crear admin por defecto si la tabla está vacía
            db.query('SELECT COUNT(*) AS count FROM administradores', async (err, results) => {
                if (err) return reject(err);
                if (results[0].count === 0) {
                    console.log('[Auto-Healing] Sin administradores, creando usuario "admin" por defecto...');
                    try {
                        const hashedPassword = await bcrypt.hash('admin123', 10);
                        db.query('INSERT INTO administradores (username, password) VALUES (?, ?)', ['admin', hashedPassword], (err) => {
                            if (err) console.error('[Auto-Healing] Error creando admin:', err);
                            else console.log('[Auto-Healing] Usuario "admin" creado con contraseña "admin123" ✓');
                            resolve();
                        });
                    } catch (e) { reject(e); }
                } else {
                    resolve();
                }
            });
        });
    });

    // --- Tabla: usuarios ---
    await new Promise((resolve, reject) => {
        const sql = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id VARCHAR(50) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                avatar LONGTEXT
            )
        `;
        db.query(sql, (err) => {
            if (err) { console.error('[Auto-Healing] Error al crear tabla usuarios:', err); return reject(err); }
            console.log('[Auto-Healing] Tabla "usuarios" verificada ✓');

            // Seed: insertar perfiles de ejemplo si la tabla está vacía
            db.query('SELECT COUNT(*) AS count FROM usuarios', (err, results) => {
                if (err) return reject(err);
                if (results[0].count === 0) {
                    console.log('[Auto-Healing] Sin usuarios, cargando datos de ejemplo...');
                    const seedData = [
                        ['u1', 'Elon Musk', 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Elon_Musk_Royal_Society.jpg'],
                        ['u2', 'Taylor Swift', 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png'],
                        ['u3', 'Lionel Messi', 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg'],
                        ['u4', 'Albert Einstein', 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg'],
                        ['u5', 'Marie Curie', 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Marie_Curie_c._1920s.jpg']
                    ];
                    let pending = seedData.length;
                    seedData.forEach(user => {
                        db.query('INSERT IGNORE INTO usuarios (id, nombre, avatar) VALUES (?, ?, ?)', user, (err) => {
                            if (err) console.error('[Auto-Healing] Error en seed usuario:', err);
                            if (--pending === 0) {
                                console.log('[Auto-Healing] Usuarios de ejemplo cargados ✓');
                                resolve();
                            }
                        });
                    });
                } else {
                    resolve();
                }
            });
        });
    });

    // --- Tabla: tareas ---
    await new Promise((resolve, reject) => {
        const sql = `
            CREATE TABLE IF NOT EXISTS tareas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                resumen TEXT,
                expira DATE,
                idUsuario VARCHAR(50),
                completada TINYINT(1) DEFAULT 0,
                FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `;
        db.query(sql, (err) => {
            if (err) { console.error('[Auto-Healing] Error al crear tabla tareas:', err); return reject(err); }
            console.log('[Auto-Healing] Tabla "tareas" verificada ✓');
            resolve();
        });
    });

    console.log('[Auto-Healing] ✅ Todas las tablas verificadas y listas.');
}

// Conectar a la BD y lanzar el auto-healing
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos ✓');
    connection.release();

    inicializarBaseDeDatos().catch(e => {
        console.error('[Auto-Healing] Error crítico en la inicialización:', e);
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

// --- Rutas Raíz ---
app.get('/', (req, res) => {
    res.send('<h1>API del Gestor de Tareas Funciona Correctamente</h1><p>Esta es la API del backend. El frontend se ejecuta por separado.</p>');
});

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

// Actualizar perfil (contraseña) de cualquier administrador
app.put('/admin/password/:id', verificarAuth, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Falta la nueva contraseña' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('UPDATE administradores SET password = ? WHERE id = ?', [hashedPassword, id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Contraseña actualizada correctamente' });
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

// --- Rutas Usuarios (Perfiles de Tareas) ---
app.get('/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/usuarios', verificarAuth, (req, res) => {
    const { nombre, avatar } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });
    const id = 'u' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    db.query('INSERT INTO usuarios (id, nombre, avatar) VALUES (?, ?, ?)', [id, nombre, avatar || null], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Usuario creado', id });
    });
});

app.put('/usuarios/:id', verificarAuth, (req, res) => {
    const { id } = req.params;
    const { nombre, avatar } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });
    db.query('UPDATE usuarios SET nombre = ?, avatar = ? WHERE id = ?', [nombre, avatar || null, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Usuario actualizado' });
    });
});

app.delete('/usuarios/:id', verificarAuth, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tareas WHERE idUsuario = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        db.query('DELETE FROM usuarios WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Usuario y sus tareas eliminadas' });
        });
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

// PUT: Actualizar o completar tarea (PROTEGIDO)
app.put('/tareas/:id', verificarAuth, (req, res) => {
    const { id } = req.params;
    const { titulo, resumen, expira, completada } = req.body;

    let sql = '';
    let params = [];

    // Si viene titulo, significa que es una edición de contenido
    if (titulo) {
        sql = 'UPDATE tareas SET titulo = ?, resumen = ?, expira = ? WHERE id = ?';
        params = [titulo, resumen, expira, id];
    } else if (completada !== undefined) {
        // Si viene completada, actualizamos el estado
        sql = 'UPDATE tareas SET completada = ? WHERE id = ?';
        params = [completada, id];
    } else {
        // Si no viene titulo ni completada, asumimos que solo se quiere marcar como completada
        sql = 'UPDATE tareas SET completada = 1 WHERE id = ?';
        params = [id];
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error UPDATE:', err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: 'Tarea actualizada correctamente' });
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