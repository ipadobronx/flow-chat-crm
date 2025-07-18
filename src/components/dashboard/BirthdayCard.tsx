import { useState, useEffect } from "react";
import { MessageSquare, Phone, Cake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Aniversariante {
  id: string;
  nome: string;
  data_nascimento: string;
  telefone?: string;
  idade?: number;
}

export function BirthdayCard() {
  const { user } = useAuth();
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);

  useEffect(() => {
    if (user) {
      fetchAniversariantes();
    }
  }, [user]);

  const fetchAniversariantes = async () => {
    if (!user) return;

    try {
      // Usar função otimizada do banco
      const { data, error } = await supabase
        .rpc('get_birthday_leads', {
          p_user_id: user.id,
          p_data: new Date().toISOString().split('T')[0] // formato YYYY-MM-DD
        });

      if (error) throw error;

      setAniversariantes(data || []);
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error);
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (aniversariantes.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <Cake className="w-4 h-4" />
          Aniversariantes do Dia
        </CardTitle>
        <CardDescription className="text-yellow-700">
          Lembre-se de parabenizar seus contatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {aniversariantes.map((aniversariante) => (
            <div key={aniversariante.id} className="flex items-center justify-between p-3 rounded-lg bg-white/80 border border-yellow-200">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8 border-2 border-yellow-300">
                  <AvatarFallback className="bg-yellow-100 text-yellow-800">
                    {getInitials(aniversariante.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-yellow-900">{aniversariante.nome}</p>
                  <p className="text-xs text-yellow-700">
                    🎂 Aniversário hoje! {aniversariante.idade && `(${aniversariante.idade} anos)`}
                  </p>
                </div>
              </div>
              {aniversariante.telefone && (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const phoneNumber = aniversariante.telefone?.replace(/\D/g, '');
                      window.open(`https://wa.me/55${phoneNumber}?text=🎉 Parabéns pelo seu aniversário! 🎂`, '_blank');
                    }}
                    className="p-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => window.open(`tel:${aniversariante.telefone}`, '_self')}
                    className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}