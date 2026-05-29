const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB (set MONGO_URI in .env for Atlas/local mongod; leave empty for embedded DB — no Docker)
let mongoUri = process.env.MONGO_URI || '';
let memoryServer = null;
let client;
let db;
let routesRegistered = false;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

function setupSession() {
  app.use(session({
    secret: process.env.SECRET_KEY || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUri }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: 'lax'
    }
  }));
}

// IST timezone helper
function getISTTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

// Auth middleware
function loginRequired(req, res, next) {
  if (!req.session.username) {
    return res.status(401).json({ error: 'Please log in to access this page.' });
  }
  next();
}

// Email transporter
let transporter = null;
if (process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });
}

// Hugging Face API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HUGGINGFACE_QA_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-large';

// ========== AI / Quiz Generation ==========

async function generateFreeResponse(storyText) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY || '';
    if (!apiKey) return generateSmartFallback(storyText);

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // Step 1: Generate summary
    let summary = '';
    try {
      const summaryRes = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: storyText,
          parameters: { max_length: 150, min_length: 30, do_sample: false }
        }),
        signal: AbortSignal.timeout(30000)
      });
      if (summaryRes.ok) {
        const result = await summaryRes.json();
        if (Array.isArray(result) && result.length > 0) summary = result[0].summary_text || '';
        else if (result && typeof result === 'object') summary = result.summary_text || '';
      }
    } catch (e) { console.error('Summary generation error:', e.message); }

    // Step 2: Generate quiz questions
    const quizPrompt = `Based on this story, create 5 multiple choice questions with 4 options each.\n\nStory: ${storyText.slice(0, 1500)}\n\nGenerate questions that test comprehension of:\n1. Main characters and their roles\n2. Key plot events\n3. Setting and time period\n4. Central conflict or problem\n5. Theme or moral of the story\n\nFormat each question with options A, B, C, D and indicate the correct answer.`;

    let quizQuestions = [];
    try {
      const quizRes = await fetch(HUGGINGFACE_QA_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: quizPrompt,
          parameters: { max_length: 500, temperature: 0.7, top_p: 0.9 }
        }),
        signal: AbortSignal.timeout(30000)
      });
      if (quizRes.ok) {
        const result = await quizRes.json();
        let quizText = '';
        if (Array.isArray(result) && result.length > 0) quizText = result[0].generated_text || '';
        else if (result && typeof result === 'object') quizText = result.generated_text || '';
        if (quizText) quizQuestions = parseQuizFromText(quizText, storyText);
      }
    } catch (e) { console.error('Quiz generation error:', e.message); }

    if (!summary || quizQuestions.length < 5) return generateSmartFallback(storyText);

    const quizFormatted = formatQuizQuestions(quizQuestions);
    return `SUMMARY:\n${summary}\n\n${quizFormatted}`;
  } catch (e) {
    console.error('Error in generateFreeResponse:', e.message);
    return generateSmartFallback(storyText);
  }
}

