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
        this.isInitializing = true;
        
        this.init();
    }

    async init() {
        try {
            this.showLoading('Initializing application...');
            
            // Initialize controllers
            console.log('Initializing controllers...');
            this.uiController = new UIController(this);
            this.exportController = new ExportController(this);
            this.dataLoader = new DataLoader();
            
            // Initialize graph controller but don't create network yet
            console.log('Initializing graph...');
            this.graphController = new GraphController(this);
            
            // Setup UI
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('Setting up filters...');
            this.setupFilters();
            
            // Start with empty graph - just show welcome message
            console.log('Starting with empty graph - use Load button to add data');
            this.currentGraphData = { nodes: [], edges: [] };
            
            // Show welcome message immediately without network initialization
            this.showEmptyGraphMessage();
            
            this.isInitializing = false; // Initialization complete
            this.hideLoading();
            console.log('Knowledge Graph App initialized successfully');
            
            // Setup load event listeners last
            setTimeout(() => {
                try {
                    console.log('Setting up load event listeners...');
                    this.setupLoadEventListeners();
                    console.log('Load event listeners setup completed');
                } catch (error) {
                    console.error('Error setting up load event listeners:', error);
                }
            }, 500);
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            console.error('Error stack:', error.stack);
            // Don't show alert - just log the error
            console.error('Application initialization failed, but continuing...');
        }
    }

    setupEventListeners() {
        try {
            console.log('Setting up event listeners...');
            
            // Graph events will be attached after network initialization in attachGraphEventListeners()

            // UI events with error checking
            const addEventListenerSafe = (id, event, handler) => {
                try {
                    const element = document.getElementById(id);
                    if (element) {
                        element.addEventListener(event, handler);
                        console.log(`✓ Added listener for ${id}`);
                    } else {
                        console.warn(`✗ Element with id '${id}' not found`);
                    }
                } catch (error) {
                    console.error(`✗ Error adding listener for ${id}:`, error);
                }
            };

            addEventListenerSafe('resetFilters', 'click', () => this.resetFilters());
            addEventListenerSafe('centerGraph', 'click', () => this.centerGraph());
            addEventListenerSafe('searchInput', 'input', (e) => this.handleSearch(e.target.value));
            
            // Header controls
            addEventListenerSafe('loadBtn', 'click', () => this.showLoad());
            addEventListenerSafe('statsBtn', 'click', () => this.showStats());
            addEventListenerSafe('exportBtn', 'click', () => this.showExport());
            addEventListenerSafe('fullscreenBtn', 'click', () => this.toggleFullscreen());
            
            // Modal controls
            addEventListenerSafe('closeStats', 'click', () => this.hideStats());
            addEventListenerSafe('closeExport', 'click', () => this.hideExport());
            addEventListenerSafe('closeLoad', 'click', () => this.hideLoad());
            addEventListenerSafe('closeInfo', 'click', () => this.hideInfo());
            
            // Export actions
            addEventListenerSafe('exportPNG', 'click', () => this.exportController.exportPNG());
            
            // Controls toggle
            addEventListenerSafe('toggleControls', 'click', () => this.toggleControls());
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
            
            // Load actions will be setup after full initialization
            
            console.log('Event listeners setup completed');
        } catch (error) {
            console.error('Error in setupEventListeners:', error);
            throw error;
        }
    }

    attachGraphEventListeners() {
        if (this.network) {
            console.log('Attaching graph event listeners...');
            this.network.on('click', (params) => this.handleNodeClick(params));
            this.network.on('hoverNode', (params) => this.handleNodeHover(params));
            this.network.on('blurNode', () => this.handleNodeBlur());
            this.network.on('stabilizationProgress', (params) => this.updateStabilizationProgress(params));
            this.network.on('stabilizationIterationsDone', () => this.hideStabilizationProgress());
        } else {
            console.warn('Attempted to attach graph listeners, but network is not initialized.');
        }
    }

    setupFilters() {
        try {
            // Check if TomSelect is available
            if (typeof TomSelect === 'undefined') {
                console.warn('TomSelect not loaded, filters disabled');
                return;
            }

            // Check if filter elements exist
            const nodeFilterEl = document.getElementById('nodeFilter');
            const relationshipFilterEl = document.getElementById('relationshipFilter');
            
            if (!nodeFilterEl || !relationshipFilterEl) {
                console.warn('Filter elements not found');
                return;
            }

            // Initialize filters with empty options (will be populated when data loads)
            const nodeFilter = new TomSelect('#nodeFilter', {
                plugins: ['remove_button'],
                maxItems: null,
                options: [],
                onItemAdd: () => this.applyFilters(),
                onItemRemove: () => this.applyFilters()
            });

            // Relationship filter
            const relationshipFilter = new TomSelect('#relationshipFilter', {
                plugins: ['remove_button'],
                maxItems: null,
                options: [],
                onItemAdd: () => this.applyFilters(),
                onItemRemove: () => this.applyFilters()
            });

            this.nodeFilter = nodeFilter;
            this.relationshipFilter = relationshipFilter;
            console.log('Filters initialized successfully');
        } catch (error) {
            console.error('Failed to setup filters:', error);
        }
    }

    applyFilters() {
        if (!this.nodeFilter || !this.relationshipFilter || !this.originalData) {
            console.log('Filters not ready, skipping filter application');
            return;
        }
        
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
        
        // Check if we have data and network ready
        if (!this.filteredData || !this.filteredData.nodes) {
            console.log('Search: No data available yet');
            return;
        }
        
        const searchTerm = query.toLowerCase();
        
        // Get all current nodes from the DataSet
        const allNodes = this.filteredData.nodes.get();
        
        // Find matching nodes
        const searchResults = allNodes.filter(node => 
            node.label.toLowerCase().includes(searchTerm) ||
            (node.title && node.title.toLowerCase().includes(searchTerm)) ||
            (node.group && node.group.toLowerCase().includes(searchTerm))
        );
        
        const resultIds = new Set(searchResults.map(node => node.id));
        
        // Highlight search results
        const updatedNodes = allNodes.map(node => ({
            ...node,
            color: resultIds.has(node.id) ? '#e74c3c' : undefined,
            borderWidth: resultIds.has(node.id) ? 3 : 1
        }));
        
        this.filteredData.nodes.update(updatedNodes);
        
        // Focus on first result if any and network is ready
        if (searchResults.length > 0 && this.network) {
            try {
                this.network.selectNodes([searchResults[0].id]);
                this.network.focus(searchResults[0].id, {scale: 1.5});
                console.log(`Search found ${searchResults.length} results, focused on: ${searchResults[0].label}`);
            } catch (error) {
                console.log('Search highlighting successful, but network focus failed:', error.message);
            }
        } else if (searchResults.length > 0) {
            console.log(`Search found ${searchResults.length} results, but network not ready for focus`);
        } else {
            console.log('No search results found');
        }
    }

    handleNodeClick(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const nodeData = this.originalData.nodes.get(nodeId);
            this.showNodeInfo(nodeData);
        }
    }

    handleNodeHover() {
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
        const stats = window.getGraphStats();
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
        // Clear filters if they exist
        if (this.nodeFilter) this.nodeFilter.clear();
        if (this.relationshipFilter) this.relationshipFilter.clear();
        
        // Clear search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        // Reset to original data if available
        if (this.filteredData && this.originalData) {
            this.filteredData.nodes.clear();
            this.filteredData.edges.clear();
            this.filteredData.nodes.add(this.originalData.nodes.get());
            this.filteredData.edges.add(this.originalData.edges.get());
            this.updateGraphInfo();
        }
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
        this.hideLoading();
        console.log('Network stabilization complete');
    }

    showLoading(message) {
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        
        console.log('Loading:', message);
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        if (loadingBar) {
            // Use the CSS styling, just make it visible
            loadingBar.style.display = 'block';
            loadingBar.style.opacity = '1';
            loadingBar.style.zIndex = '10000';
        }
        
        // Reset progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.style.backgroundColor = '#3498db';
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
        console.error('Error:', message);
        // Just log errors during app lifecycle - no blocking alerts
    }

    updateGraphInfo() {
        const nodeCount = this.filteredData.nodes.length;
        const edgeCount = this.filteredData.edges.length;
        
        // Update any status displays
        console.log(`Graph updated: ${nodeCount} nodes, ${edgeCount} edges`);
    }


    showEmptyGraphMessage() {
        const networkContainer = document.getElementById('networkContainer');
        if (networkContainer) {
            networkContainer.style.display = 'none';
        }
        
        // Create or show empty graph message
        let emptyMessage = document.getElementById('emptyGraphMessage');
        if (!emptyMessage) {
            emptyMessage = document.createElement('div');
            emptyMessage.id = 'emptyGraphMessage';
            emptyMessage.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 60vh;
                text-align: center;
                color: #bdc3c7;
                font-size: 18px;
                background: transparent;
            `;
            emptyMessage.innerHTML = `
                <div style="font-size: 64px; margin-bottom: 20px;">🕸️</div>
                <h2 style="color: #3498db; margin: 0 0 10px 0;">Welcome to Knowledge Graph Explorer</h2>
                <p style="margin: 0 0 20px 0;">No graph data loaded</p>
                <p style="margin: 0; font-size: 16px;">Click the <strong>📁 Load Graph</strong> button to get started</p>
            `;
            
            // Insert after network container
            const graphContainer = document.querySelector('.graph-container');
            if (graphContainer) {
                graphContainer.appendChild(emptyMessage);
            }
        } else {
            emptyMessage.style.display = 'flex';
        }
    }

    hideEmptyGraphMessage() {
        const emptyMessage = document.getElementById('emptyGraphMessage');
        
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        // Don't show network container yet - wait until graph is ready
    }

    showNetworkContainer() {
        const networkContainer = document.getElementById('networkContainer');
        if (networkContainer) {
            networkContainer.style.display = 'block';
        }
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


    async processAndSetGraphData(data) {
        // Only process if we have actual data
        if (data.nodes.length === 0) {
            console.log('No data to process, showing empty state');
            this.currentGraphData = { nodes: [], edges: [] };
            this.showEmptyGraphMessage();
            return;
        }
        
        // Hide empty graph message when loading real data
        this.hideEmptyGraphMessage();
        
        // Initial showLoading for this phase
        this.showLoading('Processing graph (Step 1/5)...');
        await this.delay(100);
        
        // Get loading text element once for efficiency
        const loadingText = document.getElementById('loadingText');
        
        // Convert to the expected format with performance improvements
        console.log(`Processing graph with ${data.nodes.length} nodes and ${data.edges.length} edges`);
        
        const processedNodes = data.nodes.map(node => ({
            id: node.id,
            label: node.label,
            title: node.label,
            group: node.group || node.type || 'default',
            type: node.type || node.group || 'default',
            font: { color: 'white' },
            shape: 'dot'
        }));

        if (loadingText) loadingText.textContent = 'Processing relationships (Step 2/5)...';
        await this.delay(100);
        
        const processedEdges = data.edges.map(edge => ({
            from: edge.from,
            to: edge.to,
            label: edge.label,
            title: `Relationship: ${edge.label}`,
            arrows: 'to'
        }));

        if (loadingText) loadingText.textContent = 'Creating network visualization (Step 3/5)...';
        await this.delay(100);

        this.originalData = {
            nodes: new vis.DataSet(processedNodes),
            edges: new vis.DataSet(processedEdges)
        };

        this.filteredData = {
            nodes: new vis.DataSet(processedNodes),
            edges: new vis.DataSet(processedEdges)
        };

        this.currentGraphData = { nodes: processedNodes, edges: processedEdges };
        
        if (loadingText) loadingText.textContent = 'Setting up filters (Step 4/5)...';
        await this.delay(100);
        this.updateFiltersAfterDataLoad();
        
        if (loadingText) loadingText.textContent = 'Rendering network (Step 5/5)... This may take a moment for large graphs.';
        await this.delay(100);
        
        // Use setTimeout to allow UI to update before heavy graph rendering
        setTimeout(async () => {
            // Initialize network if not already done
            if (!this.network) {
                console.log('Initializing network for first time...');
                await this.graphController.initializeGraph();
                this.attachGraphEventListeners();
            }
            
            if (this.network) {
                // This showLoading starts the stabilization phase at 0%
                this.showLoading('Stabilizing network layout... 0%');
                this.network.setData(this.filteredData);
                this.showNetworkContainer();
            }
        }, 200);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateFiltersAfterDataLoad() {
        // Update filter options based on current data
        console.log('Updating filters with data:', this.currentGraphData.nodes.length, 'nodes');
        console.log('Filter states:', { nodeFilter: !!this.nodeFilter, relationshipFilter: !!this.relationshipFilter });
        
        // Wait a bit for filters to be ready if they're not initialized yet
        if (!this.nodeFilter || !this.relationshipFilter) {
            console.log('Filters not ready, retrying in 500ms...');
            setTimeout(() => this.updateFiltersAfterDataLoad(), 500);
            return;
        }
        
        try {
            // Update node filter
            this.nodeFilter.clearOptions();
            const nodeGroups = [...new Set(this.currentGraphData.nodes.map(node => node.group || node.type))].sort();
            console.log('Node groups found:', nodeGroups);
            
            const nodeOptions = nodeGroups.map(group => ({value: group, text: group}));
            console.log('Adding node options:', nodeOptions);
            this.nodeFilter.addOptions(nodeOptions);
            
            // Update relationship filter
            this.relationshipFilter.clearOptions();
            const edgeLabels = [...new Set(this.currentGraphData.edges.map(edge => edge.label))].sort();
            console.log('Edge labels found:', edgeLabels.length, 'unique labels');
            
            const edgeOptions = edgeLabels.map(label => ({value: label, text: label}));
            console.log('Adding edge options:', edgeOptions.slice(0, 5), '...');
            this.relationshipFilter.addOptions(edgeOptions);
            
            console.log('Filters updated successfully');
        } catch (error) {
            console.error('Error updating filters:', error);
        }

        this.updateGraphInfo();
    }

    setupLoadEventListeners() {
        try {
            console.log('Setting up load event listeners...');
            
            // Safe event listener helper
            const addEventListenerSafe = (id, event, handler) => {
                try {
                    const element = document.getElementById(id);
                    if (element) {
                        element.addEventListener(event, handler);
                        console.log(`✓ Load listener added for ${id}`);
                    } else {
                        console.warn(`✗ Load element '${id}' not found`);
                    }
                } catch (error) {
                    console.error(`✗ Error adding load listener for ${id}:`, error);
                }
            };

            // File upload
            try {
                const fileInput = document.getElementById('fileInput');
                const fileUploadArea = document.getElementById('fileUploadArea');
                
                if (fileUploadArea && fileInput) {
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
                    console.log('✓ File upload listeners added');
                } else {
                    console.warn('✗ File upload elements not found:', { fileInput: !!fileInput, fileUploadArea: !!fileUploadArea });
                }
            } catch (error) {
                console.error('✗ Error setting up file upload:', error);
            }

            // URL loading
            addEventListenerSafe('loadFromURL', 'click', () => this.loadFromURL());
            addEventListenerSafe('urlInput', 'keypress', (e) => {
                if (e.key === 'Enter') this.loadFromURL();
            });

            // Quick load buttons
            addEventListenerSafe('loadKnowledgeGraphJSON', 'click', () => this.loadFromQuickOptions('json'));
            addEventListenerSafe('loadKnowledgeGraphML', 'click', () => this.loadFromQuickOptions('graphml'));
            addEventListenerSafe('loadKnowledgeGML', 'click', () => this.loadFromQuickOptions('gml'));

            // Other actions
            addEventListenerSafe('clearGraph', 'click', () => this.clearGraph());
            
            console.log('Load event listeners setup completed successfully');
        } catch (error) {
            console.error('Critical error in setupLoadEventListeners:', error);
            // Don't throw - just log
        }
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

            await this.processAndSetGraphData(data);
            this.hideLoad();
            
            this.uiController.showNotification(
                `Loaded ${data.nodes.length} nodes and ${data.edges.length} edges successfully!`, 
                'success'
            );

            // Update file list display
            this.updateFileListDisplay(files);

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
            
            await this.processAndSetGraphData(data);
            this.hideLoad();
            
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
        console.log(`Quick load requested for format: ${format}`);
        
        const fileMap = {
            'json': './graph/knowledge_graph.json',
            'graphml': './graph/knowledge_graph.graphml', 
            'gml': './graph/knowledge_graph.gml'
        };

        const url = fileMap[format];
        if (!url) {
            console.error(`No URL found for format: ${format}`);
            return;
        }

        console.log(`Loading from URL: ${url}`);

        try {
            this.showLoading(`Loading ${format.toUpperCase()} file...`);
            const data = await this.dataLoader.loadFromURL(url);
            
            console.log(`Loaded data:`, data.nodes.length, 'nodes,', data.edges.length, 'edges');
            
            await this.processAndSetGraphData(data);
            this.hideLoad();
            
            if (this.uiController) {
                this.uiController.showNotification(
                    `Loaded graph from ${format.toUpperCase()} file successfully!`, 
                    'success'
                );
            }

        } catch (error) {
            this.hideLoading();
            console.error(`Could not load ${format} file:`, error);
            alert(`Failed to load ${format} file: ${error.message}`);
        }
    }

    clearGraph() {
        this.currentGraphData = { nodes: [], edges: [] };
        this.processAndSetGraphData(this.currentGraphData);
        this.hideLoad();
        this.uiController.showNotification('Graph cleared', 'info');
    }

    updateFileListDisplay(files) {
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