require('dotenv').config();
const { Client } = require('pg');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'url_shortener'
});

c.connect().then(async () => {
  const usersRes = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
  );
  console.log('users table columns:', usersRes.rows.map(r => r.column_name));
  
  const visitsRes = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='visits' ORDER BY ordinal_position"
  );
  console.log('visits table columns:', visitsRes.rows.map(r => r.column_name));
  c.end();
}).catch(e => {
  console.error('Error:', e.message);
  c.end();
});

