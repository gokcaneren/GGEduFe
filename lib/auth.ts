import api from "@/lib/api";
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserSignInOutputDto } from "@/types";
import { HttpStatusCode } from "axios";

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<UserSignInOutputDto>>("/api/User/signin", data);
    const body = response.data.data;

    if (!response.data.success || !body) {
      throw { response: { data: { message: response.data.message } } };
    }

    return {
      token : body?.token,
      user : {
        id : body?.id,
        firstName : body?.firstName,
        lastName : body?.lastName,
        role: body?.role
      }
    };
  },

  async register(data: RegisterRequest): Promise<{ success: boolean; message: string }> {
  const response = await api.post<ApiResponse<boolean>>("/api/User/register", data);

  if (!response.data.success) {
    throw { response: { data: { message: response.data.message } } };
  }

  return { success: true, message: response.data.message };
},

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  saveSession(data: AuthResponse) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  },

  getUser() {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },
};