function generateSmartFallback(storyText) {
  const sentences = storyText.split('.').map(s => s.trim()).filter(Boolean);
  const words = storyText.split(/\s+/);
  const lowerText = storyText.toLowerCase();

  // Summary
  let summary;
  if (sentences.length >= 3) {
    const parts = [sentences[0]];
    const actionWords = ['went', 'found', 'discovered', 'met', 'saw', 'heard', 'felt', 'took', 'gave', 'made', 'came', 'left', 'arrived', 'decided', 'realized', 'learned'];
    for (const sent of sentences.slice(1, -1)) {
      if (actionWords.some(w => sent.toLowerCase().includes(w))) { parts.push(sent); break; }
    }
    if (!parts.includes(sentences[sentences.length - 1])) parts.push(sentences[sentences.length - 1]);
    summary = parts.join('. ') + '.';
  } else {
    summary = storyText;
  }

  // Extract names
  const commonWords = new Set(['The','She','He','They','It','We','I','You','One','Once','This','That','There','These','Those','Throughout','In','At','On','By','For','With','But','And','Or','So','If','When','Where','Why','How','What','Who','Which','Every','Some','Many','Few','All','Any','After','Before','During','While','Since','Until','Curious','Suddenly','Finally','Eventually','Meanwhile','However','Therefore','Furthermore','Moreover','Nevertheless','Nonetheless','Otherwise','Instead','Indeed','Perhaps','Maybe','Certainly','Definitely','Probably','Possibly','Usually','Often','Sometimes','Always','Never','Just','Only','Even','Still','Already','Also','Too','Either','Neither','Both','Each','Every','Another','Other','Such','Rather','Quite','Very','Really','Actually','Basically','Generally','Specifically','Particularly','Especially']);
  const potentialNames = [];
  for (const word of words) {
    const cleaned = word.replace(/[.,!?;:"'\-]/g, '');
    if (cleaned && cleaned[0] === cleaned[0].toUpperCase() && cleaned[0] !== cleaned[0].toLowerCase() && cleaned.length > 2 && !commonWords.has(cleaned)) {
      potentialNames.push(cleaned);
    }
  }
  const uniqueNames = [...new Set(potentialNames)].slice(0, 10);

  // Extract locations
  const locationIndicators = ['in', 'at', 'to', 'from', 'near', 'beside', 'under', 'over', 'through', 'across', 'into', 'onto'];
  const locations = [];
  const wordsLower = words.map(w => w.toLowerCase());
  for (let i = 0; i < wordsLower.length; i++) {
    if (locationIndicators.includes(wordsLower[i]) && i + 1 < words.length) {
      const next = words[i + 1].replace(/[.,!?;:]/g, '');
      if (next && next[0] === next[0].toUpperCase() && next[0] !== next[0].toLowerCase()) locations.push(next);
    }
  }

  // Extract objects
  const objects = [];
  const objectPatterns = ['a', 'an', 'the'];
  for (let i = 0; i < wordsLower.length; i++) {
    if (objectPatterns.includes(wordsLower[i]) && i + 1 < words.length) {
      const next = words[i + 1].replace(/[.,!?;:]/g, '');
      if (next && next[0] !== next[0].toUpperCase() && next.length > 3) objects.push(next.toLowerCase());
    }
  }
  const uniqueObjects = [...new Set(objects)].slice(0, 10);

  const hasDialogue = storyText.includes('"') || storyText.includes("'") || lowerText.includes('said') || lowerText.includes('asked') || lowerText.includes('replied');
  const timeWords = ['morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year', 'yesterday', 'today', 'tomorrow', 'once', 'then', 'now', 'later', 'before', 'after'];
  const timeRefs = timeWords.filter(w => lowerText.includes(w));
  const emotionWords = ['happy', 'sad', 'angry', 'scared', 'excited', 'worried', 'surprised', 'confused', 'proud', 'disappointed', 'loved', 'hated', 'feared', 'hoped', 'wished'];
  const emotionsFound = emotionWords.filter(w => lowerText.includes(w));

  // Build question pool
  const questions = [];

  if (uniqueNames.length >= 2) {
    const others = uniqueNames.slice(1, 4);
    questions.push({ q: 'Who is the main character in this story?', options: [uniqueNames[0], others[0] || 'John', others[1] || 'Mary', 'The narrator'], correct: 'A' });
    if (uniqueNames.length >= 3) {
      questions.push({ q: `Which character appears after ${uniqueNames[0]} in the story?`, options: [uniqueNames[1], uniqueNames[2] || 'Nobody', uniqueNames[0], 'An unnamed character'], correct: 'A' });
    }
  }
  if (locations.length) questions.push({ q: 'Where does part of this story take place?', options: [locations[0], 'In a city', 'In space', 'Underwater'], correct: 'A' });
  if (uniqueObjects.length) questions.push({ q: 'What object is mentioned in the story?', options: [uniqueObjects[0], 'a sword', 'a map', 'a key'], correct: 'A' });

  const actionCheck = ['found', 'discovered', 'met', 'saw', 'went', 'came', 'took', 'gave', 'made', 'ran', 'jumped', 'flew', 'fell', 'climbed', 'opened', 'closed', 'broke', 'fixed', 'helped', 'saved', 'fought', 'won', 'lost', 'died', 'lived', 'grew', 'changed', 'became', 'turned', 'returned'];
  const actionsInStory = actionCheck.filter(v => lowerText.includes(v));
  if (actionsInStory.length) questions.push({ q: 'What action occurs in the story?', options: [`Someone ${actionsInStory[0]}`, 'Someone sleeps', 'Someone dances', 'Someone sings'], correct: 'A' });
  if (timeRefs.length) questions.push({ q: 'When does this story take place?', options: [`During the ${timeRefs[0]}`, 'In the future', 'In ancient times', 'Time is not specified'], correct: 'A' });
  if (emotionsFound.length) questions.push({ q: 'What emotion is expressed in the story?', options: [emotionsFound[0].charAt(0).toUpperCase() + emotionsFound[0].slice(1), 'Boredom', 'Jealousy', 'No emotions mentioned'], correct: 'A' });

  questions.push({ q: 'How does the story begin?', options: [sentences[0].length > 50 ? sentences[0].slice(0, 50) + '...' : sentences[0], 'With a battle scene', 'With a description of the weather', 'With dialogue'], correct: 'A' });
  if (sentences.length > 1) questions.push({ q: 'How does the story end?', options: [sentences[sentences.length - 1].length > 50 ? sentences[sentences.length - 1].slice(0, 50) + '...' : sentences[sentences.length - 1], 'With everyone living happily ever after', 'With a cliffhanger', 'With a moral lesson'], correct: 'A' });
  if (hasDialogue) questions.push({ q: 'What do characters do in this story?', options: ['They speak to each other', 'They remain silent', 'They only think', 'They only write letters'], correct: 'A' });
  if (lowerText.includes('learn') || lowerText.includes('lesson') || lowerText.includes('realize')) questions.push({ q: 'What type of story is this?', options: ['A story with a lesson or moral', 'A pure action story', 'A romance', 'A mystery'], correct: 'A' });
  if (lowerText.includes('but') || lowerText.includes('however') || lowerText.includes('although')) questions.push({ q: 'What kind of conflict or challenge appears in the story?', options: ['A problem that needs to be overcome', 'Everything goes smoothly', 'No challenges mentioned', 'Multiple unsolved problems'], correct: 'A' });

  const descriptiveWords = ['beautiful', 'ugly', 'big', 'small', 'tall', 'short', 'dark', 'bright', 'mysterious', 'strange', 'magical', 'ordinary', 'special', 'dangerous', 'safe'];
  const foundDescriptive = descriptiveWords.filter(w => lowerText.includes(w));
  if (foundDescriptive.length) questions.push({ q: 'How is something described in the story?', options: [foundDescriptive[0].charAt(0).toUpperCase() + foundDescriptive[0].slice(1), 'Boring', 'Normal', 'Not described'], correct: 'A' });

  const travelWords = ['went', 'traveled', 'journeyed', 'walked', 'ran', 'flew', 'drove', 'sailed', 'arrived', 'departed', 'left', 'came'];
  const travelFound = travelWords.filter(w => lowerText.includes(w));
  if (travelFound.length) questions.push({ q: 'What kind of movement happens in the story?', options: [`Someone ${travelFound[0]}`, 'Everyone stays in one place', 'Only thoughts move', 'No movement occurs'], correct: 'A' });

  // Shuffle and select 5
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  const selected = questions.slice(0, 5);

  // Fill up to 5 if needed
  while (selected.length < 5) {
    const important = words.filter(w => w.length > 5 && w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase());
    if (important.length && selected.length < 5) {
      selected.push({ q: 'Which word appears in the story?', options: [important[0], 'Elephant', 'Computer', 'Spaceship'], correct: 'A' });
    }
    if (selected.length < 5) {
      selected.push({ q: 'What is this story NOT about?', options: ['Aliens from Mars', uniqueNames[0] || 'A character', uniqueObjects[0] || 'An event', 'The events described'], correct: 'A' });
    }
    if (selected.length < 5) {
      let setting = 'specific location';
      if (lowerText.includes('forest') || lowerText.includes('tree')) setting = 'nature';
      else if (lowerText.includes('city') || lowerText.includes('building') || lowerText.includes('street')) setting = 'urban area';
      else if (lowerText.includes('house') || lowerText.includes('home') || lowerText.includes('room')) setting = 'indoor location';
      selected.push({ q: 'Where might this story take place?', options: [`In a ${setting}`, 'On the moon', 'Under the ocean', 'In outer space'], correct: 'A' });
    }
    if (selected.length < 5) {
      selected.push({ q: 'What is the purpose of this story?', options: ['To tell a story', 'To sell a product', 'To provide instructions', 'To list facts'], correct: 'A' });
    }
  }

  // Format with shuffled options
  let quiz = 'QUIZ:\n';
  for (let i = 0; i < selected.length; i++) {
    const q = selected[i];
    quiz += `${i + 1}. ${q.q}\n`;
    const opts = q.options.slice(0, 4);
    while (opts.length < 4) opts.push('Not applicable');
    const correctAnswer = opts[0];

    // Shuffle
    for (let k = opts.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [opts[k], opts[j]] = [opts[j], opts[k]];
    }
    const correctIndex = opts.indexOf(correctAnswer);
    const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];
    const letters = ['A', 'B', 'C', 'D'];
    for (let j = 0; j < 4; j++) quiz += `   ${letters[j]}) ${opts[j]}\n`;
    quiz += `   Correct: ${correctLetter}\n\n`;
  }

  return `SUMMARY:\n${summary}\n\n${quiz.trimEnd()}`;
}

function parseQuizFromText(quizText, storyText) {
  const questions = [];
  const lines = quizText.split('\n');
  let current = {};

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line[0] >= '0' && line[0] <= '9' && line.includes('.')) {
      if (current.question) questions.push(current);
      current = { question: line, options: [], correct: 'A' };
    } else if (line.match(/^[A-D]\)/)) {
      (current.options || []).push(line);
    } else if (line.toLowerCase().includes('correct') || line.toLowerCase().includes('answer')) {
      for (const c of ['A', 'B', 'C', 'D']) {
        if (line.includes(c)) { current.correct = c; break; }
      }
    }
  }
  if (current.question) questions.push(current);

  while (questions.length < 5) {
    const bank = [
      { question: `${questions.length + 1}. What is the main theme of this story?`, options: ['A) Adventure and discovery', 'B) Love and relationships', 'C) Conflict and resolution', 'D) Growth and learning'], correct: 'C' },
      { question: `${questions.length + 1}. What narrative technique is used in this story?`, options: ['A) Flashback', 'B) Linear progression', 'C) Multiple perspectives', 'D) Stream of consciousness'], correct: 'B' },
      { question: `${questions.length + 1}. What is the story's primary conflict?`, options: ['A) Person vs. Person', 'B) Person vs. Nature', 'C) Person vs. Self', 'D) Person vs. Society'], correct: 'A' }
    ];
    questions.push(bank[questions.length % bank.length]);
  }
  return questions.slice(0, 5);
}

