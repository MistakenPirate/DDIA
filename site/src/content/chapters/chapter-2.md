---
title: "Data Models and Query Languages"
chapter: 2
description: "Relational vs document vs graph models, and why query language design matters."
---

# Ch 2 - Data Models and Query Languages

Data models are probably the most important choice you make when building software. They shape how you *think* about the problem, not just how you store stuff.

Every app is a layer cake. Your app models real-world things as objects. You store those as JSON or tables or graphs. The DB stores those as bytes on disk. Hardware stores bytes as electrical signals. Each layer hides the mess below it. That's the whole game.

---

## Relational Model vs Document Model

SQL has been king since the mid-1980s. Edgar Codd proposed the relational model in 1970 and people thought it was too theoretical to actually work. Turns out it worked *really* well. 30+ years of dominance. Basically forever in tech.

Every few years something tries to kill it. Network model in the '70s, object databases in the '90s, XML databases in the 2000s. Lots of hype. None of them stuck.

### The Birth of NoSQL

NoSQL literally started as a Twitter hashtag for a meetup in 2009. The name is terrible. It doesn't mean "no SQL." It got backronymed into "Not Only SQL."

Why NoSQL took off:
- Need for **scale** beyond what a single relational DB handles easily
- **Open source** preference over expensive commercial DBs
- Specialized queries that relational doesn't do well
- Frustration with rigid schemas. People wanted more flexibility

The real answer? **Polyglot persistence.** Use the right DB for each job. Relational isn't going anywhere, but it's no longer the only option.

### The Object-Relational Mismatch

Most code is written in OOP languages. Relational DBs think in tables and rows. Translating between them is clunky. This gap is called the **impedance mismatch**.

ORMs (ActiveRecord, Hibernate) help, but they can't fully paper over the differences.

Take a LinkedIn profile. In relational, you need separate tables for positions, education, contact info, all linked by foreign keys back to the user. In JSON? One document with nested arrays. Way more natural for this kind of data.

JSON wins on **locality** too. One query fetches the whole profile instead of joining across five tables.

### Many-to-One and Many-to-Many

Why use IDs like `region_id` instead of storing "Greater Seattle Area" as a string? Because:
- **Consistent spelling** across all profiles
- **One place to update** if the name changes
- **Localization** - show different languages without touching every record
- **Better search** - the ID can encode that Seattle is in Washington

This is **normalization**: don't duplicate information that has a single source of truth. Use IDs that are meaningless to humans (so they never need to change) and let the meaningful names live in one place.

The catch? Normalization needs **joins**. Relational DBs do joins like breathing. Document DBs? Not so much. And here's the sneaky thing. Even if your app starts out as a nice join-free document tree, data gets more interconnected over time. Organizations become entities. Users reference other users. Suddenly you need many-to-many relationships, and the document model starts to feel limiting.

### Are Document Databases Repeating History?

This isn't a new debate. IBM's **IMS** (1968, built for the Apollo program, *still running today*) used a hierarchical model. Basically JSON before JSON existed. Worked great for trees. Terrible for many-to-many relationships.

Two solutions emerged:
- **Network model (CODASYL)** - records could have multiple parents, connected by pointer-like links. You navigated data by following "access paths." Sounds cool until you realize that changing your data model meant rewriting all your query code. Like navigating an n-dimensional maze.
- **Relational model** - just lay everything flat in tables. Let the query optimizer figure out how to find stuff. Want to query data a new way? Add an index. Done.

The relational model won because the **query optimizer** is a one-time investment that benefits everyone. CODASYL made each developer hand-optimize their own access paths. That doesn't scale.

Document databases today are NOT repeating CODASYL though. They use document references (basically foreign keys), not crazy pointer chains.

### Relational vs Document Today

**Document model is better when:**
- Your data is tree-shaped (one-to-many, self-contained documents)
- You load the whole document at once
- Your schema changes frequently

**Relational model is better when:**
- You have lots of many-to-many relationships
- You need joins everywhere
- Your data is highly interconnected

**For really interconnected data?** Graph models blow both of them away.

### Schema Flexibility

Document DBs are often called "schemaless." Misleading. The schema exists, it's just in your application code instead of the database.

Better terms:
- **Schema-on-read** (document) - write whatever, deal with structure when you read it. Like dynamic typing.
- **Schema-on-write** (relational) - DB enforces structure at write time. Like static typing.

Schema-on-read shines when your data is **heterogeneous**. Many different object types, or data from external systems you can't control. Schema-on-write shines when all records look the same and you want the DB to enforce it.

Migrating schemas in relational DBs isn't as painful as people think. `ALTER TABLE` is usually milliseconds. Except MySQL, which copies the entire table. Classic MySQL.

### Data Locality

Documents are stored as one continuous blob. If you always read the whole thing, that's fast. One disk seek instead of five joins. But if you only need a small piece of a large document, you're loading way more than necessary. And updates often mean rewriting the whole document.

Locality isn't exclusive to document DBs either. Google's **Spanner** does it in relational. **Cassandra** and **HBase** do it with column families.

### Convergence

The two models are stealing each other's best ideas. Relational DBs now support JSON natively (PostgreSQL, MySQL). Document DBs are adding join-like features (RethinkDB). The future is **hybrid**. And that's a good thing.

---

## Query Languages for Data

### Declarative vs Imperative

**Imperative** (most programming languages): you tell the computer exactly *how* to do something, step by step.

```js
function getSharks() {
  var sharks = [];
  for (var i = 0; i < animals.length; i++) {
    if (animals[i].family === "Sharks") {
      sharks.push(animals[i]);
    }
  }
  return sharks;
}
```

