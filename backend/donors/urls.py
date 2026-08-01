"""
REST URL routing for the donors app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('donors/', views.donor_list_create, name='donor-list-create'),
    path('donors/<int:donor_id>/complete/', views.donor_complete, name='donor-complete'),
    path('donors/stats/', views.donor_stats, name='donor-stats'),
]
