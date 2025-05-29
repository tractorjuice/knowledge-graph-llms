from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from pyvis.network import Network
import tiktoken

from dotenv import load_dotenv
import os
import asyncio
import time
import json
import networkx as nx


# Load the .env file
load_dotenv()
# Get API key from environment variable
api_key = os.getenv("OPENAI_API_KEY")

llm = ChatOpenAI(temperature=0, model_name="gpt-4o")

graph_transformer = LLMGraphTransformer(llm=llm)


def chunk_text(text, max_tokens=100000):
    """
    Splits text into chunks based on markdown headings, respecting token limits.

    Args:
        text (str): Input text to be chunked.
        max_tokens (int): Maximum tokens per chunk (default 100k to leave room for system prompts).

    Returns:
        list: List of text chunks.
    """
    encoding = tiktoken.encoding_for_model("gpt-4")

    # If text is small enough, return as single chunk
    if len(encoding.encode(text)) <= max_tokens:
        return [text]

    # Define headers to split on
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
        ("####", "Header 4"),
    ]

    # Split by markdown headers first
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    md_header_splits = markdown_splitter.split_text(text)

    # Convert approximate tokens to characters (rough estimate: 1 token ≈ 4 characters)
    max_chars = max_tokens * 4

    # Further split if chunks are too large
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=max_chars,
        chunk_overlap=200,  # Small overlap to maintain context
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )

    # Split each markdown section if needed
    final_chunks = []
    for doc in md_header_splits:
        doc_tokens = len(encoding.encode(doc.page_content))

        if doc_tokens <= max_tokens:
            final_chunks.append(doc.page_content)
        else:
            # Split large sections further
            sub_chunks = text_splitter.split_text(doc.page_content)
            final_chunks.extend(sub_chunks)

    return final_chunks if final_chunks else [text]


# Extract graph data from text chunks
async def extract_graph_data(chunks, progress_callback=None):
    """
    Asynchronously extracts graph data from text chunks using a graph transformer.

    Args:
        chunks (list): List of text chunks to be processed into graph format.
        progress_callback (callable, optional): Function to call with progress updates.
                                               Should accept (current, total, message, time_estimate) parameters.

    Returns:
        list: A list of GraphDocument objects containing nodes and relationships.
    """
    all_graph_documents = []
    chunk_times = []

    for i, chunk in enumerate(chunks, 1):
        chunk_start = time.time()
        
        message = f"Processing chunk {i}/{len(chunks)}..."
        print(message)
        if progress_callback:
            # Calculate time estimate
            if chunk_times:
                avg_time_per_chunk = sum(chunk_times) / len(chunk_times)
                remaining_chunks = len(chunks) - i + 1
                estimated_remaining = avg_time_per_chunk * remaining_chunks
                progress_callback(i-1, len(chunks), message, estimated_remaining)
            else:
                progress_callback(i-1, len(chunks), message, None)
        
        documents = [Document(page_content=chunk)]
        graph_documents = await graph_transformer.aconvert_to_graph_documents(documents)
        all_graph_documents.extend(graph_documents)
        
        chunk_end = time.time()
        chunk_duration = chunk_end - chunk_start
        chunk_times.append(chunk_duration)
        
        complete_message = f"✓ Chunk {i}/{len(chunks)} complete ({chunk_duration:.1f}s)"
        print(complete_message)
        if progress_callback:
            # Update time estimate after completion
            if len(chunk_times) > 1:
                avg_time_per_chunk = sum(chunk_times) / len(chunk_times)
                remaining_chunks = len(chunks) - i
                estimated_remaining = avg_time_per_chunk * remaining_chunks
                progress_callback(i, len(chunks), complete_message, estimated_remaining)
            else:
                progress_callback(i, len(chunks), complete_message, None)

    return all_graph_documents


def save_graph_formats(graph_documents, base_filename="knowledge_graph"):
    """
    Save the graph in multiple formats (JSON, GraphML, GML).
    
    Args:
        graph_documents (list): List of GraphDocument objects with nodes and relationships.
        base_filename (str): Base filename without extension.
    
    Returns:
        dict: Dictionary with format names and file paths.
    """
    saved_files = {}
    
    # Combine nodes and relationships from all graph documents
    all_nodes = []
    all_relationships = []
    
    for graph_doc in graph_documents:
        all_nodes.extend(graph_doc.nodes)
        all_relationships.extend(graph_doc.relationships)
    
    # Build lookup for valid nodes (deduplicate by ID)
    node_dict = {node.id: node for node in all_nodes}
    
    # Filter valid relationships
    valid_relationships = []
    for rel in all_relationships:
        if rel.source.id in node_dict and rel.target.id in node_dict:
            valid_relationships.append(rel)
    
    # Create NetworkX graph
    G = nx.DiGraph()
    
    # Add nodes with attributes
    for node_id, node in node_dict.items():
        G.add_node(node_id, type=node.type, label=node.id)
    
    # Add edges with attributes
    for rel in valid_relationships:
        G.add_edge(rel.source.id, rel.target.id, relationship=rel.type, label=rel.type.lower())
    
    try:
        # Save as JSON
        json_file = f"{base_filename}.json"
        graph_data = {
            "nodes": [{"id": node_id, **attrs} for node_id, attrs in G.nodes(data=True)],
            "edges": [{"source": u, "target": v, **attrs} for u, v, attrs in G.edges(data=True)]
        }
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(graph_data, f, indent=2, ensure_ascii=False)
        saved_files['JSON'] = os.path.abspath(json_file)
        print(f"Graph saved to {saved_files['JSON']}")
        
        # Save as GraphML
        graphml_file = f"{base_filename}.graphml"
        nx.write_graphml(G, graphml_file)
        saved_files['GraphML'] = os.path.abspath(graphml_file)
        print(f"Graph saved to {saved_files['GraphML']}")
        
        # Save as GML
        gml_file = f"{base_filename}.gml"
        nx.write_gml(G, gml_file)
        saved_files['GML'] = os.path.abspath(gml_file)
        print(f"Graph saved to {saved_files['GML']}")
        
    except Exception as e:
        print(f"Error saving graph formats: {e}")
    
    return saved_files


