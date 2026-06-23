from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
import random
import string

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, MerchantProfile
from .serializers import (
    UserSerializer, MerchantProfileSerializer,
    LoginSerializer, MerchantCreateSerializer
)


def _generate_store_id():
    return 'ST-' + ''.join(random.choices(string.digits, k=4))


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password']
    )
    if not user:
        return Response({'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'},
                        status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    data = {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }
    if user.role == 'merchant' and hasattr(user, 'merchant_profile'):
        data['merchant'] = MerchantProfileSerializer(user.merchant_profile).data
    return Response(data)


@api_view(['GET', 'PUT'])
def me_view(request):
    if request.method == 'GET':
        data = UserSerializer(request.user).data
        if request.user.role == 'merchant' and hasattr(request.user, 'merchant_profile'):
            data['merchant'] = MerchantProfileSerializer(request.user.merchant_profile).data
        return Response(data)
    user = request.user
    for field in ['username', 'email', 'phone']:
        if field in request.data:
            setattr(user, field, request.data[field])
    user.save()
    return Response(UserSerializer(user).data)


class MerchantListCreateView(generics.ListCreateAPIView):
    queryset = MerchantProfile.objects.select_related('user').all()
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MerchantCreateSerializer
        return MerchantProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = MerchantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        store_id = _generate_store_id()
        while MerchantProfile.objects.filter(store_id=store_id).exists():
            store_id = _generate_store_id()

        user = User.objects.create_user(
            username=data['username'],
            password=data['password'],
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            role='merchant',
        )
        profile = MerchantProfile.objects.create(
            user=user,
            store_name=data['store_name'],
            plan=data['plan'],
            store_id=store_id,
            expiry=timezone.now() + timedelta(days=30 * data['months']),
        )
        return Response(MerchantProfileSerializer(profile).data,
                        status=status.HTTP_201_CREATED)


class MerchantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MerchantProfile.objects.select_related('user').all()
    serializer_class = MerchantProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'store_id'
    lookup_url_kwarg = 'store_id'
