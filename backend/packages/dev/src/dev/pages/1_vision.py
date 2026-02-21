"""Stage 1: Vision - Analyze a drawing."""

import streamlit as st
import requests
import base64
from pathlib import Path
import json

st.set_page_config(page_title="Vision Stage", page_icon="🎨")

API_BASE = "http://localhost:8000"


def main():
    st.title("🎨 Stage 1: Drawing Analysis")

    # Image upload
    st.subheader("Upload Drawing")

    upload_method = st.radio(
        "Choose input method:",
        ["Upload Image", "Use Sample"],
        horizontal=True,
    )

    image_data = None

    if upload_method == "Upload Image":
        uploaded_file = st.file_uploader(
            "Choose an image",
            type=["png", "jpg", "jpeg"],
        )
        if uploaded_file:
            image_data = uploaded_file.read()
            st.image(image_data, caption="Uploaded drawing", width=400)

    else:  # Use Sample
        sample_dir = Path("data/samples")
        if sample_dir.exists():
            samples = list(sample_dir.glob("*.png")) + list(sample_dir.glob("*.jpg"))
            if samples:
                sample_choice = st.selectbox(
                    "Select a sample:",
                    samples,
                    format_func=lambda x: x.name,
                )
                if sample_choice:
                    image_data = sample_choice.read_bytes()
                    st.image(image_data, caption=f"Sample: {sample_choice.name}", width=400)
            else:
                st.warning("No sample images found in data/samples/")
        else:
            st.warning("Sample directory not found. Create data/samples/ and add images.")

    st.divider()

    # Analyze button
    if image_data:
        if st.button("🔍 Analyze Drawing", type="primary"):
            with st.spinner("Analyzing drawing..."):
                try:
                    # Encode to base64
                    b64_image = base64.b64encode(image_data).decode("utf-8")

                    # Call API
                    response = requests.post(
                        f"{API_BASE}/api/v1/vision/analyze",
                        json={"image_base64": b64_image},
                        timeout=60,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Analysis complete!")

                        # Display results
                        st.subheader("Results")
                        col1, col2 = st.columns(2)

                        with col1:
                            st.markdown(f"**Subject:** {result['subject']}")
                            st.markdown(f"**Setting:** {result['setting']}")
                            st.markdown(f"**Mood:** {result['mood']}")

                        with col2:
                            st.markdown("**Details:**")
                            for detail in result['details']:
                                st.markdown(f"- {detail}")
                            st.markdown(f"**Colors:** {', '.join(result['colors'])}")

                        # Store in session state
                        st.session_state['vision_result'] = result

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                        st.download_button(
                            "📋 Copy JSON",
                            json.dumps(result, indent=2),
                            file_name="vision_result.json",
                            mime="application/json",
                        )
                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")

    # Show previous result if exists
    if 'vision_result' in st.session_state:
        st.divider()
        st.subheader("Last Result (stored in session)")
        st.json(st.session_state['vision_result'])


if __name__ == "__main__":
    main()
