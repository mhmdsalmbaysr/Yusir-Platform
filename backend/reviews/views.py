import random
import string

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from .models import Review
from .serializers import ReviewSerializer


def _generate_rev_id():
    return 'REV-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = ReviewSerializer
    lookup_field = 'id'

    def get_queryset(self):
        qs = super().get_queryset()
        store_id = self.request.query_params.get('store')
        if store_id:
            qs = qs.filter(store__store_id=store_id)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        rev_id = _generate_rev_id()
        while Review.objects.filter(id=rev_id).exists():
            rev_id = _generate_rev_id()
        serializer.save(id=rev_id)
