import fetch from 'node-fetch';
import dotenv from 'dotenv';
import extractImports from '../ImportParsers/Javascript_importParser.js';

dotenv.config({ path: '../.env' });

class Node {
  constructor(data = {}, children = []) {
    this.data = data;
    this.children = [...children];
  }
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN 
if (!GITHUB_TOKEN) {
  console.error(' GITHUB_TOKEN is missing');
  process.exit(1);
}

const ignoredFolders = new Set(['node_modules', 'venv', '.git', '.github', '.vscode']);
const ignoredFiles = new Set(['.DS_Store', '.env']);
const isCodeFile = (filename) =>
  filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.tsx');

const addChildren = async (git, files = [], imports = [], md='') => {
  console.log(`Processing: ${git.data.path} (${git.data.type})`);
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };

  if (ignoredFolders.has(git.data.name)) return;

  if (git.data.type === 'file') {
    // handeling md files
    if (git.data.name.endsWith('.md')) {
      const response = await fetch(git.data.url, { headers });
      const data = await response.text();
      if (!data) return;
      md += `\n\n# ${git.data.name}\n\n${data}`;
      return;
      
      }
    if (ignoredFiles.has(git.data.name)) return;

    const response = await fetch(git.data.url, { headers });
    const data = await response.json();
    if (!data.content) return;

    let decoded = '';
    try {
      decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (err) {
      console.warn(`Skipping binary/invalid file: ${git.data.path}`);
      return;
    }

    files.push({
      name: git.data.name,
      path: git.data.path,
      code: decoded,
    });

    if (isCodeFile(git.data.name)) {
      try {
        const import_statement = extractImports(decoded);
        imports.push({
          file: git.data.name,
          path: git.data.path,
          content: decoded,
          imports: import_statement,
        });
      } catch (parseErr) {
        console.warn(`Failed to parse imports in ${git.data.path}: ${parseErr.message}`);
      }
    }

    return;
  }

  // If directory
  const response = await fetch(git.data.url, { headers });
  const children = await response.json();

  if (!Array.isArray(children)) {
    return;
  }

  for (const obj of children) {
    const childNode = new Node({
      name: obj.name,
      path: obj.path,
      url: obj.url,
      type: obj.type,
    });
    git.children.push(childNode);
    await addChildren(childNode, files, imports);
  }
};

export { Node, addChildren };


//------------------------------ Test-------------------------------------------------------//
// const runPipeline = async () => {
//   const git = new Node({
//     name: 'root',
//     path: '/root',
//     url: 'https://api.github.com/repos/KIRANBADAKURAVA/Blogwebsite/contents',
//     type: 'dir',
//   });

//   const files = [];
//   const imports = [];

//   await addChildren(git, files, imports);

//   const adjacencyList = CreatAdjacencyList(imports);
//   const sortedNodes = topologicalSort(adjacencyList);

//   console.log(typeof JSON.stringify(sortedNodes));
//   console.log(typeof JSON.parse(JSON.stringify(sortedNodes)));
//   return;
//   const rag = await new FileWiseLLM({
//     model: 'llama-3.3-70b-versatile',
//     sortedNodes: sortedNodes,
//     chunkSize: 1000,
//     chunkOverlap: 200,
//     searchType: 'similarity',
//     kDocuments: 5,
//   }).init();

//   const question = 'Explain the code ';
//   const answers = await rag.run(question);

//   const combinedCodeSummary = answers.map((res) => res.answer).join('\n\n');

//   const docLLM = new DocumentLLM({
//     codeSummary: combinedCodeSummary,
//   });

//   await docLLM.init();
//   const finalOutput = await docLLM.run('How the project is handeling CRUD operations? Explain in detail.');

//   console.log('\n📘 Final Project Documentation:\n');
//   console.log(finalOutput.documentation);
// };

// runPipeline().catch((err) => {
//   console.error(' Pipeline Error:', err);
// });

