from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Child
from apps.accounts.models import User


class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Child
        fields = ['id', 'full_name', 'grade', 'barcode', 'is_active', 'created_at']
        read_only_fields = ['barcode']


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def children_list(request):
    if request.method == 'GET':
        children = Child.objects.filter(parent=request.user)
        return Response(ChildSerializer(children, many=True).data)

    # POST: Add child using parent barcode (parent gives barcode to child device)
    data = request.data.copy()
    # Generate unique barcode for child
    import random, string
    chars = string.ascii_uppercase + string.digits
    while True:
        barcode = ''.join(random.choices(chars, k=14))
        if not Child.objects.filter(barcode=barcode).exists():
            break
    data['barcode'] = barcode

    ser = ChildSerializer(data=data)
    ser.is_valid(raise_exception=True)
    child = ser.save(parent=request.user)
    return Response(ChildSerializer(child).data, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def child_detail(request, child_id):
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
    except Child.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    if request.method == 'GET':
        return Response(ChildSerializer(child).data)
    elif request.method == 'PUT':
        ser = ChildSerializer(child, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
    elif request.method == 'DELETE':
        child.delete()
        return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_child_device(request):
    """Child device links to parent using parent's barcode"""
    parent_barcode = request.data.get('parent_barcode')
    child_name = request.data.get('full_name')
    grade = request.data.get('grade')

    try:
        parent = User.objects.get(barcode=parent_barcode)
    except User.DoesNotExist:
        return Response({'error': 'Noto\'g\'ri shtrix kod'}, status=400)

    import random, string
    chars = string.ascii_uppercase + string.digits
    while True:
        barcode = ''.join(random.choices(chars, k=14))
        if not Child.objects.filter(barcode=barcode).exists():
            break

    child = Child.objects.create(
        parent=parent,
        full_name=child_name,
        grade=grade,
        barcode=barcode,
        device_id=request.data.get('device_id', '')
    )

    from rest_framework_simplejwt.tokens import RefreshToken
    # Create a special child token
    refresh = RefreshToken.for_user(parent)
    refresh['child_id'] = child.id
    refresh['is_child'] = True

    return Response({
        'child': ChildSerializer(child).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })
