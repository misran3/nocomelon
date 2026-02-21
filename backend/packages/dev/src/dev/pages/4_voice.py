"""Stage 4: Voice - Generate narration."""

import streamlit as st
import requests
import json
from pathlib import Path

st.set_page_config(page_title="Voice Stage", page_icon="🎤")

API_BASE = "http://localhost:8000"

VOICE_TYPES = ["gentle", "cheerful"]


def main():
    st.title("🎤 Stage 4: Voice Generation")

    # Input section
    st.subheader("Input: Story Script")

    story_data = None

    if 'story_result' in st.session_state:
        story_data = st.session_state['story_result']
        st.success("Using stored story result")
        with st.expander("View Story"):
            for scene in story_data['scenes']:
                st.markdown(f"**Scene {scene['number']}:** {scene['text']}")
    else:
        story_json = st.text_area("Paste StoryScript JSON:", height=200)
        if story_json:
            try:
                story_data = json.loads(story_json)
            except json.JSONDecodeError as e:
                st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    voice_type = st.selectbox("Voice Type:", VOICE_TYPES)

    st.divider()

    # Generate button
    if story_data:
        if st.button("🔊 Generate Audio", type="primary"):
            with st.spinner("Generating audio..."):
                try:
                    payload = {
                        "story": story_data,
                        "voice_type": voice_type,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/voice/generate",
                        json=payload,
                        timeout=300,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Audio generated!")

                        # Display audio players
                        st.subheader("Generated Audio")
                        for audio in result['audio_files']:
                            audio_path = Path(audio['path'])
                            st.markdown(f"**Scene {audio['scene_number']}** ({audio['duration_sec']:.1f}s)")
                            if audio_path.exists():
                                st.audio(str(audio_path))
                            else:
                                st.warning(f"Audio not found: {audio['path']}")

                        st.metric("Total Duration", f"{result['total_duration_sec']:.1f}s")

                        # Store in session
                        st.session_state['audio_result'] = result

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")


if __name__ == "__main__":
    main()
