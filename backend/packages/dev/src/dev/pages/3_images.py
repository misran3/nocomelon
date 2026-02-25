"""Stage 3: Images - Generate illustrations."""

import streamlit as st
import requests
import json
from pathlib import Path

st.set_page_config(page_title="Images Stage", page_icon="🖼️", layout="wide")

API_BASE = "http://localhost:8000"

STYLES = ["storybook", "watercolor"]


def main():
    st.title("🖼️ Stage 3: Image Generation")

    # Input section
    st.subheader("Input: Story Script + Drawing Analysis")

    col1, col2 = st.columns(2)

    story_data = None
    drawing_data = None

    run_id = st.session_state.get('run_id')
    if run_id:
        st.info(f"Using Run ID: `{run_id}`")
    else:
        st.warning("No run_id found. Run Vision stage first.")

    with col1:
        st.markdown("**Story Script**")
        if 'story_result' in st.session_state:
            story_data = st.session_state['story_result']
            st.success("Using stored story result")
            with st.expander("View Story JSON"):
                st.json(story_data)
        else:
            story_json = st.text_area("Paste StoryScript JSON:", height=150)
            if story_json:
                try:
                    story_data = json.loads(story_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    with col2:
        st.markdown("**Drawing Analysis**")
        if 'vision_result' in st.session_state:
            drawing_data = st.session_state['vision_result']
            st.success("Using stored vision result")
            with st.expander("View Drawing JSON"):
                st.json(drawing_data)
        else:
            drawing_json = st.text_area("Paste DrawingAnalysis JSON:", height=150)
            if drawing_json:
                try:
                    drawing_data = json.loads(drawing_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    style = st.selectbox("Visual Style:", STYLES)

    st.divider()

    # Generate button
    if story_data and drawing_data and run_id:
        if st.button("🎨 Generate Images", type="primary"):
            with st.spinner("Generating images (this may take a few minutes)..."):
                try:
                    payload = {
                        "run_id": run_id,
                        "story": story_data,
                        "drawing": drawing_data,
                        "style": style,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/images/generate",
                        json=payload,
                        timeout=600,  # 10 min timeout for multiple images
                    )

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Images generated!")

                        # Display images in grid
                        st.subheader("Generated Images")
                        cols = st.columns(3)
                        for i, img in enumerate(result['images']):
                            with cols[i % 3]:
                                img_path = Path(img['path'])
                                if img_path.exists():
                                    st.image(str(img_path), caption=f"Scene {img['scene_number']}")
                                else:
                                    st.warning(f"Image not found: {img['path']}")

                        # Store in session
                        st.session_state['images_result'] = result

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")
    elif not run_id:
        st.info("Run Vision stage first to generate a run_id.")
    else:
        st.info("Load both Story Script and Drawing Analysis to generate images.")


if __name__ == "__main__":
    main()
