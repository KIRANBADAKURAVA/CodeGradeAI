// sample edge 
// {
//     "file": "todoSlice.js",
//        "content": ---
//     "path": "reduxToolkitTodo/src/features/todo/todoSlice.js",
//     "imports": [
//       {
//         "imported": "createSlice",
//         "from": "@reduxjs/toolkit"
//       },
//       {
//         "imported": "nanoid",
//         "from": "@reduxjs/toolkit"
//       }
//     ]
//   }


const CreatAdjacencyList = (edges, adjacencyList = []) => {
    const mpp = new Map();
  
    edges.forEach(edge => {
      const file = edge.file;
  
      if (!mpp.has(file)) {
        mpp.set(file, []);
      }
  
      edge.imports.forEach(imp => {
        const from = imp.from.split('/').pop()
        if (!mpp.has(file)) {
          mpp.set(file, []);
        }
        mpp.get(file).push({
          imported: imp.imported,
          from:from,
        });
      });
    });
  
    mpp.forEach((imports, file) => {
      adjacencyList.push({
        file: file,
        content: edges.find(edge => edge.file === file).content,
        path: edges.find(edge => edge.file === file).path,
        imports: imports,
      });
    });
  
    return adjacencyList;
  };

  
export default CreatAdjacencyList;



// Example output
// [
// 
//   {
//     "file": "App.js",
//     "content": "---",
//     "path": "src/App.js",
//     "imports": [
//       { "imported": "React", "from": "react" },
//       { "imported": "Todo", "from": "Todo" }
//     ]
//   }
// ]

