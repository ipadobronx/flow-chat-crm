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
import CheckedSwitch from "@/components/ui/checked-switch";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

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
  casado: z.boolean(),
  tem_filhos: z.boolean(),
  quantidade_filhos: z.string().optional(),
  cidade: z.string().max(100, "Cidade não pode exceder 100 caracteres").optional(),
  observacoes: z.string()
    .optional()
    .refine((val) => !val || validateObservations(val).isValid, "Observações muito longas ou contêm conteúdo inválido"),
  avisado: z.boolean(),
  incluir_sitplan: z.boolean(),
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
      casado: false,
      tem_filhos: false,
      quantidade_filhos: "",
      cidade: "",
      observacoes: "",
      avisado: false,
      incluir_sitplan: false,
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
        casado: data.casado,
        tem_filhos: data.tem_filhos,
        quantidade_filhos: data.tem_filhos && data.quantidade_filhos ? parseInt(data.quantidade_filhos) : null,
        cidade: data.cidade || null,
        observacoes: observationsValidation.sanitized || null,
        avisado: data.avisado,
        incluir_sitplan: data.incluir_sitplan,
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-inter font-normal tracking-tighter">Nova Recomendação</h2>
            <p className="text-sm text-muted-foreground">Cadastre um novo lead no sistema</p>
          </div>
          <button 
            type="submit" 
            form="nova-rec-form" 
            disabled={isLoading}
            className="bg-black text-white rounded-full p-3 sm:p-4 hover:bg-black/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <Form {...form}>
          <form id="nova-rec-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Layout em 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Coluna 1 */}
              <div className="space-y-4">
                {/* Card: Dados Principais */}
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 p-4 sm:p-6 space-y-4">
                  <h3 className="text-xl font-inter font-normal tracking-tighter">Dados Principais</h3>
                  
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm">Nome *</Label>
                        <FormControl>
                          <LiquidGlassInput 
                            variant="light"
                            placeholder="Nome completo" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label className="text-sm mb-2 block">Recomendantes</Label>
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
                                    variant="light"
                                    placeholder="Nome do recomendante" 
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
                            className="h-10 px-3 rounded-xl"
                            onClick={() => remove(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 bg-black text-white rounded-xl h-9 px-4 text-sm font-light hover:bg-black/80 transition-colors shadow-sm"
                        onClick={() => append({ nome: "" })}
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card: Informações Pessoais */}
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 p-4 sm:p-6 space-y-4">
                  <h3 className="text-xl font-inter font-normal tracking-tighter">Informações Pessoais</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idade"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-sm">Idade</Label>
                          <FormControl>
                            <LiquidGlassInput 
                              variant="light"
                              placeholder="30" 
                              type="number" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-sm">Cidade</Label>
                          <FormControl>
                            <LiquidGlassInput 
                              variant="light"
                              placeholder="São Paulo - SP" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="profissao"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm">Profissão</Label>
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

                  <FormField
                    control={form.control}
                    name="renda_estimada"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm">Renda Estimada</Label>
                        <FormControl>
                          <LiquidGlassInput 
                            variant="light"
                            placeholder="R$ 5.000,00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-4">
                {/* Card: Contato */}
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 p-4 sm:p-6 space-y-4">
                  <h3 className="text-xl font-inter font-normal tracking-tighter">Informações de Contato</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-sm">Celular Principal *</Label>
                          <FormControl>
                            <LiquidGlassInput 
                              variant="light"
                              placeholder="(11) 99999-9999" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="celular_secundario"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-sm">Celular Secundário</Label>
                          <FormControl>
                            <LiquidGlassInput 
                              variant="light"
                              placeholder="(11) 99999-9999" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm">Email</Label>
                        <FormControl>
                          <LiquidGlassInput 
                            variant="light"
                            placeholder="email@exemplo.com" 
                            type="email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Card: Configurações (Switches) */}
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 p-4 sm:p-6 space-y-2">
                  <h3 className="text-xl font-inter font-normal tracking-tighter mb-4">Configurações</h3>
                  
                  <FormField
                    control={form.control}
                    name="casado"
                    render={({ field }) => (
                      <div className="flex items-center justify-between py-3 border-b border-border/30">
                        <span className="text-sm">Casado(a)</span>
                        <CheckedSwitch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tem_filhos"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-3 border-b border-border/30">
                          <span className="text-sm">Tem Filhos</span>
                          <CheckedSwitch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                        
                        {/* Campo condicional: Quantidade de Filhos */}
                        {field.value && (
                          <FormField
                            control={form.control}
                            name="quantidade_filhos"
                            render={({ field: qtyField }) => (
                              <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-xl">
                                <span className="text-sm">Quantos filhos?</span>
                                <LiquidGlassInput 
                                  variant="light"
                                  type="number"
                                  min="1"
                                  max="20"
                                  placeholder="Ex: 2"
                                  className="max-w-[100px]"
                                  {...qtyField}
                                />
                              </div>
                            )}
                          />
                        )}
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="avisado"
                    render={({ field }) => (
                      <div className="flex items-center justify-between py-3 border-b border-border/30">
                        <span className="text-sm">Avisado</span>
                        <CheckedSwitch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incluir_sitplan"
                    render={({ field }) => (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm">Incluir no SitPlan</span>
                        <CheckedSwitch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>

                {/* Card: Observações */}
                <div className="rounded-2xl border border-border/30 dark:border-white/20 bg-border/10 dark:bg-white/10 backdrop-blur-md text-card-foreground shadow-xl transition-all duration-300 p-4 sm:p-6 space-y-4">
                  <h3 className="text-xl font-inter font-normal tracking-tighter">Observações</h3>
                  
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <LiquidGlassTextarea
                            placeholder="Observações adicionais sobre o lead..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
