// Graph data extracted from PyVis output
// This will be populated with actual data from the knowledge_graph.html

export const rawNodes = [
  {id: "Electricity Provision", label: "Electricity Provision", group: "Concept", title: "Concept"},
  {id: "Euro Oscon 2006", label: "Euro Oscon 2006", group: "Event", title: "Event"},
  {id: "Fitness Function", label: "Fitness Function", group: "Concept", title: "Concept"},
  {id: "Punctuated Equilibrium", label: "Punctuated Equilibrium", group: "Concept", title: "Concept"},
  {id: "Google", label: "Google", group: "Organization", title: "Organization"},
  {id: "Screw", label: "Screw", group: "Concept", title: "Concept"},
  {id: "Goal", label: "Goal", group: "Concept", title: "Concept"},
  {id: "Dan Ward", label: "Dan Ward", group: "Person", title: "Person"},
  {id: "Spot Painting", label: "Spot Painting", group: "Concept", title: "Concept"},
  {id: "Artificial Barrier To Change", label: "Artificial Barrier To Change", group: "Concept", title: "Concept"},
  {id: "Sensing Engines (Ilc)", label: "Sensing Engines (Ilc)", group: "Concept", title: "Concept"},
  {id: "Doctrine: Use Appropriate Methods", label: "Doctrine: Use Appropriate Methods", group: "Concept", title: "Concept"},
  {id: "Online Ad Networks", label: "Online Ad Networks", group: "Concept", title: "Concept"},
  {id: "Printing Press", label: "Printing Press", group: "Technology", title: "Technology"},
  {id: "Bargaining Power Of Suppliers", label: "Bargaining Power Of Suppliers", group: "Concept", title: "Concept"},
  {id: "Climatic Pattern: Peace, War And Wonder", label: "Climatic Pattern: Peace, War And Wonder", group: "Concept", title: "Concept"},
  {id: "Themistocles", label: "Themistocles", group: "Person", title: "Person"},
  {id: "Peace", label: "Peace", group: "Concept", title: "Concept"},
  {id: "Material Waste", label: "Material Waste", group: "Concept", title: "Concept"},
  {id: "Core", label: "Core", group: "Concept", title: "Concept"},
  {id: "Lot C", label: "Lot C", group: "Concept", title: "Concept"},
  {id: "Manipulation Of Images", label: "Manipulation Of Images", group: "Concept", title: "Concept"},
  {id: "Region", label: "Region", group: "Region", title: "Region"},
  {id: "Rapid Change", label: "Rapid Change", group: "Concept", title: "Concept"},
  {id: "Dividends", label: "Dividends", group: "Action", title: "Action"},
  {id: "Wow", label: "Wow", group: "Game", title: "Game"},
  {id: "Economic Factors", label: "Economic Factors", group: "Concept", title: "Concept"},
  {id: "Intellectual Property", label: "Intellectual Property", group: "Concept", title: "Concept"},
  {id: "Ford", label: "Ford", group: "Organization", title: "Organization"},
  {id: "Desire Not To Lose Value", label: "Desire Not To Lose Value", group: "Concept", title: "Concept"},
  {id: "Bricks", label: "Bricks", group: "Concept", title: "Concept"},
  {id: "Mere Mortals", label: "Mere Mortals", group: "Person", title: "Person"},
  {id: "Evolution Curve", label: "Evolution Curve", group: "Concept", title: "Concept"},
  {id: "Models", label: "Models", group: "Concept", title: "Concept"},
  {id: "Decision-Making", label: "Decision-Making", group: "Concept", title: "Concept"},
  {id: "Sources Of Worth", label: "Sources Of Worth", group: "Concept", title: "Concept"},
  {id: "Traditional Enterprise", label: "Traditional Enterprise", group: "Concept", title: "Concept"},
  {id: "Instagram", label: "Instagram", group: "Service", title: "Service"},
  {id: "Digitizing Government", label: "Digitizing Government", group: "Book", title: "Book"},
  {id: "Competitive Weapon", label: "Competitive Weapon", group: "Concept", title: "Concept"}
  // Note: Truncated for file size - full data would include all 1009 nodes
];

export const rawEdges = [
  {from: "Destitute Self", to: "Outcome-Based Approach", label: "associated_with", arrows: "to"},
  {from: "Doctrine: Know Your Users (E.G. Customers, Shareholders, Regulators, Staff)", to: "Doctrine Categories", label: "principle", arrows: "to"},
  {from: "Business Stakeholder", to: "Partnership Agreements", label: "signs", arrows: "to"},
  {from: "Partner", to: "Partnership Agreements", label: "signs", arrows: "to"},
  {from: "Osi", to: "Linux", label: "supports", arrows: "to"},
  {from: "Government Digital Services", to: "Open Source", label: "uses", arrows: "to"},
  {from: "Open Source", to: "Linux", label: "includes", arrows: "to"},
  {from: "Government Digital Services", to: "Cross-Government Software", label: "provides", arrows: "to"},
  {from: "Cross-Government Software", to: "Open Source", label: "based_on", arrows: "to"},
  {from: "Civil Servants", to: "Government Digital Services", label: "work_for", arrows: "to"},
  {from: "Government Digital Services", to: "User Needs", label: "focuses_on", arrows: "to"},
  {from: "Government Digital Services", to: "Digital Services", label: "provides", arrows: "to"},
  {from: "Government", to: "Taxpayers", label: "serves", arrows: "to"},
  {from: "Taxpayers", to: "Government", label: "funds", arrows: "to"},
  {from: "Government", to: "Digital Services", label: "provides", arrows: "to"},
  {from: "Digital Services", to: "Citizens", label: "serves", arrows: "to"},
  {from: "Citizens", to: "Taxpayers", label: "same_as", arrows: "to"},
  {from: "Government Digital Services", to: "Policy", label: "implements", arrows: "to"},
  {from: "Policy", to: "Citizens", label: "affects", arrows: "to"},
  {from: "Government Digital Services", to: "Technology", label: "uses", arrows: "to"}
  // Note: Truncated for file size - full data would include all 1850 edges
];

// Default vis.js options matching PyVis configuration
export const networkOptions = {
    physics: {
        forceAtlas2Based: {
            gravitationalConstant: -100,
            centralGravity: 0.01,
            springLength: 200,
            springConstant: 0.08
        },
        minVelocity: 0.75,
        solver: "forceAtlas2Based"
    },
    nodes: {
        font: {
            color: 'white',
            size: 14
        },
        shape: 'dot',
        scaling: {
            min: 10,
            max: 30
        }
    },
    edges: {
        font: {
            color: 'white',
            size: 12
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
    }
};

// Function to process and clean the graph data
export function processGraphData() {
    // Convert raw data to vis.js DataSets
    const nodes = new vis.DataSet(rawNodes.map(node => ({
        id: node.id,
        label: node.label,
        title: `${node.title || node.group}\n\nClick for more details`,
        group: node.group,
        font: { color: 'white' },
        shape: 'dot'
    })));

    const edges = new vis.DataSet(rawEdges.map(edge => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        title: `Relationship: ${edge.label}`,
        arrows: 'to'
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