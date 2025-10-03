// src/pages/AdminLogin.tsx
// "use client" no hace falta en React, pero no molesta si lo dejas
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Globe, Mail, Lock, Eye, EyeOff } from "lucide-react"

const travelImages = [
  { url: "./images/santorini-sunset.png", location: "Santorini, Greece" },
  { url: "./images/paris-eiffel-golden-hour.png", location: "Paris, France" },
  { url: "./images/tokyo-fuji-cherry.png", location: "Tokyo, Japan" },
  { url: "./images/newyork-skyline.jpg", location: "New York, USA" },
  { url: "./images/bali-rice-terraces.png", location: "Bali, Indonesia" },
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
    <div className="flex justify-center h-screen bg-[#17151f]/96 items-center">
      {/* panel completo */}
     <div className="h-[80vh] rounded-xs w-[80vw] grid md:grid-cols-2 bg-[#17151f] text-white">
      {/* Panel izquierdo con slideshow */}
      <div className=" m-3 relative hidden md:block overflow-hidden">
        <div className="absolute top-6 left-6 flex items-center gap-2 text-white/90 z-10">
          <Globe className="w-6 h-6" />
          <span className="font-semibold">Sol y Mar Viajes y Turismo</span>
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
                  Ahora mostrando: {image.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="p-8 md:p-12 flex items-center">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-3xl font-semibold mb-2">Inicia sesión</h1>
          <p className="text-sm text-white/70 mb-6">
            ¿No tienes cuenta? <a className="underline" href="/login">Contacta con nosotros</a>
          </p>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="email" className="text-white/80 mb-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-9 rounded-xs border-none bg-white/5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/80 mb-1">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10 rounded-xs border-none bg-white/5"
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

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox className="rounded-xs border-none bg-white/5 cursor-pointer" checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} />
              <span>Recordarme en este dispositivo</span>
            </label>

            <Button className="w-full cursor-pointer hover:bg-white/10 transition-all duration-300 rounded-xs border-none bg-white/5">Iniciar sesión</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
    
  )
}
