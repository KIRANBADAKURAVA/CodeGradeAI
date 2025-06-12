import { Node, addChildren } from '../Github/GithubTree.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import CreatAdjacencyList from '../Graph/AdjacencyList.js';
import topologicalSort from '../Graph/TopoSort.js';
import { FileWiseLLM } from '../LLM/RAG.js';
import { DocumentLLM } from '../LLM/Document.LLM.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Cache from '../Model/Cache.model.js';

export const getDocument = AsyncHandler(async (req, res) => {
  console.log(req.body);
  const { url } = req.body;
  if (!url) throw new ApiError(400, 'url is required');

  const cache = await Cache.findOne({ url: url });
  let sortedNodes;
  let md = '';

  if (cache) {
    console.log('Cache found for URL:', url);
    sortedNodes = JSON.parse(cache.data);
    console.log('Using cached data for sorted nodes');
  } else {
    const git = new Node({
      name: 'root',
      path: '/root',
      url: url,
      type: 'dir',
    });

    const files = [];
    const imports = [];

    await addChildren(git, files, imports, (markdown) => {
      md += markdown; // accumulate markdown
    });

    const adjacencyList = CreatAdjacencyList(imports);
    sortedNodes = topologicalSort(adjacencyList);

    if (sortedNodes && sortedNodes.length > 0) {
      const cacheData = new Cache({
        url: url,
        data: JSON.stringify(sortedNodes),
        createdAt: new Date(),
      });
      await cacheData.save({validateBeforeSave: false});
      console.log('Cache saved for URL:', url);
    }

    if (!sortedNodes || sortedNodes.length === 0) {
      throw new ApiError(404, 'No files found in the provided URL');
    }
  }

  const rag = await new FileWiseLLM({
    model: 'llama-3.3-70b-versatile',
    sortedNodes: sortedNodes,
    chunkSize: 1000,
    chunkOverlap: 200,
    searchType: 'similarity',
    kDocuments: 5,
  }).init();

  const question = 'Explain the code';
  const answers = await rag.run(question);
  let combinedCodeSummary = answers.map((res) => res.answer).join('\n\n');

  combinedCodeSummary = '\n\n### Markeddown Documentation:\n\n' + md + '\n\n' + combinedCodeSummary;
  //console.log(combinedCodeSummary);

  const docLLM = new DocumentLLM({
    codeSummary: combinedCodeSummary,
  });

  await docLLM.init();
  const finalOutput = await docLLM.run('Review the code');
  console.log('\n📘 Final Project Documentation:\n');
  const output= JSON.parse(finalOutput.documentation);
  console.log(finalOutput.documentation);

  
  res.status(200).json(
    new ApiResponse(200, {
      output: output, 
      codeSummary: combinedCodeSummary,
    }, 'Documentation generated successfully')
  );
});
