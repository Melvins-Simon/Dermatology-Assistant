
from django.contrib import admin
from django.urls import path,include
from assistant.views import RegisterView
from django.views.generic.base import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/',include('assistant.urls')),
    path('', RedirectView.as_view(url='api/medical-assistant/', permanent=False)),
]
