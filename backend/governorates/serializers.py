from rest_framework import serializers
from .models import Governorate, District


class GovernorateListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Governorate
        fields = ['pcode', 'name_ar', 'name_en', 'center_lat', 'center_lon', 'area_sqkm']


class GovernorateDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Governorate
        fields = '__all__'


class DistrictListSerializer(serializers.ModelSerializer):
    governorate_name = serializers.CharField(source='governorate.name_ar', read_only=True)

    class Meta:
        model = District
        fields = ['pcode', 'name_ar', 'name_en', 'governorate', 'governorate_name',
                  'center_lat', 'center_lon', 'area_sqkm']


class DistrictDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = '__all__'
