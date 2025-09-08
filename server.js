import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import routes from './routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const openaiApiKey = process.env.OPENAI_API_KEY;



app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));
app.use(routes);

app.get('/', (req, res) => res.sendFile(`${__dirname}/public/index.html`));
app.get('/favicon.ico', (req, res) => res.status(204));

// Story generation API endpoint (인트로, 엔딩 포함)
async function fetchFromOpenAI(messages) {
    const maxRetries = 5;
    const retryDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.choices[0].message.content.trim();
            } else if (response.status === 429) {
                console.warn(`429 Too Many Requests. 재시도 중... (${attempt + 1}/${maxRetries})`);
                await delay(retryDelay);
                continue;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error:", error);
            if (attempt === maxRetries - 1) {
                throw new Error('OpenAI API 요청 실패');
            }
            await delay(retryDelay);
        }
    }
}

// Story generation API endpoints
app.post('/api/generate-intro', async (req, res) => {
    const { characterName} = req.body;
    if (!characterName) {
        return res.status(400).send('모든 스토리 요소가 필요합니다.');
    }

    try {
        const prompt = 
        `주인공 이름: ${characterName} 으로 미래의 내가 내 앞에 나타났다, 나는 결국 타임머신을 개발하는데 성공하였다고 한다. 미래의 나는 타임머신 개발과 함께 나는 범죄집단의 타겟 대상이 되었고 도망칠 곳은 과거 밖에 없다고 한다. 더이상 미래가 없는 삶을 살게 될 수 밖에 없는 필연적인 삶을 알게 되면서도 타임머신을 개발해야 할지 고민을 시작으로하는 자연스러운 스토리 인트로를 150~250자 내외로 생성해 주세요.`;
        const intro = await fetchFromOpenAI([{ role: 'user', content: prompt }]);
        res.json({ result: intro });
    } catch (error) {
        console.error('Intro generation error:', error);
        res.status(500).json({ error: '인트로 생성 중 오류 발생' });
    }
});

app.post('/api/generate-story', async (req, res) => {
    const { fullStory, lastChoice } = req.body;
    if (!fullStory || !lastChoice) {
        return res.status(400).send('전체 스토리와 마지막 선택이 필요합니다.');
    }

    try {
        const prompt = `지금까지의 스토리: ${fullStory}\n선택지: ${lastChoice}\n이어지는 스토리만 150~250자 내외로 생성해 주세요. 이전에 몇번선택지를 골랐는지는 얘기 안 해줘도 되고 이에 대해 대답도 하지마.`;
        const story = await fetchFromOpenAI([{ role: 'user', content: prompt }]);
        res.json({ result: story });
    } catch (error) {
        console.error('Story continuation error:', error);
        res.status(500).json({ error: '스토리 생성 중 오류 발생' });
    }
});

app.post('/api/generate-ending', async (req, res) => {
    const { fullStory } = req.body;
    if (!fullStory) {
        return res.status(400).send('전체 스토리가 필요합니다.');
    }

    try {
        const prompt = `지금까지의 스토리: ${fullStory}\n결말을 150~250자 내외로 생성해 주세요. 이전에 몇번선택지를 골랐는지는 얘기 안해줘도되고 이에대해 대답도 하지마.`;
        const ending = await fetchFromOpenAI([{ role: 'user', content: prompt }]);
        res.json({ result: ending });
    } catch (error) {
        console.error('Ending generation error:', error);
        res.status(500).json({ error: '엔딩 생성 중 오류 발생' });
    }
});

// Choice generation API endpoint
app.post('/api/generate-choice', async (req, res) => {
    const { lastStory } = req.body;
    if (!lastStory) {
        return res.status(400).send('마지막 스토리가 필요합니다.');
    }

    try {
        const prompt = `지금까지의 스토리: ${lastStory}\n선택지를 각각 20자 이하로 4개 생성해 주세요.`;
        const choices = await fetchFromOpenAI([{ role: 'user', content: prompt }]);
        res.json({ result: choices });
    } catch (error) {
        console.error('Choice generation error:', error);
        res.status(500).json({ error: '선택지 생성 중 오류 발생' });
    }
});

