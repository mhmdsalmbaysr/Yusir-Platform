from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.OrderViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='api-order-list'),
    path('orders/<str:id>/', views.OrderViewSet.as_view({
        'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='api-order-detail'),
]
