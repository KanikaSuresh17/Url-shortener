const { Pool, Client } = require('pg');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'url_shortener';
const connectionString = process.env.DATABASE_URL;

let pool = null;

const db = {
  users: {
    create: async (username, passwordHash) => {
      const query = `
        INSERT INTO users (username, password_hash)
        VALUES ($1, $2)
        RETURNING id, username, password_hash, created_at
      `;
      try {
        const res = await pool.query(query, [username, passwordHash]);
        return res.rows[0];
      } catch (err) {
        if (err.code === '23505') { // PostgreSQL unique violation
          throw new Error('UNIQUE constraint failed: users.username');
        }
        throw err;
      }
    },

    findByUsername: async (username) => {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
      return res.rows[0] || null;
    },

    findById: async (id) => {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
  },

  urls: {
    create: async (shortCode, longUrl, userId) => {
      const query = `
        INSERT INTO urls (short_code, long_url, user_id)
        VALUES ($1, $2, $3)
        RETURNING id, short_code, long_url, user_id, click_count, created_at
      `;
      try {
        const res = await pool.query(query, [shortCode, longUrl, userId]);
        return res.rows[0];
      } catch (err) {
        if (err.code === '23505') {
          throw new Error('UNIQUE constraint failed: urls.short_code');
        }
        throw err;
      }
    },

    findByShortCode: async (shortCode) => {
      const res = await pool.query('SELECT * FROM urls WHERE short_code = $1', [shortCode]);
      return res.rows[0] || null;
    },

    findByUser: async (userId) => {
      const res = await pool.query(
        'SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return res.rows;
    },

    delete: async (id, userId) => {
      const res = await pool.query(
        'DELETE FROM urls WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return res.rowCount > 0;
    },

    incrementClicks: async (id) => {
      await pool.query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [id]);
    }
  },

  visits: {
    create: async (urlId, ipAddress, userAgent) => {
      const query = `
        INSERT INTO visits (url_id, ip_address, user_agent)
        VALUES ($1, $2, $3)
      `;
      await pool.query(query, [urlId, ipAddress, userAgent]);
    },

    findByUrl: async (urlId) => {
      const res = await pool.query(
        'SELECT * FROM visits WHERE url_id = $1 ORDER BY timestamp DESC LIMIT 50',
        [urlId]
      );
      return res.rows;
    },

    getSummary: async (urlId) => {
      const res = await pool.query(
        'SELECT COUNT(*) as click_count, MAX(timestamp) as last_visited FROM visits WHERE url_id = $1',
        [urlId]
      );
      const row = res.rows[0];
      return {
        click_count: parseInt(row.click_count || 0, 10),
        last_visited: row.last_visited || null
      };
    }
  },

  init: async () => {
    console.log('Initializing PostgreSQL database setup...');

    // 1. Pre-connection check: Check if the target database exists, if not, create it
    let clientConfig;
    if (connectionString) {
      clientConfig = { connectionString };
    } else {
      clientConfig = {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword
      };
    }

    // Connect to the default 'postgres' database first to create target db if needed
    const tempConfig = connectionString 
      ? { connectionString: connectionString.replace(/\/([^/]+)$/, '/postgres') }
      : { ...clientConfig, database: 'postgres' };

    const checkClient = new Client(tempConfig);
    try {
      await checkClient.connect();
      
      // Check if target database exists
      const dbCheckRes = await checkClient.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );

      if (dbCheckRes.rowCount === 0) {
        console.log(`Database "${dbName}" does not exist. Creating database...`);
        // Note: CREATE DATABASE cannot be executed inside a transaction block and target db name is from env
        await checkClient.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
        console.log(`Database "${dbName}" created successfully!`);
      } else {
        console.log(`Database "${dbName}" already exists.`);
      }
    } catch (err) {
      console.warn('Warning checking/creating PostgreSQL database:', err.message);
      console.warn('Attempting direct connection. Make sure database exists.');
    } finally {
      try {
        await checkClient.end();
      } catch (_) {}
    }

    // 2. Initialize connection pool to the target database
    let poolConfig;
    if (connectionString) {
      poolConfig = { connectionString };
    } else {
      poolConfig = {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName
      };
    }

    pool = new Pool(poolConfig);

    // Test connection
    try {
      const client = await pool.connect();
      console.log(`Successfully connected to PostgreSQL database: ${dbName}`);
      client.release();
    } catch (err) {
      console.error('CRITICAL: Failed to connect to PostgreSQL database:', err.message);
      throw err;
    }

    // 3. Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        long_url TEXT NOT NULL,
        click_count INTEGER DEFAULT 0,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);

    console.log('PostgreSQL database schema migrated successfully!');
  }
};

module.exports = db;
