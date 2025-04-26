import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { User } from "./models/user";
import { parseJwt } from "../lib/utils";
import config from "../lib/config";

type AuthState = {
  token: string | null;
  user: (User & { image: string }) | null;
};

type AuthDispatch = {
  setToken: (token: string | null) => void;
  setUser: (user: User & { image: string }) => void;
};

type AuthProviderProps = {
  children: ReactNode;
  initialState?: AuthState;
};

const AuthContext = createContext<AuthState | null>(null);
const AuthDispatchContext = createContext<AuthDispatch | null>(null);

const AuthProvider = ({
  children,
  initialState = { token: null, user: null },
}: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const setToken = (token: string | null) => {
    const tokenUser = parseJwt(token);
    setAuthState({
      token,
      user: {
        _id: tokenUser?._id || "",
        email: tokenUser?.email || "",
        image: tokenUser?.image || "",
        userName: tokenUser?.username || "",
      },
    });
  };

  const setUser = (user: User & { image: string }) => {
    setAuthState((prevState) => ({
      ...prevState,
      user,
    }));
  };

  useEffect(() => {
    axios.defaults.baseURL = config.apiUrl;
    const interceptorId = axios.interceptors.request.use((config) => {
      if (authState.token) {
        config.headers.Authorization = `Bearer ${authState.token}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [authState.token]);

  return (
    <AuthContext.Provider value={authState}>
      <AuthDispatchContext.Provider value={{ setToken, setUser }}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const useAuthDispatch = () => {
  const context = useContext(AuthDispatchContext);
  if (context === null) {
    throw new Error("useAuthDispatch must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth, useAuthDispatch };
