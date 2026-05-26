from django.db import models
from apps.accounts.models import User


class Child(models.Model):
    GRADE_CHOICES = [(i, f"{i}-sinf") for i in range(1, 12)]

    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='children')
    full_name = models.CharField(max_length=100)
    grade = models.IntegerField(choices=GRADE_CHOICES)
    barcode = models.CharField(max_length=14, unique=True)  # Child device barcode
    device_id = models.CharField(max_length=200, blank=True)
    fcm_token = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.parent.phone})"


class ChildDevice(models.Model):
    child = models.OneToOneField(Child, on_delete=models.CASCADE, related_name='device')
    device_model = models.CharField(max_length=100, blank=True)
    os_version = models.CharField(max_length=50, blank=True)
    last_seen = models.DateTimeField(auto_now=True)
    battery_level = models.IntegerField(default=0)
    is_online = models.BooleanField(default=False)
