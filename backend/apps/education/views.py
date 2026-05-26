from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import Question, TestSession, TestAnswer
from apps.children.models import Child
import random


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Without correct_answer for test-taking"""
    class Meta:
        model = Question
        exclude = ['correct_answer']


class TestSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSession
        fields = '__all__'


# ── Admin: Manage Questions ──────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_questions(request):
    if request.method == 'GET':
        subject = request.query_params.get('subject')
        grade = request.query_params.get('grade')
        qs = Question.objects.all()
        if subject:
            qs = qs.filter(subject=subject)
        if grade:
            qs = qs.filter(grade=grade)
        return Response(QuestionSerializer(qs, many=True).data)

    ser = QuestionSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data, status=201)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_question_detail(request, q_id):
    try:
        q = Question.objects.get(id=q_id)
    except Question.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    if request.method == 'PUT':
        ser = QuestionSerializer(q, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
    q.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_import_questions(request):
    """Import multiple questions at once"""
    questions = request.data.get('questions', [])
    created = 0
    for q_data in questions:
        ser = QuestionSerializer(data=q_data)
        if ser.is_valid():
            ser.save()
            created += 1
    return Response({'created': created})


# ── Child: Take Tests ────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_test(request, child_id, subject):
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
    except Child.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    grade = child.grade
    questions = list(Question.objects.filter(subject=subject, grade=grade))
    if not questions:
        return Response({'error': 'Savollar topilmadi'}, status=404)

    sample = random.sample(questions, min(10, len(questions)))
    return Response(QuestionPublicSerializer(sample, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_test(request, child_id, subject):
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
    except Child.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    answers = request.data.get('answers', [])
    session = TestSession.objects.create(
        child=child, subject=subject, grade=child.grade, total=len(answers)
    )
    score = 0
    for ans in answers:
        q = Question.objects.get(id=ans['question_id'])
        is_correct = q.correct_answer == ans['selected']
        if is_correct:
            score += 1
        TestAnswer.objects.create(
            session=session, question=q,
            selected_answer=ans['selected'], is_correct=is_correct
        )

    session.score = score
    session.save()
    return Response({'score': score, 'total': len(answers), 'session_id': session.id})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_history(request, child_id):
    try:
        child = Child.objects.get(id=child_id, parent=request.user)
    except Child.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)

    sessions = TestSession.objects.filter(child=child).order_by('-completed_at')[:20]
    return Response(TestSessionSerializer(sessions, many=True).data)
