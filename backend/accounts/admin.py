from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, MerchantProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'phone', 'is_staff']
    list_filter = ['role', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('معلومات إضافية', {'fields': ('role', 'phone')}),
    )


@admin.register(MerchantProfile)
class MerchantProfileAdmin(admin.ModelAdmin):
    list_display = ['store_name', 'store_id', 'plan', 'suspended', 'expiry', 'created']
    list_filter = ['plan', 'suspended']
    search_fields = ['store_name', 'store_id']
