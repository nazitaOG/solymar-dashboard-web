import { useState, useTransition, FormEvent, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { fetchAPI } from "@/lib/api/fetchApi"
import { resetPasswordSchema } from "@/lib/schemas/login/login.schema"
// 👇 1. IMPORTAR EL COMPONENTE HEAD
import { Head } from "@/components/seo/Head"

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
      } catch {
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

  // --- RENDERIZADO DE ESTADOS (Loading, Error, Success) ---
  if (isVerifying) {
    return (
      <>
        <Head title="Verificando enlace..." />
        <div className="min-h-screen w-full flex items-center justify-center bg-[#17151f]/96 px-4">
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 animate-spin text-white/80" />
            <p className="text-sm text-white/60 font-medium">Verificando enlace...</p>
          </div>
        </div>
      </>
    )
  }

  if (!isTokenValid) {
    return (
      <>
        <Head title="Enlace Expirado" description="El enlace de recuperación ya no es válido." />
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
      </>
    )
  }

  if (success) {
    return (
      <>
        <Head title="Contraseña Restablecida" />
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
      </>
    )
  }

  // --- RENDERIZADO DEL FORMULARIO PRINCIPAL ---
  return (
    <>
      <Head 
        title="Nueva Contraseña" 
        description="Ingresa tu nueva contraseña para acceder a Solymar Viajes." 
      />
      
      <div className="min-h-screen w-full flex items-center justify-center bg-[#17151f]/96 px-4">
        <div className="w-full max-w-md bg-[#17151f] text-white rounded-md shadow-xl border border-white/5 p-8 sm:p-10 animate-in fade-in duration-500">
          <h1 className="text-2xl font-semibold mb-2">Nueva Contraseña</h1>
          <p className="text-sm text-white/70 mb-6">Ingresa tu nueva clave segura.</p>

          <form onSubmit={handleReset} className="space-y-5">
            <PasswordInput
              id="new-password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              placeholder="••••••••"
            />

            <PasswordInput
              id="confirm-password"
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
              placeholder="••••••••"
            />

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
    </>
  )
}

// ----------------------------------------------------------------------
// 🧩 COMPONENTE REUTILIZABLE (DRY)
// ----------------------------------------------------------------------

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

function PasswordInput({ label, id, disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div>
      <Label htmlFor={id} className="text-white/80 mb-1.5 block">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          {...props}
          id={id}
          type={isVisible ? "text" : "password"}
          className="pl-9 pr-10 rounded-md border-none bg-white/5 h-10"
          disabled={disabled}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer p-1"
          tabIndex={-1}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}