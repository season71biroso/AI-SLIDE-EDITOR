import React, { useState } from 'react';
import { Key, Save, CheckCircle2, AlertCircle, X, Wifi } from 'lucide-react';
import { saveApiKey } from '../utils/keyStorage';
import { testApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialKey = '' }) => {
  const [key, setKey] = useState(initialKey);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!key.trim()) {
      setErrorMsg("Please enter an API Key");
      setStatus('error');
      return;
    }
    
    setStatus('testing');
    setErrorMsg('');
    
    const isValid = await testApiKey(key);
    
    if (isValid) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg("Connection failed. Please check your key.");
    }
  };

  const handleSave = () => {
    if (status !== 'success') {
      // Allow saving without testing, but warn? No, let's force a test or just save.
      // Better UX: Save immediately if user wants, but recommended to test.
      // We will just save.
    }
    saveApiKey(key);
    onSave(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-slate-800">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg">API Key Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            This application requires a Google Gemini API Key. Your key will be 
            <strong> encrypted and stored locally</strong> in your browser.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gemini API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setStatus('idle');
                setErrorMsg('');
              }}
              placeholder="AIzaSy..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
            />
          </div>

          {/* Status Messages */}
          {status === 'testing' && (
            <div className="text-sm text-blue-600 flex items-center">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Testing connection...
            </div>
          )}
          {status === 'success' && (
            <div className="text-sm text-green-600 flex items-center font-medium">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Connection Successful!
            </div>
          )}
          {status === 'error' && (
             <div className="text-sm text-red-600 flex items-center font-medium">
              <AlertCircle className="w-4 h-4 mr-2" />
              {errorMsg}
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
            Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline font-bold hover:text-blue-900">Get one here</a>.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={handleTestConnection}
            className="text-slate-600 hover:text-blue-600 text-sm font-medium flex items-center px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Test Connection
          </button>

          <button
            onClick={handleSave}
            disabled={!key}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};