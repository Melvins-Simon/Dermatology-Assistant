import React, { useContext } from "react";
import { Logo } from "../assets";
import { Globalstate } from "../context/Globalcontext";
import { Link } from "react-router-dom";

export default function Header() {
  const {
    screenSize: { WIDTH, HEIGHT },
  } = useContext(Globalstate);
  return (
    <nav className={`w-full h-18 shadow-2xl z-20 fixed top-0 bg-gray-100`}>
      <div
        className={` flex items-center justify-between ${
          WIDTH <= 660 ? "w-full" : "w-[80%] mx-auto"
        }`}
      >
        <div>
          <img src={Logo} width={90} height={80} />
        </div>

        <div>
          <span
            className={` font-lite font-extrabold bg-gradient-to-r from-[hsl(240,100%,50%)] via-[hsl(120,100%,42%)] to-[hsl(240,100%,50%)] w-max text-transparent bg-clip-text ${
              WIDTH <= 800 ? "text-[16px]" : "text-[20px]"
            }`}
          >
            {WIDTH <= 1059
              ? "AI HACK"
              : "AI Hack With Microsoft AZure and Fabrics"}
          </span>
        </div>

        <div>
          <Link
            to={"/about"}
            className="p-3 text-[hsl(240,91%,70%)] font-semibold hover:underline hover:text-[blue]"
          >
            Meet our team
          </Link>
        </div>
      </div>
    </nav>
  );
}
