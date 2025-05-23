"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthDispatch } from "../auth.context";

const GoogleLogin: React.FC = () => {
  const router = useRouter();
  const pathName = usePathname();
  const { setToken } = useAuthDispatch();

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
      router.push("/feed");
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
