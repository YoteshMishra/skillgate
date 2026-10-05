const { Client } = require("pg");

const DB_CONFIG = {
  database: "RahulDB",
  user: "postgres",
  password: "postgres",
  host: "localhost",
  port: 5432,
};

function getClient() {
  return new Client(DB_CONFIG);
}

// CREATE TABLE (if not exists)
async function createCustomerTable() {
  const client = getClient();
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Table 'customers' ready.");
  } finally {
    await client.end();
  }
}

// CREATE / ADD a customer row
async function addCustomer(name, email) {
  const client = getClient();
  try {
    await client.connect();
    const result = await client.query(
      "INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING *;",
      [name, email]
    );
    console.log("Added customer:", result.rows[0]);
    return result.rows[0];
  } finally {
    await client.end();
  }
}

// READ all customers
async function getCustomers() {
  const client = getClient();
  try {
    await client.connect();
    const result = await client.query("SELECT * FROM customers;");
    return result.rows;
  } finally {
    await client.end();
  }
}

// UPDATE a customer by id
async function updateCustomer(id, fields) {
  const client = getClient();
  try {
    await client.connect();
    const keys = Object.keys(fields);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = Object.values(fields);
    const result = await client.query(
      `UPDATE customers SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *;`,
      [...values, id]
    );
    console.log("Updated customer:", result.rows[0]);
    return result.rows[0];
  } finally {
    await client.end();
  }
}

// DELETE a customer row by matching a given column/value (e.g. deleteCustomer("id", 3))
async function deleteCustomer(column, value) {
  const client = getClient();
  try {
    await client.connect();
    const result = await client.query(
      `DELETE FROM customers WHERE ${column} = $1 RETURNING *;`,
      [value]
    );
    console.log("Deleted customer:", result.rows[0]);
    return result.rows[0];
  } finally {
    await client.end();
  }
}

module.exports = {
  createCustomerTable,
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
};