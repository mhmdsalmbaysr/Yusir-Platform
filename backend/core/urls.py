from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('admin-panel/', views.admin_page, name='admin'),
    path('login/', views.login_page, name='login'),
    path('merchant/', views.merchant_page, name='merchant'),
    path('super-admin/', views.super_admin_page, name='super-admin'),
    path('api/v1/', include('api_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
