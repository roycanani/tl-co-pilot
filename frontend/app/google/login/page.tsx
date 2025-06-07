"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
// import { useAuthDispatch } from "../../../context/auth-context";
import { useAuth } from "../../../context/auth-context";

const GoogleLogin: React.FC = () => {
  const router = useRouter();
  const pathName = usePathname();
  const { setToken } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(pathName);
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userId = searchParams.get("_id");

    if (accessToken && refreshToken && userId) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", userId);

      setToken(accessToken);
      router.push("/dashboard");
    } else {
      console.error("Tokens missing from URL");
      router.push("/login");
    }
  }, [pathName, router, setToken]);

  return (
    <div>
      <h1>Logging in with Google...</h1>
    </div>
  );
};

export default GoogleLogin;
