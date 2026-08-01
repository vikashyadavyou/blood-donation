"""
DRF Serializers for the Donor model.
"""

from rest_framework import serializers
from .models import Donor


class DonorSerializer(serializers.ModelSerializer):
    """Full serializer for Donor CRUD operations."""

    class Meta:
        model = Donor
        fields = ['id', 'name', 'status', 'language', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class DonorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new donor (Screening Desk)."""

    class Meta:
        model = Donor
        fields = ['id', 'name', 'language']

    def create(self, validated_data):
        """Create donor with ELIGIBLE status."""
        validated_data['status'] = Donor.Status.ELIGIBLE
        return super().create(validated_data)
