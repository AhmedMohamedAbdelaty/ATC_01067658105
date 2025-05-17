"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Define API URL with proper fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

// Define role type
type Role = string | { name: string; [key: string]: any };

interface User {
  id: string
  username: string
  email: string
  roles: Role[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const isAdmin =
    user?.roles?.some((role) =>
      role === "ROLE_ADMIN" ||
      (typeof role === "object" && role !== null && 'name' in role && role.name === "ROLE_ADMIN")
    ) || false

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (emailOrUsername: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrUsername, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      if (data.success && data.data.token) {
        localStorage.setItem("token", data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        setUser(data.data.user)

        toast({
          title: "Login successful",
          description: `Welcome back, ${data.data.user.username}!`,
        })

        router.push("/events")
      } else {
        throw new Error(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now log in.",
      })

      router.push("/login")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout API call failed:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      router.push("/")
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
