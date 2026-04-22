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
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          cedula: formData.cedula,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento,
          genero: formData.genero,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          pais: formData.pais,
          registration_complete: true,
          updated_at: new Date().toISOString(),
        })

      if (errorPersonal) throw errorPersonal

      // 2. Guardar en PROFILES (Configuración Visual por columnas individuales)
      const { error: errorTema } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          theme_name: "Esmeralda (Default)",
          primary_color: "#10B981",
          secondary_color: "#0d9488",
          accent_color: "#f59e0b",
          background_color: "#0a0a0a",
          text_color: "#ffffff",
          sidebar_color: "#1f2937",
          card_color: "#ffffff",
          font_family: "Roboto", // Nombre que vi en tus columnas
          font_size: "16px",
          background_opacity: 100,
          updated_at: new Date().toISOString(),
        })

      if (errorTema) throw errorTema

      toast.success("¡Perfil y tema configurados!")
      router.push("/dashboard") 
      
    } catch (error: any) {
      console.error("Error:", error.message)
      toast.error("Hubo un problema: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans">
      <Card className="w-full max-w-2xl border-gray-800 bg-[#121212] text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-500">Completa tu perfil</CardTitle>
          <CardDescription className="text-gray-400">
            Sincroniza tus datos personales y visuales para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombres *</Label>
                <Input required value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="bg-[#1a1a1a] border-gray-700"/>
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input required value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="bg-[#1a1a1a] border-gray-700"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cédula *</Label>
                <Input required value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="bg-[#1a1a1a] border-gray-700"/>
              </div>
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="bg-[#1a1a1a] border-gray-700"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} className="bg-[#1a1a1a] border-gray-700"/>
              </div>
              <div className="space-y-2">
                <Label>Género</Label>
                <Select onValueChange={v => setFormData({...formData, genero: v})}>
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700"><SelectValue placeholder="Selecciona"/></SelectTrigger>
                  <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="bg-[#1a1a1a] border-gray-700"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} className="bg-[#1a1a1a] border-gray-700"/>
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Select defaultValue="Colombia" onValueChange={v => setFormData({...formData, pais: v})}>
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Colombia">Colombia</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
              {isLoading ? "Guardando..." : "Finalizar Registro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
