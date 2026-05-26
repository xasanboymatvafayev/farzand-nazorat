from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import AppPermission, AppUsageLog, ScreenTimeSchedule
from apps.children.models import Child


class AppPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppPermission
        fields = '__all__'


class AppUsageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUsageLog
        fields = '__all__'


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScreenTimeSchedule
        fields = '__all__'


def get_child_or_404(parent, child_id):
    try:
        return Child.objects.get(id=child_id, parent=parent)
    except Child.DoesNotExist:
        return None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def app_permissions(request, child_id):
    child = get_child_or_404(request.user, child_id)
    if not child:
        return Response({'error': 'Topilmadi'}, status=404)

    if request.method == 'GET':
        apps = AppPermission.objects.filter(child=child)
        return Response(AppPermissionSerializer(apps, many=True).data)

    ser = AppPermissionSerializer(data={**request.data, 'child': child.id})
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data, status=201)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def app_permission_detail(request, child_id, perm_id):
    child = get_child_or_404(request.user, child_id)
    if not child:
        return Response({'error': 'Topilmadi'}, status=404)

    try:
        perm = AppPermission.objects.get(id=perm_id, child=child)
    except AppPermission.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    if request.method == 'PUT':
        ser = AppPermissionSerializer(perm, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
    perm.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_installed_apps(request, child_id):
    """Child device sends list of installed apps"""
    child = get_child_or_404(request.user, child_id)
    if not child:
        return Response({'error': 'Topilmadi'}, status=404)

    apps = request.data.get('apps', [])
    for app in apps:
        AppPermission.objects.get_or_create(
            child=child,
            package_name=app['package_name'],
            defaults={
                'app_name': app.get('app_name', app['package_name']),
                'is_allowed': True,
                'daily_limit_minutes': 0,
            }
        )
    return Response({'synced': len(apps)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_app_allowed(request, child_id, package_name):
    """Child device checks if app is allowed to run"""
    child = get_child_or_404(request.user, child_id)
    if not child:
        return Response({'error': 'Topilmadi'}, status=404)

    try:
        perm = AppPermission.objects.get(child=child, package_name=package_name)
    except AppPermission.DoesNotExist:
        return Response({'allowed': True})  # Not restricted by default

    if not perm.is_allowed:
        return Response({'allowed': False, 'reason': 'blocked'})

    if perm.daily_limit_minutes > 0:
        today = timezone.now().date()
        log = AppUsageLog.objects.filter(
            child=child, package_name=package_name, date=today
        ).first()
        if log and log.usage_minutes >= perm.daily_limit_minutes:
            return Response({'allowed': False, 'reason': 'time_limit', 'limit': perm.daily_limit_minutes})

    return Response({'allowed': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_usage(request, child_id):
    """Child device reports app usage"""
    child = get_child_or_404(request.user, child_id)
    if not child:
        return Response({'error': 'Topilmadi'}, status=404)

    today = timezone.now().date()
    for item in request.data.get('usage', []):
        log, _ = AppUsageLog.objects.get_or_create(
            child=child,
            package_name=item['package_name'],
            date=today,
            defaults={'app_name': item.get('app_name', item['package_name']), 'usage_minutes': 0}
        )
        log.usage_minutes += item.get('minutes', 0)
        log.save()

    return Response({'success': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_report(request, child_id):
    child = get_child_or_404(request.user, child_id)
    if not child:
        return Response({'error': 'Topilmadi'}, status=404)

    date_str = request.query_params.get('date', str(timezone.now().date()))
    logs = AppUsageLog.objects.filter(child=child, date=date_str).order_by('-usage_minutes')
    return Response(AppUsageLogSerializer(logs, many=True).data)
