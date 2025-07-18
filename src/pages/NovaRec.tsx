import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, X } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  recomendantes: z.array(z.object({
    nome: z.string().min(1, "Nome do recomendante é obrigatório")
  })).optional(),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  celular_secundario: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  idade: z.string().optional(),
  profissao: z.string().optional(),
  renda_estimada: z.string().optional(),
  casado: z.enum(["true", "false"]),
  tem_filhos: z.enum(["true", "false"]),
  quantidade_filhos: z.string().optional(),
  cidade: z.string().optional(),
  observacoes: z.string().optional(),
  avisado: z.enum(["true", "false"]),
  incluir_sitplan: z.enum(["true", "false"]),
});

type FormData = z.infer<typeof formSchema>;

export default function NovaRec() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      recomendantes: [],
      telefone: "",
      celular_secundario: "",
      email: "",
      idade: "",
      profissao: "",
      renda_estimada: "",
      casado: "false",
      tem_filhos: "false",
      quantidade_filhos: "",
      cidade: "",
      observacoes: "",
      avisado: "false",
      incluir_sitplan: "false",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recomendantes"
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const leadData = {
        nome: data.nome,
        recomendante: data.recomendantes && data.recomendantes.length > 0 
          ? data.recomendantes.map(r => r.nome) 
          : null,
        telefone: data.telefone,
        celular_secundario: data.celular_secundario || null,
        email: data.email || null,
        idade: data.idade ? parseInt(data.idade) : null,
        profissao: data.profissao || null,
        renda_estimada: data.renda_estimada || null,
        casado: data.casado === "true",
        tem_filhos: data.tem_filhos === "true",
        quantidade_filhos: data.tem_filhos === "true" && data.quantidade_filhos ? parseInt(data.quantidade_filhos) : null,
        cidade: data.cidade || null,
        observacoes: data.observacoes || null,
        avisado: data.avisado === "true",
        incluir_sitplan: data.incluir_sitplan === "true",
        user_id: user.id,
        etapa: "Novo" as const,
      };

      const { error } = await supabase
        .from("leads")
        .insert([leadData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Lead cadastrado com sucesso. Redirecionando para o pipeline...",
      });

      // Redirecionar para o pipeline após breve delay para mostrar o toast
      setTimeout(() => {
        navigate("/dashboard/pipeline");
      }, 1500);

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar lead:", error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar lead. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nova Recomendação</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Cadastre um novo lead no sistema
          </p>
        </div>

        <Card className="w-full max-w-none">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="text-lg sm:text-xl">Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {/* Dados Pessoais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Nome *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome completo" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <div>
                      <FormLabel className="text-sm font-medium mb-3 block">Recomendantes</FormLabel>
                      <div className="space-y-2">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex gap-2">
                            <FormField
                              control={form.control}
                              name={`recomendantes.${index}.nome`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input 
                                      placeholder="Nome do recomendante" 
                                      className="h-10 sm:h-11"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-10 sm:h-11 px-3"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => append({ nome: "" })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Recomendante
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-1 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Celular Principal *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-1 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="celular_secundario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Celular Secundário</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="email@exemplo.com" 
                              type="email" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-1 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="idade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Idade</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="30" 
                              type="number" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-1 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="profissao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Profissão</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Profissão" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-1 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="renda_estimada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Renda Estimada</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="R$ 5.000,00" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2 xl:col-span-1">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Cidade</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="São Paulo - SP" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Seção de Radio Buttons */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium text-foreground border-b pb-2">Informações Adicionais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="casado"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">Casado(a)</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="casado-sim" />
                                <Label htmlFor="casado-sim" className="text-sm">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="casado-nao" />
                                <Label htmlFor="casado-nao" className="text-sm">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tem_filhos"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">Tem Filhos</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="filhos-sim" />
                                <Label htmlFor="filhos-sim" className="text-sm">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="filhos-nao" />
                                <Label htmlFor="filhos-nao" className="text-sm">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("tem_filhos") === "true" && (
                      <FormField
                        control={form.control}
                        name="quantidade_filhos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Quantos filhos?</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                placeholder="Ex: 2"
                                {...field}
                                className="max-w-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="avisado"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">Avisado</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="avisado-sim" />
                                <Label htmlFor="avisado-sim" className="text-sm">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="avisado-nao" />
                                <Label htmlFor="avisado-nao" className="text-sm">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="incluir_sitplan"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium">Incluir no Próximo SitPlan</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="sitplan-sim" />
                                <Label htmlFor="sitplan-sim" className="text-sm">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="sitplan-nao" />
                                <Label htmlFor="sitplan-nao" className="text-sm">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Observações */}
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais sobre o lead..."
                          className="min-h-[80px] sm:min-h-[100px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base animate-fade-in"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Cadastrar Lead
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base sm:min-w-[120px]"
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}