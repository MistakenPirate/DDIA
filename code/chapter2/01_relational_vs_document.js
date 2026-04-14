// Relational vs Document Model
//
// The classic LinkedIn profile problem. Relational needs 3 tables
// and JOINs. Document model? One JSON blob, one query. Done.
//
// Run: node 01_relational_vs_document.js

import { query, close } from "./db.js";

// 3 tables, 2 JOINs, just to load one profile
console.log("=== RELATIONAL MODEL (normalized, multi-table) ===\n");

const relational = await query(`
  SELECT u.first_name, u.last_name, u.summary,
         p.job_title, p.organization,
         e.school_name
  FROM users u
  LEFT JOIN positions p ON u.user_id = p.user_id
  LEFT JOIN education e ON u.user_id = e.user_id
  WHERE u.user_id = 1
`);

for (const row of relational) {
	console.log(
		`  ${row.first_name} ${row.last_name} | ${row.job_title} @ ${row.organization} | School: ${row.school_name}`,
	);
}

// one row, everything nested inside, no joins needed
console.log("\n=== DOCUMENT MODEL (single JSON column) ===\n");

const [{ profile }] = await query(
	"SELECT profile FROM users_doc WHERE user_id = 1",
);

console.log(`  Name: ${profile.first_name} ${profile.last_name}`);
console.log(`  Summary: ${profile.summary}`);
for (const pos of profile.positions) {
	console.log(`  Job: ${pos.job_title} @ ${pos.organization}`);
}
for (const edu of profile.education) {
	console.log(`  School: ${edu.school_name}`);
}

// the cool part: postgres lets you query inside JSON with SQL
console.log("\n=== CONVERGENCE: querying inside JSON with SQL ===\n");

const jsonQuery = await query(`
  SELECT profile->>'first_name' AS name,
         jsonb_array_elements(profile->'positions')->>'job_title' AS title
  FROM users_doc
  WHERE user_id = 1
`);

for (const row of jsonQuery) {
	console.log(`  ${row.name}: ${row.title}`);
}

await close();
