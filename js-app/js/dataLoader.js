export class DataLoader {
    constructor() {
        this.supportedFormats = ['json', 'graphml', 'gml'];
    }

    async loadFromFile(file) {
        const extension = this.getFileExtension(file.name).toLowerCase();
        
        if (!this.supportedFormats.includes(extension)) {
            throw new Error(`Unsupported file format: ${extension}. Supported formats: ${this.supportedFormats.join(', ')}`);
        }

        const content = await this.readFileContent(file);
        
        switch (extension) {
            case 'json':
                return this.parseJSON(content);
            case 'graphml':
                return this.parseGraphML(content);
            case 'gml':
                return this.parseGML(content);
            default:
                throw new Error(`Unknown format: ${extension}`);
        }
    }

    async loadFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const extension = this.getFileExtension(url).toLowerCase();
            const content = await response.text();
            
            switch (extension) {
                case 'json':
                    return this.parseJSON(content);
                case 'graphml':
                    return this.parseGraphML(content);
                case 'gml':
                    return this.parseGML(content);
                default:
                    // Try to detect format from content
                    return this.autoDetectAndParse(content);
            }
        } catch (error) {
            throw new Error(`Failed to load from URL: ${error.message}`);
        }
    }

    async loadFromLocalStorage(key) {
        const content = localStorage.getItem(key);
        if (!content) {
            throw new Error(`No data found in localStorage with key: ${key}`);
        }
        
        try {
            return this.parseJSON(content);
        } catch (error) {
            throw new Error(`Failed to parse localStorage data: ${error.message}`);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseJSON(content) {
        try {
            const data = JSON.parse(content);
            
            // Handle different JSON structures
            if (data.nodes && data.edges) {
                // Direct nodes/edges format
                return {
                    nodes: this.normalizeNodes(data.nodes),
                    edges: this.normalizeEdges(data.edges),
                    metadata: data.metadata || {}
                };
            } else if (data.elements) {
                // Cytoscape format
                return this.parseCytoscapeFormat(data);
            } else if (Array.isArray(data)) {
                // Array of objects - try to detect structure
                return this.parseArrayFormat(data);
            } else {
                throw new Error('Unrecognized JSON structure');
            }
        } catch (error) {
            throw new Error(`JSON parsing failed: ${error.message}`);
        }
    }

    parseGraphML(content) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            
            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid XML format');
            }

            const nodes = [];
            const edges = [];
            
            // Parse key definitions
            const keys = {};
            xmlDoc.querySelectorAll('key').forEach(key => {
                keys[key.getAttribute('id')] = {
                    for: key.getAttribute('for'),
                    name: key.getAttribute('attr.name'),
                    type: key.getAttribute('attr.type')
                };
            });

            // Parse nodes
            xmlDoc.querySelectorAll('node').forEach(nodeEl => {
                const node = {
                    id: nodeEl.getAttribute('id'),
                    label: nodeEl.getAttribute('id'), // Default label
                    group: 'default',
                    title: ''
                };

                // Parse data elements
                nodeEl.querySelectorAll('data').forEach(dataEl => {
                    const keyId = dataEl.getAttribute('key');
                    const value = dataEl.textContent;
                    
                    if (keys[keyId]) {
                        const keyName = keys[keyId].name;
                        switch (keyName) {
                            case 'label':
                                node.label = value;
                                break;
                            case 'group':
                            case 'type':
                                node.group = value;
                                break;
                            case 'title':
                            case 'description':
                                node.title = value;
                                break;
                            default:
                                node[keyName] = value;
                        }
                    }
                });

                nodes.push(node);
            });

            // Parse edges
            xmlDoc.querySelectorAll('edge').forEach(edgeEl => {
                const edge = {
                    from: edgeEl.getAttribute('source'),
                    to: edgeEl.getAttribute('target'),
                    label: '',
                    arrows: 'to'
                };

                // Parse data elements
                edgeEl.querySelectorAll('data').forEach(dataEl => {
                    const keyId = dataEl.getAttribute('key');
                    const value = dataEl.textContent;
                    
                    if (keys[keyId]) {
                        const keyName = keys[keyId].name;
                        switch (keyName) {
                            case 'label':
                            case 'relationship':
                            case 'type':
                                edge.label = value;
                                break;
                            default:
                                edge[keyName] = value;
                        }
                    }
                });

                edges.push(edge);
            });

            return {
                nodes: this.normalizeNodes(nodes),
                edges: this.normalizeEdges(edges),
                metadata: { format: 'graphml', nodeCount: nodes.length, edgeCount: edges.length }
            };

        } catch (error) {
            throw new Error(`GraphML parsing failed: ${error.message}`);
        }
    }

    parseGML(content) {
        try {
            const nodes = [];
            const edges = [];
            
            // Simple GML parser - this could be enhanced for more complex GML files
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);
            
            let currentSection = null;
            let currentObject = null;
            let bracketCount = 0;
            
            for (const line of lines) {
                if (line.includes('[')) {
                    bracketCount += (line.match(/\[/g) || []).length;
                }
                if (line.includes(']')) {
                    bracketCount -= (line.match(/\]/g) || []).length;
                }
                
                if (line.startsWith('node [')) {
                    currentSection = 'node';
                    currentObject = { group: 'default', title: '' };
                } else if (line.startsWith('edge [')) {
                    currentSection = 'edge';
                    currentObject = { arrows: 'to' };
                } else if (line === ']' && bracketCount === 1) {
                    // End of current object
                    if (currentSection === 'node' && currentObject) {
                        if (!currentObject.label) currentObject.label = currentObject.id;
                        nodes.push(currentObject);
                    } else if (currentSection === 'edge' && currentObject) {
                        if (!currentObject.label) currentObject.label = 'related';
                        edges.push(currentObject);
                    }
                    currentSection = null;
                    currentObject = null;
                } else if (currentObject && line.includes(' ')) {
                    // Parse property
                    const spaceIndex = line.indexOf(' ');
                    const key = line.substring(0, spaceIndex);
                    let value = line.substring(spaceIndex + 1);
                    
                    // Remove quotes
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    
                    // Map common properties
                    switch (key) {
                        case 'id':
                            currentObject.id = value;
                            if (currentSection === 'node' && !currentObject.label) {
                                currentObject.label = value;
                            }
                            break;
                        case 'source':
                            currentObject.from = value;
                            break;
                        case 'target':
                            currentObject.to = value;
                            break;
                        case 'label':
                            currentObject.label = value;
                            break;
                        case 'group':
                        case 'type':
                            currentObject.group = value;
                            break;
                        case 'title':
                            currentObject.title = value;
                            break;
                        default:
                            currentObject[key] = value;
                    }
                }
            }

            return {
                nodes: this.normalizeNodes(nodes),
                edges: this.normalizeEdges(edges),
                metadata: { format: 'gml', nodeCount: nodes.length, edgeCount: edges.length }
            };

        } catch (error) {
            throw new Error(`GML parsing failed: ${error.message}`);
        }
    }

    autoDetectAndParse(content) {
        // Try to detect format from content
        content = content.trim();
        
        if (content.startsWith('{') || content.startsWith('[')) {
            return this.parseJSON(content);
        } else if (content.includes('<?xml') || content.includes('<graphml')) {
            return this.parseGraphML(content);
        } else if (content.includes('graph [') || content.includes('node [')) {
            return this.parseGML(content);
        } else {
            throw new Error('Could not detect file format');
        }
    }

    parseCytoscapeFormat(data) {
        const nodes = [];
        const edges = [];
        
        data.elements.forEach(element => {
            if (element.group === 'nodes') {
                nodes.push({
                    id: element.data.id,
                    label: element.data.label || element.data.id,
                    group: element.data.type || 'default',
                    title: element.data.title || element.data.type || 'default'
                });
            } else if (element.group === 'edges') {
                edges.push({
                    from: element.data.source,
                    to: element.data.target,
                    label: element.data.label || element.data.type || 'related',
                    arrows: 'to'
                });
            }
        });
        
        return {
            nodes: this.normalizeNodes(nodes),
            edges: this.normalizeEdges(edges),
            metadata: { format: 'cytoscape', nodeCount: nodes.length, edgeCount: edges.length }
        };
    }

    parseArrayFormat(data) {
        // Try to determine if it's nodes or edges
        const hasFromTo = data.some(item => item.from && item.to);
        const hasSourceTarget = data.some(item => item.source && item.target);
        
        if (hasFromTo || hasSourceTarget) {
            // It's edges
            return {
                nodes: [],
                edges: this.normalizeEdges(data),
                metadata: { format: 'array', edgeCount: data.length }
            };
        } else {
            // It's nodes
            return {
                nodes: this.normalizeNodes(data),
                edges: [],
                metadata: { format: 'array', nodeCount: data.length }
            };
        }
    }

    normalizeNodes(nodes) {
        return nodes.map(node => ({
            id: node.id || node.name || String(Math.random()),
            label: node.label || node.name || node.id || 'Unknown',
            group: node.group || node.type || node.category || 'default',
            title: node.title || node.description || node.group || node.type || 'Node'
        }));
    }

    normalizeEdges(edges) {
        return edges.map(edge => ({
            from: edge.from || edge.source || edge.src,
            to: edge.to || edge.target || edge.dest,
            label: edge.label || edge.relationship || edge.type || 'related',
            arrows: edge.arrows || 'to'
        }));
    }

    getFileExtension(filename) {
        return filename.split('.').pop() || '';
    }

    // Method to load multiple files and merge them
    async loadMultipleFiles(files) {
        const results = await Promise.all(
            Array.from(files).map(file => this.loadFromFile(file))
        );
        
        // Merge all results
        const mergedNodes = [];
        const mergedEdges = [];
        const metadata = { sources: [] };
        
        results.forEach((result, index) => {
            mergedNodes.push(...result.nodes);
            mergedEdges.push(...result.edges);
            metadata.sources.push({
                file: files[index].name,
                format: result.metadata.format,
                nodeCount: result.nodes.length,
                edgeCount: result.edges.length
            });
        });
        
        // Remove duplicate nodes (by id)
        const uniqueNodes = mergedNodes.filter((node, index, self) => 
            index === self.findIndex(n => n.id === node.id)
        );
        
        return {
            nodes: uniqueNodes,
            edges: mergedEdges,
            metadata: {
                ...metadata,
                totalNodes: uniqueNodes.length,
                totalEdges: mergedEdges.length,
                merged: true
            }
        };
    }
}