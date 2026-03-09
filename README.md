# Head Tilting Quiz Game 🎮

Welcome to the **Head Tilting Quiz Game**! This is a fun, interactive game designed for classrooms or presentations where participants answer questions by physically tilting their heads left or right in front of a webcam.

The game runs entirely in your web browser—no installation, databases, or accounts needed!

---

## 🚀 Quick Start Guide

### How to Run the Game (For Non-Developers)

Since the game requires modern web features (like webcam access), you need to "serve" it over a local server. If someone sent you this folder, here is the easiest way to run it:

1. **Install Node.js (One-time setup)**
   - Go to [nodejs.org](https://nodejs.org/) and download the "LTS" (Long Term Support) version.
   - Install it using the default settings.

2. **Open the Project Folder**
   - Open your terminal or command prompt (on Windows, search for `cmd` or `PowerShell`).
   - Navigate to this game folder. (e.g., `cd path/to/head-titling-game`)

3. **Install and Start (First time only)**
   - Type the following command and press Enter:
     ```bash
     npm install
     ```
   - This downloads the necessary pieces for the game to run. **You only need to do this once!**

4. **Play the Game!**
   - Type the following command and press Enter:
     ```bash
     npm run dev
     ```
   - You will see a web link appear in the console (usually `http://localhost:5173/`).
   - Hold `Ctrl` (or `Cmd` on Mac) and click that link, or copy and paste it into your web browser (Chrome or Edge recommended).

---

## 👩‍🏫 Teacher / Host Guide

### 1. Create Your Quiz
When you open the page, you'll see the **Setup Screen**.
- Choose how many questions you want to ask.
- Click **"Generate Q&A Fields"**.
- For each question:
  - Enter the **Question Text**.
  - Enter the text for the **Left Answer** and **Right Answer**.
  - Select which side is the **Correct Answer**.
- Click **Start Game** at the bottom!

### 2. Playing the Game
The game uses your webcam to track your face.
- Make sure you are clearly visible and well-lit.
- **To answer LEFT**: Tilt your head clearly to your left shoulder.
- **To answer RIGHT**: Tilt your head clearly to your right shoulder.
- Hold your head there for **1 second**. You will see the progress bar fill up on the screen!
- Once it fills, your answer is locked in, and the game automatically moves to the next question.

### 3. Reviewing Results
After all questions are answered, the **Result Screen** will appear.
- You will see your final score.
- You can review each question, see a snapshot of you answering, and check if you got it right or wrong.
- **Export to Excel**: Click this button to download a spreadsheet (`.xlsx`) of all the questions and answers for your records!
- **Retry Quiz**: Did you mess up? Instantly replay the exact same questions.
- **Create New Quiz**: Start completely over to write new questions.

---

## 💡 Troubleshooting

- **My webcam isn't turning on!** Ensure your browser hasn't blocked camera access. Click the small camera or padlock icon next to the website URL to allow access.
- **It isn't tracking my head!** Make sure you are facing the camera and have decent lighting. Remember, you have to tilt your head (like resting your ear on your shoulder) rather than turning your head like you're looking behind you!

Have fun! 🎉
