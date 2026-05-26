from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.send_otp),
    path('verify-otp/', views.verify_otp),
    path('set-pin/', views.set_pin),
    path('verify-pin/', views.verify_pin),
    path('profile/', views.profile),
    path('profile/update/', views.update_profile),
]
