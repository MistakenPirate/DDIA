// Property Graph Model
//
// Two people, a bunch of locations, and the question:
// who was born in the US but lives in Europe?
// 4 lines of Cypher. ~25 lines of SQL. Same answer.
//
// Run: node 05_graph_model.js

import { close, query } from "./db.js";

// what's in the graph
console.log("=== GRAPH: vertices ===\n");

const vertices = await query(`
  SELECT vertex_id, properties->>'type' AS type, properties->>'name' AS name
  FROM vertices ORDER BY vertex_id
`);

for (const v of vertices) {
	console.log(
		`  [${String(v.vertex_id).padStart(2)}] ${v.type.padEnd(10)} ${v.name}`,
	);
}

// how they're connected
console.log("\n=== GRAPH: edges ===\n");

const edges = await query(`
  SELECT t.properties->>'name' AS from_name,
         e.label,
         h.properties->>'name' AS to_name
  FROM edges e
  JOIN vertices t ON e.tail_vertex = t.vertex_id
  JOIN vertices h ON e.head_vertex = h.vertex_id
  ORDER BY e.edge_id
`);

for (const e of edges) {
	console.log(
		`  ${e.from_name.padEnd(15)} --[${e.label.padEnd(8)}]--> ${e.to_name}`,
	);
}

// here's where SQL starts to sweat
console.log("\n=== QUERY: who emigrated from the US to Europe? ===\n");

const emigrants = await query(`
  WITH RECURSIVE
      in_usa(vertex_id) AS (
          SELECT vertex_id FROM vertices
          WHERE properties->>'name' = 'United States'
          UNION
          SELECT edges.tail_vertex FROM edges
          JOIN in_usa ON edges.head_vertex = in_usa.vertex_id
          WHERE edges.label = 'within'
      ),
      in_europe(vertex_id) AS (
          SELECT vertex_id FROM vertices
          WHERE properties->>'name' = 'Europe'
          UNION
          SELECT edges.tail_vertex FROM edges
          JOIN in_europe ON edges.head_vertex = in_europe.vertex_id
          WHERE edges.label = 'within'
      ),
      born_in_usa(vertex_id) AS (
          SELECT edges.tail_vertex FROM edges
          JOIN in_usa ON edges.head_vertex = in_usa.vertex_id
          WHERE edges.label = 'born_in'
      ),
      lives_in_europe(vertex_id) AS (
          SELECT edges.tail_vertex FROM edges
          JOIN in_europe ON edges.head_vertex = in_europe.vertex_id
          WHERE edges.label = 'lives_in'
      )
  SELECT vertices.properties->>'name' AS emigrant
  FROM vertices
  JOIN born_in_usa ON vertices.vertex_id = born_in_usa.vertex_id
  JOIN lives_in_europe ON vertices.vertex_id = lives_in_europe.vertex_id
`);

for (const row of emigrants) {
	console.log(`  ${row.emigrant}`);
}

console.log(`
  Found ${emigrants.length} emigrant(s).

  That was ~25 lines of recursive CTEs.
  In Cypher (Neo4j) it's just:

    MATCH
      (person) -[:BORN_IN]-> () -[:WITHIN*0..]-> (us:Location {name:'United States'}),
      (person) -[:LIVES_IN]-> () -[:WITHIN*0..]-> (eu:Location {name:'Europe'})
    RETURN person.name

  4 lines. Pick the right tool.
`);

await close();
