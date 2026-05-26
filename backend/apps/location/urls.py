from django.urls import path
from . import views

urlpatterns = [
    path('<int:child_id>/current/', views.child_location),
    path('<int:child_id>/history/', views.location_history),
    path('<int:child_id>/update/', views.update_location),
]
