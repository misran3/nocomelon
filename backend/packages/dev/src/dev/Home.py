"""Main Streamlit app for testing the NoComelon pipeline."""

import streamlit as st
import requests

st.set_page_config(
    page_title="NoComelon POC",
    page_icon="🎨",
    layout="wide",
)

API_BASE = "http://localhost:8000"


def check_api_health():
    """Check if the API is running."""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def main():
    st.title("🎨 NoComelon POC")
    st.markdown("Test the AI pipeline stage by stage.")

    # Check API status
    if check_api_health():
        st.success("✅ API is running")

        # Get detailed status
        try:
            status = requests.get(f"{API_BASE}/api/v1/status").json()
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("OpenAI", status.get("openai", "unknown"))
            with col2:
                st.metric("ElevenLabs", status.get("elevenlabs", "unknown"))
            with col3:
                st.metric("FFmpeg", status.get("ffmpeg", "unknown"))
            with col4:
                st.metric("Data Dir", status.get("data_dir", "unknown"))
        except Exception as e:
            st.warning(f"Could not get status: {e}")
    else:
        st.error("❌ API is not running. Start it with: `uv run uvicorn app.main:app --reload --port 8000`")

    st.divider()

    st.markdown("""
    ## Pipeline Stages

    Use the sidebar to navigate to each stage:

    1. **Vision** - Upload and analyze a drawing
    2. **Story** - Generate a story script
    3. **Images** - Generate illustrations
    4. **Voice** - Generate narration
    5. **Video** - Assemble final video

    Each stage can be tested independently or you can chain outputs together.
    """)


if __name__ == "__main__":
    main()
