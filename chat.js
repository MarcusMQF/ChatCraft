const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');

// Function to create message elements
function createMessageElement(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    if (isUser) {
        messageDiv.textContent = content;
    } else {
        // Use innerHTML for bot messages to render formatted text
        messageDiv.innerHTML = formatAIResponse(content);
    }
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
                model: 'llama3.1:8b',
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

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            // Add bot response to chat with typing effect
            await this.addMessage(data.response, 'bot');
        } catch (error) {
            console.error('Error:', error);
            await this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }

    async addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        if (sender === 'bot') {
            // For bot messages, use the formatting
            messageDiv.innerHTML = '';
            this.messagesContainer.appendChild(messageDiv);
            await this.typeText(messageDiv, formatAIResponse(text));
        } else {
            // For user messages, show immediately
            messageDiv.textContent = text;
            this.messagesContainer.appendChild(messageDiv);
        }
        
        this.scrollToBottom();
    }

    async typeText(element, text) {
        const htmlContent = text;
        element.innerHTML = '';
        
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;
        
        for (const node of temp.childNodes) {
            const newElement = node.cloneNode(true);
            element.appendChild(newElement);
            
            if (node.textContent) {
                newElement.textContent = '';
                for (const char of node.textContent) {
                    newElement.textContent += char;
                    await new Promise(resolve => setTimeout(resolve, 20)); // Adjust speed here
                    this.scrollToBottom();
                }
            }
        }
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

function formatAIResponse(text) {
    // Handle bold text (**text**)
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert asterisk lists to bullet points with proper indentation
        .replace(/^\* (.*?)$/gm, '<div class="formatted-list">• $1</div>')
        // Convert paragraphs (double newlines)
        .replace(/\n\n/g, '</div><div class="formatted-paragraph">')
        // Convert single newlines
        .replace(/\n/g, '<br>');

    // Wrap in a div if not already wrapped
    if (!formatted.startsWith('<div')) {
        formatted = `<div class="formatted-paragraph">${formatted}</div>`;
    }

    return formatted;
} 