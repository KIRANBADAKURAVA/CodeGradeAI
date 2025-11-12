import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";

/**
 * Simple in-memory vector store implementation
 */
export class MemoryVectorStore extends VectorStore {
  constructor(embeddings, config = {}) {
    super(embeddings, config);
    this.vectors = [];
    this.documents = [];
  }

  _vectorstoreType() {
    return "memory";
  }

  async addVectors(vectors, documents, options = {}) {
    const ids = options.ids || vectors.map((_, i) => `doc_${Date.now()}_${i}`);
    
    for (let i = 0; i < vectors.length; i++) {
      this.vectors.push({
        id: ids[i],
        vector: vectors[i],
        document: documents[i],
      });
    }
    
    return ids;
  }

  async addDocuments(documents, options = {}) {
    const texts = documents.map((doc) => doc.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    return this.addVectors(vectors, documents, options);
  }

  async similaritySearchVectorWithScore(query, k) {
    // Calculate cosine similarity
    const scores = this.vectors.map((item) => {
      const similarity = this.cosineSimilarity(query, item.vector);
      return {
        document: item.document,
        score: similarity,
      };
    });

    // Sort by score (descending) and take top k
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, k).map((item) => [item.document, item.score]);
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  static async fromDocuments(documents, embeddings) {
    const store = new MemoryVectorStore(embeddings);
    await store.addDocuments(documents);
    return store;
  }
}

