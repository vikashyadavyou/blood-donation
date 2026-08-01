"""
WebSocket consumer for real-time donor updates.

All connected clients (e.g., the /display screen) join the 'donors' group
and receive broadcasts whenever a donor is created or completed.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class DonorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for the donor broadcast channel.

    Group: 'donors'
    Receives: donor_update events from the channel layer (sent by views.py)
    Sends: JSON payloads to connected WebSocket clients
    """

    GROUP_NAME = 'donors'

    async def connect(self):
        """Join the donors broadcast group on WebSocket connect."""
        await self.channel_layer.group_add(
            self.GROUP_NAME,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        """Leave the donors broadcast group on WebSocket disconnect."""
        await self.channel_layer.group_discard(
            self.GROUP_NAME,
            self.channel_name
        )

    async def donor_update(self, event):
        """
        Handle donor_update events from the channel layer.

        Forwards the payload as-is to the connected WebSocket client.
        Expected payload structure:
        {
            "id": <int>,
            "name": "Donor Name",
            "action_type": "eligible" | "completed",
            "language": "EN" | "HI" | "GU",
            "counts": {
                "eligible": <int>,
                "completed": <int>
            }
        }
        """
        await self.send(text_data=json.dumps(event['payload']))
