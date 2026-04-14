// MapReduce vs SQL Aggregation
//
// How many sharks did we spot each month?
// Three ways to answer:
//   1. MapReduce (the hard way)
//   2. SQL GROUP BY (the clean way)
//   3. Pipeline style (the MongoDB-learned-its-lesson way)
//
// Run: node 04_mapreduce_vs_aggregation.js

import { query, close } from "./db.js";

const observations = [
	{
		timestamp: new Date("1995-12-25"),
		family: "Sharks",
		species: "Carcharodon carcharias",
		numAnimals: 3,
	},
	{
		timestamp: new Date("1995-12-12"),
		family: "Sharks",
		species: "Carcharias taurus",
		numAnimals: 4,
	},
	{
		timestamp: new Date("1996-01-05"),
		family: "Sharks",
		species: "Carcharodon carcharias",
		numAnimals: 1,
	},
	{
		timestamp: new Date("1995-12-20"),
		family: "Whales",
		species: "Balaenoptera musculus",
		numAnimals: 2,
	},
	{
		timestamp: new Date("1996-01-15"),
		family: "Sharks",
		species: "Sphyrna mokarran",
		numAnimals: 5,
	},
];

// two functions that have to work together perfectly. annoying.
console.log("=== MAPREDUCE (JS simulation) ===\n");

function mapFn(doc) {
	const year = doc.timestamp.getFullYear();
	const month = doc.timestamp.getMonth() + 1;
	return { key: `${year}-${month}`, value: doc.numAnimals };
}

function reduceFn(key, values) {
	return values.reduce((sum, v) => sum + v, 0);
}

const sharks = observations.filter((o) => o.family === "Sharks");
const mapped = sharks.map(mapFn);

const grouped = {};
for (const { key, value } of mapped) {
	if (!grouped[key]) grouped[key] = [];
	grouped[key].push(value);
}

const mapReduceResult = {};
for (const [key, values] of Object.entries(grouped)) {
	mapReduceResult[key] = reduceFn(key, values);
}

console.log(" ", mapReduceResult);

// let the DB handle it. three lines of SQL.
console.log("\n=== SQL AGGREGATION (declarative, on PostgreSQL) ===\n");

const rows = await query(`
  SELECT date_trunc('month', observation_timestamp) AS month,
         sum(num_animals) AS total
  FROM observations
  WHERE family = 'Sharks'
  GROUP BY month
  ORDER BY month
`);

for (const row of rows) {
	const label = row.month.toISOString().slice(0, 7);
	console.log(`  ${label}: ${row.total} sharks`);
}

// step-by-step transforms, no coordinated functions needed
console.log("\n=== PIPELINE STYLE (simulating MongoDB aggregate) ===\n");

const pipeline = observations
	.filter((o) => o.family === "Sharks")
	.reduce((acc, o) => {
		const key = `${o.timestamp.getFullYear()}-${o.timestamp.getMonth() + 1}`;
		acc[key] = (acc[key] || 0) + o.numAnimals;
		return acc;
	}, {});

for (const [month, total] of Object.entries(pipeline).sort()) {
	console.log(`  ${month}: ${total} sharks`);
}

console.log(`
  Three approaches, same answer.
  MapReduce: powerful but clunky (two coordinated functions).
  SQL: clean and declarative. The DB optimizes it for you.
  Pipeline: middle ground. Readable, step-by-step.
  MongoDB added the pipeline because MapReduce was too painful.
`);

await close();
