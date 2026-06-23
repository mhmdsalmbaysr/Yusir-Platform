from django.contrib import admin
from .models import FieldDataItem


@admin.register(FieldDataItem)
class FieldDataItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'district', 'district_name', 'latitude', 'longitude']
    list_filter = ['type', 'district']
    search_fields = ['name', 'district_name']
