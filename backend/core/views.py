from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def admin_page(request):
    return render(request, 'admin.html')

def login_page(request):
    return render(request, 'login.html')

def merchant_page(request):
    return render(request, 'merchant.html')

def super_admin_page(request):
    return render(request, 'super-admin.html')
