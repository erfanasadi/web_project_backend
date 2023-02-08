
const { Pool } = require("pg");

// const pool = new Pool("postgres://postgres:alierfan@localhost:5432/webbackend")
const pool = new Pool({
  user: 'postgres',
      database: 'webbackend',
    password: 'alierfan',
    port: 5432,
    host: 'localhost',
})
module.exports = {
  query: (text, params) => pool.query(text, params),
};
