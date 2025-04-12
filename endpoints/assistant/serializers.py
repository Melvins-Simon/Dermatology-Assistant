from rest_framework import serializers
# from django.contrib.auth.models import User 
from django_rest_passwordreset.models import ResetPasswordToken
from .models import SkinDiseasePrediction,ChatHistory
from django.contrib.auth import get_user_model


User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField()


class SkinDiseasePredictionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SkinDiseasePrediction
        fields = [
            'id','image_url', 'symptoms', 
            'predicted_disease', 'confidence_score', 
            'chatbot_response', 'created_at','session' 
        ]
        read_only_fields = ['image_url']
        extra_kwargs = {
         'user': {'required': False} 
        }
    def get_image_url(self, obj):
        """Generate full URL for the image"""
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ChatHistorySerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(source='session.user_id', read_only=True) 

    class Meta:
        model = ChatHistory
        fields = [
            'id',
            'user_id',         
            'user_message',
            'chatbot_response',
            'created_at',
            'session'        
        ]
        extra_kwargs = {
            'session': {'write_only': True}  
        }