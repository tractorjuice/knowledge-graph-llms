from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from pyvis.network import Network
import tiktoken

from dotenv import load_dotenv
import os
import asyncio


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
async def extract_graph_data(chunks):
    """
    Asynchronously extracts graph data from text chunks using a graph transformer.

    Args:
        chunks (list): List of text chunks to be processed into graph format.

    Returns:
        list: A list of GraphDocument objects containing nodes and relationships.
    """
    all_graph_documents = []

    for i, chunk in enumerate(chunks, 1):
        print(f"Processing chunk {i}/{len(chunks)}...")
        documents = [Document(page_content=chunk)]
        graph_documents = await graph_transformer.aconvert_to_graph_documents(documents)
        all_graph_documents.extend(graph_documents)
        print(f"✓ Chunk {i}/{len(chunks)} complete")

    return all_graph_documents


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


def generate_knowledge_graph(text):
    """
    Generates and visualizes a knowledge graph from input text.

    This function runs the graph extraction asynchronously and then visualizes
    the resulting graph using PyVis.

    Args:
        text (str): Input text to convert into a knowledge graph.

    Returns:
        pyvis.network.Network: The visualized network graph object.
    """
    # Count tokens and provide feedback
    encoding = tiktoken.encoding_for_model("gpt-4")
    token_count = len(encoding.encode(text))
    chunks = chunk_text(text)

    print(f"Input text: {token_count:,} tokens")
    print(f"Processing in {len(chunks)} chunk(s)")

    graph_documents = asyncio.run(extract_graph_data(chunks))

    print("Building graph visualization...")
    net = visualize_graph(graph_documents)
    print("✓ Graph generation complete!")
    return net