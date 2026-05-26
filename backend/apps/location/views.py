from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LocationLog
from apps.children.models import Child
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationLog
        fields = '__all__'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def child_location(request, child_id):
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
    except Child.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    latest = LocationLog.objects.filter(child=child).first()
    if not latest:
        return Response({'error': 'Joylashuv topilmadi'}, status=404)
    return Response(LocationSerializer(latest).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def location_history(request, child_id):
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
    except Child.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    logs = LocationLog.objects.filter(child=child)[:50]
    return Response(LocationSerializer(logs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_location(request, child_id):
    """Child device sends its location"""
    try:
        child = Child.objects.get(id=child_id)
    except Child.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    loc = LocationLog.objects.create(
        child=child,
        latitude=request.data['latitude'],
        longitude=request.data['longitude'],
        accuracy=request.data.get('accuracy', 0),
        address=request.data.get('address', ''),
    )

    # Notify parent via WebSocket
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"parent_{child.parent_id}",
        {
            'type': 'location_update',
            'child_id': child.id,
            'latitude': loc.latitude,
            'longitude': loc.longitude,
            'recorded_at': str(loc.recorded_at),
        }
    )
    return Response({'success': True})


# WebSocket Consumer
class ParentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.group_name = f"parent_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def location_update(self, event):
        await self.send(text_data=json.dumps({'type': 'location', **event}))

    async def camera_frame(self, event):
        await self.send(text_data=json.dumps({'type': 'camera', **event}))
