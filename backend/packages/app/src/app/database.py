"""DynamoDB database abstraction."""

import boto3
from decimal import Decimal
from functools import lru_cache
from datetime import datetime, timezone
from typing import Any

from app.config import get_settings


def _convert_floats_to_decimal(obj: Any) -> Any:
    """Recursively convert float values to Decimal for DynamoDB compatibility."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _convert_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_floats_to_decimal(item) for item in obj]
    return obj


class Database:
    """DynamoDB client for library and checkpoints."""

    def __init__(self) -> None:
        settings = get_settings()
        self.dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
        self.library_table = self.dynamodb.Table(settings.library_table_name)
        self.checkpoints_table = self.dynamodb.Table(settings.checkpoints_table_name)

    # Library methods
    def get_library(self, user_id: str) -> list[dict[str, Any]]:
        """Get all storybooks for a user, sorted by created_at descending (newest first)."""
        response = self.library_table.query(
            IndexName="user_id-created_at-index",
            KeyConditionExpression="user_id = :uid",
            ExpressionAttributeValues={":uid": user_id},
            ScanIndexForward=False,  # Descending order (newest first)
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
        item = _convert_floats_to_decimal({"user_id": user_id, **entry})
        self.library_table.put_item(Item=item)

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
        item = _convert_floats_to_decimal({
            "user_id": user_id,
            "run_id": run_id,
            "ttl": ttl,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            **data,
        })
        self.checkpoints_table.put_item(Item=item)

    def delete_checkpoint(self, user_id: str, run_id: str) -> None:
        """Delete a pipeline checkpoint."""
        self.checkpoints_table.delete_item(Key={"user_id": user_id, "run_id": run_id})


@lru_cache
def get_database() -> Database:
    """Get cached Database instance (singleton)."""
    return Database()
