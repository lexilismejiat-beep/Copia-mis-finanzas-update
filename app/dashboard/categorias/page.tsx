"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus, Wallet, Car, Utensils, Zap, Heart, CreditCard, 
  ShoppingBag, ChevronDown, ChevronUp, Calendar as CalendarIcon,
  Trash2, Loader2, Tag
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { toast } from "sonner"

// Mapa de iconos para renderizar según el string guardado
const ICON_MAP: Record<string, any> = {
  Utensils, Car, Zap, Heart, CreditCard, ShoppingBag, Wallet
}

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
]

export default function CategoriasPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [grupos, setGrupos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      if (!profileData) return
      setProfile(profileData)

      // 1. Obtener Categorías del Usuario
      const { data: catUser } = await supabase
        .from("categorias_personalizadas")
        .select("*")
        .eq("user_id", profileData.cedula)

      // 2. Obtener Transacciones del mes
      const dateFrom = startOfMonth(new Date(selectedYear, selectedMonth))
      const dateTo = endOfMonth(new Date(selectedYear, selectedMonth))
      const { data: transData } = await supabase
        .from("transacciones")
        .select("categoria, monto, created_at")
        .eq("user_id", profileData.cedula)
        .gte("created_at", startOfDay(dateFrom).toISOString())
        .lte("created_at", endOfDay(dateTo).toISOString())

      // 3. Lógica de Clasificación
      const mapping: Record<string, any> = {}
      
      // Inicializar con las categorías del usuario
      catUser?.forEach(cat => {
        mapping[cat.nombre] = { 
          ...cat, 
          icon: ICON_MAP[cat.icon_name] || ShoppingBag, 
          total: 0, 
          desglose: {} 
        }
      })

      // Categoría "Otros" por defecto
      mapping["Otros"] = { nombre: "Otros", icon: ShoppingBag, desc: "Sin clasificar", total: 0, desglose: {}, keywords: [] }

      transData?.forEach(t => {
        const catLower = t.categoria?.toLowerCase() || ""
        let asignado = false

        for (const nombreGrupo in mapping) {
          const catDef = mapping[nombreGrupo]
          if (catDef.keywords?.some((k: string) => catLower.includes(k.toLowerCase()))) {
            mapping[nombreGrupo].total += t.monto
            mapping[nombreGrupo].desglose[t.categoria] = (mapping[nombreGrupo].desglose[t.categoria] || 0) + t.monto
            asignado = true
            break
          }
        }

        if (!asignado) {
          mapping["Otros"].total += t.monto
          mapping["Otros"].desglose[t.categoria || "Sin etiqueta"] = (mapping["Otros"].desglose[t.categoria || "Sin etiqueta"] || 0) + t.monto
        }
      })

      setGrupos(Object.values(mapping))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [selectedMonth, selectedYear])

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAdding(true)
    const formData = new FormData(e.currentTarget)
    const newCat = {
      user_id: profile.cedula,
      nombre: formData.get("nombre"),
      descripcion: formData.get("descripcion"),
      icon_name: formData.get("icon_name"),
      keywords: (formData.get("keywords") as string).split(",").map(k => k.trim())
    }

    const { error } = await supabase.from("categorias_personalizadas").insert([newCat])
    if (error) toast.error(error.message)
    else {
      toast.success("Categoría creada");
      fetchData();
    }
    setIsAdding(false)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar categoría? Los gastos volverán a 'Otros'")) return
    const { error } = await supabase.from("categorias_personalizadas").delete().eq('id', id)
    if (error) toast.error("Error al borrar")
    else { toast.success("Categoría eliminada"); fetchData(); }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background_color || "#0a0a0a" }}>
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile?.nombres || "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-black text-white">Categorías</h1>
              <p className="text-gray-400">Gestiona cómo se clasifican tus gastos automáticamente.</p>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
                <CalendarIcon className="h-4 w-4 text-emerald-500 ml-1" />
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-sm text-white outline-none">
                  {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-zinc-900">{m.label}</option>)}
                </select>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <Plus size={18} /> Nueva
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                  <DialogHeader><DialogTitle>Crear Categoría Maestra</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateCategory} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Nombre de la Categoría</Label>
                      <Input name="nombre" placeholder="Ej: Diversión" className="bg-zinc-900 border-zinc-800" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Palabras Clave (Separadas por coma)</Label>
                      <Input name="keywords" placeholder="cine, netflix, bolos, bar" className="bg-zinc-900 border-zinc-800" required />
                      <p className="text-[10px] text-gray-500">Si un gasto contiene alguna de estas palabras, se moverá aquí.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Icono</Label>
                            <select name="icon_name" className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2">
                                {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input name="descripcion" placeholder="Opcional" className="bg-zinc-900 border-zinc-800" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600" disabled={isAdding}>
                        {isAdding ? <Loader2 className="animate-spin" /> : "Guardar Categoría"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 h-10 w-10" /></div>
          ) : (
            <div className="grid gap-4">
              {grupos.map((grupo, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
                  <div className="p-6 flex items-center gap-6 cursor-pointer hover:bg-zinc-800/50 transition-colors" onClick={() => toggleExpand(i)}>
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <grupo.icon size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{grupo.nombre}</h3>
                      <div className="flex gap-1 mt-1">
                        {grupo.keywords?.map((k:string) => <span key={k} className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-gray-400">{k}</span>)}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-2xl font-black text-emerald-500">${Math.abs(grupo.total).toLocaleString()}</p>
                    </div>
                    {grupo.id && (
                        <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-rose-500" onClick={(e) => {e.stopPropagation(); deleteCategory(grupo.id)}}>
                            <Trash2 size={18} />
                        </Button>
                    )}
                  </div>
                  
                  {expandedIndex === i && (
                    <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
                      <div className="bg-black/20 rounded-2xl p-4 border border-zinc-800/50">
                        {Object.entries(grupo.desglose).map(([tag, monto]: any) => (
                          <div key={tag} className="flex justify-between py-2 border-b border-zinc-800/30 last:border-0 text-sm">
                            <span className="text-gray-400">{tag}</span>
                            <span className="font-bold text-white">${Math.abs(monto).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
