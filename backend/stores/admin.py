from django.contrib import admin
from .models import Store, Product


class ProductInline(admin.TabularInline):
    model = Product
    extra = 1


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'store_id', 'category', 'city', 'rating', 'delivery_fee', 'open']
    list_filter = ['open', 'category', 'city']
    search_fields = ['name', 'store_id', 'city']
    inlines = [ProductInline]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'price', 'in_stock', 'rating']
    list_filter = ['in_stock', 'category']
    search_fields = ['name', 'store__name']