**Declarative** (SQL): you describe *what* you want. The DB figures out how to get it.

```sql
SELECT * FROM animals WHERE family = 'Sharks';
```

Why declarative wins:
- **Shorter and clearer** to read
- **Hides implementation details** - the DB can optimize behind the scenes without breaking your queries
- **Parallelizable** - you're not specifying execution order, so the DB can split work across cores

Same lesson shows up in web dev. CSS (declarative) vs manipulating DOM styles in JavaScript (imperative). CSS just *works*. The browser handles updates automatically. The imperative JS version is 10x longer and breaks when things change.

### MapReduce

MapReduce sits between fully declarative and fully imperative. You write `map` and `reduce` functions, and the framework runs them across your data. MongoDB supported this but it was honestly kind of annoying. Writing two carefully coordinated functions is harder than one SQL query.

MongoDB figured this out and added the **aggregation pipeline**. Basically SQL in a JSON trenchcoat:

```js
db.observations.aggregate([
  { $match: { family: "Sharks" } },
  { $group: {
    _id: { year: { $year: "$observationTimestamp" },
           month: { $month: "$observationTimestamp" } },
    totalAnimals: { $sum: "$numAnimals" }
  }}
]);
```

The moral: NoSQL systems keep accidentally reinventing SQL. Just in disguise.

---

## Graph-Like Data Models

When your data is full of many-to-many relationships, graphs are the natural choice. Vertices (nodes) + edges (relationships). That's it.

Examples everywhere:
- **Social graphs** - people connected to people
- **The web** - pages linked to pages
- **Road networks** - junctions connected by roads

The real power? Graphs can store **completely different types of things** in one datastore. Facebook's graph has people, locations, events, checkins, comments. All connected with different types of edges.

### Property Graphs

Each vertex has: an ID, properties (key-value pairs), and incoming/outgoing edges.
Each edge has: an ID, a label, properties, a head vertex, and a tail vertex.

You could model this in PostgreSQL with two tables:

```sql
CREATE TABLE vertices (vertex_id integer PRIMARY KEY, properties json);
CREATE TABLE edges (
  edge_id    integer PRIMARY KEY,
  tail_vertex integer REFERENCES vertices(vertex_id),
  head_vertex integer REFERENCES vertices(vertex_id),
  label       text,
  properties  json
);
```

Three things that make graphs awesome:
1. **Any vertex can connect to any other vertex.** No schema restrictions.
2. **Traverse in any direction** efficiently (index on both head and tail).
3. **Different edge labels** = different types of relationships in one clean graph.

### Cypher

Declarative query language for graph DBs. Created for Neo4j. Named after the Matrix character, not cryptography.

Finding people who emigrated from the US to Europe:

```
MATCH
  (person) -[:BORN_IN]-> () -[:WITHIN*0..]-> (us:Location {name:'United States'}),
  (person) -[:LIVES_IN]-> () -[:WITHIN*0..]-> (eu:Location {name:'Europe'})
RETURN person.name
```

That `[:WITHIN*0..]` is beautiful. "Follow WITHIN edges zero or more times." Like a regex `*` but for graph traversal.

The same query in SQL? **29 lines** of recursive CTEs. It works, but it's ugly. Different data models are designed for different use cases. Pick the right one.

### Triple-Stores and SPARQL

Triple-stores express everything as **(subject, predicate, object)** triples. Like `(Jim, likes, bananas)`.

- If the object is a value, it's a property: `(lucy, age, 33)`
- If the object is another vertex, it's an edge: `(lucy, marriedTo, alain)`

Same concept as property graphs, different vocabulary. **SPARQL** is the query language, and it's even more concise than Cypher:

```sparql
PREFIX : <urn:example:>
SELECT ?personName WHERE {
  ?person :name ?personName.
  ?person :bornIn / :within* / :name "United States".
  ?person :livesIn / :within* / :name "Europe".
}
```

The **semantic web** (RDF, machine-readable internet-wide data) was the original motivation. Overhyped and never really happened, but the underlying tech (triples as a data model) is genuinely useful.

### Graph DBs vs CODASYL (the old network model)

They look similar but they're fundamentally different:
- CODASYL had rigid schemas. Graphs don't.
- CODASYL required navigating specific access paths. Graphs let you jump to any vertex by ID or index.
- CODASYL was imperative. Graph DBs have declarative query languages.

### Datalog

The grandparent of graph query languages. Studied since the 1980s. Used by Datomic and Cascalog.

Instead of `(subject, predicate, object)`, you write `predicate(subject, object)`. You define **rules** that derive new facts from existing ones, and rules can call other rules recursively. Basically Prolog for databases.

Less convenient for quick one-off queries, but incredibly powerful for complex, reusable query logic.

---

## Code Snippets

Runnable code examples for this chapter: [code/chapter2](https://github.com/mistakenpirate/DDIA/tree/main/code/chapter2)

---

## TL;DR

- **Data models shape everything.** How you store it, how you query it, how you think about it.
- **Document DBs** are great for self-contained, tree-shaped data. Schema-on-read. Poor at joins.
- **Relational DBs** are great for interconnected data with lots of joins. Schema-on-write. Battle-tested for 30+ years.
- **Graph DBs** are great when everything connects to everything. Most natural for highly relational data (ironically).
- **Declarative > imperative** for queries. Let the optimizer do its job.
- The models are **converging**. Relational adds JSON, document adds joins. The future is hybrid.
- There's no one-size-fits-all. Pick the model that matches your data's actual shape.
