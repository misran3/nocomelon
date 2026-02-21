"""Stage 5: Video - Assemble final video."""

import streamlit as st
import requests
import json
from pathlib import Path

st.set_page_config(page_title="Video Stage", page_icon="🎬")

API_BASE = "http://localhost:8000"


def main():
    st.title("🎬 Stage 5: Video Assembly")

    # Input section
    st.subheader("Input: Images + Audio")

    col1, col2 = st.columns(2)

    images_data = None
    audio_data = None

    with col1:
        st.markdown("**Images Result**")
        if 'images_result' in st.session_state:
            images_data = st.session_state['images_result']
            st.success(f"Using stored images ({len(images_data['images'])} images)")
        else:
            images_json = st.text_area("Paste ImageResult JSON:", height=150)
            if images_json:
                try:
                    images_data = json.loads(images_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    with col2:
        st.markdown("**Audio Result**")
        if 'audio_result' in st.session_state:
            audio_data = st.session_state['audio_result']
            st.success(f"Using stored audio ({len(audio_data['audio_files'])} files)")
        else:
            audio_json = st.text_area("Paste AudioResult JSON:", height=150)
            if audio_json:
                try:
                    audio_data = json.loads(audio_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    st.subheader("Options")

    music_dir = Path("assets/music")
    music_files = list(music_dir.glob("*.mp3")) if music_dir.exists() else []

    use_music = st.checkbox("Add background music")
    music_track = None

    if use_music:
        if music_files:
            music_choice = st.selectbox(
                "Select music track:",
                music_files,
                format_func=lambda x: x.name,
            )
            music_track = str(music_choice)
        else:
            st.warning("No music files found in assets/music/")

    st.divider()

    # Assemble button
    if images_data and audio_data:
        if st.button("🎬 Assemble Video", type="primary"):
            with st.spinner("Assembling video..."):
                try:
                    payload = {
                        "images": images_data,
                        "audio": audio_data,
                        "music_track": music_track,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/video/assemble",
                        json=payload,
                        timeout=300,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Video assembled!")

                        # Display video
                        st.subheader("Final Video")
                        video_path = Path(result['video_path'])
                        if video_path.exists():
                            st.video(str(video_path))
                            st.metric("Duration", f"{result['duration_sec']:.1f}s")

                            # Download button
                            with open(video_path, "rb") as f:
                                st.download_button(
                                    "⬇️ Download Video",
                                    f.read(),
                                    file_name="storybook.mp4",
                                    mime="video/mp4",
                                )
                        else:
                            st.warning(f"Video not found: {result['video_path']}")

                        # Store in session
                        st.session_state['video_result'] = result

                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")
    else:
        st.info("Load both Images and Audio results to assemble video.")


if __name__ == "__main__":
    main()
