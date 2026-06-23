from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'store', 'customer_name', 'total', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['customer_name', 'store__name']
