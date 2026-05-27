from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
from .models import User, OTPCode
from .sms import sms_service, generate_otp


def normalize_phone(phone):
    """Har qanday formatdagi telefon raqamni +998XXXXXXXXX formatga o'tkazish"""
    digits = ''.join(filter(str.isdigit, phone))
    if len(digits) == 9:
        return '+998' + digits
    elif len(digits) == 12 and digits.startswith('998'):
        return '+' + digits
    elif len(digits) == 13 and digits.startswith('9989'):
        return '+' + digits[1:]
    return '+' + digits


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)


class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=6)


class SetPINSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=4, max_length=4)

    def validate_pin(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("PIN faqat raqamlardan iborat bo'lishi kerak")
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone', 'full_name', 'barcode', 'app_pin']
        read_only_fields = ['barcode']


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    ser = SendOTPSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    phone = normalize_phone(ser.validated_data['phone'])

    recent = OTPCode.objects.filter(
        phone=phone,
        created_at__gte=timezone.now() - timedelta(minutes=1),
        is_used=False
    ).first()
    if recent:
        return Response({'error': 'Iltimos, 1 daqiqa kuting'}, status=429)

    code = generate_otp()
    OTPCode.objects.create(phone=phone, code=code)
    message = f"Farzad Nazorat: Tasdiqlash kodi {code}. Hech kimga bermang!"
    result = sms_service.send_sms(phone, message)

    if result.get('demo'):
        return Response({
            'success': True,
            'demo': True,
            'demo_code': code,
            'otp': code,
            'message': f"Demo rejim: SMS yuborildi ({code})"
        })
    if result.get('success'):
        return Response({'success': True, 'message': 'SMS yuborildi'})
    return Response({'error': 'SMS yuborishda xatolik'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    ser = VerifyOTPSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    phone = normalize_phone(ser.validated_data['phone'])
    code = ser.validated_data['code']

    otp = OTPCode.objects.filter(
        phone=phone,
        code=code,
        is_used=False,
        created_at__gte=timezone.now() - timedelta(minutes=10)
    ).first()

    if not otp:
        return Response({'error': "Noto'g'ri yoki muddati o'tgan kod"}, status=400)

    otp.is_used = True
    otp.save()

    user, created = User.objects.get_or_create(phone=phone)
    refresh = RefreshToken.for_user(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
        'is_new': created,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_pin(request):
    ser = SetPINSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    request.user.app_pin = ser.validated_data['pin']
    request.user.save()
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_pin(request):
    pin = request.data.get('pin')
    if request.user.app_pin == pin:
        return Response({'success': True})
    return Response({'error': "Noto'g'ri PIN"}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    ser = UserSerializer(request.user, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)