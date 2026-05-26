from django.db import models
from apps.children.models import Child


class AppPermission(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='app_permissions')
    package_name = models.CharField(max_length=200)  # e.g. com.pubg.mobile
    app_name = models.CharField(max_length=100)
    app_icon = models.TextField(blank=True)  # base64 icon
    is_allowed = models.BooleanField(default=True)
    daily_limit_minutes = models.IntegerField(default=0)  # 0 = no limit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'package_name']

    def __str__(self):
        return f"{self.app_name} - {self.child.full_name}"


class AppUsageLog(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='usage_logs')
    package_name = models.CharField(max_length=200)
    app_name = models.CharField(max_length=100)
    usage_minutes = models.IntegerField(default=0)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['child', 'package_name', 'date']

    def __str__(self):
        return f"{self.app_name} - {self.child.full_name} - {self.date}"


class ScreenTimeSchedule(models.Model):
    DAYS = [
        ('MON', 'Dushanba'), ('TUE', 'Seshanba'), ('WED', 'Chorshanba'),
        ('THU', 'Payshanba'), ('FRI', 'Juma'), ('SAT', 'Shanba'), ('SUN', 'Yakshanba')
    ]
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=3, choices=DAYS)
    allowed_start = models.TimeField()
    allowed_end = models.TimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.child.full_name} - {self.day_of_week}"
