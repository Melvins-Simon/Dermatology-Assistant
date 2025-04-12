from PIL import Image
from rest_framework.parsers import JSONParser,MultiPartParser

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django_rest_passwordreset.views import ResetPasswordRequestToken, ResetPasswordConfirm
from .serializers import (
    UserSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    SkinDiseasePredictionSerializer,
    ChatHistorySerializer,
)
from django.db.models import Q
from .models import User, SkinDiseasePrediction, ChatHistory,Dermatologist,ConversationSession
import numpy as np
import tensorflow as tf
from rest_framework.views import APIView
import os
import uuid
from django.conf import settings

from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory,BaseChatMessageHistory
from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage

# # Configure Azure OpenAI
api_key = settings.AZURE_OPENAI_API_KEY
api_endpoint = settings.AZURE_OPENAI_API_ENDPOINT
azure_search_api=settings.AZURE_AI_SEARCH_API
azure_search_endpoint = settings.AZURE_AI_SEARCH_ENDPOINT

from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential


llm = AzureChatOpenAI(
    openai_api_key=settings.AZURE_OPENAI_API_KEY,
    azure_endpoint=settings.AZURE_OPENAI_API_ENDPOINT,
    api_version="2024-05-01-preview",
    model_name="gpt-35-turbo",
    temperature=0.7,
)

# Initialize chat history
chat_history = InMemoryChatMessageHistory()

