from rest_framework import viewsets, permissions
from .models import Governorate, District
from .serializers import (
    GovernorateListSerializer, GovernorateDetailSerializer,
    DistrictListSerializer, DistrictDetailSerializer,
)


class GovernorateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Governorate.objects.all()
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pcode'

    def get_serializer_class(self):
        if self.action == 'list':
            return GovernorateListSerializer
        return GovernorateDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '')
        if search:
            return qs.filter(name_ar__icontains=search) | qs.filter(name_en__icontains=search)
        return qs


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.select_related('governorate').all()
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pcode'

    def get_serializer_class(self):
        if self.action == 'list':
            return DistrictListSerializer
        return DistrictDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        gov_pcode = self.request.query_params.get('governorate')
        if gov_pcode:
            qs = qs.filter(governorate__pcode=gov_pcode)
        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(name_ar__icontains=search) | qs.filter(name_en__icontains=search)
        return qs
