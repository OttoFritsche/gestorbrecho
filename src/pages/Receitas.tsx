import { Button } from "@/components/ui/button"
import { ArrowLeft, PlusCircle, RefreshCw } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Receitas = () => {
  const navigate = useNavigate()

  const handleAddClick = () => {
    // Implemente a lógica para adicionar uma nova receita
  }

  return (
    <div className="flex items-center justify-between pb-4 border-b w-full mb-6">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => navigate(-1)} 
        aria-label="Voltar"
        className="flex-shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-grow text-center px-4">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Receitas</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie as receitas do seu brechó.
        </p>
        <div className="flex items-center gap-2 mt-2 justify-center">
          <Button 
            onClick={handleAddClick}
            className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Receita
          </Button>
          <Button 
            onClick={() => navigate('/app/receitas/recorrente')}
            variant="outline"
            className="border-[#a16207] text-[#a16207] hover:bg-amber-50 gap-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Receita Recorrente
          </Button>
        </div>
      </div>
      <div className="w-[40px] flex-shrink-0"></div>
    </div>
  )
}

export default Receitas 