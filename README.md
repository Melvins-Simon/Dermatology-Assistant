# 🤖 AI-Powered-Dermatology-Assistant

This is an Agentic AI application that leverages a CNN-based deep learning model to classify skin diseases and integrates Azure OpenAI (GPT-35 Turbo) with LangChain and Azure AI Search to generate intelligent, context-aware healthcare recommendations.It is Designed to empower users with early self-diagnosis of skin disorders, the platform combines AI-driven accuracy with actionable insights for better health outcomes. The backend, built with Django REST Framework, ensures robust API orchestration, while the React.js frontend delivers an intuitive user experience. For data management, we implemented a scalable pipeline using Microsoft Fabric to ingest and transform raw data from Azure PostgreSQL, followed by the creation of a semantic model for structured analytics. Then processed data we visualized through interactive Power BI dashboards, enabling clear trend analysis and decision-making. The entire solution—spanning AI/ML workflows, data pipelines, and the web application—is securely deployed on Azure, ensuring end-to-end scalability and integration.

## 🖥️ UI/UX of the aplication

- Our intuitive React-based web application, deployed on Azure App Services, empowers users to take control of their skin health through AI-driven diagnosis. Users can simply upload or drag-and-drop images of affected skin areas, describe their symptoms, and click "Get Diagnosis" to receive instant analysis.

- The application leverages a CNN model for accurate image classification and integrates Azure OpenAI (GPT-35 Turbo) to provide conversational, evidence-based insights—enabling users to ask follow-up questions for deeper clarity. Every interaction is preserved, ensuring seamless continuity in symptom tracking and healthcare guidance.

- Designed for accessibility and early detection, this tool bridges the gap between users and proactive skin care, transforming how people approach dermatological health—one smart diagnosis at a time.

#### 🔗 Frontend link

