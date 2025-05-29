# Knowledge Graph Explorer - JavaScript App

A modern, standalone JavaScript application for exploring knowledge graphs with interactive visualization, filtering, and export capabilities.

## 🚀 Features

### Interactive Visualization
- **High-performance rendering** using vis.js with forceAtlas2 physics
- **Dynamic node highlighting** with connected node emphasis
- **Responsive design** that adapts to different screen sizes
- **Dark theme** optimized for long viewing sessions

### Flexible Data Loading
- **File Upload**: Drag & drop or click to upload JSON, GraphML, GML files
- **URL Loading**: Load graph data directly from web URLs
- **Quick Load**: One-click loading of generated graph files
- **Multiple Formats**: Support for JSON, GraphML, GML with auto-detection
- **Multiple Files**: Merge data from multiple files automatically

### Advanced Filtering
- **Multi-select filters** for node types and relationship types
- **Real-time search** with instant result highlighting
- **Visual feedback** for filtered elements
- **Quick reset** to restore original view

### Export Capabilities
- **JSON**: Standard format for data exchange and analysis
- **CSV**: Separate files for nodes and edges (Excel/data analysis)
- **PNG**: High-quality image export of current graph view
- **GraphML**: XML format for advanced network analysis (Gephi, yEd)
- **GML**: Graph Modeling Language for research tools

### User Experience
- **Keyboard shortcuts** for power users (Ctrl+F, Ctrl+R, Ctrl+S, etc.)
- **Responsive layout** for desktop, tablet, and mobile
- **Fullscreen mode** for immersive exploration
- **Progress indicators** for long operations
- **Accessibility features** with screen reader support

## 📁 Project Structure

```
js-app/
├── index.html              # Main HTML file
├── styles.css              # Complete CSS styling
├── js/
│   ├── app.js              # Main application controller
│   ├── graphData.js        # Graph data and configuration
│   ├── graphController.js  # Graph interaction logic
│   ├── uiController.js     # UI and responsive design
│   └── exportController.js # Export functionality
└── README.md              # This file
```

## 🛠️ Installation & Setup

### Option 1: Direct File Access
```bash
# Simply open index.html in a modern web browser
open index.html
# or
python -m http.server 8000  # Then visit http://localhost:8000
```

### Option 2: Local Development Server
```bash
# Using Node.js
npx serve .

# Using Python
python -m http.server 8000

# Using PHP
php -S localhost:8000
```

### Option 3: Web Server Deployment
Upload the entire `js-app` folder to any web server. The app is completely self-contained.

## 🎮 Usage Guide

### Loading Graph Data
1. **Click "📁 Load Graph"** in the header to open the load dialog
2. **Choose your loading method**:
   - **File Upload**: Drag & drop or click to select JSON/GraphML/GML files
   - **URL Loading**: Enter a direct URL to a graph file
   - **Quick Load**: One-click loading of generated files from the main app
   - **Sample Data**: Load built-in sample data for testing

### Basic Navigation
- **Drag**: Click and drag to pan the graph
- **Zoom**: Mouse wheel or pinch gestures
- **Select**: Click nodes to see details and highlight connections
- **Double-click**: Focus on a specific node

### Filtering & Search
1. **Node Type Filter**: Use the dropdown to show only specific node types
2. **Relationship Filter**: Filter edges by relationship types
3. **Search Box**: Type to find and highlight specific nodes
4. **Reset**: Clear all filters with the reset button

### Export Options
1. Click the **💾 Export** button in the header
2. Choose your desired format:
   - **JSON**: Complete graph data structure
   - **CSV**: Spreadsheet-compatible format
   - **PNG**: Visual image of the graph
3. Files download automatically to your default download folder

### Keyboard Shortcuts
- `Ctrl/Cmd + F`: Focus search box
- `Ctrl/Cmd + R`: Reset all filters  
- `Ctrl/Cmd + S`: Show statistics modal
- `Ctrl/Cmd + E`: Show export modal
- `Escape`: Close any open modals

## 🔧 Customization

### Updating Graph Data
Replace the data in `js/graphData.js`:

