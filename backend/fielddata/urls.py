from django.urls import path
from . import views

urlpatterns = [
    path('field-data/', views.FieldDataViewSet.as_view({'get': 'list', 'post': 'create'}), name='api-fielddata-list'),
    path('field-data/<str:id>/', views.FieldDataViewSet.as_view({'delete': 'destroy'}), name='api-fielddata-detail'),
]
