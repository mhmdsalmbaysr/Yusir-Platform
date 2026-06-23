from django.db import models
from accounts.models import MerchantProfile


class Store(models.Model):
    store_id = models.CharField(max_length=20, primary_key=True)
    merchant = models.OneToOneField(
        MerchantProfile, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='store'
    )
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default='متجر')
    city = models.CharField(max_length=100, blank=True)
    neighborhood = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    rating = models.FloatField(default=4.5)
    delivery_fee = models.IntegerField(default=500)
    open = models.BooleanField(default=True)
    image = models.URLField(blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'متجر'
        verbose_name_plural = 'المتاجر'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    price = models.IntegerField()
    unit = models.CharField(max_length=50, default='وحدة')
    image = models.URLField(blank=True)
    in_stock = models.BooleanField(default=True)
    category = models.CharField(max_length=100, blank=True)
    desc = models.TextField(blank=True)
    old_price = models.IntegerField(null=True, blank=True)
    rating = models.FloatField(default=4.5)

    class Meta:
        verbose_name = 'منتج'
        verbose_name_plural = 'المنتجات'

    def __str__(self):
        return self.name
