# Changelog

All notable changes to the Knowledge Graph Generator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-29

### Added
- **Smart Text Chunking**: Intelligent semantic splitting using markdown headers with 100k token limit per chunk
- **Real-time Progress Tracking**: Visual progress bar with time estimates and chunk-by-chunk status updates
- **Multiple File Format Support**: Upload both `.txt` and `.md` files for optimal chunking results
- **Multi-format Graph Export**: Save graphs as HTML, JSON, GraphML, and GML formats
- **Enhanced Error Handling**: Comprehensive error management with proper cleanup
- **Performance Monitoring**: Individual chunk processing times and dynamic time estimates

### Changed
- **File Upload Interface**: Updated from "Upload txt" to "Upload file" with support for .md files
- **Progress Display**: Replaced generic spinner with detailed progress bar and status messages
- **Graph Saving**: Enhanced to save in multiple formats (JSON, GraphML, GML) alongside HTML
- **Documentation**: Comprehensive README update with v2.0 features and technical architecture

### Enhanced
- **Large Document Support**: Tested with 175k token documents (229 chunks)
- **User Experience**: Real-time feedback with time estimates that improve as processing continues
- **Graph Export Options**: Multiple standard formats for different analysis tools and workflows
- **Code Architecture**: Improved modularity with progress callbacks and format-specific saving

### Technical Improvements
- Added `networkx` dependency for graph format conversions
- Implemented `save_graph_formats()` function for multi-format export
- Enhanced chunking algorithm with semantic markdown header detection
- Added comprehensive error handling with progress element cleanup
- Updated .gitignore to exclude generated graph files

### Source Attribution
- Enhanced version based on original [YouTube tutorial](https://www.youtube.com/watch?v=O-T_6KOXML4)
- Significant improvements by Claude Code (Anthropic's AI Assistant)
- Maintained MIT License compatibility with original work

## [1.0.0] - Original Release

### Initial Features
- Basic text input and .txt file upload
- Entity and relationship extraction using LangChain + GPT-4o
- Interactive graph visualization with PyVis
- HTML output generation
- Streamlit web interface

---

**Note**: Version 1.0.0 represents the original tutorial implementation. Version 2.0.0 introduces significant enhancements while maintaining backward compatibility.