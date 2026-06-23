from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('merchant', 'تاجر'),
        ('superadmin', 'مشرف عام'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='merchant')
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = 'مستخدم'
        verbose_name_plural = 'المستخدمين'

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'


class MerchantProfile(models.Model):
    PLAN_CHOICES = [
        ('basic', 'أساسي'),
        ('pro', 'احترافي'),
        ('premium', 'متقدم'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='merchant_profile')
    store_name = models.CharField(max_length=200)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='basic')
    store_id = models.CharField(max_length=20, unique=True, db_index=True)
    suspended = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)
    expiry = models.DateTimeField()

    class Meta:
        verbose_name = 'ملف تاجر'
        verbose_name_plural = 'ملفات التجار'

    def __str__(self):
        return f'{self.store_name} ({self.store_id})'
