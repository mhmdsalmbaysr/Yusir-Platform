from django.db import models
from stores.models import Store


class Review(models.Model):
    id = models.CharField(max_length=30, primary_key=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='reviews')
    customer_name = models.CharField(max_length=100, default='مجهول')
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تقييم'
        verbose_name_plural = 'التقييمات'

    def __str__(self):
        return f'{self.customer_name} - {self.rating}★'
