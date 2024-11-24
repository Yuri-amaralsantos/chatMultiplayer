const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const database = require("./database"); // Import the database module

// Set up Express and Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Player slots array (2 slots, both initially null)
let playerSlots = [null, null]; // Store player roles ("Player 1" or "Player 2")

// Serve static files (HTML, CSS, JS)
app.use(express.static("public"));

// Create the database table when the server starts
database.createTable();

// Handle new player connections
io.on("connection", (socket) => {
  // Find the first available slot (null)
  const availableSlotIndex = playerSlots.findIndex((slot) => slot === null);

  if (availableSlotIndex === -1) {
    // If no slots are available, disconnect the player
    socket.emit("serverFull", "The server is full. Please try again later.");
    socket.disconnect();
    return;
  }

  // Assign the player to the available slot
  const playerRole = availableSlotIndex === 0 ? "Player 1" : "Player 2";
  playerSlots[availableSlotIndex] = playerRole;

  console.log(`${playerRole} connected:`, socket.id);

  // Send the role to the new player
  socket.emit("assignRole", playerRole);

  // Retrieve all messages from the database when a new player connects
  database.getAllMessages((err, messages) => {
    if (err) {
      console.error("Error fetching messages:", err);
    } else {
      // Map the messages to use 'senderRole' for consistency
      const formattedMessages = messages.map(({ player_id, message }) => ({
        player_id,
        message,
      }));
      socket.emit("allMessages", formattedMessages);
    }
  });

  // Handle receiving messages from a player
  socket.on("sendMessage", (message) => {
    if (!playerRole) {
      console.error("Player role is undefined for message:", message);
      return;
    }

    console.log("Received message from:", playerRole, message);

    database.insertMessage(playerRole, message, (err, messageId) => {
      if (err) {
        console.error("Error saving message:", err);
      } else {
        // Broadcast the new message to all players
        io.emit("receiveMessage", { senderRole: playerRole, message });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`${playerRole} disconnected:`, socket.id);

    // Find the slot index of the disconnected player and set it to null
    const playerIndex = playerSlots.findIndex((slot) => slot === playerRole);
    if (playerIndex !== -1) {
      playerSlots[playerIndex] = null;
    }

    // Broadcast the updated player slots to the remaining players
    io.emit("updateSlots", playerSlots);
  });
});

// Listen for server stop event to disconnect all clients
process.on("SIGINT", () => {
  console.log("Server is stopping. Disconnecting all users...");
  io.emit(
    "serverShutDown",
    "The server is shutting down. Please try again later."
  );
  io.close(() => {
    console.log("All connections closed.");
    server.close(() => {
      console.log("Server has stopped.");
      process.exit(0); // Exit the process after stopping the server
    });
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
