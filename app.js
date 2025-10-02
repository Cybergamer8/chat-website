// Get DOM elements
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Array to store messages
let messages = [];

// Function to add a message
function addMessage(text) {
    if (text.trim() === '') return;
    
    const message = {
        text: text,
        time: new Date().toLocaleTimeString()
    };
    
    messages.push(message);
    displayMessage(message);
    saveMessages();
}

// Function to display a message
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div>${message.text}</div>
        <div class="message-time">${message.time}</div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to save messages to localStorage
function saveMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
}

// Function to load messages from localStorage
function loadMessages() {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
        messages = JSON.parse(savedMessages);
        messages.forEach(message => displayMessage(message));
    }
}

// Send message on button click
sendButton.addEventListener('click', () => {
    const text = messageInput.value;
    addMessage(text);
    messageInput.value = '';
    messageInput.focus();
});

// Send message on Enter key press
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const text = messageInput.value;
        addMessage(text);
        messageInput.value = '';
    }
});

// Load messages when page loads
window.addEventListener('load', () => {
    loadMessages();
    messageInput.focus();
    
    // Display welcome message if no messages
    if (messages.length === 0) {
        addMessage('Welcome to the chat! Start messaging...');
    }
});
