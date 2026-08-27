const { runQuery } = require('../db');

exports.getEntities = async (req, res) => {
  try {
    const { search = '', type = 'all' } = req.query;

    let typeFilter = '(e:Company OR e:Person)';
    if (type === 'Company') typeFilter = 'e:Company';
    if (type === 'Person') typeFilter = 'e:Person';

    const cypher = `
      MATCH (e)
      WHERE ${typeFilter} AND ($search = '' OR toLower(e.name) CONTAINS toLower($search))
      OPTIONAL MATCH (e)-[:REGISTERED_IN]->(co:Country)
      RETURN e, labels(e)[0] AS type, co.name AS countryName
      ORDER BY e.riskScore DESC, e.name ASC
      LIMIT 50
    `;

    const result = await runQuery(cypher, { search });

    const entities = result.records.map(rec => {
      const node = rec.get('e').properties;
      return {
        id: node.id,
        name: node.name,
        type: rec.get('type'),
        riskScore: node.riskScore || 0,
        countryName: rec.get('countryName') || null,
        registrationNumber: node.registrationNumber || null,
        incorporationDate: node.incorporationDate || null,
        nationality: node.nationality || null
      };
    });

    return res.json(entities);
  } catch (error) {
    console.error('Error in getEntities:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the graph database.'
    });
  }
};

exports.getEntityById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch entity properties
    const entityCypher = `
      MATCH (e {id: $id})
      OPTIONAL MATCH (e)-[:REGISTERED_IN]->(co:Country)
      OPTIONAL MATCH (e)-[:LOCATED_AT]->(a:Address)
      RETURN e, labels(e)[0] AS type, co.name AS countryName, a.fullAddress AS fullAddress
    `;

    const entityResult = await runQuery(entityCypher, { id });

    if (!entityResult.records || entityResult.records.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `Entity with ID '${id}' not found.`
      });
    }

    const rec = entityResult.records[0];
    const nodeProps = rec.get('e').properties;
    const entityType = rec.get('type');

    // Fetch 1-hop connections
    const connCypher = `
      MATCH (e {id: $id})-[r]-(target)
      RETURN 
        startNode(r).id AS sourceId,
        endNode(r).id AS targetId,
        type(r) AS relType,
        r.ownershipPercentage AS ownershipPercentage,
        target.id AS connectedId,
        target.name AS connectedName,
        labels(target)[0] AS connectedType,
        target.riskScore AS connectedRiskScore
    `;

    const connResult = await runQuery(connCypher, { id });

    const connections = connResult.records.map(cRec => {
      const isOutbound = cRec.get('sourceId') === id;
      return {
        direction: isOutbound ? 'OUTGOING' : 'INCOMING',
        relationship: cRec.get('relType'),
        ownershipPercentage: cRec.get('ownershipPercentage') ? Number(cRec.get('ownershipPercentage')) : null,
        targetId: cRec.get('connectedId'),
        targetName: cRec.get('connectedName'),
        targetType: cRec.get('connectedType'),
        targetRiskScore: cRec.get('connectedRiskScore') ? Number(cRec.get('connectedRiskScore')) : 0
      };
    });

    return res.json({
      entity: {
        id: nodeProps.id,
        name: nodeProps.name,
        type: entityType,
        riskScore: nodeProps.riskScore || 0,
        registrationNumber: nodeProps.registrationNumber || null,
        incorporationDate: nodeProps.incorporationDate || null,
        nationality: nodeProps.nationality || null,
        countryName: rec.get('countryName') || null,
        fullAddress: rec.get('fullAddress') || null
      },
      connections
    });
  } catch (error) {
    console.error('Error in getEntityById:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the graph database.'
    });
  }
};
