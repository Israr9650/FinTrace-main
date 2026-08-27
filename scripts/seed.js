const neo4j = require('neo4j-driver');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
  console.error('Error: COGNODB_URI or COGNODB_PASSWORD is missing in .env');
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function seedDatabase() {
  const session = driver.session();
  console.log('[seed] Connecting to CognoDB...');

  try {
    console.log('[seed] Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('[seed] Creating countries...');
    await session.run(`
      UNWIND $countries AS c
      CREATE (:Country {
        id: c.id,
        name: c.name,
        isTaxHaven: c.isTaxHaven
      })
    `, {
      countries: [
        { id: 'US', name: 'United States', isTaxHaven: false },
        { id: 'UK', name: 'United Kingdom', isTaxHaven: false },
        { id: 'SG', name: 'Singapore', isTaxHaven: false },
        { id: 'KY', name: 'Cayman Islands', isTaxHaven: true },
        { id: 'PA', name: 'Panama', isTaxHaven: true },
        { id: 'VG', name: 'British Virgin Islands', isTaxHaven: true }
      ]
    });

    console.log('[seed] Creating addresses...');
    await session.run(`
      UNWIND $addresses AS a
      CREATE (:Address {
        id: a.id,
        fullAddress: a.fullAddress
      })
    `, {
      addresses: [
        { id: 'addr_1', fullAddress: '100 Financial Way, Suite 500, New York, NY 10005' },
        { id: 'addr_2', fullAddress: '12 Marina Boulevard, Tower 3, Singapore 018982' },
        { id: 'addr_3', fullAddress: 'Suite 400, Harbor Financial Center, George Town, Cayman Islands' },
        { id: 'addr_4', fullAddress: '50 Calle 50, Plaza Global, Panama City, Panama' }
      ]
    });

    console.log('[seed] Creating companies...');
    await session.run(`
      UNWIND $companies AS c
      CREATE (:Company {
        id: c.id,
        name: c.name,
        registrationNumber: c.registrationNumber,
        incorporationDate: c.incorporationDate,
        riskScore: c.riskScore
      })
    `, {
      companies: [
        { id: 'comp_1', name: 'Apex Capital Partners', registrationNumber: 'US-889123', incorporationDate: '2015-03-12', riskScore: 15 },
        { id: 'comp_2', name: 'Meridian Energy Corp', registrationNumber: 'US-441209', incorporationDate: '2018-06-20', riskScore: 25 },
        { id: 'comp_3', name: 'Nova Logistics Global', registrationNumber: 'SG-993821', incorporationDate: '2020-01-15', riskScore: 30 },
        { id: 'comp_4', name: 'BlueHorizon Holdings', registrationNumber: 'KY-110293', incorporationDate: '2021-11-04', riskScore: 85 },
        { id: 'comp_5', name: 'Sunburst Trading Ltd', registrationNumber: 'KY-110294', incorporationDate: '2022-02-18', riskScore: 90 },
        { id: 'comp_6', name: 'Vanguard Pacific Shell', registrationNumber: 'PA-772910', incorporationDate: '2021-08-30', riskScore: 95 },
        { id: 'comp_7', name: 'Orion Defense Tech', registrationNumber: 'UK-334102', incorporationDate: '2019-09-10', riskScore: 40 },
        { id: 'comp_8', name: 'Zephyr Wealth Management', registrationNumber: 'VG-559201', incorporationDate: '2023-04-05', riskScore: 78 }
      ]
    });

    console.log('[seed] Creating people...');
    await session.run(`
      UNWIND $people AS p
      CREATE (:Person {
        id: p.id,
        name: p.name,
        nationality: p.nationality,
        riskScore: p.riskScore
      })
    `, {
      people: [
        { id: 'person_1', name: 'Elena Vance', nationality: 'American', riskScore: 20 },
        { id: 'person_2', name: 'Marcus Thorne', nationality: 'British', riskScore: 45 },
        { id: 'person_3', name: 'Victor Krumov', nationality: 'Bulgarian', riskScore: 88 },
        { id: 'person_4', name: 'Sofia Rodriguez', nationality: 'Panamanian', riskScore: 65 },
        { id: 'person_5', name: 'Chen Wei', nationality: 'Singaporean', riskScore: 15 },
        { id: 'person_6', name: 'Alexander Sterling', nationality: 'British', riskScore: 92 }
      ]
    });

    console.log('[seed] Creating relationships...');

    // REGISTERED_IN (Company -> Country)
    await session.run(`MATCH (c:Company {id: 'comp_1'}), (co:Country {id: 'US'}) CREATE (c)-[:REGISTERED_IN]->(co)`);
    await session.run(`MATCH (c:Company {id: 'comp_2'}), (co:Country {id: 'US'}) CREATE (c)-[:REGISTERED_IN]->(co)`);
    await session.run(`MATCH (c:Company {id: 'comp_3'}), (co:Country {id: 'SG'}) CREATE (c)-[:REGISTERED_IN]->(co)`);
    await session.run(`MATCH (c:Company {id: 'comp_4'}), (co:Country {id: 'KY'}) CREATE (c)-[:REGISTERED_IN]->(co)`);
    await session.run(`MATCH (c:Company {id: 'comp_5'}), (co:Country {id: 'KY'}) CREATE (c)-[:REGISTERED_IN]->(co)`);
    await session.run(`MATCH (c:Company {id: 'comp_6'}), (co:Country {id: 'PA'}) CREATE (c)-[:REGISTERED_IN]->(co)`);
    await session.run(`MATCH (c:Company {id: 'comp_7'}), (co:Country {id: 'UK'}) CREATE (c)-[:REGISTERED_IN]->(co)`);
    await session.run(`MATCH (c:Company {id: 'comp_8'}), (co:Country {id: 'VG'}) CREATE (c)-[:REGISTERED_IN]->(co)`);

    // LOCATED_AT (Company -> Address)
    await session.run(`MATCH (c:Company {id: 'comp_1'}), (a:Address {id: 'addr_1'}) CREATE (c)-[:LOCATED_AT]->(a)`);
    await session.run(`MATCH (c:Company {id: 'comp_2'}), (a:Address {id: 'addr_1'}) CREATE (c)-[:LOCATED_AT]->(a)`);
    await session.run(`MATCH (c:Company {id: 'comp_3'}), (a:Address {id: 'addr_2'}) CREATE (c)-[:LOCATED_AT]->(a)`);
    await session.run(`MATCH (c:Company {id: 'comp_4'}), (a:Address {id: 'addr_3'}) CREATE (c)-[:LOCATED_AT]->(a)`);
    await session.run(`MATCH (c:Company {id: 'comp_5'}), (a:Address {id: 'addr_3'}) CREATE (c)-[:LOCATED_AT]->(a)`);
    await session.run(`MATCH (c:Company {id: 'comp_8'}), (a:Address {id: 'addr_3'}) CREATE (c)-[:LOCATED_AT]->(a)`);
    await session.run(`MATCH (c:Company {id: 'comp_6'}), (a:Address {id: 'addr_4'}) CREATE (c)-[:LOCATED_AT]->(a)`);

    // DIRECTOR_OF (Person -> Company)
    await session.run(`MATCH (p:Person {id: 'person_1'}), (c:Company {id: 'comp_1'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_2'}), (c:Company {id: 'comp_2'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_2'}), (c:Company {id: 'comp_4'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_2'}), (c:Company {id: 'comp_7'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_3'}), (c:Company {id: 'comp_6'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_4'}), (c:Company {id: 'comp_5'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_5'}), (c:Company {id: 'comp_3'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_6'}), (c:Company {id: 'comp_8'}) CREATE (p)-[:DIRECTOR_OF]->(c)`);

    // OWNS (Person -> Company / Company -> Company)
    await session.run(`MATCH (p:Person {id: 'person_1'}), (c:Company {id: 'comp_1'}) CREATE (p)-[:OWNS {ownershipPercentage: 100.0}]->(c)`);
    await session.run(`MATCH (c1:Company {id: 'comp_1'}), (c2:Company {id: 'comp_2'}) CREATE (c1)-[:OWNS {ownershipPercentage: 60.0}]->(c2)`);
    await session.run(`MATCH (c1:Company {id: 'comp_2'}), (c2:Company {id: 'comp_3'}) CREATE (c1)-[:OWNS {ownershipPercentage: 45.0}]->(c2)`);
    await session.run(`MATCH (p:Person {id: 'person_3'}), (c:Company {id: 'comp_6'}) CREATE (p)-[:OWNS {ownershipPercentage: 100.0}]->(c)`);
    await session.run(`MATCH (c1:Company {id: 'comp_6'}), (c2:Company {id: 'comp_4'}) CREATE (c1)-[:OWNS {ownershipPercentage: 75.0}]->(c2)`);
    await session.run(`MATCH (c1:Company {id: 'comp_4'}), (c2:Company {id: 'comp_5'}) CREATE (c1)-[:OWNS {ownershipPercentage: 80.0}]->(c2)`);
    await session.run(`MATCH (c1:Company {id: 'comp_5'}), (c2:Company {id: 'comp_8'}) CREATE (c1)-[:OWNS {ownershipPercentage: 51.0}]->(c2)`);
    await session.run(`MATCH (p:Person {id: 'person_5'}), (c:Company {id: 'comp_3'}) CREATE (p)-[:OWNS {ownershipPercentage: 55.0}]->(c)`);
    await session.run(`MATCH (p:Person {id: 'person_6'}), (c:Company {id: 'comp_7'}) CREATE (p)-[:OWNS {ownershipPercentage: 100.0}]->(c)`);

    console.log('[seed] Database seeded successfully.');

    const countResult = await session.run(`
      MATCH (c:Company) WITH count(c) AS companies
      MATCH (p:Person) WITH companies, count(p) AS people
      MATCH (co:Country) WITH companies, people, count(co) AS countries
      MATCH (a:Address) WITH companies, people, countries, count(a) AS addresses
      MATCH ()-[r]->() RETURN companies, people, countries, addresses, count(r) AS relationships
    `);

    const record = countResult.records[0];
    console.log('[seed] Summary:');
    console.log(` - Companies: ${record.get('companies')}`);
    console.log(` - People: ${record.get('people')}`);
    console.log(` - Countries: ${record.get('countries')}`);
    console.log(` - Addresses: ${record.get('addresses')}`);
    console.log(` - Relationships: ${record.get('relationships')}`);

  } catch (error) {
    console.error('[seed] Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
