import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings

from governorates.models import Governorate, District
from stores.models import Store, Product


class Command(BaseCommand):
    help = 'استيراد بيانات GeoJSON إلى قاعدة البيانات'

    def add_arguments(self, parser):
        parser.add_argument('--all', action='store_true', help='استيراد جميع الملفات')

    def handle(self, *args, **options):
        data_dir = settings.BASE_DIR / 'static' / 'data'

        self._import_admin1(data_dir / 'yem_admin1.geojson')
        self._import_admin2(data_dir / 'yem_admin2.geojson')
        self._import_stores(data_dir / 'stores.geojson')
        self._import_field_data(data_dir / 'yem_field_data.geojson')

        self.stdout.write(self.style.SUCCESS('تم استيراد جميع البيانات بنجاح'))

    def _import_admin1(self, path):
        if not path.exists():
            self.stdout.write(self.style.WARNING(f'الملف غير موجود: {path}'))
            return

        with open(path, encoding='utf-8') as f:
            data = json.load(f)

        count = 0
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            pcode = props.get('adm1_pcode', '')
            if not pcode:
                continue

            center_coords = self._get_center(feature.get('geometry', {}))
            Governorate.objects.update_or_create(
                pcode=pcode,
                defaults={
                    'name_ar': props.get('adm1_name1', ''),
                    'name_en': props.get('adm1_name', ''),
                    'center_lat': props.get('center_lat', center_coords[0]),
                    'center_lon': props.get('center_lon', center_coords[1]),
                    'area_sqkm': props.get('area_sqkm', 0),
                    'geometry': feature.get('geometry', {}),
                }
            )
            count += 1

        self.stdout.write(f'تم استيراد {count} محافظة')

    def _import_admin2(self, path):
        if not path.exists():
            self.stdout.write(self.style.WARNING(f'الملف غير موجود: {path}'))
            return

        with open(path, encoding='utf-8') as f:
            data = json.load(f)

        count = 0
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            pcode = props.get('adm2_pcode', '')
            if not pcode:
                continue

            gov_pcode = props.get('adm1_pcode', '')
            try:
                governorate = Governorate.objects.get(pcode=gov_pcode)
            except Governorate.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'لم يتم العثور على محافظة {gov_pcode} للمديرية {pcode}'
                ))
                continue

            center_coords = self._get_center(feature.get('geometry', {}))
            District.objects.update_or_create(
                pcode=pcode,
                defaults={
                    'name_ar': props.get('adm2_name1', ''),
                    'name_en': props.get('adm2_name', ''),
                    'governorate': governorate,
                    'center_lat': props.get('center_lat', center_coords[0]),
                    'center_lon': props.get('center_lon', center_coords[1]),
                    'area_sqkm': props.get('area_sqkm', 0),
                    'geometry': feature.get('geometry', {}),
                }
            )
            count += 1

        self.stdout.write(f'تم استيراد {count} مديرية')

    def _import_stores(self, path):
        if not path.exists():
            self.stdout.write(self.style.WARNING(f'الملف غير موجود: {path}'))
            return

        with open(path, encoding='utf-8') as f:
            data = json.load(f)

        count = 0
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            coords = feature.get('geometry', {}).get('coordinates', [0, 0])

            store_id = props.get('store_id', '')
            if not store_id:
                continue

            products_data = props.pop('products', [])

            store, created = Store.objects.update_or_create(
                store_id=store_id,
                defaults={
                    'name': props.get('name', ''),
                    'category': props.get('category', 'متجر'),
                    'city': props.get('city', ''),
                    'neighborhood': props.get('neighborhood', ''),
                    'phone': props.get('phone', ''),
                    'rating': props.get('rating', 4.5),
                    'delivery_fee': props.get('delivery_fee', 500),
                    'open': props.get('open', True),
                    'image': props.get('image', ''),
                    'latitude': float(coords[1]) if len(coords) > 1 else 0,
                    'longitude': float(coords[0]) if coords else 0,
                }
            )

            for pd in products_data:
                Product.objects.update_or_create(
                    id=pd.get('id', ''),
                    defaults={
                        'store': store,
                        'name': pd.get('name', ''),
                        'price': pd.get('price', 0),
                        'unit': pd.get('unit', 'وحدة'),
                        'image': pd.get('image', ''),
                        'in_stock': pd.get('in_stock', True),
                        'category': pd.get('category', ''),
                        'desc': pd.get('desc', ''),
                        'old_price': pd.get('old_price', None),
                        'rating': pd.get('rating', 4.5),
                    }
                )

            count += 1

        self.stdout.write(f'تم استيراد {count} متجر مع منتجاتها')

    def _import_field_data(self, path):
        if not path.exists():
            self.stdout.write(self.style.WARNING(f'الملف غير موجود: {path}'))
            return

        with open(path, encoding='utf-8') as f:
            data = json.load(f)

        count = 0
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            coords = feature.get('geometry', {}).get('coordinates', [0, 0])
            item_id = props.get('id', '')
            if not item_id:
                continue

            district_pcode = props.get('parent_adm2', '')
            try:
                district = District.objects.get(pcode=district_pcode)
            except District.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'لم يتم العثور على مديرية {district_pcode}'
                ))
                continue

            from fielddata.models import FieldDataItem
            FieldDataItem.objects.update_or_create(
                id=item_id,
                defaults={
                    'name': props.get('name', ''),
                    'type': 'hood' if props.get('type') == 'حي' else 'lane',
                    'district': district,
                    'district_name': props.get('parent_adm2_name', ''),
                    'latitude': float(coords[1]) if len(coords) > 1 else 0,
                    'longitude': float(coords[0]) if coords else 0,
                }
            )
            count += 1

        self.stdout.write(f'تم استيراد {count} عنصر بيانات ميدانية')

    def _get_center(self, geometry):
        try:
            coords = geometry.get('coordinates', [])
            if geometry.get('type') == 'Polygon':
                return self._polygon_center(coords[0])
            elif geometry.get('type') == 'MultiPolygon':
                return self._polygon_center(coords[0][0])
        except (IndexError, TypeError):
            pass
        return [0, 0]

    def _polygon_center(self, ring):
        lats = [p[1] for p in ring]
        lngs = [p[0] for p in ring]
        return [sum(lats) / len(lats), sum(lngs) / len(lngs)]
