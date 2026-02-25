"""Stage 2: Story - Generate a story script."""

import streamlit as st
import requests
import json

st.set_page_config(page_title="Story Stage", page_icon="📖")

API_BASE = "http://localhost:8000"

THEMES = ["adventure", "kindness", "bravery", "bedtime", "friendship", "counting", "nature"]
VOICE_TYPES = ["gentle", "cheerful"]


def main():
    st.title("📖 Stage 2: Story Generation")

    # Input section
    st.subheader("Input: Drawing Analysis")

    input_method = st.radio(
        "Choose input method:",
        ["Use Last Vision Result", "Paste JSON"],
        horizontal=True,
    )

    drawing_data = None

    if input_method == "Use Last Vision Result":
        if 'vision_result' in st.session_state:
            drawing_data = st.session_state['vision_result']
            st.success("Using stored vision result")
            st.json(drawing_data)
        else:
            st.warning("No vision result in session. Run Vision stage first or paste JSON.")
    else:
        json_input = st.text_area(
            "Paste DrawingAnalysis JSON:",
            height=200,
            placeholder='{"subject": "a purple dinosaur", "setting": "green meadow", ...}',
        )
        if json_input:
            try:
                drawing_data = json.loads(json_input)
                st.success("JSON parsed successfully")
            except json.JSONDecodeError as e:
                st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    st.subheader("Options")

    col1, col2 = st.columns(2)

    with col1:
        theme = st.selectbox("Theme:", THEMES, index=2)  # Default: bravery
        voice_type = st.selectbox("Voice Type:", VOICE_TYPES)

    with col2:
        child_age = st.slider("Child's Age:", 2, 9, 5)
        personal_context = st.text_input(
            "Personal Context (optional):",
            placeholder="e.g., starting kindergarten next week",
        )

    st.divider()

    # Generate button
    if drawing_data:
        if st.button("📝 Generate Story", type="primary"):
            with st.spinner("Generating story..."):
                try:
                    payload = {
                        "drawing": drawing_data,
                        "theme": theme,
                        "voice_type": voice_type,
                        "child_age": child_age,
                        "personal_context": personal_context if personal_context else None,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/story/generate",
                        json=payload,
                        timeout=120,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Story generated!")

                        # Display story
                        st.subheader("Generated Story")
                        for scene in result['scenes']:
                            st.markdown(f"**[SCENE {scene['number']}]**")
                            st.markdown(scene['text'])
                            st.markdown("")

                        # Store in session
                        st.session_state['story_result'] = result

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                        st.download_button(
                            "📋 Copy JSON",
                            json.dumps(result, indent=2),
                            file_name="story_result.json",
                            mime="application/json",
                        )
                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")


if __name__ == "__main__":
    main()
