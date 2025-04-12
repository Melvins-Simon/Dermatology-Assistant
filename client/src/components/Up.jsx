import React, { useContext, useEffect, useState } from "react";
import { FiHeart, FiMessageSquare, FiShield } from "react-icons/fi";
import { azure, fabric } from "../assets";
import { Globalstate } from "../context/Globalcontext";

const TypingEffect = ({ text, speed = 100, delay = 1000, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => {
        setDisplayedText(text[0]);
        setIndex(1);
      }, delay);
    }
  }, [index, text, speed, onComplete]);

  return (
    <span className={`lg:text-[.8em] max-sm:text-[.7em]`}>{displayedText}</span>
  );
};

const Up = () => {
  const {
    screenSize: { WIDTH },
  } = useContext(Globalstate);
  const [typingComplete, setTypingComplete] = useState(false);

  return (
    <div className="my-8 p-8 flex flex-col text-white mostleft">
      <div className="mt-0">
        <h1 className="text-[2.5em] font-extrabold font-[Times] mb-2 bg-gradient-to-r from-green-500 to-white w-max text-transparent bg-clip-text">
          <TypingEffect
            text="AI Dermatology Assistant"
            onComplete={() => setTypingComplete(true)}
          />
        </h1>
        {typingComplete && (
          <p className="text-white font-extrabold text-[15px] ">
            Get instant skin condition analysis powered by Azure AI
          </p>
        )}
      </div>

      <div className={`flex gap-3 ${WIDTH <= 815 && "flex-col"}`}>
        <div className="flex items-start space-x-4 text-white border-1 p-2 backdrop-blur-sm  rounded-2xl">
          <FiShield className=" mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-bold font-serif text-2xl">Privacy First</h3>
            <p className=" text-sm">
              Your images are processed securely and never stored permanently.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4 text-indigo-50 border-1 p-2 backdrop-blur-sm rounded-2xl">
          <FiHeart className=" mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-bold font-serif text-2xl">Expert Insights</h3>
            <p className=" text-sm">
              Our AI provides preliminary analysis based on dermatological
              expertise.
            </p>
          </div>
        </div>

        <div className="flex space-x-4 text-gray-700 border-1 p-2 backdrop-blur-sm  rounded-2xl">
          <FiMessageSquare className=" mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-bold font-serif text-2xl">Interactive Chat</h3>
            <p className=" text-sm">
              Get personalized advice and follow-up questions after diagnosis.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center items-center space-x-6 opacity-75">
        <img src={azure} alt="Azure" className="size-30" />
        <h1 className="font-bold text-4xl">&</h1>
        <img src={fabric} alt="Microsoft Fabric" className="size-30" />
      </div>
    </div>
  );
};

export default Up;
