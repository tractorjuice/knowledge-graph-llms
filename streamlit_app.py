# Import necessary modules
import streamlit as st
import streamlit.components.v1 as components  # For embedding custom HTML
from generate_knowledge_graph import generate_knowledge_graph

# Set up Streamlit page configuration
st.set_page_config(
    page_icon=None,
    layout="wide",  # Use wide layout for better graph display
    initial_sidebar_state="auto",
    menu_items=None
)

# Set the title of the app
st.title("Knowledge Graph From Text")

# Sidebar section for user input method
st.sidebar.title("Input document")
input_method = st.sidebar.radio(
    "Choose an input method:",
    ["Upload file", "Input text"],  # Options for uploading a file or manually inputting text
)

# Case 1: User chooses to upload a file
if input_method == "Upload file":
    # File uploader widget in the sidebar
    uploaded_file = st.sidebar.file_uploader(label="Upload file (.txt or .md)", type=["txt", "md"])

    if uploaded_file is not None:
        # Read the uploaded file content and decode it as UTF-8 text
        text = uploaded_file.read().decode("utf-8")

        # Button to generate the knowledge graph
        if st.sidebar.button("Generate Knowledge Graph"):
            # Create progress elements
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            def update_progress(current, total, message, time_estimate=None):
                progress = current / total if total > 0 else 0
                progress_bar.progress(progress)
                
                # Add time estimate to message if available
                if time_estimate is not None and time_estimate > 0:
                    if time_estimate < 60:
                        time_str = f" (Est. {time_estimate:.0f}s remaining)"
                    else:
                        minutes = int(time_estimate // 60)
                        seconds = int(time_estimate % 60)
                        time_str = f" (Est. {minutes}m {seconds}s remaining)"
                    display_message = message + time_str
                else:
                    display_message = message
                
                status_text.text(display_message)
            
            try:
                # Call the function to generate the graph from the text
                net = generate_knowledge_graph(text, progress_callback=update_progress)
                
                # Clear progress elements and show success
                progress_bar.empty()
                status_text.empty()
                st.success("Knowledge graph generated successfully!")
                
                # Save the graph to an HTML file
                output_file = "graph/knowledge_graph.html"
                net.save_graph(output_file)

                # Open the HTML file and display it within the Streamlit app
                HtmlFile = open(output_file, 'r', encoding='utf-8')
                components.html(HtmlFile.read(), height=1000)
                
            except Exception as e:
                progress_bar.empty()
                status_text.empty()
                st.error(f"Error generating knowledge graph: {str(e)}")

# Case 2: User chooses to directly input text
else:
    # Text area for manual input
    text = st.sidebar.text_area("Input text", height=300)

    if text:  # Check if the text area is not empty
        if st.sidebar.button("Generate Knowledge Graph"):
            # Create progress elements
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            def update_progress(current, total, message, time_estimate=None):
                progress = current / total if total > 0 else 0
                progress_bar.progress(progress)
                
                # Add time estimate to message if available
                if time_estimate is not None and time_estimate > 0:
                    if time_estimate < 60:
                        time_str = f" (Est. {time_estimate:.0f}s remaining)"
                    else:
                        minutes = int(time_estimate // 60)
                        seconds = int(time_estimate % 60)
                        time_str = f" (Est. {minutes}m {seconds}s remaining)"
                    display_message = message + time_str
                else:
                    display_message = message
                
                status_text.text(display_message)
            
            try:
                # Call the function to generate the graph from the input text
                net = generate_knowledge_graph(text, progress_callback=update_progress)
                
                # Clear progress elements and show success
                progress_bar.empty()
                status_text.empty()
                st.success("Knowledge graph generated successfully!")

                # Save the graph to an HTML file
                output_file = "graph/knowledge_graph.html"
                net.save_graph(output_file)

                # Open the HTML file and display it within the Streamlit app
                HtmlFile = open(output_file, 'r', encoding='utf-8')
                components.html(HtmlFile.read(), height=1000)
                
            except Exception as e:
                progress_bar.empty()
                status_text.empty()
                st.error(f"Error generating knowledge graph: {str(e)}")