#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py import_geojson
python manage.py seed_superadmin

python manage.py runserver 0.0.0.0:8000
