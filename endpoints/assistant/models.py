from django.db import models
from django.contrib.auth.models import AbstractUser,Group,Permission
import uuid

# 1. Users Table
class User(AbstractUser):
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def __str__(self):
        return self.email

class Dermatologist(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(null=True)  # Fixed typo: EmallField → EmailField
    specialization = models.CharField(max_length=100, default='General Dermatology')
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.name

# 3. Predictions Table
class Prediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='predictions')
    image_path = models.CharField(max_length=255)
    predicted_disease = models.CharField(max_length=100)
    confidence_score = models.FloatField()
    symptoms = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.predicted_disease} ({self.confidence_score * 100:.2f}%)"

# 4. Conversations Table
class Conversation(models.Model):
    SENDER_CHOICES = [
        ('user', 'User'),
        ('chatbot', 'Chatbot'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    message = models.TextField()
    sender = models.CharField(max_length=7, choices=SENDER_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_sender_display()} at {self.created_at}"

class Disease(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    common_symptoms = models.TextField()
    treatment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

# 6. UserDiseaseHistory Table
class UserDiseaseHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disease_history')
    disease = models.ForeignKey(Disease, on_delete=models.CASCADE, related_name='user_histories')
    prediction = models.OneToOneField(Prediction, on_delete=models.CASCADE, related_name='disease_history')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.disease.disease_name}"
class ConversationSession(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    predicted_disease = models.CharField(max_length=100, null=True)
    confidence_score = models.FloatField(null=True)

    def __str__(self):
        return f"Session {self.session_id}"

class SkinDiseasePrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='skin_images/')
    symptoms = models.TextField()
    predicted_disease = models.CharField(max_length=100)
    confidence_score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    chatbot_response = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.predicted_disease} ({self.confidence_score:.2f}%)"

class ChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE)
    user_message = models.TextField()
    chatbot_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict,null=True, blank=True)

    def __str__(self):
        return f"Chat {self.id} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"