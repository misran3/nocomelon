"""S3 storage abstraction for the app.

This module provides an S3Storage class for managing user-specific storage
in S3. The user_id parameter will be the Cognito sub when authentication
is added. For now, it defaults to "test".
"""

from pathlib import Path
from typing import Union

import boto3

# Default user ID used when no user_id is provided.
# Will be replaced with Cognito sub when auth is implemented.
DEFAULT_USER_ID = "test"


class S3Storage:
    """S3 storage client with user-scoped key management.

    Provides methods for uploading, downloading, and managing objects
    in S3 with user-specific prefixes.

    Attributes:
        bucket_name: The S3 bucket name.
        region: The AWS region for the S3 client.
    """

    def __init__(self, bucket_name: str, region: str) -> None:
        """Initialize S3Storage.

        Args:
            bucket_name: The S3 bucket name.
            region: The AWS region for the S3 client.
        """
        self.bucket_name = bucket_name
        self.region = region
        self._client = None

    @property
    def client(self):
        """Lazy-loaded boto3 S3 client.

        The client is created on first access and cached for subsequent use.
        """
        if self._client is None:
            self._client = boto3.client("s3", region_name=self.region)
        return self._client

    def get_user_prefix(self, user_id: str | None = None, subfolder: str = "") -> str:
        """Get the S3 key prefix for a user.

        Args:
            user_id: The user identifier. Defaults to DEFAULT_USER_ID if None.
            subfolder: Optional subfolder within the user's directory.

        Returns:
            The S3 key prefix in format "{user_id}/{subfolder}".
        """
        effective_user_id = user_id if user_id is not None else DEFAULT_USER_ID
        return f"{effective_user_id}/{subfolder}"

    def build_s3_key(
        self, user_id: str | None, subfolder: str, filename: str
    ) -> str:
        """Build a full S3 key from components.

        Args:
            user_id: The user identifier. Defaults to DEFAULT_USER_ID if None.
            subfolder: Subfolder within the user's directory.
            filename: The filename to append.

        Returns:
            Full S3 key in format "{user_id}/{subfolder}/{filename}"
            or "{user_id}/{filename}" if subfolder is empty.
        """
        prefix = self.get_user_prefix(user_id=user_id, subfolder=subfolder)
        # If subfolder is empty, prefix ends with "/" so we avoid double slash
        if subfolder:
            return f"{prefix}/{filename}"
        return f"{prefix}{filename}"

    def upload_bytes(self, data: bytes, s3_key: str) -> None:
        """Upload bytes data to S3.

        Args:
            data: The bytes data to upload.
            s3_key: The full S3 key (including user prefix).
        """
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=s3_key,
            Body=data
        )

    def upload_file(self, local_path: Union[str, Path], s3_key: str) -> None:
        """Upload a file to S3.

        Args:
            local_path: Path to the local file to upload.
            s3_key: The full S3 key (including user prefix).
        """
        # Convert Path to string for boto3
        path_str = str(local_path) if isinstance(local_path, Path) else local_path
        self.client.upload_file(path_str, self.bucket_name, s3_key)

    def download_file(self, s3_key: str, local_path: Union[str, Path]) -> None:
        """Download a file from S3.

        Args:
            s3_key: The full S3 key (including user prefix).
            local_path: Path where the file should be saved locally.
        """
        # Convert Path to string for boto3
        path_str = str(local_path) if isinstance(local_path, Path) else local_path
        self.client.download_file(self.bucket_name, s3_key, path_str)

    def generate_presigned_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL for accessing an S3 object.

        Args:
            s3_key: The full S3 key (including user prefix).
            expires_in: URL expiration time in seconds. Defaults to 3600 (1 hour).

        Returns:
            The presigned URL string.
        """
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": s3_key},
            ExpiresIn=expires_in
        )

    def delete_object(self, s3_key: str) -> None:
        """Delete an object from S3.

        Args:
            s3_key: The full S3 key (including user prefix).
        """
        self.client.delete_object(
            Bucket=self.bucket_name,
            Key=s3_key
        )
