const sqlite3 = require('sqlite3').verbose();

// Set up the SQLite database connection
const db = new sqlite3.Database('./game.db', (err) => {
  if (err) {
    console.error('Error opening database: ' + err.message);
  }
});

// Create the messages table if it doesn't exist
const createTable = () => {
  db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, player_id TEXT, message TEXT)', (err) => {
    if (err) {
      console.error('Error creating table:', err);
    }
  });
};

// Function to insert a message into the database
const insertMessage = (playerId, message, callback) => {
  db.run('INSERT INTO messages (player_id, message) VALUES (?, ?)', [playerId, message], function (err) {
    if (err) {
      console.error('Error inserting message:', err);
      callback(err);
    } else {
      callback(null, this.lastID);
    }
  });
};

// Function to retrieve all messages from the database
const getAllMessages = (callback) => {
  db.all('SELECT player_id, message FROM messages ORDER BY id ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching messages:', err);
      callback(err);
    } else {
      callback(null, rows);
    }
  });
};

// Export the functions
module.exports = {
  createTable,
  insertMessage,
  getAllMessages
};
