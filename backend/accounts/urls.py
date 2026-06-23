from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='api-login'),
    path('token/refresh/', views.login_view, name='api-token-refresh'),
    path('me/', views.me_view, name='api-me'),
    path('merchants/', views.MerchantListCreateView.as_view(), name='api-merchant-list'),
    path('merchants/<str:store_id>/', views.MerchantDetailView.as_view(), name='api-merchant-detail'),
]
