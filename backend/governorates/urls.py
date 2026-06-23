from django.urls import path
from . import views

urlpatterns = [
    path('governorates/', views.GovernorateViewSet.as_view({'get': 'list'}), name='api-governorate-list'),
    path('governorates/<str:pcode>/', views.GovernorateViewSet.as_view({'get': 'retrieve'}), name='api-governorate-detail'),
    path('governorates/<str:pcode>/districts/', views.DistrictViewSet.as_view({'get': 'list'}), name='api-governorate-districts'),
    path('districts/', views.DistrictViewSet.as_view({'get': 'list'}), name='api-district-list'),
    path('districts/<str:pcode>/', views.DistrictViewSet.as_view({'get': 'retrieve'}), name='api-district-detail'),
]
