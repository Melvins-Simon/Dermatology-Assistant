import { createContext, useEffect, useRef, useState } from "react";

export const Globalstate = createContext(null);

function Globalcontext({ children }) {
  const [screenSize, setscreenSize] = useState({
    WIDTH: window.innerWidth,
    HEIGHT: window.innerHeight,
  });
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  useEffect(() => {
    const dimention = () => {
      setscreenSize({
        ...screenSize,
        WIDTH: window.innerWidth,
        HEIGHT: window.innerHeight,
      });
    };
    window.addEventListener("resize", dimention);
    dimention();
    return () => {
      window.removeEventListener("resize", dimention);
    };
  }, []);
  const viewRef = useRef(null);

  return (
    <Globalstate
      value={{
        image,
        setImage,
        imageURL,
        setImageURL,
        screenSize,
        setscreenSize,
        viewRef,
      }}
    >
      {children}
    </Globalstate>
  );
}

export default Globalcontext;
