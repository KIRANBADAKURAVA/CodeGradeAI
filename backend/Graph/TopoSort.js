// Sort the graph using topological sorting to determine the order of feeding llm 

const topologicalSort = (adjacencyList) => {
    const visited = new Set();
    const stack = [];
    const result = [];

    const visit = (node) => {
        if (!visited.has(node.file)) {
            visited.add(node.file);
            node.imports.forEach((imp) => {
                const nextNode = adjacencyList.find(n => n.file === imp.from);
                if (nextNode) {
                    visit(nextNode);
                }
            });
            stack.push(node);
        }
    };

    adjacencyList.forEach((node) => {
        visit(node);
    });

    while (stack.length > 0) {
        result.push(stack.pop());
    }

    return result;
}

export default topologicalSort;