```javascript
export const rawNodes = [
    {id: "Node1", label: "Node 1", group: "Type1", title: "Description"},
    // ... your nodes
];

export const rawEdges = [
    {from: "Node1", to: "Node2", label: "relationship", arrows: "to"},
    // ... your edges
];
```

### Styling Customization
Modify `styles.css` to change:
- Color schemes and themes
- Layout dimensions
- Font styles and sizes
- Animation effects

### Network Configuration
Update `networkOptions` in `graphData.js` to adjust:
- Physics simulation parameters
- Node and edge styling
- Interaction behaviors
- Performance settings

## 📊 Data Format

### Node Structure
```javascript
{
    id: "unique-identifier",
    label: "Display Name",
    group: "Category/Type",
    title: "Tooltip Description"
}
```

### Edge Structure
```javascript
{
    from: "source-node-id",
    to: "target-node-id", 
    label: "relationship-type",
    arrows: "to"
}
```

## 🎨 Themes & Styling

The app uses a dark theme by default, optimized for:
- Reduced eye strain during long sessions
- High contrast for better visibility
- Professional appearance for presentations

### Color Scheme
- **Background**: Deep blue gradient (`#1e3c72` to `#2a5298`)
- **Graph Background**: Dark gray (`#222222`)
- **Primary Accent**: Blue (`#3498db`)
- **Success**: Green (`#2ecc71`)
- **Warning**: Orange (`#f39c12`)
- **Error**: Red (`#e74c3c`)

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome/Chromium**: 70+
- **Firefox**: 65+
- **Safari**: 12+
- **Edge**: 79+

### Required Features
- ES6 Modules support
- Canvas 2D API
- CSS Grid and Flexbox
- WebGL (for optimal performance)

## ⚡ Performance

### Optimization Features
- **Efficient rendering** with vis.js canvas-based visualization
- **Smart filtering** that updates only visible elements
- **Lazy loading** of UI components
- **Debounced resize** handling for smooth window changes
- **Memory management** with proper event cleanup

### Large Dataset Handling
- Tested with 1000+ nodes and 1800+ edges
- Responsive filtering even with complex graphs
- Progressive loading for better user experience
- Configurable physics settings for performance tuning

## 🔍 Technical Details

### Dependencies
- **vis.js**: Network visualization library
- **TomSelect**: Advanced select/dropdown components
- **Vanilla JavaScript**: No framework dependencies

### Architecture
- **Modular design** with separate controllers
- **Event-driven** communication between components
- **Responsive patterns** for different screen sizes
- **Clean separation** of data, logic, and presentation

### Data Flow
```
Raw Data → Processing → Filtering → Visualization → Export
```

## 🤝 Contributing

To extend or modify the application:

1. **Add new features** by creating additional controllers
2. **Modify styling** in `styles.css` with CSS custom properties
3. **Extend exports** by adding methods to `ExportController`
4. **Enhance UI** through `UIController` modifications

### Example: Adding a New Export Format
```javascript
// In exportController.js
exportCustomFormat() {
    const data = this.prepareExportData();
    const customData = this.convertToCustomFormat(data);
    this.downloadFile(customData, 'graph.custom', 'application/custom');
}
```

## 📈 Future Enhancements

Potential improvements:
- **3D visualization** mode
- **Collaborative editing** features
- **Real-time data** synchronization
- **Advanced analytics** dashboard
- **Custom node** rendering
- **Graph algorithms** integration

## 🐛 Troubleshooting

### Common Issues

**Graph not loading**:
- Check browser console for JavaScript errors
- Ensure all files are accessible via HTTP(S)
- Verify data format in `graphData.js`

**Poor performance**:
- Reduce physics simulation complexity
- Enable browser hardware acceleration
- Close other browser tabs/applications

**Export not working**:
- Check browser permissions for downloads
- Try different export formats
- Ensure modern browser with required APIs

### Debug Mode
Add `?debug=true` to the URL to enable console logging:
```
http://localhost:8000?debug=true
```

## 📄 License

This project is licensed under the MIT License - see the main project LICENSE file for details.

---

**Built with ❤️ using modern web technologies**  
**Compatible with the Knowledge Graph Generator v2.0 ecosystem**