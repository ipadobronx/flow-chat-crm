import { useState } from "react";
import { Button } from "@/components/ui/button";
import OutlineButton from "@/components/ui/outline-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowDown, Settings, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface HierarchyConfig {
  enabledCategories: ('profissao' | 'etapa')[];
  priorities: {
    profissoes: string[];
    etapas: string[];
  };
}

interface TAHierarchyConfigProps {
  config: HierarchyConfig;
  availableProfissoes: string[];
  availableEtapas: string[];
  onConfigChange: (config: HierarchyConfig) => void;
}

export function TAHierarchyConfig({ 
  config, 
  availableProfissoes, 
  availableEtapas, 
  onConfigChange 
}: TAHierarchyConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<HierarchyConfig>(config);

  const updateTempConfig = (updates: Partial<HierarchyConfig>) => {
    setTempConfig(prev => ({ ...prev, ...updates }));
  };

  const toggleCategory = (category: 'profissao' | 'etapa') => {
    const newCategories = tempConfig.enabledCategories.includes(category)
      ? tempConfig.enabledCategories.filter(c => c !== category)
      : [...tempConfig.enabledCategories, category];
    
    updateTempConfig({ enabledCategories: newCategories });
  };

  const movePriorityItem = (category: 'profissoes' | 'etapas', item: string, direction: 'up' | 'down') => {
    const list = [...tempConfig.priorities[category]];
    const currentIndex = list.indexOf(item);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < list.length) {
      [list[currentIndex], list[newIndex]] = [list[newIndex], list[currentIndex]];
      updateTempConfig({
        priorities: { ...tempConfig.priorities, [category]: list }
      });
    }
  };

  const addToPriority = (category: 'profissoes' | 'etapas', item: string) => {
    if (!tempConfig.priorities[category].includes(item)) {
      updateTempConfig({
        priorities: {
          ...tempConfig.priorities,
          [category]: [...tempConfig.priorities[category], item]
        }
      });
    }
  };

  const removeFromPriority = (category: 'profissoes' | 'etapas', item: string) => {
    updateTempConfig({
      priorities: {
        ...tempConfig.priorities,
        [category]: tempConfig.priorities[category].filter(i => i !== item)
      }
    });
  };

  const saveConfig = () => {
    onConfigChange(tempConfig);
    setIsOpen(false);
  };

  const resetConfig = () => {
    const defaultConfig: HierarchyConfig = {
      enabledCategories: [],
      priorities: { profissoes: [], etapas: [] }
    };
    setTempConfig(defaultConfig);
  };

  const getDisplayText = () => {
    if (config.enabledCategories.length === 0) {
      return "Sem Hierarquia";
    }
    return config.enabledCategories.map(cat => 
      cat === 'profissao' ? 'Profissão' : 'Etapa'
    ).join(' + ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <OutlineButton aria-label="Configurar hierarquia" className="h-8 w-8 p-0 rounded-full">
          <Settings className="w-4 h-4" />
        </OutlineButton>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border/30 bg-border/10 backdrop-blur-md shadow-xl">
        <DialogHeader>
          <DialogTitle>Configurar Hierarquia do TA</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Categorias */}
          <Card className="rounded-2xl border border-border/30 bg-border/10 backdrop-blur-md shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Categorias Ativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="profissao"
                  checked={tempConfig.enabledCategories.includes('profissao')}
                  onCheckedChange={() => toggleCategory('profissao')}
                />
                <Label htmlFor="profissao">Agrupar por Profissão</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="etapa"
                  checked={tempConfig.enabledCategories.includes('etapa')}
                  onCheckedChange={() => toggleCategory('etapa')}
                />
                <Label htmlFor="etapa">Agrupar por Etapa do Funil</Label>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Prioridades de Profissões */}
          {tempConfig.enabledCategories.includes('profissao') && (
            <Card className="rounded-2xl border border-border/30 bg-border/10 backdrop-blur-md shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  💼 Ordem de Prioridade - Profissões
                  <Select 
                    onValueChange={(value) => addToPriority('profissoes', value)}
                    value=""
                  >
                    <SelectTrigger className="w-48 rounded-2xl border border-border/40 bg-border/10 backdrop-blur-md">
                      <SelectValue placeholder="Adicionar profissão" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfissoes
                        .filter(p => !tempConfig.priorities.profissoes.includes(p))
                        .map(profissao => (
                          <SelectItem key={profissao} value={profissao}>
                            {profissao}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tempConfig.priorities.profissoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma profissão adicionada. Use o dropdown acima para adicionar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tempConfig.priorities.profissoes.map((profissao, index) => (
                      <div key={profissao} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span>{profissao}</span>
                        </div>
                        <div className="flex gap-1">
                          <OutlineButton
                            className="h-8 px-2 py-2 bg-white/10 border-white/30 hover:bg-white/20"
                            onClick={() => movePriorityItem('profissoes', profissao, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </OutlineButton>
                          <OutlineButton
                            className="h-8 px-2 py-2 bg-white/10 border-white/30 hover:bg-white/20"
                            onClick={() => movePriorityItem('profissoes', profissao, 'down')}
                            disabled={index === tempConfig.priorities.profissoes.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </OutlineButton>
                          <OutlineButton
                            className="h-8 px-2 py-2 bg-white/10 border-white/30 hover:bg-white/20"
                            onClick={() => removeFromPriority('profissoes', profissao)}
                          >
                            <X className="w-4 h-4" />
                          </OutlineButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Configuração de Prioridades de Etapas */}
          {tempConfig.enabledCategories.includes('etapa') && (
            <Card className="rounded-2xl border border-border/30 bg-border/10 backdrop-blur-md shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  🏷️ Ordem de Prioridade - Etapas
                  <Select 
                    onValueChange={(value) => addToPriority('etapas', value)}
                    value=""
                  >
                    <SelectTrigger className="w-48 rounded-2xl border border-border/40 bg-border/10 backdrop-blur-md">
                      <SelectValue placeholder="Adicionar etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEtapas
                        .filter(e => !tempConfig.priorities.etapas.includes(e))
                        .map(etapa => (
                          <SelectItem key={etapa} value={etapa}>
                            {etapa}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tempConfig.priorities.etapas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma etapa adicionada. Use o dropdown acima para adicionar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tempConfig.priorities.etapas.map((etapa, index) => (
                      <div key={etapa} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span>{etapa}</span>
                        </div>
                        <div className="flex gap-1">
                          <OutlineButton
                            className="h-8 px-2 py-2 bg-white/10 border-white/30 hover:bg-white/20"
                            onClick={() => movePriorityItem('etapas', etapa, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </OutlineButton>
                          <OutlineButton
                            className="h-8 px-2 py-2 bg-white/10 border-white/30 hover:bg-white/20"
                            onClick={() => movePriorityItem('etapas', etapa, 'down')}
                            disabled={index === tempConfig.priorities.etapas.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </OutlineButton>
                          <OutlineButton
                            className="h-8 px-2 py-2 bg-white/10 border-white/30 hover:bg-white/20"
                            onClick={() => removeFromPriority('etapas', etapa)}
                          >
                            <X className="w-4 h-4" />
                          </OutlineButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tempConfig.enabledCategories.length > 1 && (
            <Card className="rounded-2xl border border-amber-200 bg-amber-50/30 backdrop-blur-md">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-800">
                  <strong>Como funciona com múltiplas categorias:</strong><br />
                  Primeiro agrupa por {tempConfig.enabledCategories[0] === 'profissao' ? 'Profissão' : 'Etapa'}, 
                  depois por {tempConfig.enabledCategories[1] === 'profissao' ? 'Profissão' : 'Etapa'} dentro de cada grupo.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <OutlineButton onClick={resetConfig} className="rounded-full px-6 py-3">
            Resetar
          </OutlineButton>
          <OutlineButton onClick={() => setIsOpen(false)} className="rounded-full px-6 py-3">
            Cancelar
          </OutlineButton>
          <Button onClick={saveConfig} className="rounded-full px-6 py-3 bg-black text-white hover:bg-black/80">
            Aplicar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}