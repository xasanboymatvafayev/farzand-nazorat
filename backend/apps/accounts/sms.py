import requests
import random
from django.conf import settings
from django.core.cache import cache


class EskizSMSService:
    BASE_URL = settings.ESKIZ_BASE_URL

    def _get_token(self):
        token = cache.get('eskiz_token')
        if token:
            return token
        try:
            resp = requests.post(f"{self.BASE_URL}/auth/login", data={
                'email': settings.ESKIZ_EMAIL,
                'password': settings.ESKIZ_PASSWORD,
            }, timeout=10)
            data = resp.json()
            token = data.get('data', {}).get('token')
            if token:
                cache.set('eskiz_token', token, 3600 * 23)
            return token
        except Exception as e:
            print(f"Eskiz login error: {e}")
            return None

    def send_sms(self, phone: str, message: str) -> dict:
        if settings.ESKIZ_DEMO_MODE:
            print(f"[SMS DEMO] To: {phone} | Message: {message}")
            return {'success': True, 'demo': True, 'message': f'Demo SMS: {message}'}

        token = self._get_token()
        if not token:
            return {'success': False, 'error': 'SMS token olishda xatolik'}

        try:
            resp = requests.post(
                f"{self.BASE_URL}/message/sms/send",
                headers={'Authorization': f'Bearer {token}'},
                data={
                    'mobile_phone': phone.replace('+', ''),
                    'message': message,
                    'from': '4546',
                },
                timeout=10
            )
            data = resp.json()
            if data.get('status') == 'waiting':
                return {'success': True}
            return {'success': False, 'error': data}
        except Exception as e:
            return {'success': False, 'error': str(e)}


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


sms_service = EskizSMSService()
