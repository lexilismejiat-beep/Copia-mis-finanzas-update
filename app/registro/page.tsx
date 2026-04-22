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
      // 1. Guardar en USER_PROFILES (Datos Personales)
      const { error: errorPersonal } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          ...formData,
          registration_complete: true,
          updated_at: new Date().toISOString(),
        })

      if (errorPersonal) throw errorPersonal

      // 2. Guardar en PROFILES (Configuración Visual con Contraste Corregido)
      const { error: errorTema } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          theme_name: "Esmeralda (Default)",
          primary_color: "#10B981",    // Esmeralda principal
          secondary_color: "#0D9488",  // Teal secundario
          accent_color: "#F59E0B",     // Ámbar de acento
          background_color: "#0A0A0A", // Fondo oscuro profundo
          text_color: "#FFFFFF",       // Texto blanco para legibilidad
          sidebar_color: "#1F2937",    // Sidebar gris oscuro
          card_color: "#1A1A1A",       // Tarjetas oscuras para contraste
          font_family: "Inter",        // Fuente legible
          font_size: "16px",
          background_opacity: 100,
          updated_at: new Date().toISOString(),
        })

      if (errorTema) throw errorTema

      toast.success("¡Registro completado exitosamente!")
      router.push("/dashboard") 
      
    } catch (error: any) {
      console.error("Error detallado:", error.message)
      toast.error("Error al registrar: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <Card className="w-full max-w-2xl border-gray-800 bg-[#121212] text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-500">Completa tu perfil</CardTitle>
          <CardDescription className="text-gray-400">
            Configura tus datos y el tema visual para tu dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombres *</Label>
                <Input 
                  required 
                  value={formData.nombres} 
                  onChange={e => setFormData({...formData, nombres: e.target.value})} 
                  className="bg-[#1a1a1a] border-gray-700 text-white focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input 
                  required 
                  value={formData.apellidos} 
                  onChange={e => setFormData({...formData, apellidos: e.target.value})} 
                  className="bg-[#1a1a1a] border-gray-700 text-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cédula / Documento *</Label>
                <Input 
                  required 
                  value={formData.cedula} 
                  onChange={e => setFormData({...formData, cedula: e.target.value})} 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input 
                  required 
                  type="tel"
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input 
                  type="date" 
                  value={formData.fecha_nacimiento} 
                  onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Género</Label>
                <Select onValueChange={v => setFormData({...formData, genero: v})}>
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700">
                    <SelectValue placeholder="Selecciona"/>
                  </SelectTrigger>
                  <SelectContent className="bg-[#121212] border-gray-700 text-white">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección de Residencia</Label>
              <Input 
                value={formData.direccion} 
                onChange={e => setFormData({...formData, direccion: e.target.value})} 
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input 
                  value={formData.ciudad} 
                  onChange={e => setFormData({...formData, ciudad: e.target.value})} 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Select defaultValue="Colombia" onValueChange={v => setFormData({...formData, pais: v})}>
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121212] border-gray-700 text-white">
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="España">España</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 mt-4"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sincronizando...</span>
                </div>
              ) : "Finalizar y Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
