"""
WebSocket URL routing for the donors app.
"""

from django.urls import path
from .consumers import DonorConsumer

websocket_urlpatterns = [
    path('ws/donors/', DonorConsumer.as_asgi()),
]
