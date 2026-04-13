// Schema-on-Read vs Schema-on-Write
//
// You need to split "name" into "first_name" and "last_name".
// Document DB: just start writing the new format, handle old docs in code.
// Relational DB: ALTER TABLE, UPDATE, done.
// Neither is wrong. Depends on your situation.
//
// Run: node 06_schema_on_read_vs_write.js

import { query, close } from "./db.js";

// old docs have "name", new docs have "first_name" + "last_name"
// your code just deals with both
console.log("=== SCHEMA-ON-READ (no migration needed) ===\n");

const docs = [
	{ user_id: 1, name: "Bill Gates", region: "Seattle" },
	{ user_id: 2, name: "Satya Nadella", region: "Seattle" },
	{ user_id: 3, first_name: "Tim", last_name: "Cook", region: "Cupertino" },
];

function getFirstName(user) {
	if (user.first_name) return user.first_name;
	if (user.name) return user.name.split(" ")[0];
	return null;
}

for (const user of docs) {
	console.log(`  User ${user.user_id}: ${getFirstName(user)}`);
}

console.log("\n  No migration. No downtime. Old docs and new docs coexist.");

// the relational way: change the table, backfill the data
console.log("\n=== SCHEMA-ON-WRITE (ALTER TABLE migration) ===\n");

await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT");
await query("UPDATE users SET full_name = first_name || ' ' || last_name");

const migrated = await query(
	"SELECT user_id, first_name, last_name, full_name FROM users",
);

for (const row of migrated) {
	console.log(
		`  User ${row.user_id}: ${row.first_name} ${row.last_name} (full: ${row.full_name})`,
	);
}

console.log(`
  ALTER TABLE: usually milliseconds. (Except MySQL - copies the entire table.)
  UPDATE on millions of rows: slow on any DB.

  Schema-on-read:  flexible, handles messy/heterogeneous data.
  Schema-on-write: strict, catches bad data before it's stored.

  Neither is universally better. Depends on your data.
`);

await close();
