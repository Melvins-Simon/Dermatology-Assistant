from django.test import TestCase

# testing database
# python manage.py shell
from assistant.models import Dermatologist
print(list(Dermatologist.objects.values('name', 'specialization')))
# Example VALID entry:
# {'name': 'Dr. Smith', 'specialization': 'Cosmetic dermatologist'}