"""
Django admin registration for the Donor model.
"""

from django.contrib import admin
from .models import Donor


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'language', 'created_at', 'updated_at')
    list_filter = ('status', 'language')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')
