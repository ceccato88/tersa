import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getModelSchema } from '@/lib/model-schemas';
import { X, Settings } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useState, useEffect } from 'react';
import type { ImageNodeProps } from '.';

interface AdvancedParamsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  data: ImageNodeProps['data'];
  modelId: string;
}

export const AdvancedParamsPopup = ({
  isOpen,
  onClose,
  nodeId,
  data,
  modelId,
}: AdvancedParamsPopupProps) => {
  const { updateNodeData } = useReactFlow();
  
  // Estado local para inputs em edição
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  
  // Estado para controlar se já fez limpeza inicial
  const [hasCleanedUp, setHasCleanedUp] = useState(false);

  // Limpeza de campos antigos (executar apenas uma vez quando abrir)
  useEffect(() => {
    if (!isOpen || hasCleanedUp) return;

    // Reset campos antigos do Recraft V3 text-to-image
    if (modelId === 'fal-ai/recraft-v3') {
      let needsUpdate = false;
      const updates: Record<string, any> = {};

      // Remover style_id se existir (campo antigo)
      if (data.style_id !== undefined) {
        console.log('🧹 Removendo campo style_id obsoleto do Recraft V3');
        updates.style_id = undefined;
        needsUpdate = true;
      }
      
      // Remover colors antigo se existir
      if (data.colors !== undefined) {
        console.log('🧹 Removendo campo colors obsoleto do Recraft V3');
        updates.colors = undefined;
        needsUpdate = true;
      }
      
      // Reset colors_type para 'none' se valor inválido
      if (data.colors_type === 'custom' && !data.colors_r) {
        console.log('🔄 Forçando reset colors_type para none devido a valor inválido');
        updates.colors_type = 'none';
        needsUpdate = true;
      }

      if (needsUpdate) {
        updateNodeData(nodeId, updates);
      }
    }

    // Reset para Ideogram V3
    if (modelId === 'fal-ai/ideogram-v3' && data.color_palette_type === 'custom' && !data.color_r) {
      console.log('🔄 Forçando reset para none devido a valor inválido');
      updateNodeData(nodeId, { color_palette_type: 'none' });
    }

    setHasCleanedUp(true);
  }, [isOpen, hasCleanedUp, modelId, data, nodeId, updateNodeData]);

  // Reset hasCleanedUp quando fechar o popup
  useEffect(() => {
    if (!isOpen) {
      setHasCleanedUp(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modelSchema = getModelSchema(modelId);
  
  // Debug para identificar qual modelo está sendo usado
  console.log('🔍 Advanced Params Debug:', {
    modelId,
    modelLabel: modelSchema?.label,
    fieldsCount: modelSchema?.fields?.length,
    fieldNames: modelSchema?.fields?.map(f => f.name)
  });
  
  // Filtrar apenas campos avançados (excluir básicos que aparecem no nó e campos hidden)
  const basicFields = ['prompt', 'image_size', 'quantity', 'numOutputs', 'num_images'];
  const advancedFields = modelSchema?.fields?.filter(field => {
    // Excluir campos básicos e hidden
    if (basicFields.includes(field.name) || field.type === 'hidden') {
      return false;
    }
    
    // Verificar campos condicionais
    if (field.conditional) {
      const conditionFieldValue = data[field.conditional.field];
      return conditionFieldValue === field.conditional.value;
    }
    
    return true;
  }) || [];

  const handleFieldChange = (fieldName: string, value: any) => {
    console.log('🔧 Advanced Param Change:', {
      nodeId,
      fieldName,
      value,
      type: typeof value,
      modelId
    });
    updateNodeData(nodeId, { [fieldName]: value });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 w-80 bg-background border border-border rounded-lg shadow-lg z-[9999] max-h-[60vh] overflow-y-auto transform -translate-x-1/2 -translate-y-1/2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-muted-foreground" />
            <h3 className="font-medium text-sm text-foreground">Parâmetros Avançados</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X size={14} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {advancedFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum parâmetro avançado disponível para este modelo.
            </p>
          ) : (
            advancedFields.map((field) => {
              const rawValue = data[field.name];
              const fieldValue = rawValue !== undefined && rawValue !== null ? rawValue : field.defaultValue;
              const localValue = localValues[field.name];
              const displayValue = localValue !== undefined ? localValue : (fieldValue === null || fieldValue === undefined ? '' : String(fieldValue));
              
              // Debug para color_palette_type
              if (field.name === 'color_palette_type') {
                console.log('🎨 Color Palette Type Debug:', {
                  fieldName: field.name,
                  rawValue,
                  defaultValue: field.defaultValue,
                  fieldValue,
                  displayValue,
                  modelId
                });
              }

              return (
                <div key={field.name} className="space-y-2">
                  {field.type !== 'checkbox' && (
                    <Label className="text-xs font-medium">{field.label}</Label>
                  )}
                  
                  {field.type === 'input' && (
                    <Input
                      type="text"
                      placeholder={field.placeholder}
                      value={displayValue}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setLocalValues(prev => ({
                          ...prev,
                          [field.name]: inputValue
                        }));
                      }}
                      onBlur={(e) => {
                        const inputValue = e.target.value;
                        handleFieldChange(field.name, inputValue);
                        setLocalValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[field.name];
                          return newValues;
                        });
                      }}
                      className="h-8 text-xs"
                    />
                  )}
                  
                  {field.type === 'number' && (
                    <Input
                      type="text"
                      placeholder={field.placeholder}
                      value={displayValue}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        console.log('🔢 Number Input Change:', {
                          fieldName: field.name,
                          inputValue,
                          displayValue
                        });
                        
                        // Atualizar valor local imediatamente
                        setLocalValues(prev => ({
                          ...prev,
                          [field.name]: inputValue
                        }));
                      }}
                      onBlur={(e) => {
                        const inputValue = e.target.value;
                        console.log('🔢 Number Input Blur:', {
                          fieldName: field.name,
                          inputValue
                        });
                        
                        // Salvar o valor final quando perder o foco
                        if (inputValue === '') {
                          handleFieldChange(field.name, null);
                        } else if (inputValue.match(/^-?\d*\.?\d*$/) && inputValue !== '.') {
                          const value = Number(inputValue);
                          if (!isNaN(value)) {
                            // Aplicar limites se definidos
                            let finalValue = value;
                            if (field.min !== undefined && value < field.min) {
                              finalValue = field.min;
                            }
                            if (field.max !== undefined && value > field.max) {
                              finalValue = field.max;
                            }
                            handleFieldChange(field.name, finalValue);
                          }
                        }
                        
                        // Limpar valor local após salvar
                        setLocalValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[field.name];
                          return newValues;
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur(); // Força o onBlur
                        }
                        // Desabilitar setas completamente
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => {
                        // Desabilitar scroll wheel
                        e.preventDefault();
                      }}
                      step={field.step || 1}
                      min={field.min}
                      max={field.max}
                      className="h-8 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ MozAppearance: 'textfield' }}
                    />
                  )}
                  
                  {field.type === 'select' && (
                    <Select
                      value={String(fieldValue)}
                      onValueChange={(value) => {
                        const parsedValue = isNaN(Number(value)) ? value : Number(value);
                        handleFieldChange(field.name, parsedValue);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === 'checkbox' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${nodeId}-${field.name}`}
                        checked={fieldValue || false}
                        onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`${nodeId}-${field.name}`} className="text-xs">
                        {field.label}
                      </Label>
                    </div>
                  )}
                  
                  {field.type === 'textarea' && (
                    <Textarea
                      placeholder={field.placeholder}
                      value={displayValue}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setLocalValues(prev => ({
                          ...prev,
                          [field.name]: inputValue
                        }));
                      }}
                      onBlur={(e) => {
                        const inputValue = e.target.value;
                        handleFieldChange(field.name, inputValue);
                        setLocalValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[field.name];
                          return newValues;
                        });
                      }}
                      className="text-xs min-h-[60px] resize-y"
                      rows={3}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};