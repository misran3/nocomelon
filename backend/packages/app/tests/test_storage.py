"""Tests for S3 storage module."""

import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path

from app.storage import S3Storage, DEFAULT_USER_ID


class TestGetUserPrefix:
    """Tests for get_user_prefix method."""

    def test_get_user_prefix_returns_correct_path(self):
        """User prefix should return user_id/subfolder format."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")

        result = storage.get_user_prefix(user_id="user123", subfolder="images")

        assert result == "user123/images"

    def test_get_user_prefix_default_user(self):
        """When user_id is None, should use DEFAULT_USER_ID ('test')."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")

        result = storage.get_user_prefix(user_id=None, subfolder="audio")

        assert result == "test/audio"
        assert DEFAULT_USER_ID == "test"

    def test_get_user_prefix_empty_subfolder(self):
        """Empty subfolder should return just user_id."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")

        result = storage.get_user_prefix(user_id="user456", subfolder="")

        assert result == "user456/"

    def test_get_user_prefix_no_subfolder_arg(self):
        """When subfolder not provided, should default to empty string."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")

        result = storage.get_user_prefix(user_id="user789")

        assert result == "user789/"


class TestBuildS3Key:
    """Tests for build_s3_key method."""

    def test_build_s3_key(self):
        """Should build full S3 key from user_id, subfolder, and filename."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")

        result = storage.build_s3_key(
            user_id="user123",
            subfolder="images",
            filename="scene_1.png"
        )

        assert result == "user123/images/scene_1.png"

    def test_build_s3_key_with_default_user(self):
        """Should use DEFAULT_USER_ID when user_id is None."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")

        result = storage.build_s3_key(
            user_id=None,
            subfolder="audio",
            filename="voice_1.mp3"
        )

        assert result == "test/audio/voice_1.mp3"

    def test_build_s3_key_empty_subfolder(self):
        """Empty subfolder should place file directly under user_id."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")

        result = storage.build_s3_key(
            user_id="user123",
            subfolder="",
            filename="data.json"
        )

        assert result == "user123/data.json"


class TestUploadFile:
    """Tests for upload_file method."""

    @patch("app.storage.boto3")
    def test_upload_file(self, mock_boto3):
        """Should upload file to S3 with correct parameters."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-west-2")
        result = storage.upload_file(
            local_path="/tmp/test.txt",
            s3_key="user123/files/test.txt"
        )

        mock_boto3.client.assert_called_once_with("s3", region_name="us-west-2")
        mock_client.upload_file.assert_called_once_with(
            "/tmp/test.txt",
            "my-bucket",
            "user123/files/test.txt"
        )
        assert result == "s3://my-bucket/user123/files/test.txt"

    @patch("app.storage.boto3")
    def test_upload_file_with_path_object(self, mock_boto3):
        """Should handle Path objects for local_path."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-west-2")
        result = storage.upload_file(
            local_path=Path("/tmp/test.txt"),
            s3_key="user123/files/test.txt"
        )

        mock_client.upload_file.assert_called_once_with(
            "/tmp/test.txt",
            "my-bucket",
            "user123/files/test.txt"
        )
        assert result == "s3://my-bucket/user123/files/test.txt"


class TestUploadBytes:
    """Tests for upload_bytes method."""

    @patch("app.storage.boto3")
    def test_upload_bytes(self, mock_boto3):
        """Should upload bytes data to S3."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")
        test_data = b"Hello, World!"
        result = storage.upload_bytes(data=test_data, s3_key="user123/data.bin")

        mock_client.put_object.assert_called_once()
        call_kwargs = mock_client.put_object.call_args[1]
        assert call_kwargs["Bucket"] == "my-bucket"
        assert call_kwargs["Key"] == "user123/data.bin"
        assert call_kwargs["Body"] == test_data
        assert result == "s3://my-bucket/user123/data.bin"


class TestDownloadFile:
    """Tests for download_file method."""

    @patch("app.storage.boto3")
    def test_download_file(self, mock_boto3, tmp_path):
        """Should download file from S3 to local path and return Path object."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")
        local_path = tmp_path / "downloaded.txt"
        result = storage.download_file(
            s3_key="user123/files/data.txt",
            local_path=str(local_path)
        )

        mock_client.download_file.assert_called_once_with(
            "my-bucket",
            "user123/files/data.txt",
            str(local_path)
        )
        assert result == local_path
        assert isinstance(result, Path)

    @patch("app.storage.boto3")
    def test_download_file_with_path_object(self, mock_boto3, tmp_path):
        """Should handle Path objects for local_path."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")
        local_path = tmp_path / "downloaded.txt"
        result = storage.download_file(
            s3_key="user123/files/data.txt",
            local_path=local_path
        )

        mock_client.download_file.assert_called_once_with(
            "my-bucket",
            "user123/files/data.txt",
            str(local_path)
        )
        assert result == local_path
        assert isinstance(result, Path)

    @patch("app.storage.boto3")
    def test_download_file_creates_parent_directories(self, mock_boto3, tmp_path):
        """Should create parent directories if they don't exist."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")
        # Create a path with nested directories that don't exist
        local_path = tmp_path / "nested" / "dirs" / "downloaded.txt"
        assert not local_path.parent.exists()

        result = storage.download_file(
            s3_key="user123/files/data.txt",
            local_path=local_path
        )

        # Parent directories should have been created
        assert local_path.parent.exists()
        assert result == local_path


class TestGeneratePresignedUrl:
    """Tests for generate_presigned_url method."""

    @patch("app.storage.boto3")
    def test_generate_presigned_url(self, mock_boto3):
        """Should generate presigned URL with correct parameters."""
        mock_client = MagicMock()
        mock_client.generate_presigned_url.return_value = "https://presigned-url.example.com"
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")
        result = storage.generate_presigned_url(s3_key="user123/files/image.png")

        mock_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": "my-bucket", "Key": "user123/files/image.png"},
            ExpiresIn=3600
        )
        assert result == "https://presigned-url.example.com"

    @patch("app.storage.boto3")
    def test_generate_presigned_url_custom_expiry(self, mock_boto3):
        """Should use custom expiry time when provided."""
        mock_client = MagicMock()
        mock_client.generate_presigned_url.return_value = "https://presigned-url.example.com"
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")
        storage.generate_presigned_url(s3_key="user123/files/image.png", expires_in=7200)

        mock_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": "my-bucket", "Key": "user123/files/image.png"},
            ExpiresIn=7200
        )


class TestDeleteObject:
    """Tests for delete_object method."""

    @patch("app.storage.boto3")
    def test_delete_object(self, mock_boto3):
        """Should delete object from S3."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")
        storage.delete_object(s3_key="user123/files/old_file.txt")

        mock_client.delete_object.assert_called_once_with(
            Bucket="my-bucket",
            Key="user123/files/old_file.txt"
        )


class TestClientProperty:
    """Tests for lazy-loaded client property."""

    @patch("app.storage.boto3")
    def test_client_lazy_loaded(self, mock_boto3):
        """Client should be created lazily on first access."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="my-bucket", region="us-east-1")

        # Client should not be created yet
        mock_boto3.client.assert_not_called()

        # Access client
        client1 = storage.client
        mock_boto3.client.assert_called_once_with("s3", region_name="us-east-1")

        # Access again - should be cached
        client2 = storage.client
        mock_boto3.client.assert_called_once()  # Still only one call

        assert client1 is client2
