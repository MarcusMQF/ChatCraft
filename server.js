import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const response = await fetch(OLLAMA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-r1:7b',
                prompt: message,
                stream: false
            })
        });

        const data = await response.json();
        res.json({ response: data.response });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 