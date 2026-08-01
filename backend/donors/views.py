"""
REST API views for the Donor model.

Endpoints:
  POST   /api/donors/              → Create a new donor (ELIGIBLE)
  GET    /api/donors/              → List donors (filterable by ?status=ELIGIBLE)
  GET    /api/donors/stats/        → Get current eligible/completed counts
  PATCH  /api/donors/<id>/complete/ → Mark a donor as COMPLETED
"""

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Donor
from .serializers import DonorSerializer, DonorCreateSerializer


def _get_counts():
    """Calculate current real-time stats."""
    return {
        'eligible': Donor.objects.filter(status=Donor.Status.ELIGIBLE).count(),
        'completed': Donor.objects.filter(status=Donor.Status.COMPLETED).count(),
    }


def _broadcast_donor_event(donor, action_type):
    """
    Broadcast a donor event to all connected WebSocket clients.

    Sends the donor's id, name, action type, language, and current counts
    to the 'donors' channel group.
    """
    channel_layer = get_channel_layer()
    payload = {
        'id': donor.id,
        'name': donor.name,
        'action_type': action_type,
        'language': donor.language,
        'counts': _get_counts(),
    }
    async_to_sync(channel_layer.group_send)(
        'donors',
        {
            'type': 'donor_update',
            'payload': payload,
        }
    )


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def donor_list_create(request):
    """
    GET  → List donors. Supports ?status=ELIGIBLE filter.
    POST → Create a new donor with ELIGIBLE status.
    """
    if request.method == 'GET':
        queryset = Donor.objects.all()
        # Optional status filter for the admin Donation Bed desk
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        serializer = DonorSerializer(queryset, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = DonorCreateSerializer(data=request.data)
        if serializer.is_valid():
            donor = serializer.save()
            # Broadcast the new eligible donor via WebSocket
            _broadcast_donor_event(donor, 'eligible')
            return Response(
                DonorSerializer(donor).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@authentication_classes([])
@permission_classes([AllowAny])
def donor_complete(request, donor_id):
    """
    PATCH /api/donors/<id>/complete/
    Mark a donor as COMPLETED (used by the Donation Bed desk).
    """
    try:
        donor = Donor.objects.get(id=donor_id)
    except Donor.DoesNotExist:
        return Response(
            {'error': 'Donor not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if donor.status == Donor.Status.COMPLETED:
        return Response(
            {'error': 'Donor already completed'},
            status=status.HTTP_400_BAD_REQUEST
        )

    donor.status = Donor.Status.COMPLETED
    donor.save()

    # Broadcast the completion event via WebSocket
    _broadcast_donor_event(donor, 'completed')

    return Response(DonorSerializer(donor).data)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def donor_stats(request):
    """
    GET /api/donors/stats/
    Returns current eligible and completed counts.
    """
    return Response(_get_counts())
