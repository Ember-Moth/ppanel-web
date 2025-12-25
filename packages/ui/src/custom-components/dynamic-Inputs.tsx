'use client';

import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import { Combobox } from '@workspace/ui/custom-components/combobox';
import { EnhancedInput, EnhancedInputProps } from '@workspace/ui/custom-components/enhanced-input';
import { cn } from '@workspace/ui/lib/utils';
import { CircleMinusIcon, CirclePlusIcon, XIcon } from 'lucide-react';
import { useEffect, useState, KeyboardEvent } from 'react';

// 1. 正确定义 FieldConfig 类型，确保包含 'tags'
interface FieldConfig extends Omit<EnhancedInputProps, 'type'> {
  name: string;
  type: 'text' | 'number' | 'select' | 'time' | 'boolean' | 'textarea' | 'tags';
  options?: { label: string; value: string }[];
  visible?: (item: Record<string, any>) => boolean;
}

interface ObjectInputProps<T> {
  value: T;
  onChange: (value: T) => void;
  fields: FieldConfig[];
  className?: string;
}

export function ObjectInput<T extends Record<string, any>>({
  value,
  onChange,
  fields,
  className,
}: ObjectInputProps<T>) {
  const [internalState, setInternalState] = useState<T>(value);

  useEffect(() => {
    setInternalState(value);
  }, [value]);

  const updateField = (key: string, fieldValue: any) => {
    const updatedInternalState = { ...internalState, [key]: fieldValue };
    setInternalState(updatedInternalState);
    onChange(updatedInternalState as T);
  };

  const renderField = (field: FieldConfig) => {
    if (field.visible && !field.visible(internalState)) return null;

    switch (field.type) {
      case 'select':
        return (
          field.options && (
            <Combobox<string, false>
              placeholder={field.placeholder}
              options={field.options}
              value={internalState[field.name]}
              onChange={(fieldValue) => updateField(field.name, fieldValue)}
            />
          )
        );
      case 'boolean':
        return (
          <div className='flex h-full items-center space-x-2'>
            <Switch
              checked={!!internalState[field.name]}
              onCheckedChange={(fieldValue) => updateField(field.name, fieldValue)}
            />
            {field.placeholder && <Label>{field.placeholder}</Label>}
          </div>
        );
      case 'textarea':
        return (
          <div className='w-full space-y-2'>
            {field.prefix && <Label className='text-sm font-medium'>{field.prefix}</Label>}
            <Textarea
              value={internalState[field.name] || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className='min-h-32'
            />
          </div>
        );
      case 'tags':
        const tags = Array.isArray(internalState[field.name]) 
          ? (internalState[field.name] as string[]) 
          : [];

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault(); 
            const input = e.currentTarget;
            const val = input.value.trim();
            if (val && !tags.includes(val)) {
              updateField(field.name, [...tags, val]);
              input.value = '';
            }
          }
        };

        const removeTag = (tagToRemove: string) => {
          updateField(field.name, tags.filter(t => t !== tagToRemove));
        };

        return (
          <div className='w-full space-y-2'>
            {field.prefix && <Label className='text-sm font-medium'>{field.prefix}</Label>}
            <div className={cn(
              'flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring min-h-10 transition-all',
              field.className
            )}>
              {tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className='inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded border border-primary/20'
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive transition-colors"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}
              <input
                className='flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground'
                placeholder={field.placeholder || "Enter to add..."}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        );
      default:
        // 排除掉 EnhancedInput 不识别的属性
        const { options, visible, ...restField } = field;
        return (
          <EnhancedInput
            value={internalState[field.name] ?? ''}
            onValueChange={(fieldValue) => updateField(field.name, fieldValue)}
            {...(restField as any)}
          />
        );
    }
  };

  return (
    <div className={cn('flex flex-1 flex-wrap gap-4', className)}>
      {fields.map((field) => {
        const node = renderField(field);
        if (node === null) return null;
        return (
          <div key={field.name} className={cn('flex-1', field.className)}>
            {node}
          </div>
        );
      })}
    </div>
  );
}

interface ArrayInputProps<T> {
  value?: T[];
  onChange: (value: T[]) => void;
  fields: FieldConfig[];
  isReverse?: boolean;
  className?: string;
}

export function ArrayInput<T extends Record<string, any>>({
  value = [],
  onChange,
  fields,
  isReverse = false,
  className,
}: ArrayInputProps<T>) {
  const initializeDefaultItem = (): T =>
    fields.reduce((acc, field) => {
      // 关键修复：如果是 tags 类型，初始化为空数组，避免渲染崩溃
      acc[field.name as keyof T] = (field.type === 'tags' ? [] : (field.type === 'boolean' ? false : '')) as any;
      return acc;
    }, {} as T);

  const [displayItems, setDisplayItems] = useState<T[]>(() => {
    return value && value.length > 0 ? value : [initializeDefaultItem()];
  });

  const isItemModified = (item: T): boolean =>
    fields.some((field) => {
      const val = item[field.name];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && val !== '';
    });

  const handleItemChange = (index: number, updatedItem: T) => {
    const newDisplayItems = [...displayItems];
    newDisplayItems[index] = updatedItem;
    setDisplayItems(newDisplayItems);
    onChange(newDisplayItems.filter(isItemModified));
  };

  const createField = () => {
    if (isReverse) {
      setDisplayItems([initializeDefaultItem(), ...displayItems]);
    } else {
      setDisplayItems([...displayItems, initializeDefaultItem()]);
    }
  };

  const deleteField = (index: number) => {
    const newDisplayItems = displayItems.filter((_, i) => i !== index);
    const finalItems = newDisplayItems.length > 0 ? newDisplayItems : [initializeDefaultItem()];
    setDisplayItems(finalItems);
    onChange(finalItems.filter(isItemModified));
  };

  useEffect(() => {
    if (value && value.length > 0) {
      setDisplayItems(value);
    }
  }, [value]);

  return (
    <div className='flex flex-col gap-4'>
      {displayItems.map((item, index) => (
        <div key={index} className='flex items-center gap-4'>
          <ObjectInput
            value={item}
            onChange={(updatedItem) => handleItemChange(index, updatedItem)}
            fields={fields}
            className={className}
          />
          <div className='flex min-w-20 items-center'>
            {displayItems.length > 1 && (
              <Button
                variant='ghost'
                size='icon'
                type='button'
                className='text-destructive p-0 text-lg'
                onClick={() => deleteField(index)}
              >
                <CircleMinusIcon />
              </Button>
            )}
            {(isReverse ? index === 0 : index === displayItems.length - 1) && (
              <Button
                variant='ghost'
                size='icon'
                type='button'
                className='text-primary p-0 text-lg'
                onClick={createField}
              >
                <CirclePlusIcon />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
