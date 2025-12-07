import { useState, useEffect, useTransition, FormEvent } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Globe, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "@/stores/useAuthStore"
import { fetchAPI } from "@/lib/api/fetchApi"
import { loginSchema } from "@/lib/schemas/login/login.schema"

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

export default function AdminLogin() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setToken } = useAuthStore()
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()

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
        setError(
          err instanceof Error
            ? err.message
            : "Error inesperado. Contacta con el administrador."
        )
      }
    })
  }

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

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#17151f]/96 px-4 py-8 md:py-12">
      <div className="w-full md:pb-6 max-w-5xl bg-[#17151f] text-white rounded-none md:rounded-md overflow-hidden shadow-xl border border-white/5 flex flex-col md:grid md:grid-cols-2">
        {/* Slideshow */}
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

        {/* Formulario */}
        <form
          onSubmit={handleLogin}
          className="flex-1 p-6 sm:p-8 md:p-12 flex items-center justify-center"
        >
          <div className="w-full max-w-md mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-semibold mb-1">Inicia sesión</h1>
              <p className="text-sm text-white/70">
                ¿No tienes cuenta?{" "}
                <a
                  className="underline"
                  href={
                    "mailto:solymarbue@hotmail.com" +
                    "?subject=" +
                    encodeURIComponent("Solicitud de creación de cuenta – Sol y Mar Viajes") +
                    "&body=" +
                    encodeURIComponent(
                      "Hola, quisiera crear una cuenta para acceder al sistema de reservas.\n\n" +
                      "Mis datos son:\n" +
                      "- Nombre:\n" +
                      "- Email:\n" +
                      "Gracias."
                    )
                  }
                >
                  Contacta con nosotros
                </a>


              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="email" className="text-white/80 mb-1">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className="pl-9 rounded-md border-none bg-white/5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-white/80 mb-1">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-9 pr-10 rounded-md border-none bg-white/5"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  className="rounded-sm border-none bg-white/5 cursor-pointer" // El cursor-pointer debe estar aquí
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(!!v)}
                />
                {/* El texto ya no activará el checkbox porque el padre es un div */}
                <span>Recordarme en este dispositivo</span>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={isPending}
                className={`cursor-pointer w-full transition-all duration-300 rounded-md border-none bg-white/5 hover:bg-white/10 ${isPending ? "opacity-70 cursor-wait" : ""
                  }`}
              >
                {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
