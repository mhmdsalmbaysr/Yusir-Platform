from rest_framework import serializers
from .models import User, MerchantProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class MerchantProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = MerchantProfile
        fields = ['id', 'user', 'user_id', 'store_name', 'plan', 'store_id',
                  'suspended', 'created', 'expiry', 'status']

    def get_status(self, obj):
        from django.utils import timezone
        if obj.suspended:
            return 'suspended'
        if obj.expiry and obj.expiry < timezone.now():
            return 'expired'
        return 'active'

    def create(self, validated_data):
        validated_data.pop('user_id')
        return super().create(validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class MerchantCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    store_name = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    plan = serializers.ChoiceField(choices=['basic', 'pro', 'premium'])
    months = serializers.IntegerField(default=1)
