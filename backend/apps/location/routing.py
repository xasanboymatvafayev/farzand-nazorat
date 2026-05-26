from django.urls import re_path
from .views import ParentConsumer

websocket_urlpatterns = [
    re_path(r'ws/parent/(?P<user_id>\d+)/$', ParentConsumer.as_asgi()),
]
