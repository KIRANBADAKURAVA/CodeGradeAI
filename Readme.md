# CodeGradeAI 🧠💻

**CodeGradeAI** is an AI-powered assistant for intelligent codebase evaluation. It helps developers and teams receive automated insights on the structure, quality, and maintainability of their repositories using advanced LLMs.


🌐 **Live Demo**: [https://code-grade-ai-v6sx.vercel.app/](https://code-grade-ai-v6sx.vercel.app/)

## 🧠 How It Works

![CodeGradeAI Architecture](./Pipeline.png)

> The diagram above outlines the core pipeline:
- Takes a **repository link** and parses its **file tree**.
- Builds a **graph** using structure-aware logic to track code relationships.
- Extracts code into **function/class chunks** and feeds them to a **LLM**.
- Generates **file-wise summaries**, **vectorized insights**, and **PDF-style documentation templates**.
- Performs a **multi-dimensional analysis** based on key engineering metrics.

## ⚙️ Key Features

- 📂 File-wise and project-wide understanding
- 📈 Metric-based scoring (Readability, Modularity, Documentation, etc.)
- 📄 Summary generation for every file
- 📎 AST-based parsing for structured comprehension
- 🧾 Generates vectorized templates for code documentation
- 📊 Analysis stored in structured JSON output

