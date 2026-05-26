from django.urls import path
from . import views

urlpatterns = [
    path('<int:child_id>/permissions/', views.app_permissions),
    path('<int:child_id>/permissions/<int:perm_id>/', views.app_permission_detail),
    path('<int:child_id>/sync/', views.sync_installed_apps),
    path('<int:child_id>/check/<str:package_name>/', views.check_app_allowed),
    path('<int:child_id>/usage/', views.usage_report),
    path('<int:child_id>/report-usage/', views.report_usage),
]
