import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getModelSchema } from '@/lib/model-schemas';
import { Settings, X } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

type AdvancedVideoParamsPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  data: any;
  modelId: string;
};

export const AdvancedVideoParamsPopup = ({ isOpen, onClose, nodeId, data, modelId }: AdvancedVideoParamsPopupProps) => {
  const { updateNodeData } = useReactFlow();
  const schema = getModelSchema(modelId);

  if (!schema) {
    return null;
  }

  // Campos avançados = todos, exceto os que ficam na frente
  const advancedFields = schema.fields.filter((f) => !['aspect_ratio', 'numOutputs', 'dimensions', 'fixed_size'].includes(f.name));

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Popup central, mesmo estilo do nó de imagem */}
      <div className="fixed top-1/2 left-1/2 w-80 bg-background border border-border rounded-lg shadow-lg z-[9999] max-h-[60vh] overflow-y-auto transform -translate-x-1/2 -translate-y-1/2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-muted-foreground" />
            <h3 className="font-medium text-sm text-foreground">Parâmetros Avançados</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X size={14} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {advancedFields.map((field) => (
            <div key={field.name} className="space-y-2">
              {field.type === 'select' && (
                <>
                  <Label>{field.label}</Label>
                  <Select
                    value={String(data[field.name] ?? field.defaultValue)}
                    onValueChange={(value) => updateNodeData(nodeId, { [field.name]: value })}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {field.type === 'input' && (
                <>
                  <Label>{field.label}</Label>
                  <Input
                    type="text"
                    value={String(data[field.name] ?? field.defaultValue ?? '')}
                    onChange={(e) => updateNodeData(nodeId, { [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                </>
              )}
              {field.type === 'number' && (
                <>
                  <Label>{field.label}</Label>
                  <Input
                    type="number"
                    value={String(data[field.name] ?? field.defaultValue ?? '')}
                    min={field.min as number | undefined}
                    max={field.max as number | undefined}
                    step={field.step as number | undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      const num = v === '' ? '' : Number(v);
                      updateNodeData(nodeId, { [field.name]: num });
                    }}
                    placeholder={field.placeholder}
                  />
                </>
              )}
              {field.type === 'checkbox' && (
                <div className="flex items-center gap-2">
                  <input
                    id={`adv-${nodeId}-${field.name}`}
                    type="checkbox"
                    checked={Boolean(data[field.name] ?? field.defaultValue)}
                    onChange={(e) => updateNodeData(nodeId, { [field.name]: e.target.checked })}
                  />
                  <Label htmlFor={`adv-${nodeId}-${field.name}`}>{field.label}</Label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};


