const { runQuery } = require('../db');

exports.getEntityNetwork = async (req, res) => {
  try {
    const { id } = req.params;

    const cypher = `
      MATCH (center {id: $id})
      OPTIONAL MATCH path = (center)-[r*1..2]-(neighbor)
      RETURN center, path LIMIT 50
    `;

    const result = await runQuery(cypher, { id });

    const nodeMap = new Map();
    const edgeSet = new Set();
    const edges = [];

    // Helper to extract node properties
    const addNode = (node) => {
      if (!node || !node.properties || !node.properties.id) return;
      const props = node.properties;
      if (!nodeMap.has(props.id)) {
        nodeMap.set(props.id, {
          id: props.id,
          label: props.name || props.fullAddress || props.id,
          type: node.labels ? node.labels[0] : 'Entity',
          riskScore: props.riskScore || 0,
          isTaxHaven: props.isTaxHaven || false
        });
      }
    };

    if (result.records && result.records.length > 0) {
      result.records.forEach(rec => {
        const centerNode = rec.get('center');
        addNode(centerNode);

        const path = rec.get('path');
        if (path) {
          path.segments.forEach(segment => {
            addNode(segment.start);
            addNode(segment.end);

            const edgeId = `${segment.start.properties.id}-${segment.relationship.type}-${segment.end.properties.id}`;
            if (!edgeSet.has(edgeId)) {
              edgeSet.add(edgeId);
              edges.push({
                id: edgeId,
                from: segment.start.properties.id,
                to: segment.end.properties.id,
                label: segment.relationship.type,
                ownershipPercentage: segment.relationship.properties.ownershipPercentage || null
              });
            }
          });
        }
      });
    }

    return res.json({
      nodes: Array.from(nodeMap.values()),
      edges
    });
  } catch (error) {
    console.error('Error in getEntityNetwork:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the graph database.'
    });
  }
};

exports.getOwnershipPath = async (req, res) => {
  try {
    const { sourceId, targetId } = req.query;

    if (!sourceId || !targetId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both sourceId and targetId query parameters.'
      });
    }

    const cypher = `
      MATCH path = (source {id: $sourceId})-[:OWNS*1..4]->(target:Company {id: $targetId})
      RETURN path
      LIMIT 10
    `;

    const result = await runQuery(cypher, { sourceId, targetId });

    if (!result.records || result.records.length === 0) {
      return res.json({
        found: false,
        message: 'No ownership path found between the selected entities.',
        paths: []
      });
    }

    const paths = result.records.map((rec, pathIndex) => {
      const path = rec.get('path');
      const nodes = [];
      const steps = [];
      let totalEffectiveShare = 1.0;

      path.segments.forEach((segment, idx) => {
        if (idx === 0) {
          nodes.push({
            id: segment.start.properties.id,
            name: segment.start.properties.name,
            type: segment.start.labels[0],
            riskScore: segment.start.properties.riskScore || 0
          });
        }

        const pct = segment.relationship.properties.ownershipPercentage || 100.0;
        totalEffectiveShare *= (pct / 100.0);

        nodes.push({
          id: segment.end.properties.id,
          name: segment.end.properties.name,
          type: segment.end.labels[0],
          riskScore: segment.end.properties.riskScore || 0
        });

        steps.push({
          fromName: segment.start.properties.name,
          toName: segment.end.properties.name,
          percentage: pct
        });
      });

      return {
        pathIndex: pathIndex + 1,
        hops: path.length,
        effectiveOwnershipPct: (totalEffectiveShare * 100).toFixed(2),
        nodes,
        steps
      };
    });

    return res.json({
      found: true,
      paths
    });
  } catch (error) {
    console.error('Error in getOwnershipPath:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to connect to the graph database.'
    });
  }
};
