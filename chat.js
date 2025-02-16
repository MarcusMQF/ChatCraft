const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');

// Function to create message elements
function createMessageElement(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = content;
    return messageDiv;
}

// Function to call Ollama API
async function callOllama(prompt) {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-r1:7b',
                prompt: prompt,
                stream: false
            })
        });

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        return 'Sorry, there was an error processing your request.';
    }
}

// Handle send button click
async function handleSend() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    messagesContainer.appendChild(createMessageElement(message, true));
    chatInput.value = '';

    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message loading';
    loadingDiv.textContent = 'Thinking...';
    messagesContainer.appendChild(loadingDiv);

    // Get response from Ollama
    const response = await callOllama(message);
    
    // Remove loading indicator and add bot response
    messagesContainer.removeChild(loadingDiv);
    messagesContainer.appendChild(createMessageElement(response, false));
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Event listeners
sendButton.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

class ChatBot {
    constructor() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response to chat
            this.addMessage(data.response, 'bot');
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.id = 'typingIndicator';
        indicator.textContent = '...';
        this.messagesContainer.appendChild(indicator);
        indicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chat bot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
}); 