import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  date: Date
  setDate: (date: Date) => void
  disabled?: boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  // Armazena os componentes de hora e minuto
  const [hour, setHour] = React.useState<number>(date?.getHours() || 0)
  const [minute, setMinute] = React.useState<number>(date?.getMinutes() || 0)

  // Atualiza a data sempre que o componente de data ou hora mudar
  React.useEffect(() => {
    if (date) {
      const newDate = new Date(date)
      newDate.setHours(hour)
      newDate.setMinutes(minute)
      
      // Log para debugging
      console.log("[DateTimePicker] Data atualizada:", 
        "\n -> Original:", date.toISOString(),
        "\n -> Nova data com hora atualizada:", newDate.toISOString(),
        "\n -> Hora local:", newDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      );
      
      setDate(newDate)
    }
  }, [hour, minute, date, setDate])

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) {
                // Preserva a hora ao selecionar nova data
                const updatedDate = new Date(newDate);
                updatedDate.setHours(hour);
                updatedDate.setMinutes(minute);
                setDate(updatedDate);
              }
            }}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center">
        <Clock className="mr-2 h-4 w-4" />
        <div className="flex">
          <Input
            type="number"
            min="0"
            max="23"
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value, 10) || 0)}
            className="w-16 text-center"
            disabled={disabled}
          />
          <span className="mx-1">:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={minute}
            onChange={(e) => setMinute(parseInt(e.target.value, 10) || 0)}
            className="w-16 text-center"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
} 