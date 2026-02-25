"""DynamoDB database abstraction."""

import boto3
from functools import lru_cache
from datetime import datetime, timezone
from typing import Any

from app.config import get_settings


class Database:
    """DynamoDB client for library and checkpoints."""

    def __init__(self) -> None:
        settings = get_settings()
        self.dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
        self.library_table = self.dynamodb.Table(settings.library_table_name)
        self.checkpoints_table = self.dynamodb.Table(settings.checkpoints_table_name)

    # Library methods
    def get_library(self, user_id: str) -> list[dict[str, Any]]:
        """Get all storybooks for a user."""
        response = self.library_table.query(
            KeyConditionExpression="user_id = :uid",
            ExpressionAttributeValues={":uid": user_id},
        )
        return response.get("Items", [])

    def get_storybook(self, user_id: str, storybook_id: str) -> dict[str, Any] | None:
        """Get a single storybook."""
        response = self.library_table.get_item(
            Key={"user_id": user_id, "id": storybook_id}
        )
        return response.get("Item")

    def save_storybook(self, user_id: str, entry: dict[str, Any]) -> None:
        """Save a storybook to the library."""
        self.library_table.put_item(Item={"user_id": user_id, **entry})

    def delete_storybook(self, user_id: str, storybook_id: str) -> None:
        """Delete a storybook from the library."""
        self.library_table.delete_item(Key={"user_id": user_id, "id": storybook_id})

    # Checkpoint methods
    def get_checkpoint(self, user_id: str, run_id: str) -> dict[str, Any] | None:
        """Get a pipeline checkpoint."""
        response = self.checkpoints_table.get_item(
            Key={"user_id": user_id, "run_id": run_id}
        )
        return response.get("Item")

    def save_checkpoint(self, user_id: str, run_id: str, data: dict[str, Any]) -> None:
        """Save a pipeline checkpoint with 7-day TTL."""
        ttl = int(datetime.now(timezone.utc).timestamp() + 7 * 24 * 3600)
        self.checkpoints_table.put_item(
            Item={
                "user_id": user_id,
                "run_id": run_id,
                "ttl": ttl,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                **data,
            }
        )

    def delete_checkpoint(self, user_id: str, run_id: str) -> None:
        """Delete a pipeline checkpoint."""
        self.checkpoints_table.delete_item(Key={"user_id": user_id, "run_id": run_id})


@lru_cache
def get_database() -> Database:
    """Get cached Database instance (singleton)."""
    return Database()
