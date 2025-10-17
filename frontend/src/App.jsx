import React, { useState, useEffect } from 'react';

// URL hipotética do nosso backend Node.js
const API_URL = 'http://localhost:3001/api/mensagem';

const App = () => {
  const [mensagem, setMensagem] = useState("A carregar mensagem do backend...");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Função para simular a chamada ao backend
  useEffect(() => {
    const obterMensagem = async () => {
      setLoading(true);
      setErro(null);

      // NOTA IMPORTANTE:
      // Neste ambiente Canvas, a chamada 'fetch' para 'http://localhost:3001'
      // irá falhar devido a restrições de segurança do navegador (CORS / Mixed Content).
      //
      // No entanto, esta é a ESTRUTURA CORRETA que usaria num ambiente Node/React real.
      // Vamos simular um sucesso após um pequeno atraso para fins de demonstração.

      try {
        // Simulação de atraso de 1 segundo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulação de resposta de sucesso:
        const mockResponse = { mensagem: "Olá do backend Node.js/Express! Conexão simulada com sucesso." };
        setMensagem(mockResponse.mensagem);


        /* --- CÓDIGO REAL QUE VOCÊ USARIA FORA DESTE AMBIENTE ---
        
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Erro de rede: ${response.status}`);
        }
        const data = await response.json();
        setMensagem(data.mensagem);

        ------------------------------------------------------------- */
      } catch (e) {
        console.error("Erro real na chamada da API:", e);
        // Exibimos uma mensagem de erro útil, explicando a simulação
        setErro("Erro simulado: A chamada real para http://localhost:3001 falhou (esperado neste ambiente de execução). Veja a estrutura do backend abaixo!");
        setMensagem("Mensagem Padrão do Frontend (Falha na Ligação)");
      } finally {
        setLoading(false);
      }
    };

    obterMensagem();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-xl p-8 transition-all duration-300 hover:shadow-3xl">
        
        <header className="mb-8 border-b pb-4">
          <h1 className="text-4xl font-extrabold text-indigo-700 text-center">
            Demo React & Node.js
          </h1>
          <p className="text-gray-500 text-center mt-1">
            Frontend: React com Tailwind CSS
          </p>
        </header>

        <section className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-2">
              Estado da Ligação
            </h2>
            <p className="text-indigo-600">
              O frontend tentou comunicar com o backend Node.js na porta 3001.
            </p>
          </div>
          
          <div className="text-center">
            {loading && (
              <div className="flex items-center justify-center space-x-2 text-indigo-600">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">
                    A TENTAR LIGAR...
                </span>
              </div>
            )}

            {!loading && erro && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Atenção!</strong>
                <span className="block sm:inline ml-2">{erro}</span>
              </div>
            )}
            
            {!loading && !erro && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative transition transform hover:scale-105">
                    <h3 className="text-lg font-bold">Mensagem Recebida:</h3>
                    <p className="mt-1 text-xl font-mono break-words">{mensagem}</p>
                </div>
            )}
            
          </div>
        </section>

        <footer className="mt-8 pt-4 border-t text-sm text-gray-400 text-center">
            Código React (Frontend) por Gemini.
        </footer>
      </div>
    </div>
  );
};

export default App;
