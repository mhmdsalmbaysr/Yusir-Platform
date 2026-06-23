from django.db import models
from governorates.models import District


class FieldDataItem(models.Model):
    FIELD_TYPE_CHOICES = [
        ('hood', 'حي'),
        ('lane', 'حارة'),
    ]
    id = models.CharField(max_length=30, primary_key=True)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=10, choices=FIELD_TYPE_CHOICES)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='field_data')
    district_name = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'بيانات ميدانية'
        verbose_name_plural = 'البيانات الميدانية'

    def __str__(self):
        return f'{self.name} ({self.get_type_display()})'
