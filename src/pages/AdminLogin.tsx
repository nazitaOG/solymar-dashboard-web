import { useState, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2, ArrowLeft, UserCheck } from "lucide-react"
import { loginSchema, forgotPasswordSchema } from "@/lib/schemas/login/login.schema"
import { Head } from "@/components/seo/Head"
import { useLoginMutation, useForgotPasswordMutation } from "@/hooks/login/useAuthMutations"

// Configuración Demo
const isDemoMode = import.meta.env.VITE_APP_MODE === 'demo'
const demoEmail = import.meta.env.VITE_DEMO_EMAIL || 'demo@solymar.com'
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'Demo123!'

type AuthView = "login" | "forgot-password"

export default function AdminLogin() {
  const [view, setView] = useState<AuthView>("login")

  // States de Formulario
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // State de Forgot Password
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState(false)

  // Errores de validación local (Zod)
  const [validationError, setValidationError] = useState<string | null>(null)

  // TanStack Query Mutations
  const loginMutation = useLoginMutation()
  const forgotMutation = useForgotPasswordMutation()

  // --- LOGIC: EFFECTS ---
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    setValidationError(null)
    setForgotSuccess(false)
    loginMutation.reset()
    forgotMutation.reset()
  }, [view])

  // --- LOGIC: HANDLERS ---

  const handleLogin = (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // 1. Zod Validation
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0].message)
      return
    }

    // 2. Guardamos intención de recordar en localStorage temporal para el hook
    localStorage.setItem("tempRequestRemember", String(rememberMe))

    // 3. Ejecutar Mutación
    loginMutation.mutate({ email, password })
  }

  const handleDemoLogin = () => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    localStorage.setItem("tempRequestRemember", "false")
    loginMutation.mutate({ email: demoEmail, password: demoPassword })
  }

  const handleForgotPassword = (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const parsed = forgotPasswordSchema.safeParse({ email: forgotEmail })
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0].message)
      return
    }

    forgotMutation.mutate({ email: forgotEmail }, {
      onSuccess: () => setForgotSuccess(true)
    })
  }

  return (
    <>
      <Head
        title={view === 'login' ? "Iniciar Sesión" : "Recuperar Contraseña"}
        description="Portal de acceso administrativo de Solymar Viajes."
      />

      <div className="min-h-screen flex flex-col lg:flex-row bg-background">

        {/* === LEFT PANEL (Desktop) / TOP PANEL (Mobile) === */}
        <div className="lg:w-[28%] bg-[#ffca00] justify-between relative overflow-hidden flex flex-col">

          {/* Header Branding (Visible siempre) */}
          <div className="relative z-10 p-4 lg:p-6 flex justify-center 2xl:justify-start">
            <div className="w-fit bg-white/20 backdrop-blur-sm border border-white/10 p-3 rounded-3xl shadow-sm">
              <img
                src="/logo.png"
                alt="Sol y Mar Viajes"
                // h-12: Tamaño grandecito para móvil/tablet donde es protagonista
                // 2xl:h-8: Tamaño "chiquito" para la esquina en pantallas gigantes
                className="h-12 2xl:h-10 3xl:h-12 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* IMAGE CONTAINER */}
          {/* 'hidden lg:block': Oculto en móvil/tablet, visible solo en pantallas grandes (Desktop) */}
          <div className="w-full z-10 hidden lg:block">
            <img
              src="/amarelo.jpg"
              alt="Imagen de vuelos"
              className="w-full h-auto"
            />
          </div>

          {/* === CÍRCULOS DECORATIVOS === */}
          {/* 'hidden lg:block': Ocultos en móvil/tablet, visibles solo en Desktop */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden 2xl:block">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/30" />
            {/* Si tenías un segundo círculo abajo a la izquierda, iría aquí */}
          </div>

        </div>

        {/* === RIGHT PANEL: FORM LOGIC === */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
          <div className="w-full max-w-md space-y-8">

            {/* Form Container */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-8 sm:p-10 animate-in slide-in-from-right-4 duration-500">

              {/* Header Logic */}
              <div className="space-y-2 mb-8">
                {view === 'forgot-password' && (
                  <button
                    onClick={() => setView('login')}
                    className="flex items-center text-xs text-muted-foreground hover:text-primary mb-2 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" /> Volver
                  </button>
                )}
                <h1 className="text-2xl font-bold text-card-foreground tracking-tight">
                  {view === 'login' ? "Bienvenido de nuevo" : "Recuperar cuenta"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {view === 'login'
                    ? "Accede al dashboard administrativo"
                    : "Ingresa tu email para restablecer la contraseña"}
                </p>
              </div>

              {/* === LOGIN FORM === */}
              {view === "login" && (
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* INPUT DE EMAIL */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@solymar.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      // LIMPIO: Dejamos que el CSS Global se encargue del autofill
                      className="h-11 bg-white border-input focus:border-primary text-black"
                      disabled={loginMutation.isPending}
                    />
                  </div>

                  {/* INPUT DE PASSWORD */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Contraseña</Label>
                      <button
                        type="button"
                        onClick={() => setView("forgot-password")}
                        className="text-sm cursor-pointer text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                         // LIMPIO AQUÍ TAMBIÉN
                        className="h-11 pr-10 bg-white border-input focus:border-primary text-black"
                        disabled={loginMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(!!c)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                      Recordarme en este dispositivo
                    </Label>
                  </div>

                  {/* Errores */}
                  {(validationError || loginMutation.isError) && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                      {validationError || (loginMutation.error as Error)?.message || "Error al iniciar sesión"}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>

                  {/* === RESTAURADO: SECCIÓN DE SOLICITUD DE CUENTA === */}
                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">O</span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{" "}
                    <a
                      href="mailto:solymarbue@hotmail.com?subject=Solicitud de Acceso Admin&body=Hola, solicito acceso al panel administrativo de Sol y Mar."
                      className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
                    >
                      Contacta con nosotros
                    </a>
                  </p>

                  {/* Demo Mode Button */}
                  {isDemoMode && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loginMutation.isPending}
                        variant="outline"
                        className="w-full h-10 border-amber-500/30 text-amber-600 hover:bg-amber-50 hover:text-amber-700 gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        Acceso Rápido Reclutador
                      </Button>
                    </div>
                  )}
                </form>
              )}

              {/* === FORGOT PASSWORD FORM === */}
              {view === "forgot-password" && (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {!forgotSuccess ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email registrado</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="admin@solymar.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="h-11 bg-background border-input"
                          disabled={forgotMutation.isPending}
                        />
                      </div>

                      {(validationError || forgotMutation.isError) && (
                        <p className="text-red-500 text-sm">{validationError || "Error enviando correo"}</p>
                      )}

                      <Button
                        type="submit"
                        disabled={forgotMutation.isPending}
                        className="w-full h-11 cursor-pointer"
                      >
                        {forgotMutation.isPending ? "Enviando..." : "Enviar enlace de recuperación"}
                      </Button>
                    </>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-md text-center animate-in zoom-in-95">
                      <p className="text-green-700 font-medium mb-2">¡Correo enviado!</p>
                      <p className="text-sm text-muted-foreground">
                        Si existe una cuenta asociada a <strong>{forgotEmail}</strong>, recibirás instrucciones en breve.
                      </p>
                    </div>
                  )}
                </form>
              )}

            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Sol y Mar Viajes y Turismo.{" "}
              <a href="mailto:soporte@solymar.com" className="text-primary hover:underline">
                Soporte Técnico
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}