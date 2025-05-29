import { 
    rawNodes, 
    rawEdges, 
    networkOptions, 
    processGraphData, 
    getNodeGroups, 
    getEdgeLabels, 
    searchNodes, 
    getGraphStats 
} from './graphData.js';

import { GraphController } from './graphController.js';
import { UIController } from './uiController.js';
import { ExportController } from './exportController.js';
import { DataLoader } from './dataLoader.js';

class KnowledgeGraphApp {
    constructor() {
        this.graphController = null;
        this.uiController = null;
        this.exportController = null;
        this.dataLoader = null;
        this.network = null;
        this.originalData = null;
        this.filteredData = null;
        this.currentGraphData = { nodes: [], edges: [] };
        
        this.init();
    }

    async init() {
        try {
            this.showLoading('Initializing application...');
            
            // Initialize controllers
            this.uiController = new UIController(this);
            this.exportController = new ExportController(this);
            this.dataLoader = new DataLoader();
            
            // Try to load default data, fall back to sample data
            await this.loadDefaultData();
            
            // Initialize graph
            this.graphController = new GraphController(this);
            await this.graphController.initializeGraph();
            
            // Setup UI
            this.setupEventListeners();
            this.setupFilters();
            
            this.hideLoading();
            console.log('Knowledge Graph App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    setupEventListeners() {
        // Graph events
        if (this.network) {
            this.network.on('click', (params) => this.handleNodeClick(params));
            this.network.on('hoverNode', (params) => this.handleNodeHover(params));
            this.network.on('blurNode', () => this.handleNodeBlur());
            this.network.on('stabilizationProgress', (params) => this.updateStabilizationProgress(params));
            this.network.on('stabilizationIterationsDone', () => this.hideStabilizationProgress());
        }

        // UI events
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());
        document.getElementById('centerGraph').addEventListener('click', () => this.centerGraph());
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Header controls
        document.getElementById('loadBtn').addEventListener('click', () => this.showLoad());
        document.getElementById('statsBtn').addEventListener('click', () => this.showStats());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExport());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        // Modal controls
        document.getElementById('closeStats').addEventListener('click', () => this.hideStats());
        document.getElementById('closeExport').addEventListener('click', () => this.hideExport());
        document.getElementById('closeLoad').addEventListener('click', () => this.hideLoad());
        document.getElementById('closeInfo').addEventListener('click', () => this.hideInfo());
        
        // Export actions
        document.getElementById('exportJSON').addEventListener('click', () => this.exportController.exportJSON());
        document.getElementById('exportCSV').addEventListener('click', () => this.exportController.exportCSV());
        document.getElementById('exportPNG').addEventListener('click', () => this.exportController.exportPNG());
        document.getElementById('exportGraphML').addEventListener('click', () => this.exportController.exportGraphML());
        document.getElementById('exportGML').addEventListener('click', () => this.exportController.exportGML());
        
        // Load actions
        this.setupLoadEventListeners();
        
        // Controls toggle
        document.getElementById('toggleControls').addEventListener('click', () => this.toggleControls());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupFilters() {
        // Node type filter
        const nodeFilter = new TomSelect('#nodeFilter', {
            plugins: ['remove_button'],
            maxItems: null,
            options: getNodeGroups().map(group => ({value: group, text: group})),
            onItemAdd: () => this.applyFilters(),
            onItemRemove: () => this.applyFilters()
        });

        // Relationship filter
        const relationshipFilter = new TomSelect('#relationshipFilter', {
            plugins: ['remove_button'],
            maxItems: null,
            options: getEdgeLabels().map(label => ({value: label, text: label})),
            onItemAdd: () => this.applyFilters(),
            onItemRemove: () => this.applyFilters()
        });

        this.nodeFilter = nodeFilter;
        this.relationshipFilter = relationshipFilter;
    }

    applyFilters() {
        const selectedNodeTypes = this.nodeFilter.getValue();
        const selectedRelationships = this.relationshipFilter.getValue();
        
        // Filter nodes
        let filteredNodes = this.originalData.nodes.get();
        if (selectedNodeTypes.length > 0) {
            filteredNodes = filteredNodes.filter(node => selectedNodeTypes.includes(node.group));
        }
        
        // Filter edges
        let filteredEdges = this.originalData.edges.get();
        if (selectedRelationships.length > 0) {
            filteredEdges = filteredEdges.filter(edge => selectedRelationships.includes(edge.label));
        }
        
        // Only show edges between visible nodes
        const visibleNodeIds = new Set(filteredNodes.map(node => node.id));
        filteredEdges = filteredEdges.filter(edge => 
            visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)
        );
        
        // Update the graph
        this.filteredData.nodes.clear();
        this.filteredData.edges.clear();
        this.filteredData.nodes.add(filteredNodes);
        this.filteredData.edges.add(filteredEdges);
        
        this.updateGraphInfo();
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.resetFilters();
            return;
        }
        
