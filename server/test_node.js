const { Client } = require("pg");

const DB_CONFIG = {
  database: "RahulDB",
  user: "postgres",
  password: "postgres",
  host: "localhost",
  port: 5432,
};

// 1. CHANGED: Table name updated from 'users1' to 'student'
const CREATE_TABLE_QUERY = `
CREATE TABLE IF NOT EXISTS student (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
`;

async function createTable() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    await client.query(CREATE_TABLE_QUERY);
    // 2. CHANGED: Updated the log message to say 'student' table
    console.log("Connected to RahulDB and created 'student' table successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

createTable(); 
