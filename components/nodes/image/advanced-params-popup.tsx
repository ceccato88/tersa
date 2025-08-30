import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getModelSchema } from '@/lib/model-schemas';
import { X, Settings } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
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

  if (!isOpen) return null;

  const modelSchema = getModelSchema(modelId);
  
  // Filtrar apenas campos avançados (excluir básicos que aparecem no nó e campos hidden)
  const basicFields = ['prompt', 'image_size', 'quantity', 'numOutputs', 'num_images'];
  const advancedFields = modelSchema?.fields?.filter(
    field => !basicFields.includes(field.name) && field.type !== 'hidden'
  ) || [];

  const handleFieldChange = (fieldName: string, value: any) => {
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
              const fieldValue = data[field.name] ?? field.defaultValue;

              return (
                <div key={field.name} className="space-y-2">
                  <Label className="text-xs font-medium">{field.label}</Label>
                  
                  {field.type === 'input' && (
                    <Input
                      type="text"
                      placeholder={field.placeholder}
                      value={fieldValue || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="h-8 text-xs"
                    />
                  )}
                  
                  {field.type === 'number' && (
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      value={fieldValue || ''}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        // Aplicar limites se definidos
                        if (field.min !== undefined && value < field.min) return;
                        if (field.max !== undefined && value > field.max) return;
                        handleFieldChange(field.name, value);
                      }}
                      onKeyDown={(e) => {
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
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};