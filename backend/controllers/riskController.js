const { runQuery } = require('../db');

exports.getRiskAnalysis = async (req, res) => {
  try {
    // 1. Tax Haven Exposure Query
    const taxHavenCypher = `
      MATCH path = (c:Company)-[:OWNS|REGISTERED_IN*1..3]->(co:Country {isTaxHaven: true})
      RETURN c.id AS companyId, c.name AS companyName, c.riskScore AS riskScore, co.name AS taxHaven, length(path) AS hops
      ORDER BY c.riskScore DESC
      LIMIT 10
    `;
    const taxHavenResult = await runQuery(taxHavenCypher);
    const taxHavenExposures = taxHavenResult.records.map(rec => ({
      companyId: rec.get('companyId'),
      companyName: rec.get('companyName'),
      riskScore: rec.get('riskScore') ? Number(rec.get('riskScore')) : 0,
      taxHaven: rec.get('taxHaven'),
      hops: rec.get('hops') ? Number(rec.get('hops')) : 1,
      explanation: `Connected to tax-haven jurisdiction '${rec.get('taxHaven')}' via ${rec.get('hops')} hop(s).`
    }));

    // 2. Shared Address Congestion Query (Awkward in SQL)
    const sharedAddrCypher = `
      MATCH (c:Company)-[:LOCATED_AT]->(a:Address)
      WITH a, collect({id: c.id, name: c.name, riskScore: c.riskScore}) AS companies
      WHERE size(companies) > 1
      RETURN a.id AS addressId, a.fullAddress AS fullAddress, companies, size(companies) AS count
      ORDER BY count DESC
    `;
    const sharedAddrResult = await runQuery(sharedAddrCypher);
    const sharedAddresses = sharedAddrResult.records.map(rec => ({
      addressId: rec.get('addressId'),
      fullAddress: rec.get('fullAddress'),
      companyCount: rec.get('count') ? Number(rec.get('count')) : 0,
      companies: rec.get('companies'),
      explanation: `Hosts ${rec.get('count')} registered companies at the exact same physical address, a common indicator of shell corporate centers.`
    }));

    // 3. Shared Director Query (Relational Pain Point)
    const sharedDirectorCypher = `
      MATCH (p:Person)-[:DIRECTOR_OF]->(c:Company)
      WITH p, collect({id: c.id, name: c.name, riskScore: c.riskScore}) AS companies
      WHERE size(companies) > 1
      RETURN p.id AS personId, p.name AS personName, p.riskScore AS personRiskScore, companies, size(companies) AS count
      ORDER BY count DESC
    `;
    const sharedDirectorResult = await runQuery(sharedDirectorCypher);
    const sharedDirectors = sharedDirectorResult.records.map(rec => ({
      personId: rec.get('personId'),
      personName: rec.get('personName'),
      riskScore: rec.get('personRiskScore') ? Number(rec.get('personRiskScore')) : 0,
      companyCount: rec.get('count') ? Number(rec.get('count')) : 0,
      companies: rec.get('companies'),
      explanation: `Director ${rec.get('personName')} manages ${rec.get('count')} separate companies across the network.`
    }));

    // 4. High Risk Persons Query
    const highRiskPersonCypher = `
      MATCH (p:Person)-[r:OWNS|DIRECTOR_OF]->(c:Company)
      WHERE p.riskScore >= 70
      RETURN p.id AS personId, p.name AS personName, p.riskScore AS personRiskScore,
             type(r) AS relationship, c.id AS companyId, c.name AS companyName, c.riskScore AS companyRiskScore
      ORDER BY p.riskScore DESC
    `;
    const highRiskResult = await runQuery(highRiskPersonCypher);
    const highRiskConnections = highRiskResult.records.map(rec => ({
      personId: rec.get('personId'),
      personName: rec.get('personName'),
      personRiskScore: rec.get('personRiskScore') ? Number(rec.get('personRiskScore')) : 0,
      relationship: rec.get('relationship'),
      companyId: rec.get('companyId'),
      companyName: rec.get('companyName'),
      companyRiskScore: rec.get('companyRiskScore') ? Number(rec.get('companyRiskScore')) : 0,
      explanation: `High-risk individual (${rec.get('personName')}, risk score ${rec.get('personRiskScore')}) holds '${rec.get('relationship')}' relationship with ${rec.get('companyName')}.`
    }));

    return res.json({
      taxHavenExposures,
      sharedAddresses,
      sharedDirectors,
      highRiskConnections
    });
  } catch (error) {
    console.error('Error in getRiskAnalysis:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the graph database.'
    });
  }
};
