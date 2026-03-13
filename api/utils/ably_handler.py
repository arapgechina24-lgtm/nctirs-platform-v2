import os
from ably import AblyRealtime
import asyncio
import logging

logger = logging.getLogger(__name__)

class AblyHandler:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AblyHandler, cls).__new__(cls)
            api_key = os.getenv("NEXT_PUBLIC_ABLY_API_KEY") # Shared key for simplicity in hackathon
            if api_key:
                try:
                    cls._instance.client = AblyRealtime(api_key)
                    logger.info("✅ Ably Python Client Initialized")
                except Exception as e:
                    logger.error(f"❌ Failed to initialize Ably: {e}")
                    cls._instance.client = None
            else:
                logger.warning("⚠️ Ably API Key missing in environment.")
                cls._instance.client = None
        return cls._instance

    async def publish_alert(self, channel_name: str, event_name: str, data: dict):
        if self.client:
            try:
                channel = self.client.channels.get(channel_name)
                await channel.publish(event_name, data)
                logger.info(f"📡 Ably Pulse Sent: {event_name} on {channel_name}")
            except Exception as e:
                logger.error(f"❌ Ably Publish Failed: {e}")

ably_handler = AblyHandler()
