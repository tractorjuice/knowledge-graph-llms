# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Knowledge Graph Generator application that extracts entities and relationships from text using LangChain and OpenAI's GPT-4o model, then visualizes them as interactive graphs using PyVis.

## Architecture

The application consists of two main execution paths:
1. **Streamlit Web App** (`streamlit_app.py`) - Interactive web interface for uploading text or entering input directly
2. **Jupyter Notebook** (`knowledge_graph.ipynb`) - Development and experimentation environment

Core functionality is in `generate_knowledge_graph.py` with key functions:
- `chunk_text()` - Intelligently splits large text using semantic markdown splitting with token limits
- `extract_graph_data()` - Async function using LangChain's LLMGraphTransformer to convert text chunks to graph documents
- `visualize_graph()` - Creates PyVis network visualization with custom physics and filtering
- `generate_knowledge_graph()` - Main orchestration function that handles chunking, extraction, and visualization

## Required Environment

The application requires an OpenAI API key in a `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Common Commands

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run the Streamlit app:**
```bash
streamlit run streamlit_app.py
```

**Development with Jupyter:**
```bash
jupyter notebook knowledge_graph.ipynb
```

## Key Dependencies

- `langchain-experimental` - Provides LLMGraphTransformer for entity/relationship extraction
- `langchain-openai` - GPT-4o integration 
- `pyvis` - Interactive graph visualization
- `streamlit` - Web interface framework

## Graph Configuration

The PyVis network uses forceAtlas2Based physics with specific parameters for optimal visualization:
- Dark theme (`bgcolor="#222222"`, `font_color="white"`)
- Filter menu enabled for node/edge filtering
- Custom spring constants and gravity settings in `generate_knowledge_graph.py:156-169`

## Text Processing

Large text inputs are automatically chunked using intelligent semantic splitting:
- Markdown header-based splitting (`#`, `##`, `###`, `####`) to preserve document structure
- Token-aware chunking with 100k token limit per chunk (respects GPT-4 context limits)
- Recursive character splitting for oversized sections with 200-character overlap
- Progress indicators during multi-chunk processing

Output is always saved to `knowledge_graph.html` in the project root.