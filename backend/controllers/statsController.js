const { runQuery, checkConnection } = require('../db');

exports.getHealth = async (req, res) => {
  try {
    const conn = await checkConnection();
    if (!conn.connected) {
      return res.status(503).json({
        status: 'error',
        message: 'Unable to connect to the graph database.',
        connected: false
      });
    }
    return res.json({
      status: 'ok',
      message: 'GraphLens API and CognoDB are healthy.',
      connected: true
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the graph database.',
      connected: false
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const cypher = `
      MATCH (c:Company) WITH count(c) AS companies
      MATCH (p:Person) WITH companies, count(p) AS people
      MATCH (co:Country) WITH companies, people, count(co) AS countries
      MATCH (a:Address) WITH companies, people, countries, count(a) AS addresses
      MATCH ()-[r]->() WITH companies, people, countries, addresses, count(r) AS relationships
      MATCH (e) WHERE (e:Company OR e:Person) AND e.riskScore >= 70
      RETURN companies, people, countries, addresses, relationships, count(e) AS highRiskCount
    `;

    const result = await runQuery(cypher);
    if (!result.records || result.records.length === 0) {
      return res.json({
        companies: 0,
        people: 0,
        countries: 0,
        addresses: 0,
        relationships: 0,
        highRiskCount: 0
      });
    }

    const rec = result.records[0];
    return res.json({
      companies: rec.get('companies').toNumber ? rec.get('companies').toNumber() : Number(rec.get('companies')),
      people: rec.get('people').toNumber ? rec.get('people').toNumber() : Number(rec.get('people')),
      countries: rec.get('countries').toNumber ? rec.get('countries').toNumber() : Number(rec.get('countries')),
      addresses: rec.get('addresses').toNumber ? rec.get('addresses').toNumber() : Number(rec.get('addresses')),
      relationships: rec.get('relationships').toNumber ? rec.get('relationships').toNumber() : Number(rec.get('relationships')),
      highRiskCount: rec.get('highRiskCount').toNumber ? rec.get('highRiskCount').toNumber() : Number(rec.get('highRiskCount'))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the graph database.'
    });
  }
};
