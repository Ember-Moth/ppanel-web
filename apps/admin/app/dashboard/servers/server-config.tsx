'use client';

import { getNodeConfig, updateNodeConfig } from '@/services/admin/system';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Textarea } from '@workspace/ui/components/textarea';
import { ArrayInput } from '@workspace/ui/custom-components/dynamic-Inputs';
import { EnhancedInput } from '@workspace/ui/custom-components/enhanced-input';
import { Icon } from '@workspace/ui/custom-components/icon';
import { unitConversion } from '@workspace/ui/utils';
import { DicesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { uid } from 'radash';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { SS_CIPHERS } from './form-schema';

// --- Zod Schema: 必须与后端 int64 数组匹配 ---
const dnsConfigSchema = z.object({
  proto: z.string(),
  address: z.string(),
  domains: z.array(z.string()),
  node_ids: z.array(z.number()).optional(), 
});

const outboundConfigSchema = z.object({
  name: z.string(),
  protocol: z.string(),
  address: z.string(),
  port: z.number(),
  cipher: z.string().optional(),
  password: z.string().optional(),
  rules: z.array(z.string()).optional(),
  node_ids: z.array(z.number()).optional(), 
});

const nodeConfigSchema = z.object({
  node_secret: z.string().optional(),
  node_pull_interval: z.number().optional(),
  node_push_interval: z.number().optional(),
  traffic_report_threshold: z.number().optional(),
  ip_strategy: z.enum(['prefer_ipv4', 'prefer_ipv6']).optional(),
  dns: z.array(dnsConfigSchema).optional(),
  block: z.array(z.string()).optional(),
  outbound: z.array(outboundConfigSchema).optional(),
});

type NodeConfigFormData = z.infer<typeof nodeConfigSchema>;

export default function ServerConfig() {
  const t = useTranslations('servers');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: cfgResp, refetch: refetchCfg } = useQuery({
    queryKey: ['getNodeConfig'],
    queryFn: async () => {
      const { data } = await getNodeConfig();
      return data.data as API.NodeConfig | undefined;
    },
    enabled: open,
  });

  const form = useForm<NodeConfigFormData>({
    resolver: zodResolver(nodeConfigSchema),
    defaultValues: {
      node_secret: '',
      node_pull_interval: undefined,
      node_push_interval: undefined,
      traffic_report_threshold: undefined,
      ip_strategy: 'prefer_ipv4',
      dns: [],
      block: [],
      outbound: [],
    },
  });

  useEffect(() => {
    if (cfgResp) {
      form.reset({
        node_secret: cfgResp.node_secret ?? '',
        node_pull_interval: cfgResp.node_pull_interval as number | undefined,
        node_push_interval: cfgResp.node_push_interval as number | undefined,
        traffic_report_threshold: cfgResp.traffic_report_threshold as number | undefined,
        ip_strategy: (cfgResp.ip_strategy as 'prefer_ipv4' | 'prefer_ipv6' | undefined) || 'prefer_ipv4',
        dns: cfgResp.dns || [],
        block: cfgResp.block || [],
        outbound: cfgResp.outbound || [],
      });
    }
  }, [cfgResp, form]);

  async function onSubmit(values: NodeConfigFormData) {
    setSaving(true);
    try {
      // 这里的 values.dns[i].node_ids 现在是 [1] 而非 ["1"]
      await updateNodeConfig(values as API.NodeConfig);
      toast.success(t('server_config.saveSuccess'));
      await refetchCfg();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Card onClick={() => setOpen(true)} className="cursor-pointer">
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                <Icon icon='mdi:resistor-nodes' className='text-primary h-5 w-5' />
              </div>
              <div className='flex-1'>
                <p className='font-medium'>{t('server_config.title')}</p>
                <p className='text-muted-foreground truncate text-sm'>
                  {t('server_config.description')}
                </p>
              </div>
            </div>
            <Icon icon='mdi:chevron-right' className='size-6' />
          </div>
        </CardContent>
      </Card>

      <SheetContent className='w-[720px] max-w-full md:max-w-screen-md'>
        <SheetHeader>
          <SheetTitle>{t('server_config.title')}</SheetTitle>
        </SheetHeader>

        <ScrollArea className='-mx-6 h-[calc(100dvh-120px)] px-6'>
          <Tabs defaultValue='basic' className='pt-4'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='basic'>{t('server_config.tabs.basic')}</TabsTrigger>
              <TabsTrigger value='dns'>{t('server_config.tabs.dns')}</TabsTrigger>
              <TabsTrigger value='outbound'>{t('server_config.tabs.outbound')}</TabsTrigger>
              <TabsTrigger value='block'>{t('server_config.tabs.block')}</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form id='server-config-form' onSubmit={form.handleSubmit(onSubmit)} className='mt-4'>
                <TabsContent value='basic' className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='node_secret'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('server_config.fields.communication_key')}</FormLabel>
                        <FormControl>
                          <EnhancedInput
                            placeholder={t('server_config.fields.communication_key_placeholder')}
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            suffix={
                              <div className='bg-muted flex h-9 items-center px-3'>
                                <DicesIcon
                                  onClick={() => {
                                    const id = uid(32).toLowerCase();
                                    const formatted = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
                                    form.setValue('node_secret', formatted);
                                  }}
                                  className='cursor-pointer'
                                />
                              </div>
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name='node_pull_interval'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('server_config.fields.node_pull_interval')}</FormLabel>
                          <FormControl>
                            <EnhancedInput type='number' suffix='S' value={field.value as any} onValueChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='node_push_interval'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('server_config.fields.node_push_interval')}</FormLabel>
                          <FormControl>
                            <EnhancedInput type='number' step={0.1} suffix='S' value={field.value as any} onValueChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value='dns' className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='dns'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ArrayInput
                            fields={[
                              { name: 'proto', type: 'select', options: [{ label: 'UDP', value: 'udp' }, { label: 'TCP', value: 'tcp' }, { label: 'TLS', value: 'tls' }, { label: 'HTTPS', value: 'https' }] },
                              { name: 'address', type: 'text', placeholder: '8.8.8.8:53' },
                              { name: 'domains', type: 'textarea', className: 'col-span-2', placeholder: 'Domains (One per line)' },
                              { name: 'node_ids', type: 'tags', className: 'col-span-2', placeholder: 'Node ID' },
                            ]}
                            value={(field.value || []).map((item) => ({
                              ...item,
                              domains: Array.isArray(item.domains) ? item.domains.join('\n') : '',
                              // 数字转字符串回显
                              node_ids: Array.isArray(item.node_ids) ? item.node_ids.map(String) : [],
                            }))}
                            onChange={(values) => {
                              const converted = values.map((item: any) => ({
                                proto: item.proto,
                                address: item.address,
                                domains: typeof item.domains === 'string' ? item.domains.split('\n').filter(Boolean) : [],
                                // 关键：字符串转数字 int64
                                node_ids: Array.isArray(item.node_ids) ? item.node_ids.map(Number).filter(v => !isNaN(v)) : [],
                              }));
                              field.onChange(converted);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value='outbound' className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='outbound'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ArrayInput
                            fields={[
                              { name: 'name', type: 'text', className: 'col-span-2' },
                              { name: 'protocol', type: 'select', options: [{ label: 'Shadowsocks', value: 'shadowsocks' }, { label: 'VLESS', value: 'vless' }, { label: 'Trojan', value: 'trojan' }, { label: 'Direct', value: 'direct' }] },
                              { name: 'address', type: 'text' },
                              { name: 'port', type: 'number' },
                              { name: 'password', type: 'text' },
                              { name: 'rules', type: 'textarea', className: 'col-span-2' },
                              { name: 'node_ids', type: 'tags', className: 'col-span-2', placeholder: 'Node ID' },
                            ]}
                            value={(field.value || []).map((item) => ({
                              ...item,
                              rules: Array.isArray(item.rules) ? item.rules.join('\n') : '',
                              node_ids: Array.isArray(item.node_ids) ? item.node_ids.map(String) : [],
                            }))}
                            onChange={(values) => {
                              const converted = values.map((item: any) => ({
                                ...item,
                                port: Number(item.port),
                                rules: typeof item.rules === 'string' ? item.rules.split('\n').filter(Boolean) : [],
                                node_ids: Array.isArray(item.node_ids) ? item.node_ids.map(Number).filter(v => !isNaN(v)) : [],
                              }));
                              field.onChange(converted);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </ScrollArea>

        <SheetFooter className="mt-4">
          <Button disabled={saving} type='submit' form='server-config-form' className="w-full">
            {saving && <Icon icon='mdi:loading' className='mr-2 animate-spin' />}
            {t('actions.save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
