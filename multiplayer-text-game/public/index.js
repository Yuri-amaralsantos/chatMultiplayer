const socket = io();

const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');
const roleBox = document.getElementById('roleBox');

// Display the assigned role
socket.on('assignRole', (role) => {
    roleBox.textContent = `${role}`;
});

// Update player slots when the server sends an update
socket.on('updateSlots', (slots) => {
    console.log('Current player slots:', slots);
    // Optionally, you can update the UI based on the slots
    // For example, highlight Player 1 and Player 2 in the UI
});

// Receive all messages from the server
socket.on('allMessages', (messages) => {
    messages.forEach(({ player_id, message }) => {
        addMessage(player_id, message);
    });
});


// Send a message to the server when the button is clicked
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('sendMessage', message);
        messageInput.value = ''; // Clear the input field
    }
});

// Display a message in the messages section
function addMessage(senderRole, text) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${senderRole}: ${text}`;
    messagesDiv.appendChild(messageDiv);
}

// Receive new messages from other players
socket.on('receiveMessage', ({ senderRole, message }) => {
    addMessage(senderRole, message);
});

