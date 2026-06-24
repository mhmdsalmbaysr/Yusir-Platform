import random
import string

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Store, Product
from .serializers import (
    StoreListSerializer, StoreDetailSerializer,
    StoreCreateSerializer, ProductSerializer, ProductCreateSerializer,
)


def _generate_store_id():
    return 'ST-' + ''.join(random.choices(string.digits, k=4))


def _generate_product_id():
    return 'P-' + ''.join(random.choices(string.digits, k=4))


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.prefetch_related('products').all()
    permission_classes = [permissions.AllowAny]
    lookup_field = 'store_id'

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StoreCreateSerializer
        if self.action == 'list':
            if self.request.query_params.get('include_products', '').lower() == 'true':
                return StoreDetailSerializer
            return StoreListSerializer
        return StoreDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        ne_lat = params.get('ne_lat')
        ne_lng = params.get('ne_lng')
        sw_lat = params.get('sw_lat')
        sw_lng = params.get('sw_lng')
        if ne_lat and ne_lng and sw_lat and sw_lng:
            qs = qs.filter(
                latitude__gte=float(sw_lat), latitude__lte=float(ne_lat),
                longitude__gte=float(sw_lng), longitude__lte=float(ne_lng),
            )

        search = params.get('search', '')
        if search:
            qs = qs.filter(name__icontains=search)

        open_filter = params.get('open')
        if open_filter is not None:
            qs = qs.filter(open=open_filter.lower() == 'true')

        category = params.get('category', '')
        if category:
            qs = qs.filter(category__icontains=category)

        city = params.get('city', '')
        if city:
            qs = qs.filter(city__icontains=city)

        return qs

    def perform_create(self, serializer):
        store_id = _generate_store_id()
        while Store.objects.filter(store_id=store_id).exists():
            store_id = _generate_store_id()
        serializer.save(store_id=store_id)

    @action(detail=True, methods=['get', 'post'])
    def products(self, request, store_id=None):
        store = self.get_object()
        if request.method == 'GET':
            queryset = store.products.all()
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ProductSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = ProductSerializer(queryset, many=True)
            return Response(serializer.data)

        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = _generate_product_id()
        while Product.objects.filter(id=product_id).exists():
            product_id = _generate_product_id()
        serializer.save(store=store, id=product_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer
    lookup_field = 'id'

    def get_queryset(self):
        qs = super().get_queryset()
        store_id = self.request.query_params.get('store')
        if store_id:
            qs = qs.filter(store__store_id=store_id)
        return qs
