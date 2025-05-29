export class ExportController {
    constructor(app) {
        this.app = app;
    }

    exportJSON() {
        try {
            const data = this.prepareExportData();
            const jsonData = JSON.stringify(data, null, 2);
            
            this.downloadFile(jsonData, 'knowledge-graph.json', 'application/json');
            this.app.uiController.showNotification('Graph exported as JSON successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to export JSON:', error);
            this.app.uiController.showNotification('Failed to export JSON: ' + error.message, 'error');
        }
    }

    exportCSV() {
        try {
            const { nodes, edges } = this.prepareExportData();
            
            // Create CSV content for nodes
            const nodeHeaders = ['id', 'label', 'group', 'title'];
            const nodeRows = nodes.map(node => 
                nodeHeaders.map(header => this.escapeCsvValue(node[header] || '')).join(',')
            );
            const nodesCSV = [nodeHeaders.join(','), ...nodeRows].join('\n');
            
            // Create CSV content for edges
            const edgeHeaders = ['from', 'to', 'label', 'relationship_type'];
            const edgeRows = edges.map(edge => 
                edgeHeaders.map(header => this.escapeCsvValue(edge[header] || edge.label || '')).join(',')
            );
            const edgesCSV = [edgeHeaders.join(','), ...edgeRows].join('\n');
            
            // Download both files
            this.downloadFile(nodesCSV, 'knowledge-graph-nodes.csv', 'text/csv');
            setTimeout(() => {
                this.downloadFile(edgesCSV, 'knowledge-graph-edges.csv', 'text/csv');
            }, 100);
            
            this.app.uiController.showNotification('Graph exported as CSV files successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to export CSV:', error);
            this.app.uiController.showNotification('Failed to export CSV: ' + error.message, 'error');
        }
    }

    async exportPNG() {
        try {
            const network = this.app.getNetwork();
            if (!network) {
                throw new Error('Network not available');
            }

            this.app.uiController.showNotification('Generating PNG image...', 'info');

            // Fit the graph to get the best view
            network.fit();
            
            // Wait a moment for the fit to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the canvas from vis.js
            const canvas = await this.getNetworkCanvas();
            
            if (canvas) {
                // Convert to blob and download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'knowledge-graph.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    this.app.uiController.showNotification('Graph exported as PNG successfully!', 'success');
                }, 'image/png');
            } else {
                throw new Error('Could not access network canvas');
            }
            
        } catch (error) {
            console.error('Failed to export PNG:', error);
            this.app.uiController.showNotification('Failed to export PNG: ' + error.message, 'error');
        }
    }

    async getNetworkCanvas() {
        try {
            // Get the vis.js network canvas
            const container = document.getElementById('networkContainer');
            const canvas = container.querySelector('canvas');
            
            if (!canvas) {
                throw new Error('Canvas not found');
            }
            
            return canvas;
            
        } catch (error) {
            console.error('Error getting network canvas:', error);
            
            // Fallback: use html2canvas if available
            if (window.html2canvas) {
                const container = document.getElementById('networkContainer');
                return await html2canvas(container);
            }
            
            throw error;
        }
    }

    exportGraphML() {
        try {
            const { nodes, edges } = this.prepareExportData();
            const graphMLContent = this.generateGraphML(nodes, edges);
            
            this.downloadFile(graphMLContent, 'knowledge-graph.graphml', 'application/xml');
            this.app.uiController.showNotification('Graph exported as GraphML successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to export GraphML:', error);
            this.app.uiController.showNotification('Failed to export GraphML: ' + error.message, 'error');
        }
    }

    exportGML() {
        try {
            const { nodes, edges } = this.prepareExportData();
            const gmlContent = this.generateGML(nodes, edges);
            
            this.downloadFile(gmlContent, 'knowledge-graph.gml', 'text/plain');
            this.app.uiController.showNotification('Graph exported as GML successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to export GML:', error);
            this.app.uiController.showNotification('Failed to export GML: ' + error.message, 'error');
        }
    }

    prepareExportData() {
        const filteredData = this.app.getFilteredData();
        
        const nodes = filteredData.nodes.get().map(node => ({
            id: node.id,
            label: node.label,
            group: node.group,
            title: node.title || node.group
        }));
        
        const edges = filteredData.edges.get().map(edge => ({
            from: edge.from,
            to: edge.to,
            label: edge.label,
            relationship_type: edge.label
        }));
        
        return {
            nodes,
            edges,
            metadata: {
                exportDate: new Date().toISOString(),
                nodeCount: nodes.length,
                edgeCount: edges.length,
                source: 'Knowledge Graph Explorer v2.0'
            }
        };
    }

    generateGraphML(nodes, edges) {
        let graphML = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
         
  <!-- Key definitions -->
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="group" for="node" attr.name="group" attr.type="string"/>
  <key id="title" for="node" attr.name="title" attr.type="string"/>
  <key id="relationship" for="edge" attr.name="relationship" attr.type="string"/>
  
  <graph id="knowledge-graph" edgedefault="directed">
`;

        // Add nodes
        nodes.forEach(node => {
            graphML += `    <node id="${this.escapeXml(node.id)}">
      <data key="label">${this.escapeXml(node.label)}</data>
      <data key="group">${this.escapeXml(node.group)}</data>
      <data key="title">${this.escapeXml(node.title)}</data>
    </node>
`;
        });

        // Add edges
        edges.forEach((edge, index) => {
            graphML += `    <edge id="e${index}" source="${this.escapeXml(edge.from)}" target="${this.escapeXml(edge.to)}">
      <data key="relationship">${this.escapeXml(edge.label)}</data>
    </edge>
`;
        });

        graphML += `  </graph>
</graphml>`;

        return graphML;
    }

    generateGML(nodes, edges) {
        let gml = `graph [
  directed 1
  comment "Knowledge Graph exported from Knowledge Graph Explorer v2.0"
  
`;

        // Add nodes
        nodes.forEach(node => {
            gml += `  node [
    id "${this.escapeGmlString(node.id)}"
    label "${this.escapeGmlString(node.label)}"
    group "${this.escapeGmlString(node.group)}"
    title "${this.escapeGmlString(node.title)}"
  ]
  
`;
        });

        // Add edges
        edges.forEach(edge => {
            gml += `  edge [
    source "${this.escapeGmlString(edge.from)}"
    target "${this.escapeGmlString(edge.to)}"
    label "${this.escapeGmlString(edge.label)}"
  ]
  
`;
        });

        gml += `]`;

        return gml;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    escapeCsvValue(value) {
        if (typeof value !== 'string') {
            value = String(value);
        }
        
        // Escape double quotes and wrap in quotes if necessary
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        
        return value;
    }

    escapeXml(value) {
        if (typeof value !== 'string') {
            value = String(value);
        }
        
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    escapeGmlString(value) {
        if (typeof value !== 'string') {
            value = String(value);
        }
        
        return value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    // Method to export current view as SVG (if needed)
    async exportSVG() {
        try {
            // This would require converting the canvas to SVG
            // Implementation depends on specific requirements
            this.app.uiController.showNotification('SVG export not yet implemented', 'info');
            
        } catch (error) {
            console.error('Failed to export SVG:', error);
            this.app.uiController.showNotification('Failed to export SVG: ' + error.message, 'error');
        }
    }

    // Method to export filtered data summary
    exportSummary() {
        try {
            const data = this.prepareExportData();
            const stats = this.app.getGraphStats ? this.app.getGraphStats() : {};
            
            const summary = {
                ...data.metadata,
                statistics: stats,
                nodeTypes: [...new Set(data.nodes.map(n => n.group))].sort(),
                relationshipTypes: [...new Set(data.edges.map(e => e.label))].sort(),
                sampleNodes: data.nodes.slice(0, 10),
                sampleEdges: data.edges.slice(0, 10)
            };
            
            const summaryJson = JSON.stringify(summary, null, 2);
            this.downloadFile(summaryJson, 'knowledge-graph-summary.json', 'application/json');
            
            this.app.uiController.showNotification('Graph summary exported successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to export summary:', error);
            this.app.uiController.showNotification('Failed to export summary: ' + error.message, 'error');
        }
    }
}