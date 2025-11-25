import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  validatePhoneNumber, 
  validateEmail, 
  validateObservations, 
  validateLeadName,
  globalRateLimiter 
} from "@/lib/validation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ProfissaoCombobox } from "@/components/ui/profissao-combobox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import LiquidGlassInput from "@/components/ui/liquid-input";
import LiquidGlassTextarea from "@/components/ui/liquid-textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome não pode exceder 100 caracteres")
    .refine((val) => validateLeadName(val).isValid, "Nome contém caracteres inválidos"),
  recomendantes: z.array(z.object({
    nome: z.string()
      .min(1, "Nome do recomendante é obrigatório")
      .max(100, "Nome não pode exceder 100 caracteres")
      .refine((val) => validateLeadName(val).isValid, "Nome contém caracteres inválidos")
  })).optional(),
  telefone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(15, "Telefone não pode exceder 15 dígitos")
    .refine((val) => validatePhoneNumber(val).isValid, "Formato de telefone inválido"),
  celular_secundario: z.string()
    .optional()
    .refine((val) => !val || validatePhoneNumber(val).isValid, "Formato de telefone inválido"),
  email: z.string()
    .optional()
    .refine((val) => !val || val === "" || validateEmail(val), "Email inválido"),
  idade: z.string().optional(),
  profissao: z.string().max(100, "Profissão não pode exceder 100 caracteres").optional(),
  renda_estimada: z.string().optional(),
  casado: z.enum(["true", "false"]),
  tem_filhos: z.enum(["true", "false"]),
  quantidade_filhos: z.string().optional(),
  cidade: z.string().max(100, "Cidade não pode exceder 100 caracteres").optional(),
  observacoes: z.string()
    .optional()
    .refine((val) => !val || validateObservations(val).isValid, "Observações muito longas ou contêm conteúdo inválido"),
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

    // Rate limiting check
    if (!globalRateLimiter.canSubmit(user.id)) {
      toast({
        title: "Muitas tentativas",
        description: "Aguarde alguns minutos antes de tentar novamente",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Record the submission attempt
    globalRateLimiter.recordSubmission(user.id);

    try {
      // Sanitize input data before database insertion
      const phoneValidation = validatePhoneNumber(data.telefone);
      const observationsValidation = validateObservations(data.observacoes || '');
      const nameValidation = validateLeadName(data.nome);

      if (!phoneValidation.isValid || !observationsValidation.isValid || !nameValidation.isValid) {
        throw new Error("Dados de entrada inválidos após validação");
      }

      const leadData = {
        nome: nameValidation.sanitized,
        recomendante: data.recomendantes && data.recomendantes.length > 0 
          ? data.recomendantes.map(r => validateLeadName(r.nome).sanitized) 
          : null,
        telefone: phoneValidation.sanitized,
        celular_secundario: data.celular_secundario ? validatePhoneNumber(data.celular_secundario).sanitized : null,
        email: data.email || null,
        idade: data.idade ? parseInt(data.idade) : null,
        profissao: data.profissao || null,
        renda_estimada: data.renda_estimada || null,
        casado: data.casado === "true",
        tem_filhos: data.tem_filhos === "true",
        quantidade_filhos: data.tem_filhos === "true" && data.quantidade_filhos ? parseInt(data.quantidade_filhos) : null,
        cidade: data.cidade || null,
        observacoes: observationsValidation.sanitized || null,
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
      <div className="space-y-3 sm:space-y-4">
        <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-2xl transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div>
              <h3 className="text-2xl font-inter font-normal leading-none tracking-tighter">Dados do Lead</h3>
              <p className="text-sm text-muted-foreground">Preencha os dados do lead</p>
            </div>
            <button type="submit" form="nova-rec-form" disabled={isLoading} className="bg-black text-white rounded-full p-3 sm:p-4 hover:bg-black/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2"/>
              </svg>
            </button>
          </div>
          <div className="p-6 pt-0">
            <Form {...form}>
              <form id="nova-rec-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                {/* Dados Pessoais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Nome *</FormLabel>
                          <FormControl>
                            <LiquidGlassInput 
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
                                    <LiquidGlassInput 
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
                        <button
                          type="button"
                          className="inline-flex items-center justify-center bg-black text-white rounded-xl h-9 sm:h-10 px-4 text-sm font-light hover:bg-black/80 transition-colors mt-0 shadow-sm"
                          onClick={() => append({ nome: "" })}
                        >
                          Adicionar Recomendante
                        </button>
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
                            <LiquidGlassInput 
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
                            <LiquidGlassInput 
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
                            <LiquidGlassInput 
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
                            <LiquidGlassInput 
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
                            <ProfissaoCombobox
                              value={field.value}
                              onValueChange={field.onChange}
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
                            <LiquidGlassInput 
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
                            <LiquidGlassInput 
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
                          {form.watch("tem_filhos") === "true" && (
                            <FormField
                              control={form.control}
                              name="quantidade_filhos"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Quantos filhos?</FormLabel>
                                  <FormControl>
                                    <LiquidGlassInput
                                      type="number"
                                      min="1"
                                      max="20"
                                      placeholder="Ex: 2"
                                      {...field}
                                      className="w-24 sm:w-28 h-9 sm:h-10"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />


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
                        <LiquidGlassTextarea
                          placeholder="Observações adicionais sobre o lead..."
                          className="min-h-[80px] sm:min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botões removidos: ação no topo à direita */}
              </form>
            </Form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}