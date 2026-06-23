from rest_framework import serializers
from .models import Store, Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['store']


class StoreListSerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    merchant_name = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            'store_id', 'name', 'category', 'city', 'neighborhood',
            'phone', 'rating', 'delivery_fee', 'open', 'image',
            'latitude', 'longitude', 'products_count', 'merchant_name',
            'created_at', 'updated_at',
        ]

    def get_products_count(self, obj):
        return obj.products.count()

    def get_merchant_name(self, obj):
        if obj.merchant:
            return obj.merchant.store_name
        return None


class StoreDetailSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    merchant_name = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = '__all__'

    def get_merchant_name(self, obj):
        if obj.merchant:
            return obj.merchant.store_name
        return None


class StoreCreateSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, required=False)

    class Meta:
        model = Store
        fields = '__all__'
        read_only_fields = ['store_id', 'created_at', 'updated_at']

    def create(self, validated_data):
        products_data = validated_data.pop('products', [])
        store = Store.objects.create(**validated_data)
        for pd in products_data:
            Product.objects.create(store=store, **pd)
        return store


class ProductCreateSerializer(serializers.ModelSerializer):
    image_data = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'unit', 'image', 'in_stock',
                  'category', 'desc', 'old_price', 'rating', 'image_data']

    def create(self, validated_data):
        image_data = validated_data.pop('image_data', None)
        if image_data:
            import base64, uuid
            from django.core.files.base import ContentFile
            fmt, imgstr = image_data.split(';base64,')
            ext = fmt.split('/')[-1] if '/' in fmt else 'jpg'
            validated_data['image'] = f'data:image/{ext};base64,{imgstr}'
        return super().create(validated_data)
