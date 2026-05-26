from django.urls import path
from . import views

urlpatterns = [
    path('', views.children_list),
    path('<int:child_id>/', views.child_detail),
    path('link-device/', views.link_child_device),
]