        const searchResults = searchNodes(query);
        const resultIds = new Set(searchResults.map(node => node.id));
        
        // Highlight search results
        const allNodes = this.filteredData.nodes.get();
        const updatedNodes = allNodes.map(node => ({
            ...node,
            color: resultIds.has(node.id) ? '#e74c3c' : undefined,
            borderWidth: resultIds.has(node.id) ? 3 : 1
        }));
        
        this.filteredData.nodes.update(updatedNodes);
        
        // Focus on first result if any
        if (searchResults.length > 0) {
            this.network.selectNodes([searchResults[0].id]);
            this.network.focus(searchResults[0].id, {scale: 1.5});
        }
    }

    handleNodeClick(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const nodeData = this.originalData.nodes.get(nodeId);
            this.showNodeInfo(nodeData);
        }
    }

    handleNodeHover(params) {
        const nodeId = params.node;
        const nodeData = this.originalData.nodes.get(nodeId);
        // Could add hover tooltip here if needed
    }

    handleNodeBlur() {
        // Reset any hover effects
    }

    showNodeInfo(node) {
        const infoPanel = document.getElementById('infoPanel');
        const infoContent = document.getElementById('infoContent');
        
        // Get connected nodes
        const connectedEdges = this.originalData.edges.get({
            filter: edge => edge.from === node.id || edge.to === node.id
        });
        
        const connections = connectedEdges.map(edge => {
            const isSource = edge.from === node.id;
            const connectedNodeId = isSource ? edge.to : edge.from;
            const connectedNode = this.originalData.nodes.get(connectedNodeId);
            return {
                node: connectedNode,
                relationship: edge.label,
                direction: isSource ? 'outgoing' : 'incoming'
            };
        });
        
        infoContent.innerHTML = `
            <div class="node-details">
                <h4>${node.label}</h4>
                <p><strong>Type:</strong> ${node.group}</p>
                <p><strong>Connections:</strong> ${connections.length}</p>
                
                ${connections.length > 0 ? `
                    <div class="connections">
                        <h5>Connected Nodes:</h5>
                        <ul class="connection-list">
                            ${connections.slice(0, 10).map(conn => `
                                <li>
                                    <span class="direction ${conn.direction}">${conn.direction === 'outgoing' ? '→' : '←'}</span>
                                    <span class="relationship">${conn.relationship}</span>
                                    <span class="connected-node">${conn.node.label}</span>
                                </li>
                            `).join('')}
                            ${connections.length > 10 ? `<li class="more">... and ${connections.length - 10} more</li>` : ''}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        infoPanel.classList.add('visible');
    }

    hideInfo() {
        document.getElementById('infoPanel').classList.remove('visible');
    }

    showStats() {
        const stats = getGraphStats();
        const statsContent = document.getElementById('statsContent');
        
        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <h4>Total Nodes</h4>
                    <span class="stat-value">${stats.nodeCount}</span>
                </div>
                <div class="stat-item">
                    <h4>Total Edges</h4>
                    <span class="stat-value">${stats.edgeCount}</span>
                </div>
                <div class="stat-item">
                    <h4>Node Types</h4>
                    <span class="stat-value">${stats.nodeGroups}</span>
                </div>
                <div class="stat-item">
                    <h4>Relationship Types</h4>
                    <span class="stat-value">${stats.edgeTypes}</span>
                </div>
                <div class="stat-item">
                    <h4>Average Degree</h4>
                    <span class="stat-value">${stats.avgDegree}</span>
                </div>
                <div class="stat-item">
                    <h4>Max Degree</h4>
                    <span class="stat-value">${stats.maxDegree}</span>
                </div>
                <div class="stat-item">
                    <h4>Graph Density</h4>
                    <span class="stat-value">${stats.density}</span>
                </div>
            </div>
            
            <div class="group-distribution">
                <h4>Node Type Distribution</h4>
                <div class="distribution-chart">
                    ${Object.entries(stats.groupDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([group, count]) => `
                            <div class="distribution-item">
                                <span class="group-name">${group}</span>
                                <span class="count">${count}</span>
                                <div class="bar" style="width: ${(count / Math.max(...Object.values(stats.groupDistribution))) * 100}%"></div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('statsModal').classList.add('visible');
    }

    hideStats() {
        document.getElementById('statsModal').classList.remove('visible');
    }

    showExport() {
        document.getElementById('exportModal').classList.add('visible');
    }

    hideExport() {
        document.getElementById('exportModal').classList.remove('visible');
    }

    resetFilters() {
        this.nodeFilter.clear();
        this.relationshipFilter.clear();
        document.getElementById('searchInput').value = '';
        
        // Reset to original data
        this.filteredData.nodes.clear();
        this.filteredData.edges.clear();
        this.filteredData.nodes.add(this.originalData.nodes.get());
        this.filteredData.edges.add(this.originalData.edges.get());
        
        this.updateGraphInfo();
    }

    centerGraph() {
        if (this.network) {
            this.network.fit();
        }
    }

    toggleFullscreen() {
        document.body.classList.toggle('fullscreen');
        setTimeout(() => {
            if (this.network) {
                this.network.redraw();
                this.network.fit();
            }
        }, 100);
    }

    toggleControls() {
        const controlsPanel = document.getElementById('controlsPanel');
        const toggleBtn = document.getElementById('toggleControls');
        
        controlsPanel.classList.toggle('collapsed');
        toggleBtn.textContent = controlsPanel.classList.contains('collapsed') ? '+' : '−';
        
        setTimeout(() => {
            if (this.network) {
                this.network.redraw();
            }
        }, 300);
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'f':
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetFilters();
                    break;
                case 's':
                    e.preventDefault();
                    this.showStats();
                    break;
                case 'e':
                    e.preventDefault();
                    this.showExport();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.hideStats();
            this.hideExport();
            this.hideInfo();
        }
    }

    updateStabilizationProgress(params) {
        const progress = params.iterations / params.total;
        const progressBar = document.getElementById('progressBar');
        const loadingText = document.getElementById('loadingText');
        
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
        
        if (loadingText) {
            loadingText.textContent = `Stabilizing graph... ${Math.round(progress * 100)}%`;
        }
    }

    hideStabilizationProgress() {
        const loadingBar = document.getElementById('loadingBar');
        if (loadingBar) {
            loadingBar.style.opacity = '0';
            setTimeout(() => {
                loadingBar.style.display = 'none';
            }, 500);
        }
    }

    showLoading(message) {
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingText) loadingText.textContent = message;
        if (loadingBar) {
            loadingBar.style.display = 'block';
            loadingBar.style.opacity = '1';
        }
    }

    hideLoading() {
        const loadingBar = document.getElementById('loadingBar');
        if (loadingBar) {
            loadingBar.style.opacity = '0';
            setTimeout(() => {
                loadingBar.style.display = 'none';
            }, 500);
        }
    }

    showError(message) {
        console.error(message);
        alert('Error: ' + message); // Could be replaced with a better error UI
    }

    updateGraphInfo() {
        const nodeCount = this.filteredData.nodes.length;
        const edgeCount = this.filteredData.edges.length;
        
        // Update any status displays
        console.log(`Graph updated: ${nodeCount} nodes, ${edgeCount} edges`);
    }

    // Public API for controllers
    getNetwork() {
        return this.network;
    }

    setNetwork(network) {
        this.network = network;
    }

    getFilteredData() {
        return this.filteredData;
    }

    getOriginalData() {
        return this.originalData;
    }

    // Data loading methods
    async loadDefaultData() {
        try {
            // Try to load from generated files first
            await this.loadFromQuickOptions('json');
        } catch (error) {
            console.log('No generated files found, loading sample data');
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Use the existing sample data from graphData.js
        this.currentGraphData = { nodes: rawNodes, edges: rawEdges };
        this.processAndSetGraphData(this.currentGraphData);
    }

    processAndSetGraphData(data) {
        // Convert to the expected format
        const processedNodes = data.nodes.map(node => ({
            id: node.id,
            label: node.label,
            title: `${node.title || node.group}\n\nClick for more details`,
            group: node.group,
            font: { color: 'white' },
            shape: 'dot'
        }));

        const processedEdges = data.edges.map(edge => ({
            from: edge.from,
            to: edge.to,
            label: edge.label,
            title: `Relationship: ${edge.label}`,
            arrows: 'to'
        }));

        this.originalData = {
            nodes: new vis.DataSet(processedNodes),
            edges: new vis.DataSet(processedEdges)
        };

        this.filteredData = {
            nodes: new vis.DataSet(processedNodes),
            edges: new vis.DataSet(processedEdges)
        };

        this.currentGraphData = data;
        this.updateFiltersAfterDataLoad();
    }

    updateFiltersAfterDataLoad() {
        // Update filter options
        if (this.nodeFilter) {
            this.nodeFilter.clearOptions();
            this.nodeFilter.addOptions(getNodeGroups().map(group => ({value: group, text: group})));
        }

        if (this.relationshipFilter) {
            this.relationshipFilter.clearOptions();
            this.relationshipFilter.addOptions(getEdgeLabels().map(label => ({value: label, text: label})));
        }

        this.updateGraphInfo();
    }

    setupLoadEventListeners() {
        // File upload
        const fileInput = document.getElementById('fileInput');
        const fileUploadArea = document.getElementById('fileUploadArea');
        
        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        
        // Drag and drop
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });
        
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });
        
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // URL loading
        document.getElementById('loadFromURL').addEventListener('click', () => this.loadFromURL());
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadFromURL();
        });

        // Quick load buttons
        document.getElementById('loadKnowledgeGraphJSON').addEventListener('click', () => this.loadFromQuickOptions('json'));
        document.getElementById('loadKnowledgeGraphML').addEventListener('click', () => this.loadFromQuickOptions('graphml'));
        document.getElementById('loadKnowledgeGML').addEventListener('click', () => this.loadFromQuickOptions('gml'));

        // Other actions
        document.getElementById('clearGraph').addEventListener('click', () => this.clearGraph());
        document.getElementById('loadSampleData').addEventListener('click', () => this.loadSampleData());
    }

    async handleFileSelect(files) {
        if (files.length === 0) return;

        try {
            this.showLoading('Loading graph data...');
            
            let data;
            if (files.length === 1) {
                data = await this.dataLoader.loadFromFile(files[0]);
            } else {
                data = await this.dataLoader.loadMultipleFiles(files);
            }

            this.processAndSetGraphData(data);
            this.hideLoad();
            this.hideLoading();
            
            this.uiController.showNotification(
                `Loaded ${data.nodes.length} nodes and ${data.edges.length} edges successfully!`, 
                'success'
            );

            // Update file list display
            this.updateFileListDisplay(files, data);

        } catch (error) {
            this.hideLoading();
            console.error('Failed to load files:', error);
            this.uiController.showNotification('Failed to load files: ' + error.message, 'error');
        }
    }

    async loadFromURL() {
        const url = document.getElementById('urlInput').value.trim();
        if (!url) return;

        try {
            this.showLoading('Loading from URL...');
            const data = await this.dataLoader.loadFromURL(url);
            
            this.processAndSetGraphData(data);
            this.hideLoad();
            this.hideLoading();
            
            this.uiController.showNotification(
                `Loaded ${data.nodes.length} nodes and ${data.edges.length} edges from URL!`, 
                'success'
            );

        } catch (error) {
            this.hideLoading();
            console.error('Failed to load from URL:', error);
            this.uiController.showNotification('Failed to load from URL: ' + error.message, 'error');
        }
    }

    async loadFromQuickOptions(format) {
        const fileMap = {
            'json': '../graph/knowledge_graph.json',
            'graphml': '../graph/knowledge_graph.graphml', 
            'gml': '../graph/knowledge_graph.gml'
        };

        const url = fileMap[format];
        if (!url) return;

        try {
            this.showLoading(`Loading ${format.toUpperCase()} file...`);
            const data = await this.dataLoader.loadFromURL(url);
            
            this.processAndSetGraphData(data);
            this.hideLoad();
            this.hideLoading();
            
            this.uiController.showNotification(
                `Loaded graph from ${format.toUpperCase()} file successfully!`, 
                'success'
            );

        } catch (error) {
            this.hideLoading();
            console.log(`Could not load ${format} file:`, error.message);
            throw error; // Re-throw so caller can handle fallback
        }
    }

    clearGraph() {
        this.currentGraphData = { nodes: [], edges: [] };
        this.processAndSetGraphData(this.currentGraphData);
        this.hideLoad();
        this.uiController.showNotification('Graph cleared', 'info');
    }

    updateFileListDisplay(files, data) {
        const selectedFilesDiv = document.getElementById('selectedFiles');
        selectedFilesDiv.innerHTML = '';

        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            `;
            selectedFilesDiv.appendChild(fileItem);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Modal methods
    showLoad() {
        document.getElementById('loadModal').classList.add('visible');
    }

    hideLoad() {
        document.getElementById('loadModal').classList.remove('visible');
    }
}

// Update the global function references for the new methods
window.getNodeGroups = () => {
    if (window.knowledgeGraphApp && window.knowledgeGraphApp.currentGraphData) {
        return [...new Set(window.knowledgeGraphApp.currentGraphData.nodes.map(node => node.group))].sort();
    }
    return [];
};

window.getEdgeLabels = () => {
    if (window.knowledgeGraphApp && window.knowledgeGraphApp.currentGraphData) {
        return [...new Set(window.knowledgeGraphApp.currentGraphData.edges.map(edge => edge.label))].sort();
    }
    return [];
};

window.searchNodes = (query) => {
    if (!window.knowledgeGraphApp || !window.knowledgeGraphApp.currentGraphData || !query) return [];
    
    const searchTerm = query.toLowerCase();
    return window.knowledgeGraphApp.currentGraphData.nodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm) ||
        (node.title && node.title.toLowerCase().includes(searchTerm))
    );
};

