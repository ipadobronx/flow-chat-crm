import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  recomendante: z.string().optional(),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  celular_secundario: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  idade: z.string().optional(),
  profissao: z.string().optional(),
  renda_estimada: z.string().optional(),
  casado: z.enum(["true", "false"]),
  tem_filhos: z.enum(["true", "false"]),
  cidade: z.string().optional(),
  observacoes: z.string().optional(),
  avisado: z.enum(["true", "false"]),
  incluir_sitplan: z.enum(["true", "false"]),
});

type FormData = z.infer<typeof formSchema>;

export default function NovaRec() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      recomendante: "",
      telefone: "",
      celular_secundario: "",
      email: "",
      idade: "",
      profissao: "",
      renda_estimada: "",
      casado: "false",
      tem_filhos: "false",
      cidade: "",
      observacoes: "",
      avisado: "false",
      incluir_sitplan: "false",
    },
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
        recomendante: data.recomendante || null,
        telefone: data.telefone,
        celular_secundario: data.celular_secundario || null,
        email: data.email || null,
        idade: data.idade ? parseInt(data.idade) : null,
        profissao: data.profissao || null,
        renda_estimada: data.renda_estimada || null,
        casado: data.casado === "true",
        tem_filhos: data.tem_filhos === "true",
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
        description: "Lead cadastrado com sucesso",
      });

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Recomendação</h1>
          <p className="text-muted-foreground">
            Cadastre um novo lead no sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recomendante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recomendante</FormLabel>
                        <FormControl>
                          <Input placeholder="Quem recomendou" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular Principal *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
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
                        <FormLabel>Celular Secundário</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade</FormLabel>
                        <FormControl>
                          <Input placeholder="30" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input placeholder="Profissão" {...field} />
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
                        <FormLabel>Renda Estimada</FormLabel>
                        <FormControl>
                          <Input placeholder="R$ 5.000,00" {...field} />
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
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="São Paulo - SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="casado"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Casado(a)</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="casado-sim" />
                              <Label htmlFor="casado-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="casado-nao" />
                              <Label htmlFor="casado-nao">Não</Label>
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
                        <FormLabel>Tem Filhos</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="filhos-sim" />
                              <Label htmlFor="filhos-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="filhos-nao" />
                              <Label htmlFor="filhos-nao">Não</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="avisado"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Avisado</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="avisado-sim" />
                              <Label htmlFor="avisado-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="avisado-nao" />
                              <Label htmlFor="avisado-nao">Não</Label>
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
                        <FormLabel>Incluir no Próximo SitPlan</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="sitplan-sim" />
                              <Label htmlFor="sitplan-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="sitplan-nao" />
                              <Label htmlFor="sitplan-nao">Não</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais sobre o lead..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Cadastrar Lead
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isLoading}
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