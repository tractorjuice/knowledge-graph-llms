export class GraphController {
    constructor(app) {
        this.app = app;
        this.network = null;
        this.container = null;
    }

    async initializeGraph() {
        try {
            this.container = document.getElementById('networkContainer');
            if (!this.container) {
                throw new Error('Network container not found');
            }

            // Import network options
            const { networkOptions } = await import('./graphData.js');
            
            // Create the network
            this.network = new vis.Network(
                this.container,
                this.app.getFilteredData(),
                networkOptions
            );

            // Set the network reference in the app
            this.app.setNetwork(this.network);

            // Setup network event handlers
            this.setupNetworkEvents();

            console.log('Graph initialized successfully');
            return this.network;

        } catch (error) {
            console.error('Failed to initialize graph:', error);
            throw error;
        }
    }

    setupNetworkEvents() {
        if (!this.network) return;

        // Stabilization events
        this.network.on('stabilizationProgress', (params) => {
            this.app.updateStabilizationProgress(params);
        });

        this.network.on('stabilizationIterationsDone', () => {
            this.app.hideStabilizationProgress();
        });

        // Selection events
        this.network.on('selectNode', (params) => {
            this.handleNodeSelection(params);
        });

        this.network.on('deselectNode', (params) => {
            this.handleNodeDeselection(params);
        });

        // Hover events
        this.network.on('hoverNode', (params) => {
            this.handleNodeHover(params);
        });

        this.network.on('blurNode', (params) => {
            this.handleNodeBlur(params);
        });

        // Click events
        this.network.on('click', (params) => {
            this.handleNetworkClick(params);
        });

        // Double click for focus
        this.network.on('doubleClick', (params) => {
            this.handleDoubleClick(params);
        });

        // Context menu (right click)
        this.network.on('oncontext', (params) => {
            this.handleContextMenu(params);
        });

        // Zoom events
        this.network.on('zoom', (params) => {
            this.handleZoom(params);
        });
    }

    handleNodeSelection(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            this.highlightConnectedNodes(nodeId);
        }
    }

    handleNodeDeselection(params) {
        this.resetNodeHighlighting();
    }

    handleNodeHover(params) {
        const nodeId = params.node;
        this.showNodeTooltip(nodeId, params.pointer.DOM);
    }

    handleNodeBlur(params) {
        this.hideNodeTooltip();
    }

    handleNetworkClick(params) {
        // This will be handled by the main app
    }

    handleDoubleClick(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            this.focusOnNode(nodeId);
        } else {
            // Double click on empty space - fit the graph
            this.network.fit();
        }
    }

    handleContextMenu(params) {
        params.event.preventDefault();
        
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            this.showNodeContextMenu(nodeId, params.pointer.DOM);
        }
    }

    handleZoom(params) {
        // Could be used to adjust node/edge scaling based on zoom level
        const scale = this.network.getScale();
        
        // Adjust font sizes based on zoom level
        if (scale < 0.5) {
            this.adjustFontSizes('small');
        } else if (scale > 2) {
            this.adjustFontSizes('large');
        } else {
            this.adjustFontSizes('normal');
        }
    }

    highlightConnectedNodes(nodeId) {
        const connectedNodes = this.network.getConnectedNodes(nodeId);
        const connectedEdges = this.network.getConnectedEdges(nodeId);
        
        // Get all nodes and edges
        const allNodes = this.app.getFilteredData().nodes.get();
        const allEdges = this.app.getFilteredData().edges.get();
        
        // Create highlighted versions
        const highlightedNodes = allNodes.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    color: { background: '#e74c3c', border: '#c0392b' },
                    borderWidth: 3,
                    font: { ...node.font, size: 16 }
                };
            } else if (connectedNodes.includes(node.id)) {
                return {
                    ...node,
                    color: { background: '#3498db', border: '#2980b9' },
                    borderWidth: 2,
                    font: { ...node.font, size: 14 }
                };
            } else {
                return {
                    ...node,
                    color: { background: 'rgba(200,200,200,0.3)', border: 'rgba(200,200,200,0.5)' },
                    font: { ...node.font, color: 'rgba(255,255,255,0.3)' }
                };
            }
        });
        
        const highlightedEdges = allEdges.map(edge => {
            if (connectedEdges.includes(edge.id)) {
                return {
                    ...edge,
                    color: { color: '#3498db', highlight: '#e74c3c' },
                    width: 3
                };
            } else {
                return {
                    ...edge,
                    color: { color: 'rgba(200,200,200,0.2)' },
                    width: 1
                };
            }
        });
        
        // Update the graph
        this.app.getFilteredData().nodes.update(highlightedNodes);
        this.app.getFilteredData().edges.update(highlightedEdges);
    }

    resetNodeHighlighting() {
        // Reset all nodes and edges to their original appearance
        const originalNodes = this.app.getOriginalData().nodes.get();
        const originalEdges = this.app.getOriginalData().edges.get();
        
        // Filter to only include currently visible nodes/edges
        const visibleNodeIds = new Set(this.app.getFilteredData().nodes.getIds());
        const visibleEdgeIds = new Set(this.app.getFilteredData().edges.getIds());
        
        const resetNodes = originalNodes.filter(node => visibleNodeIds.has(node.id));
        const resetEdges = originalEdges.filter(edge => visibleEdgeIds.has(edge.id));
        
        this.app.getFilteredData().nodes.update(resetNodes);
        this.app.getFilteredData().edges.update(resetEdges);
    }

    showNodeTooltip(nodeId, position) {
        // Could implement custom tooltips here
        // For now, using the built-in title attribute
    }

    hideNodeTooltip() {
        // Hide any custom tooltips
    }

    focusOnNode(nodeId) {
        this.network.focus(nodeId, {
            scale: 1.5,
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
    }

    showNodeContextMenu(nodeId, position) {
        // Could implement context menu here
        console.log('Context menu for node:', nodeId, 'at position:', position);
    }

    adjustFontSizes(sizeCategory) {
        // Adjust font sizes based on zoom level
        const sizes = {
            small: { node: 10, edge: 8 },
            normal: { node: 14, edge: 12 },
            large: { node: 18, edge: 14 }
        };
        
        const size = sizes[sizeCategory] || sizes.normal;
        
        // This would require updating the network options
        // Implementation depends on specific requirements
    }

    // Public methods for external control
    fit() {
        if (this.network) {
            this.network.fit();
        }
    }

    getScale() {
        return this.network ? this.network.getScale() : 1;
    }

    getViewPosition() {
        return this.network ? this.network.getViewPosition() : { x: 0, y: 0 };
    }

    moveTo(position) {
        if (this.network) {
            this.network.moveTo(position);
        }
    }

    selectNodes(nodeIds) {
        if (this.network) {
            this.network.selectNodes(nodeIds);
        }
    }

    unselectAll() {
        if (this.network) {
            this.network.unselectAll();
        }
    }

    redraw() {
        if (this.network) {
            this.network.redraw();
        }
    }

    destroy() {
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }
    }
}