function formatQuizQuestions(questions) {
  let quiz = 'QUIZ:\n';
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    quiz += `${q.question || `${i + 1}. Question ${i + 1}`}\n`;
    for (const opt of (q.options || [])) quiz += `   ${opt}\n`;
    quiz += `   Correct: ${q.correct || 'A'}\n\n`;
  }
  return quiz.trimEnd();
}

// ========== ROUTES ==========

function registerRoutes() {
  if (routesRegistered) return;
  routesRegistered = true;

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth: check session
app.get('/api/auth/me', (req, res) => {
  if (req.session.username) {
    return res.json({ username: req.session.username });
  }
  res.json({ username: null });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

    const existing = await db.collection('users').findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    await db.collection('users').insertOne({ username, password: hashed, created_at: getISTTime() });
    res.json({ message: 'Registration successful! Please log in.' });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const user = await db.collection('users').findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.username = username;
    res.json({ message: 'Logged in successfully!', username });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully.' });
});

// Generate quiz
app.post('/api/generate', loginRequired, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No input received.' });

    const result = await generateFreeResponse(text);

    const quizResult = await db.collection('quiz_results').insertOne({
      username: req.session.username,
      story: text,
      summary: result,
      score: null,
      date: getISTTime()
    });

    res.json({ result, quiz_id: quizResult.insertedId.toString() });
  } catch (e) {
    console.error('Generate error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Save score
app.post('/api/save_score', loginRequired, async (req, res) => {
  try {
    const { score, quiz_id } = req.body;
    if (score == null || !quiz_id) return res.status(400).json({ error: 'Missing score or quiz_id.' });

    await db.collection('quiz_results').updateOne(
      { _id: new ObjectId(quiz_id), username: req.session.username },
      { $set: { score } }
    );
    res.json({ success: true });
  } catch (e) {
    console.error('Save score error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Profile
app.get('/api/profile', loginRequired, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { username: req.session.username },
      { projection: { _id: 0, username: 1, created_at: 1 } }
    );
    const quizResults = await db.collection('quiz_results')
      .find({ username: req.session.username })
      .sort({ date: -1 })
      .toArray();

    quizResults.forEach(r => { r._id = r._id.toString(); });
    res.json({ user, quizResults });
  } catch (e) {
    console.error('Profile error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Users list
app.get('/api/users', loginRequired, async (req, res) => {
  try {
    const users = await db.collection('users')
      .find({}, { projection: { _id: 0, username: 1 } })
      .toArray();
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Contact submit
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Please fill in all required fields.' });

    await db.collection('contact_messages').insertOne({
      name, email, subject, message, date: getISTTime()
    });

    if (transporter) {
      try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USERNAME;
        await transporter.sendMail({
          from: process.env.MAIL_DEFAULT_SENDER || process.env.MAIL_USERNAME,
          to: adminEmail,
          subject: `New Contact Form Submission: ${subject}`,
          html: `<h3>New Contact Form Submission</h3><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message}</p>`
        });
        await transporter.sendMail({
          from: process.env.MAIL_DEFAULT_SENDER || process.env.MAIL_USERNAME,
          to: email,
          subject: 'Thank you for contacting Story Quiz',
          html: `<h3>Thank you for reaching out, ${name}!</h3><p>We have received your message and will get back to you soon.</p><p><strong>Your message:</strong></p><p>${message}</p><hr><p>Best regards,<br>Story Quiz Team</p>`
        });
      } catch (e) { console.error('Email sending failed:', e.message); }
    }

    res.json({ message: 'Thank you for your message! We will get back to you soon.' });
  } catch (e) {
    console.error('Contact error:', e);
    res.status(500).json({ error: 'Server error.' });
  }
});

}

// Start server
async function start() {
  try {
    if (!mongoUri) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log('Using embedded MongoDB for local dev (no Docker, no mongod install).');
      console.log('Data is cleared when the server stops. Set MONGO_URI in .env for a permanent database.');
    }

    setupSession();
    registerRoutes();

    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    console.log('MongoDB connected successfully');

    // Create test user in development
    if (process.env.NODE_ENV !== 'production') {
      const existing = await db.collection('users').findOne({ username: 'testuser' });
      if (!existing) {
        const hashed = await bcrypt.hash('testpass', 10);
        await db.collection('users').insertOne({ username: 'testuser', password: hashed });
        console.log('Test user created');
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
}

start();
