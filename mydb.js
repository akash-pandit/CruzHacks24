const sqlite3 = require('sqlite3').verbose();

// create a new database
const db = new sqlite3.Database('mydb.db');

// define a schema for the users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`);


//retrieves all users from the user table
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    } else {
      res.json(rows);
    }
  });
});