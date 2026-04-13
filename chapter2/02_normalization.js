// Normalization: IDs vs duplicated strings
//
// Store "Greater Seattle Area" in every row, or store it once
// and point to it with an ID? One rename shows you why IDs win.
//
// Run: node 02_normalization.js

import { query, close } from "./db.js";

console.log("=== BEFORE: current region names ===\n");

const before = await query(`
  SELECT u.name, r.name AS region, i.name AS industry
  FROM users_normalized u
  JOIN regions r ON u.region_id = r.region_id
  JOIN industries i ON u.industry_id = i.industry_id
  ORDER BY u.user_id
`);

for (const row of before) {
	console.log(
		`  ${row.name.padEnd(10)} | ${row.region.padEnd(25)} | ${row.industry}`,
	);
}

// one row updated, every user sees the change
console.log(
	"\n=== Renaming 'Greater Seattle Area' -> 'Greater Seattle Metro' ===\n",
);

await query(
	"UPDATE regions SET name = 'Greater Seattle Metro' WHERE region_id = 1",
);

const after = await query(`
  SELECT u.name, r.name AS region
  FROM users_normalized u
  JOIN regions r ON u.region_id = r.region_id
  ORDER BY u.user_id
`);

for (const row of after) {
	console.log(`  ${row.name.padEnd(10)} | ${row.region}`);
}

console.log("\n  One UPDATE, all 3 Seattle users see the new name instantly.");
console.log(
	"  With duplicated strings you'd be running UPDATE ... WHERE region = 'Greater Seattle Area'",
);
console.log("  and praying nobody misspelled it.\n");

// this only works because region is a proper entity with structured fields
console.log("=== BONUS: find everyone in Washington state ===\n");

const washington = await query(`
  SELECT u.name, r.name AS region
  FROM users_normalized u
  JOIN regions r ON u.region_id = r.region_id
  WHERE r.state = 'Washington'
`);

for (const row of washington) {
	console.log(`  ${row.name.padEnd(10)} | ${row.region}`);
}

// put it back so you can rerun this
await query(
	"UPDATE regions SET name = 'Greater Seattle Area' WHERE region_id = 1",
);

await close();
