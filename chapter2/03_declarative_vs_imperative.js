// Declarative vs Imperative
//
// Three ways to filter sharks out of a list:
// a for loop, Array.filter, and SQL.
// Same result. Wildly different readability.
//
// Run: node 03_declarative_vs_imperative.js

import { query, close } from "./db.js";

const animals = [
	{ name: "Great White Shark", family: "Sharks" },
	{ name: "Tiger Shark", family: "Sharks" },
	{ name: "Blue Whale", family: "Whales" },
	{ name: "Humpback Whale", family: "Whales" },
	{ name: "Hammerhead Shark", family: "Sharks" },
];

// you spell out every step yourself
console.log("=== IMPERATIVE (loop + if) ===\n");

const sharksImperative = [];
for (let i = 0; i < animals.length; i++) {
	if (animals[i].family === "Sharks") {
		sharksImperative.push(animals[i]);
	}
}

for (const s of sharksImperative) console.log(`  ${s.name}`);

// you just say what you want
console.log("\n=== DECLARATIVE (filter) ===\n");

const sharksDeclarative = animals.filter((a) => a.family === "Sharks");

for (const s of sharksDeclarative) console.log(`  ${s.name}`);

// same idea, but the DB figures out the how
console.log("\n=== SQL (declarative, on PostgreSQL) ===\n");

const rows = await query(`
  SELECT family, species, num_animals
  FROM observations
  WHERE family = 'Sharks'
  ORDER BY observation_timestamp
`);

for (const row of rows) {
	console.log(`  ${row.species.padEnd(30)} | ${row.num_animals} spotted`);
}

console.log(`
  The SQL version doesn't say HOW to find sharks.
  No loops, no index lookups, no execution plan.
  The query optimizer handles all of that.
  That's the whole point of declarative languages.
`);

await close();
