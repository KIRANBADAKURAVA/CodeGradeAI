import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MemoryVectorStore } from "./MemoryVectorStore.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain, createRetrievalChain } from "./chains.js";
import { ChatGroq } from "@langchain/groq";
import { Document } from "@langchain/core/documents";
import { parse } from "@babel/parser";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

class FileWiseLLM {
  constructor({ model = "llama-3.1-8b-instant", sortedNodes, kDocuments = 5 }) {
    this.model = model;
    this.sortedNodes = sortedNodes;
    this.kDocuments = kDocuments;
  }

  async init() {
    this.embeddings = new HuggingFaceInferenceEmbeddings({
      model: "BAAI/bge-base-en-v1.5",
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    this.llm = new ChatGroq({
      model: this.model,
      apiKey: process.env.GROQ_API_KEY,
    });

    this.prompt = ChatPromptTemplate.fromTemplate(`
You are a code analysis assistant. You will be given code from a **single file**, chunked for vector-based retrieval. Use the provided context to understand the code and answer the user's question.
You can use general programming knowledge, but focus on the code provided in the context.

Use the following structure in your response:

---

### File Name
{file}

### 📁 File Path
{path}

---

### 🧩 Context (Vector-Chunked Code)
Use the following code chunks for your analysis:
{context}

---

### 🔍 Key Components
List the important **functions**, **classes**, and **declarations** (like constants, variables) in the file. For each item, write a brief one-liner explaining its role.

---

### 🧠 Logic & Flow
Explain the core **logic and flow** of the code. Describe how different parts of the file work together, and mention any important patterns (like API handling, auth, async flows, etc.).

---

### 📝 Summary
Summarize what this file does overall in 2–3 sentences, as if you're explaining it to another developer joining the project.

---

### ❓ Answer to the User's Question
{input}

---

Use clear bullet points or markdown formatting where needed. If any part is missing due to chunking, indicate that with a note like “⛔ Incomplete context”.
    `);

    this.combineDocsChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt: this.prompt,
    });

    return this;
  }

  chunkFile(content) {
    const ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    return ast.program.body.map((node) => content.slice(node.start, node.end));
  }

  async processFile(node, userInput) {
    console.log(`📄 Processing file: ${node.file}`);

    const chunks = this.chunkFile(node.content);
    const documents = chunks.map(
      (chunk) =>
        new Document({
          metadata: { file: node.file, path: node.path },
          pageContent: chunk,
        })
    );

    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      this.embeddings
    );
    const retriever = vectorStore.asRetriever({ k: this.kDocuments });

    const chain = await createRetrievalChain({
      retriever,
      combineDocsChain: this.combineDocsChain,
    });

    const response = await chain.invoke({
      input: userInput,
      file: node.file,
      path: node.path,
    });

    return {
      file: node.file,
      answer: response.answer ?? response,
    };
  }

  async run(userInput) {
    const results = [];

    for (const node of this.sortedNodes) {
      const result = await this.processFile(node, userInput);
      results.push(result);
      console.log(`✅ Done with ${node.file}\n`);
    }

    return results;
  }
}

export { FileWiseLLM };
