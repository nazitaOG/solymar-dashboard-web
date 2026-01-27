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

    // 2. Guardamos intención de recordar
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

      {/* SMART RESPONSIVE CONTAINER:
        - min-h-screen: Asegura que ocupe al menos toda la pantalla.
        - flex-col lg:flex-row: Columna en móvil, Fila en desktop.
        - NO usamos overflow-hidden global para permitir scroll si hay zoom.
      */}
      <div className="light login-container min-h-screen flex flex-col lg:flex-row bg-white">

        {/* LEFT PANEL (STICKY):
          - lg:sticky lg:top-0 lg:h-screen: 
            Esto hace la magia. Si la página es más larga que la pantalla (por zoom o pantallas chicas),
            este panel se queda "pegado" a la vista y no scrollea, manteniendo el diseño intacto.
        */}
        <div className="lg:w-[28%] bg-[#ffca00] justify-between relative overflow-hidden flex flex-col shrink-0 lg:h-screen lg:sticky lg:top-0">

          {/* Header Branding */}
          <div className="relative z-10 p-4 lg:p-6 flex justify-center 2xl:justify-start">
            <div className="w-fit bg-white/20 backdrop-blur-sm border border-white/10 p-3 rounded-3xl shadow-sm">
              <img
                src="/logo.png"
                alt="Sol y Mar Viajes"
                className="h-12 2xl:h-10 3xl:h-12 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* IMAGE CONTAINER */}
          <div className="w-full z-10 hidden lg:block">
            <img
              src="/amarelo.jpg"
              alt="Imagen de vuelos"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* DECORACIÓN */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden 2xl:block">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/30" />
          </div>

        </div>

        {/* RIGHT PANEL:
          - flex-1: Ocupa el resto.
          - Flexbox centra el contenido verticalmente si hay espacio.
          - Si no hay espacio, el navegador habilita el scroll naturalmente.
        */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
          <div className="w-full max-w-md space-y-8">

            {/* Form Container */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-10">

              {/* Header Logic */}
              <div className="space-y-2 mb-8">
                {view === 'forgot-password' && (
                  <button
                    onClick={() => setView('login')}
                    className="flex items-center text-xs text-gray-600 hover:text-black mb-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" /> Volver
                  </button>
                )}
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {view === 'login' ? "Bienvenido de nuevo" : "Recuperar cuenta"}
                </h1>
                <p className="text-gray-600 text-sm">
                  {view === 'login'
                    ? "Accede al dashboard administrativo"
                    : "Ingresa tu email para restablecer la contraseña"}
                </p>
              </div>

              {/* === LOGIN FORM === */}
              {view === "login" && (
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* INPUT DE EMAIL */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-900">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@solymar.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-white border-gray-200 focus:border-black transition-all text-black placeholder:text-gray-400"
                      disabled={loginMutation.isPending}
                    />
                  </div>

                  {/* INPUT DE PASSWORD */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-gray-900">Contraseña</Label>
                      <button
                        type="button"
                        onClick={() => setView("forgot-password")}
                        className="text-sm cursor-pointer text-black hover:text-gray-700 transition-colors font-medium"
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
                        className="h-11 pr-10 bg-white border-gray-200 focus:border-black transition-all text-black placeholder:text-gray-400"
                        disabled={loginMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* CHECKBOX */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(!!c)}
                      className="border-gray-300 cursor-pointer bg-white data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-white"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                      Recordarme en este dispositivo
                    </Label>
                  </div>

                  {/* ERRORES */}
                  {(validationError || loginMutation.isError) && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                      {validationError || (loginMutation.error as Error)?.message || "Error al iniciar sesión"}
                    </div>
                  )}

                  {/* BOTÓN DE INICIAR SESIÓN */}
                  <div className="pt-1">
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-11 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
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
                  </div>

                  {/* SEPARADOR "O" */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">O</span>
                    </div>
                  </div>

                  {/* TEXTO DE CONTACTO */}
                  <p className="text-center text-sm text-gray-600">
                    ¿No tienes cuenta?{" "}
                    <a
                      href="mailto:solymarbue@hotmail.com?subject=Solicitud de Acceso Admin&body=Hola, solicito acceso al panel administrativo de Sol y Mar."
                      className="text-black hover:text-gray-700 font-medium transition-colors hover:underline"
                    >
                      Contacta con nosotros
                    </a>
                  </p>

                  {/* BOTÓN DEMO */}
                  {isDemoMode && (
                    <div>
                      <Button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loginMutation.isPending}
                        variant="outline"
                        className="w-full h-11 cursor-pointer transition-all rounded-lg gap-2 bg-white border-2 border-amber-500/40 text-amber-600 hover:bg-amber-50 hover:border-amber-500/60 hover:text-amber-700"
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
                        <Label htmlFor="forgot-email" className="text-gray-900">Email registrado</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="admin@solymar.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="h-11 bg-white border-gray-200 text-black placeholder:text-gray-400"
                          disabled={forgotMutation.isPending}
                        />
                      </div>

                      {(validationError || forgotMutation.isError) && (
                        <p className="text-red-500 text-sm">{validationError || "Error enviando correo"}</p>
                      )}

                      <Button
                        type="submit"
                        disabled={forgotMutation.isPending}
                        className="w-full h-11 cursor-pointer bg-black hover:bg-gray-800 text-white"
                      >
                        {forgotMutation.isPending ? "Enviando..." : "Enviar enlace de recuperación"}
                      </Button>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md text-center">
                      <p className="text-green-700 font-medium mb-2">¡Correo enviado!</p>
                      <p className="text-sm text-gray-600">
                        Si existe una cuenta asociada a <strong>{forgotEmail}</strong>, recibirás instrucciones en breve.
                      </p>
                    </div>
                  )}
                </form>
              )}

            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Sol y Mar Viajes y Turismo.{" "}
              <a href="mailto:soporte@solymar.com" className="text-black hover:underline">
                Soporte Técnico
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}