from django.urls import path, include

urlpatterns = [
    path('auth/', include('accounts.urls')),
    path('', include('governorates.urls')),
    path('', include('fielddata.urls')),
    path('', include('stores.urls')),
    path('', include('reviews.urls')),
    path('', include('cart_orders.urls')),
]