[https://purple-river-00fd8ef0f.6.azurestaticapps.net/](https://purple-river-00fd8ef0f.6.azurestaticapps.net/)

![.](endpoints/ai-hack-img/uix.png)

### 🔌 Unified AI Medical Assistant Endpoint (/api/medical-assistant)

- The /api/medical-assistant endpoint serves as a unified interface for both image-based skin disease diagnosis and AI-powered medical conversations. When receiving an image, it processes it through a CNN model for classification and confidence scoring, while text inputs engage Azure OpenAI (GPT-35 Turbo) and LangChain—augmented by Azure AI Search—to deliver contextual, evidence-based healthcare responses. The system intelligently routes requests based on input type and maintains persistent chat history in Azure PostgreSQL, enabling seamless continuity across sessions. Designed for efficiency, the endpoint integrates with Azure API Management for scalability and security, allowing users to transition effortlessly between uploading skin condition photos and asking follow-up questions—all within a single, cohesive interaction flow.

#### 🔗 API chatcbot endpoint

[https://aid-dermatilogy-cbfbbad0cdhscbf9.spaincentral-01.azurewebsites.net/api/medical-assistant/](https://aid-dermatilogy-cbfbbad0cdhscbf9.spaincentral-01.azurewebsites.net/api/medical-assistant/)

![.](endpoints/ai-hack-img/endpoint.png)

# Steps on How to Clone And Run the Project

### 1. Clonning the project

```bash
 git clone https://github.com/Melvins-Simon/Dermatology-Assistant.git
```

### 2. Navigate to root dir, Create a new virtual environment and activate it

- **In linux distribution**

```bash
python3 -m venv venv
cd venv
source venv/bin/activate
pip install -r requirements.txt
```

- **In Window os**

```bash
python -m venv venv
cd venv
\scripts\activate
pip install -r requirements.txt
```

- **create migrations and migrate**

```bash
python manage.py makemigrations assistant
```

```bash
python manage.py migrate
```

- **Run React App in new terminal**

```bash
cd client
npm run dev
```

- Create a .env file within the endpoints dir and provide the following(shoul not be strings).For the database you can configure sqlite3 which is by default in django.
- Modify your dabase settings to use your preferred database in settings.py

```bash
AZURE_OPENAI_API_KEY=xxxx........
AZURE_OPENAI_API_ENDPOINT=xxxx........
AZURE_OPENAI_API_VERSION=.............
AZURE_AI_SEARCH_KEY=xxxx.......
AZURE_AI_SEARCH_ENDPOINT=xxxx....
DATABASE_PASSWORD=your_db_password
```

- **Run the Django api endpoints in another terminal**

```bash
cd endpoints
python manage.py runserver 8000
```

# 🧭 Project Workflow

## 🪄 The Autonomous Agentic System Design

![worfkflow diagram](endpoints/ai-hack-img/workflow.jpeg)

# 🔄 Routing

- The application employs dynamic routing to seamlessly process both image-based diagnoses and text-based medical conversations through a single, unified API endpoint (/api/medical-assistant). When a request is received, the system automatically detects the input type—whether it’s an uploaded skin photo or a text query describing symptoms—and intelligently routes it to the appropriate AI model. Image inputs are analyzed by a CNN-based classifier, which generates a diagnosis along with confidence scores, while text inputs are processed by Azure OpenAI (GPT-35 Turbo) enhanced with LangChain and Azure AI Search to deliver accurate, context-aware medical responses. This streamlined approach ensures users can effortlessly transition between submitting visual diagnostics and asking follow-up questions, all within a single, intuitive interaction flow.

# ⛓️ Prompt Chaining

- **Contextual follow-up**:If the user asks a follow-up question (e.g., "How to treat this?"), the system chains prompts by:

      Retrieving the prior diagnosis from chat history (Azure PostgreSQL).

  Injecting it into a new GPT-35 Turbo prompt:
  "The user has psoriasis (92% confidence). Provide a concise treatment plan using data from Azure AI Search, including topical treatments and lifestyle advice."

- **Multi-modal integration**:For complex queries (e.g., "Is this contagious?"), the system combines:Image analysis results (from CNN), Medical guidelines (from Azure AI Search) and Conversational context (from chat history)
  .

  Example chained prompt:
  "Based on the user's psoriasis diagnosis (image-attached), explain contagion risks and prevention steps. Cite dermatology guidelines."

# 🧠 Retrieval-Augmented Generation (RAG) in Medical AI

**RAG (Retrieval-Augmented Generation)** enhances the AI’s responses by grounding them in up-to-date, authoritative medical knowledge—combining the reasoning of **Azure OpenAI (GPT-35 Turbo)** with targeted data retrieval from **Azure AI Search**.

---

## ⚙️ How It Works

### Knowledge Retrieval

**Medical Corpus:**  
Azure AI Search indexes trusted sources such as clinical guidelines, research papers, or drug databases.

**Contextual Queries:**  
When a user asks, _"What’s the first-line treatment for psoriasis?"_, LangChain:

- Converts the question into a search query.
- Fetches relevant excerpts (e.g., _"Topical corticosteroids are preferred for mild psoriasis..."_).

---

RAG transforms the AI from a chatbot into a **context-aware medical assistant**—bridging the gap between LLMs and clinical expertise.

Need details on fine-tuning retrievers or handling ambiguous queries?

### Project Tools,Frameworks,Technologies and Libraries

- Azure Machine Learning Compute
- Azure AI Search
- Azure OpenAI(GPT-35 Turbo model)
- Langchain
- Tensorflow
- Django REST
- ReactJs
- PostgreSQL
- PowerBI
- One Lake
- Fabrics Warehouse
- Fabrics Data Factory

# 🧠 Convolution Neural Network

#### CNN Model Training with Azure Machine Learning Studio & VS Code Integration

- To develop our skin disease classifier, we designed a Sequential CNN with 3 convolutional blocks (Conv2D + MaxPooling2D), totaling 11 layers, and trained it using Azure Machine Learning Studio’s GPU clusters, orchestrated via VS Code on a local desktop. Here’s a breakdown of the process:

## Model Architecture & Specifications

### 📥 Input

- **Shape**: `(180x180x3)` RGB images
- **Preprocessing**: Standardized for consistency across all inputs

### 🧱 Convolutional Blocks

- **Structure**: 3 sequential blocks, each containing:
  - `Conv2D` layer with ReLU activation
  - `MaxPooling2D` layer for downsampling
- **Purpose**: Hierarchical feature extraction from input images

### 📤 Output Layer

- **Type**: Dense (fully-connected)
- **Neurons**: 17 (one for each skin condition class)
- **Parameters**: 2,193 trainable parameters

## 📊 Model Summary

| 🧮 Metric                | 📈 Value        |
| ------------------------ | --------------- |
| 🔢 Total Parameters      | 11.97 million   |
| 🧱 Model Weights Size    | 45.67 MB        |
| ⚙️ Optimizer States Size | 30.45 MB (Adam) |

![Connecting](endpoints/ai-hack-img/azure-vs-code-model-training.png)

## Training Infrastructure

### Azure ML Studio GPU Clusters

- **VM Type**: NC-series (NC6s_v3)
- **GPU**: NVIDIA Tesla V100
- **Features**:
  - Automated job scheduling
  - Hyperparameter tracking (learning rate, batch size)
  - Metric logging (accuracy, loss)

### VS Code Integration

- Connected local VS Code to Azure ML via the Azure Machine Learning Extension.

- Developed/trained the model interactively using Jupyter Notebooks(
  skin_disease.ipynb
  )

```bash
endpoint/skin_disease.ipynb
```

### The CNN model summary and testing

![Summary:](endpoints/ai-hack-img/model-summary.png)

### Saving the generalized CNN Model

![.](endpoints/ai-hack-img/how-to-get-the-model.png)

- 📊 **Total Parameters**: 11.97m
- ✅ **Memory footprint**: - model weight:45.67 MB - optimizer States:30.45

# Data Pipeline & Analytics Workflow in Fabrics

![Summary:](endpoints/ai-hack-img/fabrics_wkflow.png)

# Data Warehousing in OneLake 🌊

## Structure:

![](endpoints/ai-hack-img/onelake.png)

### **Workspace:**

- General Dermatology

### **Warehouses:**

- Dermatology warehouse
- Dataflow+Staging+Warehouse

### **Semantic Models:**

- aid semantic (owner: Comfortine Swende)
- Dermatology warehouse rl

### **Refresh Schedule:**

- Semantic models refreshed 4-6x daily (e.g., 4/7/25, 8:47:07 PM).

#

# 🧬 Data Ingestion with Azure PostgreSQL & Fabric Data Factory

## Tools Used:

- **Source**: public.assistant_skindiseaseprediction table in our Azure PostgreSQL (dermatology.db.postgres.databases.azure.com)
- **Destination**: Fabric OneLake Warehouse

## Steps (via Copy_kk7 Pipeline):

### **1. Connection Setup:**

- Linked PostgreSQL as the source and OneLake Warehouse as the destination.
  ![Connection Setup](endpoints/ai-hack-img/azure_postgresql_fabrics.png)
- Configured table mapping for `assistant_skindiseaseprediction`.

### **2. Pipeline Execution:**

- Used Copy Data activity with immediate transfer.

  ![Pipeline Execution](endpoints/ai-hack-img/data_pipeline.png)

- Validated data consistency post-copy.

### **3. Key Fields Copied:**

```plaintext
id | user_id | predicted_disease | confidence_score | symptoms | image |
created_at
```

| Data Source      | Pipeline               | Data Destination      |
| ---------------- | ---------------------- | --------------------- |
| Azure PostgreSQL | Copy pipeline Activity | Dermatology warehouse |

## 📚 Semantic Model

# 🎯 **Aid Semantic - Skin Disease Prediction Model**

## 🚀 **Overview**

We developed **Aid Semantic**, an AI-driven model designed to predict skin diseases based on user-provided skin images and symptoms. The dashboard visualizes insights from the model’s predictions, offering disease distribution, confidence analysis, and time trends. Then we deployed it to **Power BI Service** via **OneLake** integration, ensuring up-to-date visualizations with automatic data refresh.

## 📊 **Database Schema**

### **Main Table: `assistant_skindiseaseprediction`**

The main table stores the results of skin disease predictions, along with additional user-reported symptoms and images.

#### **Key Columns:**

| Column Name         | Data Type     | Description                                                      |
| ------------------- | ------------- | ---------------------------------------------------------------- |
| `predicted_disease` | STRING        | The disease predicted by the model (e.g., "Psoriasis", "Eczema") |
| `confidence_score`  | FLOAT         | The model's confidence in its prediction (percentage value)      |
| `symptoms`          | TEXT          | User-reported symptoms (e.g., "itchy, red patches")              |
| `image`             | TEXT (Base64) | Base64-encoded skin photo submitted by the user                  |

---

## 🧮 **Calculations & Metrics**

### **Measures:**

- **Total Cases**: The total number of skin disease prediction cases stored in the database.
- **Average Confidence Score**: The average confidence percentage of all predictions made by the model.

### **Time Intelligence:**

- **Cases by time of creation**: The number of skin disease prediction cases grouped by time (`created_at`). This allows us to view trend analysis over time.

---

![Summary:](endpoints/ai-hack-img/semantic.png)

# 📈 PowerBI Analytics and Visualization

# Dashboard Components for Skin Disease Prediction

## Overview

The BI dashboard provides insightful visualizations to analyze skin disease predictions. It includes disease distribution, confidence analysis, and time trends, with auto-refreshing data published to Power BI Service via OneLake integration.

## Dashboard Components

### 🦠 **Disease Distribution**

- **Visualization**: Donut chart showing the frequency of each predicted disease.
- **Data**: `predicted_disease`
- **Insight**: Identifies the most common predicted diseases.

### 📊 **Confidence Analysis**

- **Visualization**: Funnel most acurately predicted disorder.
- **Data**: `confidence_score` (0-100%)
- **Insight**: Displays the distribution of prediction confidence, helping assess model reliability.

### 📅 **Time Series Trends**

- **Visualization**: Line graph showing the number of predictions over time.
- **Data**: `created_at` (timestamp)
- **Insight**: Tracks trends in skin disease predictions over time.

## Deployment

- **Power BI Service**: Dashboard published via OneLake integration.
- **Auto-refresh**: Semantic models in Fabric auto-refresh 4-6 times daily, ensuring up-to-date data.

  **Refresh Schedule**: Updated 4-6x daily i.e 4/7/25, 8:47:07 PM).

![Summary:](endpoints/ai-hack-img/bi_dashboard.png)
