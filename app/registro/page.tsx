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
      // 1. Registro en USER_PROFILES (Datos personales)
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

      // 2. Registro en PROFILES (Colores exactos proporcionados)
      const { error: errorTema } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          theme_name: "Esmeralda (Default)",
          primary_color: "#10B981",    // Primario
          secondary_color: "#0D9488",  // Secundario
          accent_color: "#F59E0B",     // Acento
          background_color: "#F3F4F6", // Fondo
          text_color: "#1F2937",       // Texto
          sidebar_color: "#1F2937",    // Sidebar
          card_color: "#FFFFFF",       // Tarjetas
          font_family: "Inter",
          font_size: "16px",
          background_opacity: 100,
          updated_at: new Date().toISOString(),
        })

      if (errorTema) throw errorTema

      toast.success("¡Perfil y configuración guardados correctamente!")
      router.push("/dashboard") 
      
    } catch (error: any) {
      console.error("Error en registro:", error.message)
      toast.error("Error: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#10B981]">Registro de Usuario</CardTitle>
          <CardDescription className="text-[#1F2937]">Configura tus datos personales y tema visual</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1F2937]">Nombres *</Label>
                <Input required value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="border-gray-300 focus:border-[#10B981]"/>
              </div>
              <div className="space-y-2">
                <Label className="text-[#1F2937]">Apellidos *</Label>
                <Input required value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="border-gray-300 focus:border-[#10B981]"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1F2937]">Cédula *</Label>
                <Input required value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="border-gray-300"/>
              </div>
              <div className="space-y-2">
                <Label className="text-[#1F2937]">Teléfono *</Label>
                <Input required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="border-gray-300"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1F2937]">Fecha de Nacimiento</Label>
                <Input type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} className="border-gray-300"/>
              </div>
              <div className="space-y-2">
                <Label className="text-[#1F2937]">Género</Label>
                <Select onValueChange={v => setFormData({...formData, genero: v})}>
                  <SelectTrigger className="border-gray-300"><SelectValue placeholder="Selecciona"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1F2937]">Dirección</Label>
              <Input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="border-gray-300"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1F2937]">Ciudad</Label>
                <Input value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} className="border-gray-300"/>
              </div>
              <div className="space-y-2">
                <Label className="text-[#1F2937]">País</Label>
                <Select defaultValue="Colombia" onValueChange={v => setFormData({...formData, pais: v})}>
                  <SelectTrigger className="border-gray-300"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Colombia">Colombia</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-[#10B981] hover:bg-[#0D9488] text-white font-bold h-12 mt-4"
            >
              {isLoading ? "Sincronizando..." : "Finalizar Registro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
