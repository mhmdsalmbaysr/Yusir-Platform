from django.db import models


class Governorate(models.Model):
    pcode = models.CharField(max_length=10, primary_key=True)
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    center_lat = models.FloatField()
    center_lon = models.FloatField()
    area_sqkm = models.FloatField(default=0)
    geometry = models.JSONField(default=dict)

    class Meta:
        verbose_name = 'محافظة'
        verbose_name_plural = 'المحافظات'

    def __str__(self):
        return self.name_ar


class District(models.Model):
    pcode = models.CharField(max_length=10, primary_key=True)
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    governorate = models.ForeignKey(Governorate, on_delete=models.CASCADE, related_name='districts')
    center_lat = models.FloatField()
    center_lon = models.FloatField()
    area_sqkm = models.FloatField(default=0)
    geometry = models.JSONField(default=dict)

    class Meta:
        verbose_name = 'مديرية'
        verbose_name_plural = 'المديريات'

    def __str__(self):
        return f'{self.name_ar} - {self.governorate.name_ar}'
