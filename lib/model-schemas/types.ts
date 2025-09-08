// Types para os schemas de modelos
export interface ModelField {
  name: string;
  type: 'input' | 'select' | 'checkbox' | 'number' | 'hidden';
  label?: string;
  placeholder?: string;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  gridColumn?: number;
}

export interface ModelSchema {
  fields: ModelField[];
}