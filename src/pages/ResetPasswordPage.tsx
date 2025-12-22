import { useState, useTransition, FormEvent, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { fetchAPI } from "@/lib/api/fetchApi"
import { resetPasswordSchema } from "@/lib/schemas/login/login.schema" 

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()
  
  // Estados
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  
  // Formulario
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Feedback
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 1. EFECTO DE VERIFICACIÓN (SILENCIOSO)
  useEffect(() => {
    const urlToken = searchParams.get("token")
    
    if (!urlToken) {
      navigate("/login", { replace: true })
      return
    }

    setToken(urlToken)

    const verify = async () => {
      try {
        await fetchAPI(`/auth/verify-token?token=${urlToken}`, { method: "GET" })
        setIsTokenValid(true)
      } catch (err) {
        if (err instanceof Error && (err.message.includes("token") || err.message.includes("expirado") || err.message.includes("invalid") || err.message.includes("enlace"))) {
          console.log('No se pudo procesar la solicitud. Intente nuevamente más tarde.')
        }
        setIsTokenValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verify()
  }, [searchParams, navigate])

  // 2. HANDLER DE CAMBIO (SILENCIOSO)
  const handleReset = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword })
    
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    startTransition(async () => {
      try {
        await fetchAPI("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ token, password }),
        })
        setSuccess(true)
        setTimeout(() => navigate("/login"), 3000)

      } catch (err) {
        // 🔇 SILENCIO TOTAL TAMBIÉN AQUÍ
        
        // Lógica interna para decidir UI sin imprimir nada
        const errorMsg = err instanceof Error ? err.message.toLowerCase() : "";
        const isTokenIssue = 
            errorMsg.includes("token") || 
            errorMsg.includes("enlace") || 
            errorMsg.includes("expirado") || 
            errorMsg.includes("invalid");

        if (isTokenIssue) {
             setIsTokenValid(false);
             return; 
        }

        setError("No se pudo procesar la solicitud. Intente nuevamente más tarde.");
      }
    })
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#17151f]/96 px-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <Loader2 className="w-10 h-10 animate-spin text-white/80" />
          <p className="text-sm text-white/60 font-medium">Verificando enlace...</p>
        </div>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#17151f]/96 px-4">
        <div className="w-full max-w-md bg-[#17151f] border border-red-500/20 p-8 rounded-md text-center shadow-2xl animate-in zoom-in-95">
           <div className="flex justify-center mb-6">
              <div className="bg-red-500/10 p-4 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Enlace no válido</h2>
          <p className="text-white/70 mb-6 text-sm">
             Este enlace de recuperación ha expirado, ya fue utilizado o no existe.
          </p>
          
          <div className="space-y-3">
            <Button 
                onClick={() => navigate("/login")} 
                className="w-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
                Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#17151f]/96 px-4">
            <div className="w-full max-w-md bg-[#17151f] border border-green-500/20 p-8 rounded-md text-center shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-500/10 p-4 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Contraseña restablecida!</h2>
                <p className="text-white/70 mb-4 text-sm">Serás redirigido al login en unos segundos...</p>
                <Button onClick={() => navigate("/login")} className="w-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
                    Ir al Login ahora
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#17151f]/96 px-4">
      <div className="w-full max-w-md bg-[#17151f] text-white rounded-md shadow-xl border border-white/5 p-8 sm:p-10 animate-in fade-in duration-500">
        <h1 className="text-2xl font-semibold mb-2">Nueva Contraseña</h1>
        <p className="text-sm text-white/70 mb-6">Ingresa tu nueva clave segura.</p>

        <form onSubmit={handleReset} className="space-y-5">
           
           <div>
            <Label htmlFor="new-password" className="text-white/80 mb-1.5 block">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10 rounded-md border-none bg-white/5 h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
               <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-white/80 mb-1.5 block">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 rounded-md border-none bg-white/5 h-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

           {error && (
            <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded animate-in fade-in">{error}</p>
           )}

           <Button
            type="submit"
            disabled={isPending}
            className={`cursor-pointer w-full bg-white/10 hover:bg-white/20 text-white ${isPending ? "opacity-70" : ""}`}
          >
            {isPending ? "Restableciendo..." : "Cambiar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  )
}