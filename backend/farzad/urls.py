from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/children/', include('apps.children.urls')),
    path('api/apps/', include('apps.apps_control.urls')),
    path('api/education/', include('apps.education.urls')),
    path('api/location/', include('apps.location.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
