import random
import string

from django.db import models
from stores.models import Store


def _generate_order_id():
    return 'ORD-' + ''.join(random.choices(string.digits, k=6))


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'قيد الانتظار'),
        ('confirmed', 'مؤكد'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغي'),
    ]
    id = models.CharField(max_length=30, primary_key=True, default=_generate_order_id)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='orders')
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=20)
    customer_address = models.TextField()
    notes = models.TextField(blank=True)
    total = models.IntegerField()
    items = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'طلب'
        verbose_name_plural = 'الطلبات'

    def __str__(self):
        return f'{self.id} - {self.customer_name}'
