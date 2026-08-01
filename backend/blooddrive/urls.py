"""
URL configuration for SNCF Blood Donation Drive.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('donors.urls')),
]
