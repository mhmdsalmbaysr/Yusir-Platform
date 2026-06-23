import random
import string

from rest_framework import viewsets, permissions
from .models import FieldDataItem
from .serializers import FieldDataItemSerializer


def _generate_fd_id():
    return 'FD-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class FieldDataViewSet(viewsets.ModelViewSet):
    queryset = FieldDataItem.objects.select_related('district').all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = FieldDataItemSerializer
    lookup_field = 'id'

    def get_queryset(self):
        qs = super().get_queryset()
        district = self.request.query_params.get('district')
        if district:
            qs = qs.filter(district__pcode=district)
        type_filter = self.request.query_params.get('type')
        if type_filter:
            qs = qs.filter(type=type_filter)
        return qs

    def perform_create(self, serializer):
        if not serializer.validated_data.get('id'):
            serializer.save(id=_generate_fd_id())
        else:
            serializer.save()
