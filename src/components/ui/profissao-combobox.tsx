import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProfissaoComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function ProfissaoCombobox({ value, onValueChange }: ProfissaoComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [profissoes, setProfissoes] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchValue, setSearchValue] = React.useState("");

  // Carregar profissões do banco
  React.useEffect(() => {
    loadProfissoes();
  }, []);

  const loadProfissoes = async () => {
    try {
      const { data, error } = await supabase
        .from('profissoes')
        .select('nome')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;

      setProfissoes(data?.map(p => p.nome) || []);
    } catch (error) {
      console.error('Erro ao carregar profissões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de profissões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewProfissao = async () => {
    if (!searchValue.trim()) return;

    try {
      const { error } = await supabase
        .from('profissoes')
        .insert([{ nome: searchValue.trim(), categoria: 'Outros' }]);

      if (error) {
        // Se já existe, apenas seleciona
        if (error.code === '23505') {
          onValueChange(searchValue.trim());
          setOpen(false);
          return;
        }
        throw error;
      }

      // Adiciona à lista local e seleciona
      setProfissoes([...profissoes, searchValue.trim()].sort());
      onValueChange(searchValue.trim());
      setOpen(false);

      toast({
        title: "Sucesso",
        description: "Nova profissão adicionada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar profissão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a nova profissão",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 sm:h-11"
        >
          {value || "Selecione uma profissão..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar profissão..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">Carregando...</div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    <p className="mb-2">Profissão não encontrada</p>
                    {searchValue && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddNewProfissao}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar "{searchValue}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {profissoes.map((profissao) => (
                    <CommandItem
                      key={profissao}
                      value={profissao}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === profissao ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {profissao}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