// Title generation API endpoint
app.post('/api/generate-title', async (req, res) => {
    const story = req.body.story;
    if (!story) return res.status(400).send('스토리가 필요합니다.');

    const maxRetries = 5;
    const retryDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        { role: 'system', content: '너는 창의적인 제목을 생성하는 AI입니다.' },
                        { role: "user", content: `다음 스토리에 어울리는 제목을 만들어 주세요:\n\n${story}\n\n제목:` }
                    ]
                })
            });

            if (response.ok) {
                const data = await response.json();
                return res.json({ title: data.choices[0].message.content.trim() });
            } else if (response.status === 429) {
                console.warn(`429 Too Many Requests. 재시도 중... (${attempt + 1}/${maxRetries})`);
                await delay(retryDelay);
                continue;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error generating title:", error);
            if (attempt === maxRetries - 1) {
                return res.status(500).json({ error: '제목 생성 중 오류가 발생했습니다.' });
            }
            await delay(retryDelay);
        }
    }
});

// Board API endpoints
app.post("/api/submit-post", (req, res) => {
    const { title, content, author, password, timestamp } = req.body;

    if (!title || !content || !author || !password) {
        return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
    }

    try {
        const db = new sqlite3.Database("./public/stories.db");
        db.run(
            "INSERT INTO posts (title, content, author, password, timestamp) VALUES (?, ?, ?, ?, ?)",
            [title, content, author, password, timestamp],
            function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: "게시물 등록 중 오류 발생" });
                } else {
                    res.status(200).json({ success: true });
                }
            }
        );
        db.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "DB 연결 중 오류 발생" });
    }
});

app.get("/api/get-posts", (req, res) => {
    try {
        const db = new sqlite3.Database("./public/stories.db");
        db.all(
            "SELECT id, title, author, timestamp FROM posts ORDER BY timestamp DESC",
            [],
            (err, rows) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: "게시물 조회 중 오류 발생" });
                } else {
                    res.status(200).json(rows);
                }
            }
        );
        db.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "DB 연결 중 오류 발생" });
    }
});

app.get("/api/get-post/:id", (req, res) => {
    const postId = req.params.id;

    try {
        const db = new sqlite3.Database("./public/stories.db");
        db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "게시물 조회 중 오류 발생" });
            } else if (!row) {
                res.status(404).json({ error: "게시물이 존재하지 않습니다." });
            } else {
                res.status(200).json(row);
            }
        });
        db.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "DB 연결 중 오류 발생" });
    }
});

app.post("/api/delete-post/:id", (req, res) => {
    const postId = req.params.id;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: "비밀번호가 필요합니다." });
    }

    try {
        const db = new sqlite3.Database("./public/stories.db");
        db.get("SELECT password FROM posts WHERE id = ?", [postId], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "DB 오류 발생" });
            }

            if (!row) {
                return res.status(404).json({ success: false, message: "게시물을 찾을 수 없습니다." });
            }

            if (row.password !== password) {
                return res.status(403).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
            }

            db.run("DELETE FROM posts WHERE id = ?", [postId], (deleteErr) => {
                if (deleteErr) {
                    console.error(deleteErr);
                    return res.status(500).json({ success: false, message: "DB 삭제 오류가 발생했습니다." });
                }

                res.status(200).json({ success: true, message: "게시물이 삭제되었습니다." });
            });
        });

        db.close();
    } catch (error) {
        console.error("서버 오류 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Initialize database
const db = new sqlite3.Database("./public/stories.db");
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            password TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    `);
});
db.close();

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 http://0.0.0.0:${PORT}에서 실행 중입니다.`);
});
