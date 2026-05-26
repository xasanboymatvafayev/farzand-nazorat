from django.db import models
from apps.children.models import Child


class Question(models.Model):
    SUBJECT_CHOICES = [
        ('math', 'Matematika'),
        ('english', 'Ingliz tili'),
    ]
    subject = models.CharField(max_length=20, choices=SUBJECT_CHOICES)
    grade = models.IntegerField()  # 1-11
    question_text = models.TextField()
    option_a = models.CharField(max_length=300)
    option_b = models.CharField(max_length=300)
    option_c = models.CharField(max_length=300)
    option_d = models.CharField(max_length=300)
    correct_answer = models.CharField(max_length=1, choices=[('A','A'),('B','B'),('C','C'),('D','D')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} - {self.grade}-sinf: {self.question_text[:50]}"


class TestSession(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='test_sessions')
    subject = models.CharField(max_length=20)
    grade = models.IntegerField()
    score = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.child.full_name} - {self.subject} - {self.score}/{self.total}"


class TestAnswer(models.Model):
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer = models.CharField(max_length=1)
    is_correct = models.BooleanField()
