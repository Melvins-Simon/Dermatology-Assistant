import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Upload } from "../assets";
import { FiInfo } from "react-icons/fi";
import { Globalstate } from "../context/Globalcontext";
import Leftsection from "./Leftsection";

const DiagnosisForm = ({ onDiagnosis, sessionId }) => {
  const {
    image,
    setImage,
    imageURL,
    setImageURL,
    screenSize: { WIDTH },
    viewRef,
  } = useContext(Globalstate);
  const [symptoms, setSymptoms] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const fileInputRef = useRef(null);
  // Animation states
  const [pulse, setPulse] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImageURL(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [image]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !symptoms.trim()) {
      setError("Please provide both an image and symptom description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPulse(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("message", symptoms);
    if (sessionId) formData.append("session_id", sessionId);

    try {
      const isDevelopment = import.meta.env.MODE === "development";
      const baseUrl = isDevelopment
        ? "http://localhost:8081/api/medical-assistant/"
        : "https://aid-dermatilogy-cbfbbad0cdhscbf9.spaincentral-01.azurewebsites.net/api/medical-assistant/";
      const response = await axios.post(`${baseUrl}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setUploadProgress(progress);
        },
      });

      // Simulating processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      WIDTH <= 815 && viewRef.current?.scrollIntoView({ behavior: "smooth" });

      const processedResponse = {
        ...response.data,
        confidence_score: Math.round(
          response.data.diagnosis?.confidence_score || 0
        ),
        predicted_disease:
          response.data.diagnosis?.predicted_disease || "Unknown",
        chatbot_response:
          response.data.diagnosis?.chatbot_response || "No diagnosis available",
        suggested_actions: response.data.suggested_actions || [],
      };
      onDiagnosis(processedResponse);
    } catch (error) {
      console.error("Diagnosis error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to get diagnosis. Please try again."
      );
    } finally {
      setIsLoading(false);
      setPulse(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="min-h-screen p-4 w-full">
      <div
        className={`w-full  bg-white rounded-2xl shadow-[0_0_10px_1px_grey] overflow-hidden ${
          WIDTH >= 1164 && "grid  grid-cols-2"
        } h-[90%] `}
      >
        {/* Left Section - Information */}
        {WIDTH >= 1164 && <Leftsection />}
        {/* Right Section - Diagnosis Form */}
        <div className="p-8 flex flex-col mostleftr">
          <div className="relative h-64 mb-6 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
            {imageURL ? (
              <div>
                <img
                  src={imageURL}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    showImage ? "opacity-100" : "opacity-20 blur-sm"
                  }`}
                  alt="Uploaded skin condition"
                />
                <button
                  type="button"
                  onClick={() => setShowImage(!showImage)}
                  className={`${
                    WIDTH <= 500 ? "text-[15px]" : "text-lg"
                  } z-10 absolute bottom-2 right-2 bg-[#7096ff] px-3 py-1 rounded-[5px] shadow-sm hover:bg-[blue] transition-colors text-white font-bold transform-stroke ring-2 ring-white`}
                >
                  {showImage ? "Hide Image" : "Show Image"}
                </button>

                {imageURL && (
                  <button
                    type="button"
                    onClick={() => setImageURL(false)}
                    className={`${
                      WIDTH <= 500 ? "text-[15px]" : "text-lg"
                    } z-10 absolute bottom-2 right-[9em] bg-[#7096ff]  px-3 py-1 rounded-[5px] shadow-sm hover:bg-[blue] transition-colors text-white font-bold transform-stroke ring-2 ring-white`}
                  >
                    {WIDTH <= 500 ? "Upload" : "Upload Image"}
                  </button>
                )}
              </div>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer"
                onClick={triggerFileInput}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <img src={Upload} className="size-20" />
                <p className="text-gray-500 font-medium">
                  Drag & drop skin image here
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  or click to browse files
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              className="hidden"
              accept="image/*"
              capture="environment"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Describe your symptoms
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="E.g., 'Red, itchy rash on arms for 3 days...'"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-gradient-to-br from-blue-200 ring-offset-1 ring-2 ring-blue-500 hover:from-blue-500 to-blue-800 active:indigo-600 transition-colors duration-300 w-full py-3 px-4 rounded-lg font-extrabold text-white flex items-center justify-center ${
                  pulse ? "animate-pulse" : ""
                } ${
                  isLoading
                    ? "bg-blue-400"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing ({uploadProgress}%)
                  </>
                ) : (
                  "Get Diagnosis"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-black">
              <FiInfo className="mr-2 size-5 text-red-600" />
              <p>
                For better results: Use clear, well-lit photos of the affected
                area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisForm;