window.getGraphStats = () => {
    if (!window.knowledgeGraphApp || !window.knowledgeGraphApp.currentGraphData) {
        return { nodeCount: 0, edgeCount: 0, nodeGroups: 0, edgeTypes: 0 };
    }
    
    const { nodes, edges } = window.knowledgeGraphApp.currentGraphData;
    const nodeGroups = window.getNodeGroups();
    const edgeLabels = window.getEdgeLabels();
    
    // Calculate degree distribution
    const degrees = {};
    edges.forEach(edge => {
        degrees[edge.from] = (degrees[edge.from] || 0) + 1;
        degrees[edge.to] = (degrees[edge.to] || 0) + 1;
    });
    
    const degreeValues = Object.values(degrees);
    const avgDegree = degreeValues.length > 0 ? 
        degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length : 0;
    const maxDegree = degreeValues.length > 0 ? Math.max(...degreeValues) : 0;
    
    // Group distribution
    const groupCounts = {};
    nodes.forEach(node => {
        groupCounts[node.group] = (groupCounts[node.group] || 0) + 1;
    });
    
    return {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeGroups: nodeGroups.length,
        edgeTypes: edgeLabels.length,
        avgDegree: avgDegree.toFixed(2),
        maxDegree,
        groupDistribution: groupCounts,
        density: nodes.length > 1 ? ((2 * edges.length) / (nodes.length * (nodes.length - 1))).toFixed(6) : 0
    };
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.knowledgeGraphApp = new KnowledgeGraphApp();
});