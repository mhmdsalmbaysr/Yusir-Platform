from django.contrib import admin
from .models import Governorate, District


@admin.register(Governorate)
class GovernorateAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'pcode', 'center_lat', 'center_lon']
    search_fields = ['name_ar', 'name_en', 'pcode']


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'pcode', 'governorate']
    list_filter = ['governorate']
    search_fields = ['name_ar', 'name_en', 'pcode']
