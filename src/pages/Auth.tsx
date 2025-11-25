import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LiquidGlassInput from "@/components/ui/liquid-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { TypewriterEffect } from "@/components/TypewriterEffect";
import { sanitizeErrorMessage } from "@/lib/security";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          navigate("/");
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Conta já existe",
            description: "Este email já está cadastrado. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: sanitizeErrorMessage(error.message),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no login",
            description: sanitizeErrorMessage(error.message),
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const messages = [
    "Transforme conversas em contratos",
    "Agilidade na rotina. Resultado na ponta.",
    "Você focado em pessoas, a gente no resto"
  ];

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left Panel - Gradient with Typewriter */}
      <div className="bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 p-8 lg:p-12 flex flex-col justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-16">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 flex items-center justify-center border border-white/30">
              <span className="text-2xl font-bold text-white">F</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Flow Chat CRM</h1>
          </div>
          
          {/* Typewriter Effect */}
          <div className="mb-8">
            <TypewriterEffect 
              messages={messages}
              speed={80}
              deleteSpeed={40}
              pauseTime={3000}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Black Auth Form */}
      <div className="flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-sm">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-blue-600 rounded-xl mb-4 flex items-center justify-center mx-auto">
              <span className="text-xl font-bold text-white">F</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Login</h2>
            <p className="text-gray-400">
              Entre na sua conta ou cadastre-se para continuar
            </p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-900 border-gray-700">
              <TabsTrigger value="login" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-0">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <LiquidGlassInput
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Senha</Label>
                  <LiquidGlassInput
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-white text-black hover:bg-gray-100 font-medium" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                  <LiquidGlassInput
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">Senha</Label>
                  <LiquidGlassInput
                    id="signup-password"
                    type="password"
                    placeholder="Crie uma senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-white text-black hover:bg-gray-100 font-medium" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}