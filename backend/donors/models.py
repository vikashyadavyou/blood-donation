"""
Donor model for the SNCF Blood Donation Drive.

Tracks each donor through the donation pipeline:
  ELIGIBLE  → Screened and ready to donate
  COMPLETED → Blood donation successfully completed
"""

from django.db import models


class Donor(models.Model):
    """Represents a blood donor in the donation drive."""

    # ── Status choices ────────────────────────────────────────────────────
    class Status(models.TextChoices):
        ELIGIBLE = 'ELIGIBLE', 'Eligible'
        COMPLETED = 'COMPLETED', 'Completed'

    # ── Language choices for display messages ─────────────────────────────
    class Language(models.TextChoices):
        EN = 'EN', 'English'
        HI = 'HI', 'Hindi'
        GU = 'GU', 'Gujarati'

    # ── Fields ────────────────────────────────────────────────────────────
    name = models.CharField(
        max_length=100,
        help_text="Full name of the donor."
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ELIGIBLE,
        db_index=True,
        help_text="Current status in the donation pipeline."
    )
    language = models.CharField(
        max_length=2,
        choices=Language.choices,
        default=Language.HI,
        help_text="Preferred display language for celebration messages."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Donor'
        verbose_name_plural = 'Donors'

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
