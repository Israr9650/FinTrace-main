const neo4j = require('neo4j-driver');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD;

let driver = null;

function getDriver() {
  if (!driver) {
    if (!uri || !password) {
      console.warn('Warning: COGNODB_URI or COGNODB_PASSWORD environment variables are not set.');
      return null;
    }
    try {
      driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionTimeout: 5000
      });
    } catch (err) {
      console.error('Failed to create Neo4j driver:', err.message);
      driver = null;
    }
  }
  return driver;
}

async function checkConnection() {
  const currentDriver = getDriver();
  if (!currentDriver) return { connected: false, error: 'Database connection configuration missing.' };

  const session = currentDriver.session();
  try {
    await session.run('RETURN 1 AS test');
    return { connected: true };
  } catch (err) {
    console.error('Database connection check failed:', err.message);
    return { connected: false, error: 'Unable to connect to the graph database.' };
  } finally {
    await session.close();
  }
}

async function runQuery(cypher, params = {}) {
  const currentDriver = getDriver();
  if (!currentDriver) {
    throw new Error('Unable to connect to the graph database. Driver not initialized.');
  }

  const session = currentDriver.session();
  try {
    const result = await session.run(cypher, params);
    return result;
  } catch (error) {
    console.error(`Cypher query error: ${error.message}`);
    throw error;
  } finally {
    await session.close();
  }
}

module.exports = {
  getDriver,
  checkConnection,
  runQuery
};
