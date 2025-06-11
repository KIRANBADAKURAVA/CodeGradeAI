import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatGroq } from "@langchain/groq";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

class DocumentLLM {
  constructor({ model = "llama3-8b-8192", codeSummary, kDocuments = 5 }) {
    this.model = model;
    this.rawCode = codeSummary;
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
      You are a highly skilled code reviewer AI. Your task is to review the given codebase context and evaluate it across several important software quality and performance metrics.
      
      You must:
      1. **Summarize what the repository is about.**
      2. **Rate the codebase** from 1 to 10 for each metric listed below.
      3. **Apply the corresponding weights** to each metric.
      4. **Calculate the overall score** (out of 10) as a weighted average.
      5. **Give final remarks** based on the strengths and weaknesses.
      6. **Mention how basic or complex the overall logic is.**
      7. **If there is good or well-structured logic, include the exact file names and paths where it's found.**
      8. **Strictly return only the JSON object. Do not include any explanation, prefix, suffix, or formatting like "Here is the output"**
      
      ### Evaluation Metrics (with Weights):
      - Code Readability (Weight: 8%)
      - Code Structure & Modularity (Weight: 8%)
      - Documentation & Comments (Weight: 8%)
      - Error Handling & Edge Case Coverage (Weight: 8%)
      - Test Coverage & Quality (Weight: 8%)
      - Scalability & Maintainability (Weight: 8%)
      - Efficiency (Weight: 8%)
      - Extensibility (Weight: 8%)
      - AI/Tool Usage Appropriateness (Weight: 8%)
      - Code Complexity & Logic Quality (Weight: 20%)
      
      ### Definitions:
      - **AI/Tool Usage Appropriateness**: How effectively the code leverages AI or relevant developer tools, automation, or frameworks.
      - **Code Complexity & Logic Quality**: How well the logic is written, how complex or basic it is, and how efficiently complex or feature-heavy scenarios are handled.
      
      ### JSON Response Format:
      {{
        "summary": "<detailed summary of what the repository is about>",
        "ratings": {{
          "Code Readability": <number>,
          "Code Structure & Modularity": <number>,
          "Documentation & Comments": <number>,
          "Error Handling & Edge Case Coverage": <number>,
          "Test Coverage & Quality": <number>,
          "Scalability & Maintainability": <number>,
          "Efficiency": <number>,
          "Extensibility": <number>,
          "AI/Tool Usage Appropriateness": <number>,
          "Code Complexity & Logic Quality": <number>
        }},
        "weights": {{
          "Code Readability": 0.08,
          "Code Structure & Modularity": 0.08,
          "Documentation & Comments": 0.08,
          "Error Handling & Edge Case Coverage": 0.08,
          "Test Coverage & Quality": 0.08,
          "Scalability & Maintainability": 0.08,
          "Efficiency": 0.08,
          "Extensibility": 0.08,
          "AI/Tool Usage Appropriateness": 0.08,
          "Code Complexity & Logic Quality": 0.2
        }},
        "overall_score": <calculated_score>,
        "remarks": "<summary including how basic or complex the logic is, and mention of file names and paths where important logic is found>"
      }}
      
      ### Code Context:
      {context}
      
      ### User Input:
      {input}
      `);
      
      
      
      

    this.combineDocsChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt: this.prompt,
    });

    return this;
  }

  async splitIntoChunks() {
    const splitter = new CharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = await splitter.createDocuments([this.rawCode]);
    return documents;
  }

  async process(userInput) {
    console.log(`📄 Creating documentation...`);

    const chunks = await this.splitIntoChunks();

    const vectorStore = await MemoryVectorStore.fromDocuments(chunks, this.embeddings);
    const retriever = vectorStore.asRetriever({ k: this.kDocuments });

    const chain = await createRetrievalChain({
      retriever,
      combineDocsChain: this.combineDocsChain,
    });

    const response = await chain.invoke({
      input: userInput,
      context: this.rawCode,
    });

    return {
      documentation: response.answer ?? response,
    };
  }

  async run(userInput) {
    const result = await this.process(userInput);
    console.log(`✅ Documentation complete.`);
    return result;
  }
}

export { DocumentLLM };
