const mysql = require('mysql2');
const { promisify } = require('util');
const config = require('config');

const mysqlConfig = config.get('mysql');

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: mysqlConfig.host,
  user: mysqlConfig.user,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
  port: mysqlConfig.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Get a connection from the pool
const getConnection = async () => {
  const connection = await promisify(pool.getConnection).call(pool);
  connection.queryAsync = promisify(connection.query).bind(connection);
  connection.releaseAsync = promisify(connection.release).bind(connection);
  return connection;
};

module.exports = getConnection;
