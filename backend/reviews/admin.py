from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['customer_name', 'store', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['customer_name', 'store__name']