# Define the function to retrieve session history
store={}
def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]
# Create a ConversationChain
conversation_chain = ConversationChain(
    llm=llm,
    memory=ConversationBufferMemory(),
)
# Initialize the conversation handler
conversation_handler = RunnableWithMessageHistory(
    runnable=conversation_chain,
    get_session_history=get_session_history,
    input_messages_key="input", 
    history_messages_key="history"  
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        print("Serializer:", serializer)  # Debugging line
        return serializer

class LoginView(TokenObtainPairView):
    pass  

class PasswordResetView(ResetPasswordRequestToken):
    serializer_class = PasswordResetSerializer

class PasswordResetConfirmView(ResetPasswordConfirm):
    serializer_class = PasswordResetConfirmSerializer

# Load the model
# model_path = os.path.abspath(
#     "endpoints/static/model/Skin_Disease_Classification.keras"
# )
# Get the directory of the current script (views.py)
current_dir = os.path.dirname(os.path.abspath(__file__))

# Go up one level to the 'endpoints' directory
base_dir = os.path.dirname(current_dir)

# Build the absolute path to the model
model_path = os.path.join(base_dir, "model", "Skin_Disease_Classification.keras")

print("Resolved model path:", model_path) 
model = tf.keras.models.load_model(model_path)
# print(model.summary())
# print(f"Model file path: {os.path.abspath('model.h5')}")

# Disease categories
data_cat = [
    'acne', 'actinickeratosis', 'alopeciaareata', 'chickenpox', 'cold sores',
    'eczema', 'folliculitis', 'hives', 'impetigo', 'melanoma', 'psoriasis',
    'ringworm', 'rosacea', 'shingles', 'uticaria', 'vitiligo', 'warts'
]



# Autonomous ChatBot AI Agent
# Prompt chaining
class MedicalAssistantAPI(APIView):
    """
    Unified endpoint that handles both image-based diagnosis and text-based conversations
    with persistent chat history and intelligent routing.
    """
    
    # System prompt for the AI assistant
    SYSTEM_PROMPT = """
    You are DermatologyAI, an advanced medical assistant specialized ONLY in skin conditions. 

    You provide:
    - Professional diagnosis support (when images are provided)
    - Treatment recommendations from verified medical sources
    - Dermatologist referrals when needed
    - General skin care advice

    Always:
    - Be empathetic,precise and professional
    - Clarify when uncertain
    - Recommend professional consultation for serious conditions
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Initialize Azure Cognitive Search client
        self.search_client = SearchClient(
            endpoint=azure_search_endpoint,
            index_name="medical-knowledge",
            credential=AzureKeyCredential('azure_search_api'),
        )
        
        # Enhanced conversation chain with system prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ])
        
        self.conversation_chain = self.prompt | llm
        self.conversation_handler = RunnableWithMessageHistory(
            runnable=self.conversation_chain,
            get_session_history=get_session_history,
            input_messages_key="input",
            history_messages_key="history"
        )
    parser_classes = [JSONParser,MultiPartParser]
    def post(self, request, *args, **kwargs):
        response_data = {
            "session_id": None,
            "diagnosis": None,
            "chat_response": None,
            "suggested_actions": []
        }
        try:
            # Extract and validate inputs
            data = request.data
            message = data.get('message', '')
            user_id = request.data.get('user_id', f"anon_{str(uuid.uuid4())[:8]}")
            session_id = request.data.get('session_id', str(uuid.uuid4()))
            image = request.FILES.get('image')

            # Handle session creation/retrieval FIRST
            try:
                # Convert session_id to UUID format
                session_uuid = uuid.UUID(session_id)
            except ValueError:
                session_uuid = uuid.uuid4()
                session_id = str(session_uuid)

            # Get or create session object
            session, created = ConversationSession.objects.get_or_create(
                session_id=session_uuid,
                defaults={'user_id': user_id if not user_id.startswith('anon_') else None}
            )

            response_data["session_id"] = str(session.session_id)

            # Process image if provided
            if image:
                try:
                    predicted_disease, confidence_score = self.predict_disease(image)
                     # Handle low confidence first
                    if confidence_score < 65:
                        response_data.update({
                            "status": "low_confidence",
                            "diagnosis": {
                                "condition": predicted_disease,
                                "confidence": confidence_score
                            },
                            "message": (
                                f"Possible {predicted_disease} detected ({confidence_score:.1f}% confidence). "
                                "For better accuracy:\n"
                                "1. Upload a clearer, closer photo\n"
                                "2. Ensure good lighting\n"
                                "3. Consult a dermatologist"
                            ),
                            "suggested_actions": [
                                "upload_new_image",
                                "find_specialist"
                            ]
                        })
                        return Response(response_data, status=status.HTTP_200_OK)
                    
                    analysis = self.generate_chatbot_response(
                        predicted_disease=predicted_disease,
                        confidence_score=confidence_score,
                        symptoms=message,
                        session_id=str(session.session_id)
                    )

                    # Create prediction with session object
                    prediction = SkinDiseasePrediction.objects.create(
                        user_id=user_id if not user_id.startswith('anon_') else None,
                        image=image,
                        symptoms=message,
                        predicted_disease=predicted_disease,
                        confidence_score=confidence_score,
                        chatbot_response=analysis,
                        session=session  # Use the session object
                    )

                    response_data["diagnosis"] = SkinDiseasePredictionSerializer(
                        prediction,
                        context={'request': request}
                    ).data
                    response_data.update({
                        "diagnosis": SkinDiseasePredictionSerializer(
                            prediction,
                            context={'request': request}
                        ).data,
                        "suggested_actions": ["explain_diagnosis", "treatment_options"],
                        "status": "success",
                        "message": None 
                    })
                    message = f"I was diagnosed with {predicted_disease}. {message}"

                except Exception as e:
                    return Response(
                            {
                        "error": str(e),
                        "suggested_actions": ["retry_upload", "contact_support"]
                    },
                    status=status.HTTP_400_BAD_REQUEST
                    )

            # Process text message (if any)
            if message or not image:
                try:
                    chat_response = self.handle_text_input(
                        message=message or "Explain this diagnosis",
                        session_id=str(session.session_id),
                        is_followup=bool(image)
                    )

                    # Create chat history with session object
                    chat = ChatHistory.objects.create(
                        user_id=user_id if not user_id.startswith('anon_') else None,
                        user_message=message,
                        chatbot_response=chat_response['text'],
                        session=session,  # Use the session object
                        metadata={
                            'sources': chat_response.get('sources'),
                            'suggested_actions': chat_response.get('suggested_actions')
                        }
                    )

                    response_data["chat_response"] = ChatHistorySerializer(
                        chat,
                        context={'request': request}
                    ).data
                    response_data["suggested_actions"] = chat_response.get('suggested_actions', [])

                except Exception as e:
                    return Response(
                        {"error": f"Chat processing failed: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def process_image(self, image, symptoms, session_id):
        """Handle image-based diagnosis flow"""
        try:
            # Predict disease
            predicted_disease, confidence_score = self.predict_disease(image)
            
            # Generate context-aware response
            prompt = f"Diagnosis: {predicted_disease} ({confidence_score:.1f}% confidence)\nSymptoms: {symptoms}\nProvide a professional analysis:"
            response = self.conversation_handler.invoke(
                {"input": prompt},
                config={"configurable": {"session_id": session_id}},
            )
            
            # Save to database
            SkinDiseasePrediction.objects.create(
                user_id=session_id,
                image=image,
                symptoms=symptoms,
                predicted_disease=predicted_disease,
                confidence_score=confidence_score,
                chatbot_response=response.content,
            )
            
            return {
                "predicted_disease": predicted_disease,
                "confidence_score": confidence_score,
                "analysis": response.content
            }
            
        except Exception as e:
            raise Exception(f"Image processing failed: {str(e)}")


    # Helper methods
    def is_healthcare_question(self, message):
        """Determine if the message is healthcare-related"""
        healthcare_keywords = [
            'skin', 'rash', 'acne', 'treatment', 'medicine', 'doctor',
            'dermatologist', 'itch', 'itchy', 'red', 'bump', 'pimple',
            'eczema', 'psoriasis', 'melanoma', 'hives', 'allergy',
            'infection', 'diagnose', 'symptom', 'pain', 'swelling',
            'prescription', 'medical', 'health', 'disease', 'condition',
            'cure', 'relief', 'ointment', 'cream', 'antibiotic', 'fungal',
            'virus', 'bacteria', 'allergic', 'reaction', 'scar', 'mark',
            'spot', 'patch', 'dry', 'oily', 'sensitive', 'burn', 'sting',
            'peel', 'blister', 'wart', 'mole', 'freckle', 'patch','hello','hey',
            'thank you'
        ]
        
        message_lower = message.lower()
        
        # Check for explicit non-healthcare phrases
        non_healthcare_phrases = [
            'joke','code'
        ]
        
        if any(phrase in message_lower for phrase in non_healthcare_phrases):
            return False
        
        # Check for healthcare keywords
        return any(keyword in message_lower for keyword in healthcare_keywords)
    def handle_text_input(self, message, session_id, is_followup=False):
        """Process text input with intelligent routing"""
        try:
            # Process text input with healthcare filtering
            if not self.is_healthcare_question(message):
                return {
                    "text": "I specialize only in dermatology and skin health questions. "
                        "Please ask me about skin conditions, treatments, or related medical concerns.",
                    "suggested_actions": []
                }
            # Determine processing path
            processing_mode = self.determine_processing_mode(message, is_followup)
            
            if processing_mode == "medical_search":
                # Retrieve evidence-based medical information
                results = self.retrieve_medical_info(message)
                if results:
                    prompt = f"Question: {message}\nMedical Context: {results}\nProvide a concise answer citing sources:"
                    response = self.conversation_handler.invoke(
                        {"input": prompt},
                        config={"configurable": {"session_id": session_id}},
                    )
                    return {
                        "text": response.content,
                        "sources": results[:3],  # Return top 3 sources
                        "suggested_actions": ["more_details", "dermatologist_referral"]
                    }
                else:
                    # Fallback to general chat if no results found
                    processing_mode = "general_chat"
            
            if processing_mode == "dermatologist_query":
                dermatologists = self.query_dermatologists(message)
                if dermatologists:
                    return {
                        "text": f"I found these dermatologists matching your query:\n{dermatologists}",
                        "suggested_actions": ["book_appointment", "more_options"]
                    }
                else:
                    return {
                        "text": "I couldn't find dermatologists matching your criteria. Would you like to expand your search?",
                        "suggested_actions": ["broaden_search"]
                    }
            
            # Default to general conversation
            response = self.conversation_handler.invoke(
                {"input": message},
                config={"configurable": {"session_id": session_id}},
            )
            
            return {
                "text": response.content,
                "suggested_actions": self.generate_followup_actions(message)
            }
            
        except Exception as e:
            raise Exception(f"Text processing failed: {str(e)}") 
    def predict_disease(self, image):
        """Predict disease from image with enhanced preprocessing"""
        try:
            img_width, img_height = 180, 180
            pil_image = Image.open(image).convert("RGB")
            pil_image = pil_image.resize((img_width, img_height))
            image_arr = tf.keras.utils.array_to_img(pil_image)
            image_bat = tf.expand_dims(image_arr, axis=0)
            
            # Predict and process results
            predict = model.predict(image_bat)
            score = tf.nn.softmax(predict)
            confidence_score = float(np.max(score)*100)
            predicted_idx = np.argmax(score)
            predicted_disease = data_cat[predicted_idx]
            print(f"Predicted:{predicted_disease} ({confidence_score:.2f}%)")
            
            return predicted_disease, confidence_score
            
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            raise Exception("Could not process the image. Please try again with a clearer photo.")
    
    def generate_chatbot_response(self,predicted_disease, confidence_score, symptoms, session_id):
        """Generate AI response for diagnosis"""
        try:
            prompt = f"""
            Diagnosis: {predicted_disease} ({confidence_score:.1f}% confidence)
            Symptoms: {symptoms}
            
            As a dermatology assistant, provide:
            1. A simple explanation of the condition
            2. Recommended self-care measures
            3. When to see a doctor
            4. Any precautions
            """
            
            response = self.conversation_handler.invoke(
                {"input": prompt},
                config={"configurable": {"session_id": session_id}},
            )
            return response.content
        except Exception as e:
            raise Exception(f"Response generation failed: {str(e)}")


    def determine_processing_mode(self, message, is_followup):
        """Intelligent routing of text inputs"""
        message_lower = message.lower()
        if is_followup:
            return "general_chat"
        elif any(keyword in message_lower for keyword in ["treatment", "medicine", "remedy"]):
            return "medical_search"
        elif any(keyword in message_lower for keyword in ["dermatologist", "doctor", "specialist","recommend a doctor"]):
            return "dermatologist_query"
        else:
            return "general_chat"

    def retrieve_medical_info(self, query):
        """Enhanced medical information retrieval"""
        try:
            results = self.search_client.search(
                search_text=query,
                top=5,
                include_total_count=True
            )
            return [{"content": hit["content"], "source": hit.get("source", "medical database")} 
                   for hit in results]
        except Exception as e:
            print(f"Search error: {str(e)}")
            return None

    def query_dermatologists(self, query):
        """Search for dermatologists with location awareness"""
        try:
            print(f"DEBUG QUERY: {query}") 
            base_qs = Dermatologist.objects.filter(
            Q(specialization__icontains="dermatology") |
            Q(name__icontains="dermatology"))
            # Simple implementation - extend with location filtering if available
            if "specializing in" in query.lower():
                _, condition = query.lower().split("specializing in", 1)
                condition = condition.strip()
                # Search for both dermatology AND condition
                return base_qs.filter(
                    Q(specialization__icontains=condition) |
                    Q(name__icontains=condition)
                )[:5]
        
            return base_qs[:5]
           
        except Exception as e:
            print(f"Dermatologist query error: {str(e)}")
            return None

    def generate_visual_feedback(self, image, diagnosis):
        """Generate visual feedback about the diagnosis"""
        # Placeholder for actual implementation
        return {
            "affected_areas": "Not specified",
            "severity_indicator": "moderate",
            "comparison_images": None
        }

    def generate_followup_actions(self, message):
        """Generate context-aware suggested actions"""
        message_lower = message.lower()
        actions = []
        
        if any(word in message_lower for word in ["treatment", "medicine"]):
            actions.append("alternative_treatments")
        if "serious" in message_lower:
            actions.append("emergency_contact")
        if any(word in message_lower for word in ["prevent", "avoid"]):
            actions.append("prevention_tips")
            
        if not actions:
            actions = ["learn_more", "ask_specialist", "related_conditions"]
            
        return actions

    def save_interaction(self, user_id, session_id, user_message, image, response_data):
        """Save complete interaction to both chat history and prediction tables"""
        try:
            # Save to chat history
            ChatHistory.objects.create(
                user_id=user_id,
                session_id=session_id,
                user_message=user_message,
                chatbot_response=response_data.get("response", ""),
                metadata={
                    "diagnosis": response_data.get("diagnosis"),
                    "sources": response_data.get("sources"),
                    "actions": response_data.get("suggested_actions")
                }
            )
            
            # If image was processed, save to predictions
            if image and response_data.get("diagnosis"):
                SkinDiseasePrediction.objects.create(
                    user_id=user_id,
                    session_id=session_id,
                    image=image,
                    symptoms=user_message,
                    predicted_disease=response_data["diagnosis"]["condition"],
                    confidence_score=response_data["diagnosis"]["confidence"],
                    chatbot_response=response_data.get("response", ""),
                    visual_feedback=response_data["diagnosis"]["visual_feedback"]
                )
        except Exception as e:
            print(f"Failed to save interaction: {str(e)}")
       
