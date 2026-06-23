from rest_framework import serializers
from .models import FieldDataItem


class FieldDataItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldDataItem
        fields = '__all__'
        read_only_fields = ['created_at']
