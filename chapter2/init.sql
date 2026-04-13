-- Schemas and seed data for all Chapter 2 demos.
-- Runs automatically when the Postgres container starts up.

-- 1. The LinkedIn profile, split across tables (the "shredding" problem)

CREATE TABLE users (
    user_id    SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    summary    TEXT
);

CREATE TABLE positions (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(user_id),
    job_title    TEXT,
    organization TEXT,
    start_year   INTEGER,
    end_year     INTEGER
);

CREATE TABLE education (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(user_id),
    school_name TEXT,
    start_year  INTEGER,
    end_year    INTEGER
);

INSERT INTO users (first_name, last_name, summary) VALUES
    ('Bill', 'Gates', 'Co-chair of the Bill & Melinda Gates Foundation. Active blogger.'),
    ('Satya', 'Nadella', 'CEO of Microsoft.');

INSERT INTO positions (user_id, job_title, organization) VALUES
    (1, 'Co-chair', 'Bill & Melinda Gates Foundation'),
    (1, 'Co-founder, Chairman', 'Microsoft'),
    (2, 'CEO', 'Microsoft'),
    (2, 'EVP, Cloud', 'Microsoft');

INSERT INTO education (user_id, school_name, start_year, end_year) VALUES
    (1, 'Harvard University', 1973, 1975),
    (1, 'Lakeside School, Seattle', NULL, NULL),
    (2, 'University of Wisconsin-Milwaukee', 1988, 1990);

-- 2. Same profile, but crammed into a single JSON column

CREATE TABLE users_doc (
    user_id SERIAL PRIMARY KEY,
    profile JSONB NOT NULL
);

INSERT INTO users_doc (profile) VALUES
('{
    "first_name": "Bill",
    "last_name": "Gates",
    "summary": "Co-chair of the Bill & Melinda Gates Foundation. Active blogger.",
    "positions": [
        {"job_title": "Co-chair", "organization": "Bill & Melinda Gates Foundation"},
        {"job_title": "Co-founder, Chairman", "organization": "Microsoft"}
    ],
    "education": [
        {"school_name": "Harvard University", "start": 1973, "end": 1975},
        {"school_name": "Lakeside School, Seattle"}
    ]
}'),
('{
    "first_name": "Satya",
    "last_name": "Nadella",
    "summary": "CEO of Microsoft.",
    "positions": [
        {"job_title": "CEO", "organization": "Microsoft"}
    ],
    "education": [
        {"school_name": "University of Wisconsin-Milwaukee", "start": 1988, "end": 1990}
    ]
}');

-- 3. Normalization demo: IDs pointing to a single source of truth

CREATE TABLE regions (
    region_id SERIAL PRIMARY KEY,
    name      TEXT NOT NULL,
    state     TEXT,
    country   TEXT
);

CREATE TABLE industries (
    industry_id SERIAL PRIMARY KEY,
    name        TEXT NOT NULL
);

CREATE TABLE users_normalized (
    user_id     SERIAL PRIMARY KEY,
    name        TEXT,
    region_id   INTEGER REFERENCES regions(region_id),
    industry_id INTEGER REFERENCES industries(industry_id)
);

INSERT INTO regions (name, state, country) VALUES
    ('Greater Seattle Area', 'Washington', 'US'),
    ('San Francisco Bay Area', 'California', 'US');

INSERT INTO industries (name) VALUES
    ('Philanthropy'),
    ('Technology');

INSERT INTO users_normalized (name, region_id, industry_id) VALUES
    ('Bill', 1, 1),
    ('Satya', 1, 2),
    ('Alice', 1, 1),
    ('Tim', 2, 2);

-- 4. Property graph stored in two relational tables (vertices + edges)

CREATE TABLE vertices (
    vertex_id  SERIAL PRIMARY KEY,
    properties JSONB NOT NULL
);

CREATE TABLE edges (
    edge_id     SERIAL PRIMARY KEY,
    tail_vertex INTEGER REFERENCES vertices(vertex_id),
    head_vertex INTEGER REFERENCES vertices(vertex_id),
    label       TEXT NOT NULL,
    properties  JSONB DEFAULT '{}'
);

CREATE INDEX edges_tails ON edges (tail_vertex);
CREATE INDEX edges_heads ON edges (head_vertex);

INSERT INTO vertices (vertex_id, properties) VALUES
    (1,  '{"type": "continent", "name": "North America"}'),
    (2,  '{"type": "country",   "name": "United States"}'),
    (3,  '{"type": "state",     "name": "Idaho"}'),
    (4,  '{"type": "continent", "name": "Europe"}'),
    (5,  '{"type": "country",   "name": "United Kingdom"}'),
    (6,  '{"type": "city",      "name": "London"}'),
    (7,  '{"type": "country",   "name": "France"}'),
    (8,  '{"type": "city",      "name": "Beaune"}');

INSERT INTO vertices (vertex_id, properties) VALUES
    (9,  '{"type": "person", "name": "Lucy"}'),
    (10, '{"type": "person", "name": "Alain"}');

-- where things are inside other things
INSERT INTO edges (tail_vertex, head_vertex, label) VALUES
    (2, 1, 'within'),
    (3, 2, 'within'),
    (5, 4, 'within'),
    (6, 5, 'within'),
    (7, 4, 'within'),
    (8, 7, 'within');

-- where people were born and where they live now
INSERT INTO edges (tail_vertex, head_vertex, label) VALUES
    (9,  3, 'born_in'),
    (9,  6, 'lives_in'),
    (10, 8, 'born_in'),
    (10, 6, 'lives_in');

-- 5. Marine biologist observations (for the MapReduce / aggregation demo)

CREATE TABLE observations (
    id                    SERIAL PRIMARY KEY,
    observation_timestamp TIMESTAMP NOT NULL,
    family                TEXT NOT NULL,
    species               TEXT NOT NULL,
    num_animals           INTEGER NOT NULL
);

INSERT INTO observations (observation_timestamp, family, species, num_animals) VALUES
    ('1995-12-25', 'Sharks', 'Carcharodon carcharias', 3),
    ('1995-12-12', 'Sharks', 'Carcharias taurus', 4),
    ('1996-01-05', 'Sharks', 'Carcharodon carcharias', 1),
    ('1995-12-20', 'Whales', 'Balaenoptera musculus', 2),
    ('1996-01-15', 'Sharks', 'Sphyrna mokarran', 5);
