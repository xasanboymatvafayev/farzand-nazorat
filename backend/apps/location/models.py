from django.db import models
from apps.children.models import Child


class LocationLog(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='locations')
    latitude = models.FloatField()
    longitude = models.FloatField()
    accuracy = models.FloatField(default=0)
    address = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.child.full_name} - {self.latitude},{self.longitude}"
