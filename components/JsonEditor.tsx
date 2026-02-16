import React from 'react';
import { SlideAnalysis } from '../types';
import { Plus, Trash2, AlignLeft, Image as ImageIcon, Type, ChevronUp, ChevronDown } from 'lucide-react';

interface JsonEditorProps {
  data: SlideAnalysis | null;
  onChange: (newData: SlideAnalysis) => void;
  disabled?: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ data, onChange, disabled }) => {
  
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg p-8">
        <p>Select a slide to analyze...</p>
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, title: e.target.value });
  };

  const handleVisualDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...data, visual_description: e.target.value });
  };

  const handleKeyDataChange = (index: number, value: string) => {
    const newKeyData = [...data.key_data];
    newKeyData[index] = value;
    onChange({ ...data, key_data: newKeyData });
  };

  const removeKeyDataItem = (index: number) => {
    const newKeyData = data.key_data.filter((_, i) => i !== index);
    onChange({ ...data, key_data: newKeyData });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newKeyData = [...data.key_data];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newKeyData.length) return;

    [newKeyData[index], newKeyData[targetIndex]] = [newKeyData[targetIndex], newKeyData[index]];
    onChange({ ...data, key_data: newKeyData });
  };

  const addKeyDataItem = () => {
    onChange({ ...data, key_data: [...data.key_data, "New Item"] });
  };

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">
      
      {/* Title Section */}
      <div className="space-y-2">
        <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
          <Type className="w-3.5 h-3.5 mr-2" />
          Title
        </label>
        <input
          type="text"
          value={data.title}
          onChange={handleTitleChange}
          disabled={disabled}
          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          placeholder="Slide Title"
        />
      </div>

      {/* Key Data Section (List) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            <AlignLeft className="w-3.5 h-3.5 mr-2" />
            Key Data
          </label>
          <button
            onClick={addKeyDataItem}
            disabled={disabled}
            className="flex items-center text-xs text-blue-600 font-bold hover:text-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </button>
        </div>
        
        <div className="space-y-2">
          {data.key_data.map((item, index) => (
            <div key={index} className="flex items-center space-x-1 group animate-in fade-in slide-in-from-left-2">
              {/* Order Controls */}
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => moveItem(index, 'up')}
                  disabled={disabled || index === 0}
                  className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-20"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => moveItem(index, 'down')}
                  disabled={disabled || index === data.key_data.length - 1}
                  className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-20"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <input
                type="text"
                value={item}
                onChange={(e) => handleKeyDataChange(index, e.target.value)}
                disabled={disabled}
                className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              />
              
              <button
                onClick={() => removeKeyDataItem(index)}
                disabled={disabled}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {data.key_data.length === 0 && (
            <div className="text-sm text-slate-400 italic p-4 border border-slate-100 rounded-lg bg-slate-50/50 text-center">
              No key data points. Click "Add" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Visual Description Section */}
      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
          <ImageIcon className="w-3.5 h-3.5 mr-2" />
          Visual Elements
        </label>
        <textarea
          value={data.visual_description}
          onChange={handleVisualDescriptionChange}
          disabled={disabled}
          className="w-full flex-1 p-3 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none min-h-[120px]"
          placeholder="Description of visual style..."
        />
      </div>

    </div>
  );
};