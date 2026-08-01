"""
WSGI config for SNCF Blood Donation Drive.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'blooddrive.settings')

application = get_wsgi_application()