def visualize_graph(graph_documents):
    """
    Visualizes a knowledge graph using PyVis based on the extracted graph documents.

    Args:
        graph_documents (list): A list of GraphDocument objects with nodes and relationships.

    Returns:
        pyvis.network.Network: The visualized network graph object.
    """
    # Create network
    net = Network(height="1200px", width="100%", directed=True,
                      notebook=False, bgcolor="#222222", font_color="white", filter_menu=True, cdn_resources='remote')

    # Combine nodes and relationships from all graph documents
    all_nodes = []
    all_relationships = []

    for graph_doc in graph_documents:
        all_nodes.extend(graph_doc.nodes)
        all_relationships.extend(graph_doc.relationships)

    # Build lookup for valid nodes (deduplicate by ID)
    node_dict = {node.id: node for node in all_nodes}

    # Filter out invalid edges and collect valid node IDs
    valid_edges = []
    valid_node_ids = set()
    for rel in all_relationships:
        if rel.source.id in node_dict and rel.target.id in node_dict:
            valid_edges.append(rel)
            valid_node_ids.update([rel.source.id, rel.target.id])

    # Track which nodes are part of any relationship
    connected_node_ids = set()
    for rel in all_relationships:
        connected_node_ids.add(rel.source.id)
        connected_node_ids.add(rel.target.id)

    # Add valid nodes to the graph
    for node_id in valid_node_ids:
        node = node_dict[node_id]
        try:
            net.add_node(node.id, label=node.id, title=node.type, group=node.type)
        except:
            continue  # Skip node if error occurs

    # Add valid edges to the graph
    for rel in valid_edges:
        try:
            net.add_edge(rel.source.id, rel.target.id, label=rel.type.lower())
        except:
            continue  # Skip edge if error occurs

    # Configure graph layout and physics
    net.set_options("""
        {
            "physics": {
                "forceAtlas2Based": {
                    "gravitationalConstant": -100,
                    "centralGravity": 0.01,
                    "springLength": 200,
                    "springConstant": 0.08
                },
                "minVelocity": 0.75,
                "solver": "forceAtlas2Based"
            }
        }
    """)

    output_file = "knowledge_graph.html"
    try:
        net.save_graph(output_file)
        print(f"Graph saved to {os.path.abspath(output_file)}")
        return net
    except Exception as e:
        print(f"Error saving graph: {e}")
        return None


def generate_knowledge_graph(text, progress_callback=None):
    """
    Generates and visualizes a knowledge graph from input text.

    This function runs the graph extraction asynchronously and then visualizes
    the resulting graph using PyVis.

    Args:
        text (str): Input text to convert into a knowledge graph.
        progress_callback (callable, optional): Function to call with progress updates.
                                               Should accept (current, total, message, time_estimate) parameters.

    Returns:
        pyvis.network.Network: The visualized network graph object.
    """
    # Count tokens and provide feedback
    encoding = tiktoken.encoding_for_model("gpt-4")
    token_count = len(encoding.encode(text))
    chunks = chunk_text(text)

    print(f"Input text: {token_count:,} tokens")
    print(f"Processing in {len(chunks)} chunk(s)")

    graph_documents = asyncio.run(extract_graph_data(chunks, progress_callback))

    message = "Building graph visualization..."
    print(message)
    if progress_callback:
        progress_callback(len(chunks), len(chunks), message, 0)
    
    net = visualize_graph(graph_documents)
    
    # Save graph in multiple formats
    save_message = "Saving graph in multiple formats..."
    print(save_message)
    if progress_callback:
        progress_callback(len(chunks), len(chunks), save_message, 0)
    
    saved_files = save_graph_formats(graph_documents)
    
    complete_message = "✓ Graph generation complete!"
    print(complete_message)
    if progress_callback:
        progress_callback(len(chunks), len(chunks), complete_message, 0)
    
    return net