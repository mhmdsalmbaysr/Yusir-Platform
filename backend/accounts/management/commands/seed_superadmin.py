from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'إنشاء حساب المشرف العام الافتراضي'

    def handle(self, *args, **options):
        if User.objects.filter(username='superadmin').exists():
            self.stdout.write(self.style.WARNING('حساب superadmin موجود بالفعل'))
            return
        User.objects.create_superuser(
            username='superadmin',
            password='yusir@2024',
            email='superadmin@yusir.app',
            role='superadmin',
        )
        self.stdout.write(self.style.SUCCESS('تم إنشاء حساب superadmin بنجاح'))
