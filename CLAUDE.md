# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Knowledge Graph Generator application that extracts entities and relationships from text using LangChain and OpenAI's GPT-4o model, then visualizes them as interactive graphs using PyVis.

## Architecture

The application consists of two main execution paths:
1. **Streamlit Web App** (`app.py`) - Interactive web interface for uploading text or entering input directly
2. **Jupyter Notebook** (`knowledge_graph.ipynb`) - Development and experimentation environment

Core functionality is in `generate_knowledge_graph.py` with two key functions:
- `extract_graph_data()` - Async function using LangChain's LLMGraphTransformer to convert text to graph documents
- `visualize_graph()` - Creates PyVis network visualization with custom physics and filtering

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
streamlit run app.py
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
- Custom spring constants and gravity settings in `generate_knowledge_graph.py:87-100`

Output is always saved to `knowledge_graph.html` in the project root.