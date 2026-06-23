from django.urls import path
from . import views

urlpatterns = [
    path('reviews/', views.ReviewViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='api-review-list'),
    path('reviews/<str:id>/', views.ReviewViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'delete': 'destroy'
    }), name='api-review-detail'),
]
