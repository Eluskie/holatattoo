'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface DebugInfo {
  extractedData: any;
  status: string;
  currentStep: number;
  conversationId: string;
  messageCount: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  messages: string[];
  expectedOutcome: any;
}

export default function BotTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [runningTemplate, setRunningTemplate] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [evalStartTime, setEvalStartTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/bot-test/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    setLoading(true);
    
    // Add user message to UI
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const res = await fetch('/api/bot-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          reset: false
        })
      });

      const data = await res.json();

      if (data.success) {
        // Add bot messages to UI
        data.messages.forEach((msg: string) => {
          const botMessage: Message = {
            role: 'bot',
            content: msg,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        });

        setConversationId(data.conversationId);
        setDebugInfo(data.debug);
      } else {
        const errorMsg = `Error: ${data.error}\n\nType: ${data.type || 'Unknown'}\n\nDetails:\n${data.details || 'No details'}`;
        console.error('API Error:', data);
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`Error sending message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = async () => {
    if (!confirm('Reset conversation? This will close the current conversation.')) return;

    try {
      const res = await fetch('/api/bot-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true })
      });

      const data = await res.json();
      if (data.success) {
        setMessages([]);
        setConversationId(null);
        setDebugInfo(null);
        setEvaluationMode(false);
        setEvalStartTime(null);
      }
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  const runTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || runningTemplate) return;

    // Reset first
    await resetConversation();

    setRunningTemplate(true);
    setEvaluationMode(true);
    setEvalStartTime(Date.now());

    // Run messages sequentially with delay
    for (const msg of template.messages) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between messages
      await sendMessage(msg);
    }

    setRunningTemplate(false);
  };

  const saveEvaluation = async () => {
    if (!evaluationMode || !selectedTemplate || !debugInfo) {
      alert('No evaluation to save. Run a template first.');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const duration = evalStartTime ? Date.now() - evalStartTime : 0;
    const userMessages = messages.filter(m => m.role === 'user');
    const botMessages = messages.filter(m => m.role === 'bot');

    const evaluation = {
      templateId: template.id,
      templateName: template.name,
      configName: 'Pep', // You could make this dynamic
      results: {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        finalData: debugInfo.extractedData,
        status: debugInfo.status,
        messageCount: debugInfo.messageCount,
        qualified: debugInfo.status === 'qualified',
        toolsUsed: [] // Would need to track this
      },
      metrics: {
        duration,
        userMessages: userMessages.length,
        botMessages: botMessages.length,
        toolCalls: 0 // Would need to track this
      }
    };

    try {
      const res = await fetch('/api/bot-test/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation)
      });

      const data = await res.json();
      if (data.evaluation) {
        alert('✅ Evaluation saved!');
        setEvaluationMode(false);
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Error saving evaluation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🤖 Bot Test Chat</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDebug(!showDebug)}
              variant="outline"
              size="sm"
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </Button>
            <Button
              onClick={resetConversation}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              🔄 Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col" style={{ height: '70vh' }}>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Test Chat with Minca Studio</p>
                    <p className="text-xs text-gray-500">
                      Status: {debugInfo?.status || 'Not started'} | 
                      Step: {debugInfo?.currentStep || 0}
                    </p>
                  </div>
                  {evaluationMode && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      📊 Evaluation Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 mt-10">
                    <p className="text-lg mb-2">👋</p>
                    <p>Start a conversation or run a template</p>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading || runningTemplate}
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={loading || runningTemplate || !input.trim()}
                    size="sm"
                  >
                    {loading ? '...' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Templates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-sm mb-3">📝 Test Templates</h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded p-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="text-xs font-medium">{template.name}</p>
                        <p className="text-xs text-gray-500">{template.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {template.messages.length} messages
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          runTemplate(template.id);
                        }}
                        disabled={runningTemplate || loading}
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                      >
                        ▶️ Run
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {evaluationMode && (
                <Button
                  onClick={saveEvaluation}
                  className="w-full mt-3"
                  size="sm"
                >
                  💾 Save Evaluation
                </Button>
              )}
            </div>

            {/* Debug Info */}
            {showDebug && debugInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-sm mb-3">🔍 Debug Info</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-gray-500">Extracted Data:</p>
                    <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto text-xs">
                      {JSON.stringify(debugInfo.extractedData, null, 2)}
                    </pre>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-gray-500">Conversation ID:</p>
                    <p className="font-mono text-xs break-all">{debugInfo.conversationId}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-gray-500">Total Messages:</p>
                    <p>{debugInfo.messageCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

