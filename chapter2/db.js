import pg from "pg";

const pool = new pg.Pool({
	host: "localhost",
	port: 5434,
	database: "chapter2",
	user: "ddia",
	password: "ddia",
});

export async function query(text, params) {
	const res = await pool.query(text, params);
	return res.rows;
}

export async function close() {
	await pool.end();
}
