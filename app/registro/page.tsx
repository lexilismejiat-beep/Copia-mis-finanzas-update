"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { toast } from "sonner"

export default function RegistroPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    telefono: "",
    fecha_nacimiento: "",
    genero: "",
    direccion: "",
    ciudad: "",
    pais: "Colombia",
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      
      // Pre-llenado con metadatos de Google si existen
      if (user.user_metadata) {
        setFormData(prev => ({
          ...prev,
          nombres: user.user_metadata.full_name?.split(" ")[0] || "",
          apellidos: user.user_metadata.full_name?.split(" ").slice(1).join(" ") || "",
        }))
      }
    }
    getUser()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      // 1. Guardar datos en la tabla de información personal
      const { error: errorPersonal } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          ...formData,
          registration_complete: true,
          updated_at: new Date().toISOString(),
        })

      if (errorPersonal) throw errorPersonal

      // 2. Inicializar la tabla de apariencia con el tema Esmeralda por defecto
      // Usamos los colores extraídos de tu configuración visual
      const { error: errorTema } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          // Ajusta los nombres de las columnas según tu base de datos (ej. theme_settings)
          theme_settings: {
            primary: "#10b981",    // Emerald 500
            secondary: "#0d9488",  // Teal 600
            accent: "#f59e0b",     // Amber 500
            background: "#0a0a0a", // Fondo oscuro de tu app
            text: "#ffffff",
            sidebar: "#121212",
            card: "#121212"
          },
          font_family: "Inter",
          updated_at: new Date().toISOString(),
        })

      if (errorTema) throw errorTema

      toast.success("¡Perfil completado con éxito!")
      router.push("/dashboard") 
      
    } catch (error: any) {
      console.error("Error en el proceso de registro:", error.message)
      toast.error("Error al guardar: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white dark:bg-[#121212]">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Completa tu perfil
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Necesitamos algunos datos básicos para personalizar tu experiencia financiera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fila: Nombres y Apellidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Ej: Juan"
                  required
                  className="bg-gray-50 dark:bg-[#1a1a1a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Ej: Pérez"
                  required
                  className="bg-gray-50 dark:bg-[#1a1a1a]"
                />
              </div>
            </div>

            {/* Fila: Cédula y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula / Documento *</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                  placeholder="Número de identidad"
                  required
                  className="bg-gray-50 dark:bg-[#1a1a1a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="+57 300 000 0000"
                  required
                  className="bg-gray-50 dark:bg-[#1a1a1a]"
                />
              </div>
            </div>

            {/* Fila: Fecha y Género */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                  className="bg-gray-50 dark:bg-[#1a1a1a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genero">Género</Label>
                <Select
                  value={formData.genero}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value }))}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-[#1a1a1a]">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#121212]">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Dirección de residencia"
                className="bg-gray-50 dark:bg-[#1a1a1a]"
              />
            </div>

            {/* Fila: Ciudad y País */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                  placeholder="Ej: Bogotá"
                  className="bg-gray-50 dark:bg-[#1a1a1a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Select
                  value={formData.pais}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-[#1a1a1a]">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#121212]">
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Mexico">México</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Peru">Perú</SelectItem>
                    <SelectItem value="Ecuador">Ecuador</SelectItem>
                    <SelectItem value="España">España</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sincronizando perfil...</span>
                </div>
              ) : (
                "Finalizar Registro"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
