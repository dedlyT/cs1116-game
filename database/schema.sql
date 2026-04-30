DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
) WITHOUT ROWID;

DROP TABLE IF EXISTS runs;
CREATE TABLE runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    unix INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    levels_traversed INTEGER NOT NULL,

    FOREIGN KEY (username) REFERENCES accounts(username) ON DELETE CASCADE
);