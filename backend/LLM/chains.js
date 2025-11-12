import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";

/**
 * Formats an array of documents into a single string
 */
function formatDocumentsAsString(documents) {
  return documents
    .map((doc, i) => {
      const metadataStr = doc.metadata
        ? `\nMetadata: ${JSON.stringify(doc.metadata)}`
        : "";
      return `Document ${i + 1}:\n${doc.pageContent}${metadataStr}`;
    })
    .join("\n\n");
}

/**
 * Creates a chain that combines documents into a single string
 * and passes them to the LLM with the prompt
 */
export async function createStuffDocumentsChain({ llm, prompt }) {
  // Get all input variables from the prompt
  const inputVars = prompt.inputVariables || [];
  
  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: (input) => {
        // If documents are provided, format them as string
        if (input.documents && Array.isArray(input.documents)) {
          return formatDocumentsAsString(input.documents);
        }
        return input.context || "";
      },
    }),
    (input) => {
      // Build the variables object for the prompt
      const promptVars = {};
      for (const key of inputVars) {
        if (key === "context") {
          promptVars[key] = input.context || "";
        } else if (key === "input") {
          promptVars[key] = input.input || input.question || "";
        } else {
          promptVars[key] = input[key] || "";
        }
      }
      return promptVars;
    },
    prompt,
    llm,
  ]);

  return chain;
}

/**
 * Creates a retrieval chain that retrieves documents and combines them
 */
export async function createRetrievalChain({ retriever, combineDocsChain }) {
  const retrievalChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: async (input) => {
        const query = input.input || input.question || "";
        // Retrievers in LangChain v1.x are Runnables, so use invoke
        const docs = await retriever.invoke(query);
        return formatDocumentsAsString(docs);
      },
    }),
    combineDocsChain,
    (input) => {
      // Extract the answer from the LLM response and preserve other input fields
      let answer;
      if (input && typeof input === "object") {
        // If it's an AIMessage or similar, get the content
        if (input.content !== undefined) {
          answer = input.content;
        } else {
          // Otherwise, try to stringify
          answer = String(input);
        }
      } else if (typeof input === "string") {
        answer = input;
      } else {
        answer = String(input);
      }
      
      // Return an object with answer and preserve other input fields
      return {
        answer,
        ...(typeof input === "object" && input !== null ? input : {}),
      };
    },
  ]);

  return retrievalChain;
}

