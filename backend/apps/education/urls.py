from django.urls import path
from . import views

urlpatterns = [
    path('admin/questions/', views.admin_questions),
    path('admin/questions/<int:q_id>/', views.admin_question_detail),
    path('admin/questions/bulk/', views.bulk_import_questions),
    path('<int:child_id>/test/<str:subject>/', views.get_test),
    path('<int:child_id>/test/<str:subject>/submit/', views.submit_test),
    path('<int:child_id>/history/', views.test_history),
]
