from django.contrib import admin
from django.urls import path
from chat import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('interface_stream/', views.interface_stream), 
    path('history/', views.paginated_history),
    path('conversation/<str:conversation_name>/',views.conversation_by_name,),
    path('interface_fetch/', views.interface_fetch),   
]