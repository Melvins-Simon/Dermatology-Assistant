import React from "react";

const MulticolorProgressBar = ({ isLoading }) => {
  return (
    <div className="w-full max-w-lg absolute top-0 left-0 right-0 mx-auto">
      {isLoading && (
        <div className="relative h-[4px] bg-gray-300 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full w-full animate-fast-extended"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ec4899, #f97316, #eab308, #84cc16, #3b82f6, #8b5cf6, #ec4899, #f97316, #eab308)",
              backgroundSize: "300% 100%",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default MulticolorProgressBar;
