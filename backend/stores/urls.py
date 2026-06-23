from django.urls import path
from . import views

urlpatterns = [
    path('stores/', views.StoreViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='api-store-list'),
    path('stores/<str:store_id>/', views.StoreViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='api-store-detail'),
    path('stores/<str:store_id>/products/', views.StoreViewSet.as_view({
        'get': 'products', 'post': 'products'
    }), name='api-store-products'),
    path('products/<str:id>/', views.ProductViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='api-product-detail'),
]
