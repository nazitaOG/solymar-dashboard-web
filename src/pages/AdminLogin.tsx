import { useState, useEffect, useTransition, FormEvent } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Globe, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react" // Agregué ArrowLeft
import { useAuthStore } from "@/stores/useAuthStore"
import { fetchAPI } from "@/lib/api/fetchApi"
import { loginSchema, forgotPasswordSchema } from "@/lib/schemas/login/login.schema"
// ... (travelImages se mantiene igual)
const travelImages = [
  { url: "/images/santorini-sunset.png", location: "Santorini, Greece" },
  { url: "/images/paris-eiffel-golden-hour.png", location: "Paris, France" },
  { url: "/images/tokyo-fuji-cherry.png", location: "Tokyo, Japan" },
  { url: "/images/newyork-skyline.jpg", location: "New York, USA" },
  { url: "/images/bali-rice-terraces.png", location: "Bali, Indonesia" },
]

interface LoginResponse {
  username: string
  email: string
  token: string
  isActive: boolean
}

// Tipos de vista
type AuthView = "login" | "forgot-password"

export default function AdminLogin() {
  const [view, setView] = useState<AuthView>("login") // Estado para controlar la vista
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Login States
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const { setToken } = useAuthStore()
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()

  // --- HANDLERS ---

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    startTransition(async () => {
      try {
        const res = await fetchAPI<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        })

        setToken(res.token)

        if (rememberMe) localStorage.setItem("rememberEmail", email)
        else localStorage.removeItem("rememberEmail")

        navigate("/reservas", { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.")
      }
    })
  }

  const handleForgotPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setForgotSuccess(false)

    const parsed = forgotPasswordSchema.safeParse({ email: forgotEmail })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    startTransition(async () => {
      try {
        // Llamada al endpoint público que creamos
        await fetchAPI("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: forgotEmail }),
        })
        
        // UX Senior: Siempre mostramos éxito para evitar enumeración de usuarios,
        // incluso si el email no existe en backend (aunque el backend ya maneja eso).
        setForgotSuccess(true)
      } catch (err) {
        // Solo mostramos error si es algo técnico (500), no validación lógica
        console.error(err)
        setError("Ocurrió un error al intentar enviar el correo. Intenta nuevamente mas tarde.")
      }
    })
  }

  // --- EFFECTS ---

  useEffect(() => {
    const id = setInterval(
      () => setCurrentImageIndex((i) => (i + 1) % travelImages.length),
      4000
    )
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  // Limpiar errores al cambiar de vista
  useEffect(() => {
    setError(null)
    setForgotSuccess(false)
  }, [view])


  return (
    <div className="min-h-screen w-full flex justify-center bg-[#17151f]/96 px-4 py-8 md:py-12">
      <div className="w-full md:pb-6 max-w-5xl bg-[#17151f] text-white rounded-none md:rounded-md overflow-hidden shadow-xl border border-white/5 flex flex-col md:grid md:grid-cols-2">
        {/* Slideshow (Igual que antes) */}
        <div className="relative w-full h-48 sm:h-64 md:h-full md:m-3 md:rounded-md overflow-hidden">
          <div className="absolute top-3 left-3 flex items-center gap-2 text-white/90 z-10">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            <span className="font-semibold">Sol y Mar Viajes y Turismo</span>
          </div>

          <div className="absolute inset-0">
            {travelImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
              >
                <img
                  src={image.url}
                  alt={image.location}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 right-3 text-white">
                  <p className="text-xs bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                    Ahora mostrando: {image.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LOGIC SWAP: Renderizado condicional basado en 'view' */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 flex items-center justify-center">
          
          {/* VISTA 1: LOGIN */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="w-full max-w-md mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-1">Inicia sesión</h1>
                <p className="text-sm text-white/70">
                  ¿No tienes cuenta?{" "}
                  <a
                    className="underline hover:text-white transition-colors"
                    href="mailto:solymarbue@hotmail.com?subject=Solicitud..."
                  >
                    Contacta con nosotros
                  </a>
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="email" className="text-white/80 mb-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-9 rounded-md border-none bg-white/5"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="password" className="text-white/80">Contraseña</Label>
                    {/* Botón para cambiar a Forgot Password */}
                    <button
                      type="button"
                      onClick={() => setView("forgot-password")}
                      className="text-xs text-white/50 cursor-pointer hover:text-white underline transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-10 rounded-md border-none bg-white/5"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    className="rounded-sm border-none bg-white/5 cursor-pointer"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(!!v)}
                  />
                  <span>Recordarme en este dispositivo</span>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <Button
                  type="submit"
                  disabled={isPending}
                  className={`cursor-pointer text-white w-full transition-all duration-300 rounded-md border-none bg-white/5 hover:bg-white/10 ${isPending ? "opacity-70 cursor-wait" : ""}`}
                >
                  {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </div>
            </form>
          )}

          {/* VISTA 2: FORGOT PASSWORD */}
          {view === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                 <button
                    type="button"
                    onClick={() => setView("login")}
                    className=" cursor-pointer flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4  h-4" /> Volver al login
                  </button>
                <h1 className="text-2xl font-semibold mb-1">Recuperar cuenta</h1>
                <p className="text-sm text-white/70">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              {!forgotSuccess ? (
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="forgot-email" className="text-white/80 mb-1">Email registrado</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-9 rounded-md border-none bg-white/5"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="cursor-pointer w-full transition-all duration-300 rounded-md border-none bg-white/20 hover:bg-white/30 text-white font-medium"
                  >
                    {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-md text-center">
                  <p className="text-green-200 font-medium mb-2">¡Correo enviado!</p>
                  <p className="text-sm text-white/70">
                    Si existe una cuenta asociada a <strong>{forgotEmail}</strong>, recibirás instrucciones en breve.
                  </p>
                  <p className="text-xs text-white/40 mt-4">Revisa tu bandeja de spam si no lo ves.</p>
                </div>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  )
}