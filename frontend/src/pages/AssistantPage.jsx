import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Send, Sparkles, User, Bot, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AssistantPage({ onOpenDecisionReport }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: (
        "Hello! I am **CineMind Smart Assistant**, your movie decision intelligence copilot.\n\n" +
        "I provide empirical, fact-grounded answers backed by Bayesian statistics and your personal Taste DNA. Ask me to compare films, verify rating evidence, or search with strict constraints."
      ),
      related_movie_ids: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.askAssistant(text);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: res.response,
          related_movie_ids: res.related_movie_ids || []
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I encountered an error retrieving data. Please ensure the backend server is running and try again.",
          related_movie_ids: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Compare RRR and KGF",
    "Which has better ratings between Inception and Interstellar?",
    "Is Kantara's rating reliable?",
    "Find a Malayalam mystery under 2 hours",
    "What are my top genres according to my Taste DNA?"
  ];

  // Helper to format basic markdown (bold, headers, bullets)
  const formatAssistantText = (raw) => {
    return raw.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-white mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        const content = line.replace('- ', '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300">
            {renderBoldText(content)}
          </li>
        );
      }
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
        return (
          <div key={idx} className="font-medium text-slate-200 mt-2">
            {renderBoldText(line)}
          </div>
        );
      }
      return <p key={idx} className="text-slate-300 leading-relaxed mb-1">{renderBoldText(line)}</p>;
    });
  };

  const renderBoldText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-indigo-300 italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center space-x-3 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">CineMind Movie Assistant</h1>
          <p className="text-xs text-slate-400">
            Ask for movie recommendations, comparisons, or ratings across regional cinema.
          </p>
        </div>
      </div>

      {/* Chat messages viewport */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 min-h-[500px] flex flex-col justify-between">
        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${
                m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                    : 'bg-slate-950 border border-slate-800 rounded-tl-none shadow-md'
                }`}
              >
                {m.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <div>
                    {formatAssistantText(m.text)}

                    {/* Action buttons if movies are mentioned */}
                    {m.related_movie_ids?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                        {m.related_movie_ids.map(id => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => onOpenDecisionReport(id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-300 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg transition flex items-center space-x-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Open Movie #{id} Report</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 pl-2">Grounded in database facts...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sample Decision Queries:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {samplePrompts.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 text-[11px] text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition text-left"
              >
                "{prompt}"
              </button>
            ))}
          </div>

          {/* Input text box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl focus-within:border-indigo-500 transition shadow-inner"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about movies, Bayesian ratings, comparisons, or your Taste DNA..."
              className="w-full px-4 py-3 text-xs sm:text-sm bg-transparent text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="mr-2 p-2.5 text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/30 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
