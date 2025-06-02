// Empty initial data - graph will be populated from loaded files
export const rawNodes = [];
export const rawEdges = [];

// Default vis.js options matching PyVis configuration with performance optimizations
export const networkOptions = {
    physics: {
        forceAtlas2Based: {
            gravitationalConstant: -100,
            centralGravity: 0.01,
            springLength: 200,
            springConstant: 0.08
        },
        minVelocity: 0.75,
        solver: "forceAtlas2Based",
        stabilization: {
            enabled: true,
            iterations: 200,  // Reduced from 1000 for faster loading
            updateInterval: 25
        }
    },
    nodes: {
        font: {
            color: 'white',
            size: 14
        },
        shape: 'dot',
        color: {
            background: '#3498db',
            border: '#2980b9'
        },
        scaling: {
            min: 10,
            max: 30
        }
    },
    edges: {
        font: {
            color: 'white',
            size: 12,
            weight: '300'
        },
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 1
            }
        },
        color: {
            color: '#848484',
            highlight: '#3498db',
            hover: '#2ecc71'
        },
        smooth: {
            enabled: true,
            type: 'continuous'
        }
    },
    layout: {
        improvedLayout: false
    },
    interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        tooltipDelay: 300,
        zoomView: true,
        dragView: true
    },
    configure: {
        enabled: false
    },
    groups: {
        // Dynamic group coloring - no red colors (reserved for search highlighting)
        Concept: { color: { background: '#3498db', border: '#2980b9' } },
        Person: { color: { background: '#f39c12', border: '#e67e22' } },
        Organization: { color: { background: '#5dade2', border: '#3498db' } },
        Object: { color: { background: '#9b59b6', border: '#8e44ad' } },
        Event: { color: { background: '#1abc9c', border: '#16a085' } },
        Service: { color: { background: '#2ecc71', border: '#27ae60' } },
        Book: { color: { background: '#95a5a6', border: '#7f8c8d' } },
        Chapter: { color: { background: '#34495e', border: '#2c3e50' } },
        Action: { color: { background: '#8e44ad', border: '#7d3c98' } },
        Industry: { color: { background: '#17a2b8', border: '#138496' } }
    }
};

// Function to process and clean the graph data
export function processGraphData(inputNodes = rawNodes, inputEdges = rawEdges) {
    // Convert raw data to vis.js DataSets with performance optimizations
    const nodes = new vis.DataSet(inputNodes.map(node => ({
        id: node.id,
        label: node.label,
        title: `${node.title || node.group || node.type}\n\nType: ${node.group || node.type}\nClick for more details`,
        group: node.group || node.type || 'default',
        font: { color: 'white' },
        shape: 'dot',
        size: Math.min(30, Math.max(10, (node.connections || 1) * 2)) // Dynamic sizing based on connections
    })));

    const edges = new vis.DataSet(inputEdges.map(edge => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        title: `Relationship: ${edge.label}`,
        arrows: 'to',
        width: 1,
        selectionWidth: 3,
        font: { color: 'white', size: 12, weight: '300' }
    })));

    return { nodes, edges };
}

// Get unique node groups for filtering
export function getNodeGroups() {
    const groups = [...new Set(rawNodes.map(node => node.group))];
    return groups.sort();
}

// Get unique edge labels for filtering
export function getEdgeLabels() {
    const labels = [...new Set(rawEdges.map(edge => edge.label))];
    return labels.sort();
}

// Search nodes by label
export function searchNodes(query) {
    if (!query) return [];
    
    const searchTerm = query.toLowerCase();
    return rawNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm) ||
        (node.title && node.title.toLowerCase().includes(searchTerm))
    );
}

// Get node statistics
export function getGraphStats() {
    const nodeCount = rawNodes.length;
    const edgeCount = rawEdges.length;
    const nodeGroups = getNodeGroups();
    const edgeLabels = getEdgeLabels();
    
    // Calculate degree distribution
    const degrees = {};
    rawEdges.forEach(edge => {
        degrees[edge.from] = (degrees[edge.from] || 0) + 1;
        degrees[edge.to] = (degrees[edge.to] || 0) + 1;
    });
    
    const degreeValues = Object.values(degrees);
    const avgDegree = degreeValues.length > 0 ? 
        degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length : 0;
    const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
    
    // Group distribution
    const groupCounts = {};
    rawNodes.forEach(node => {
        groupCounts[node.group] = (groupCounts[node.group] || 0) + 1;
    });
    
    return {
        nodeCount,
        edgeCount,
        nodeGroups: nodeGroups.length,
        edgeTypes: edgeLabels.length,
        avgDegree: avgDegree.toFixed(2),
        maxDegree,
        groupDistribution: groupCounts,
        density: ((2 * edgeCount) / (nodeCount * (nodeCount - 1))).toFixed(6)
    };
}