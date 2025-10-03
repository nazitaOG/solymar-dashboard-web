// src/pages/AdminLogin.tsx
// "use client" no hace falta en React, pero no molesta si lo dejas
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Globe, Mail, Lock, Eye, EyeOff } from "lucide-react"

const travelImages = [
  { url: "/santorini-sunset.png", location: "Santorini, Greece" },
  { url: "/paris-eiffel.png", location: "Paris, France" },
  { url: "/tokyo-city.png", location: "Tokyo, Japan" },
  { url: "/maldives-overwater.png", location: "Maldives" },
  { url: "/newyork-skyline.png", location: "New York, USA" },
  { url: "/bali-rice-terraces.png", location: "Bali, Indonesia" },
]

export default function AdminLogin() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentImageIndex((i) => (i + 1) % travelImages.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#17151f] text-white">
      {/* Panel izquierdo con slideshow */}
      <div className="relative hidden md:block overflow-hidden">
        <div className="absolute top-6 left-6 flex items-center gap-2 text-white/90 z-10">
          <Globe className="w-6 h-6" />
          <span className="font-semibold">Solymar Travel</span>
        </div>

        <div className="absolute inset-0">
          {travelImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img src={image.url} alt={image.location} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 right-6 text-white">
                <p className="text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  Now showing: {image.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="p-8 md:p-12 flex items-center">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-3xl font-semibold mb-2">Crea tu cuenta de viajero</h1>
          <p className="text-sm text-white/70 mb-6">
            ¿Ya tienes cuenta? <a className="underline" href="/login">Inicia sesión</a>
          </p>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/80">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} />
              <span>Recordarme en este dispositivo</span>
            </label>

            <Button className="w-full">Crear cuenta</Button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-xs text-white/60">o regístrate con</span>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="bg-white text-black">Google</Button>
              <Button variant="outline" className="bg-white text-black">Apple</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
