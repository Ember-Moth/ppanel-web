'use client';

import { getNodeConfig, updateNodeConfig } from '@/services/admin/system';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
  Form,
  FormControl,
  FormDescription,
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
  SheetTrigger,
} from '@workspace/ui/components/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Textarea } from '@workspace/ui/components/textarea';
import { ArrayInput } from '@workspace/ui/custom-components/dynamic-Inputs';
import { EnhancedInput } from '@workspace/ui/custom-components/enhanced-input';
import { Icon } from '@workspace/ui/custom-components/icon';
import TagInput from '@workspace/ui/custom-components/tag-input'; // 引入 TagInput 组件
import { unitConversion } from '@workspace/ui/utils';
import { DicesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { uid } from 'radash';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { SS_CIPHERS } from './form-schema';

// --- Zod Schema 定义 ---
const dnsConfigSchema = z.object({
  proto: z.string(),
  address: z.string(),
  domains: z.array(z.string()),
  node_ids: z.array(z.string()).optional(),
});

const outboundConfigSchema = z.object({
  name: z.string(),
  protocol: z.string(),
  address: z.string(),
  port: z.number(),
  cipher: z.string().optional(),
  password: z.string().optional(),
  rules: z.array(z.string()).optional(),
  node_ids: z.array(z.string()).optional(),
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

  // 获取配置数据
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

  // 数据回显逻辑
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
      <SheetTrigger asChild>
        <Card>
          <CardContent className='p-4'>
            <div className='flex cursor-pointer items-center justify-between'>
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
      </SheetTrigger>

      <SheetContent className='w-[720px] max-w-full md:max-w-screen-md'>
        <SheetHeader>
          <SheetTitle>{t('server_config.title')}</SheetTitle>
        </SheetHeader>

        <ScrollArea className='-mx-6 h-[calc(100dvh-48px-36px-36px-env(safe-area-inset-top))] px-6'>
          <Tabs defaultValue='basic' className='pt-4'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='basic'>{t('server_config.tabs.basic')}</TabsTrigger>
              <TabsTrigger value='dns'>{t('server_config.tabs.dns')}</TabsTrigger>
              <TabsTrigger value='outbound'>{t('server_config.tabs.outbound')}</TabsTrigger>
              <TabsTrigger value='block'>{t('server_config.tabs.block')}</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form id='server-config-form' onSubmit={form.handleSubmit(onSubmit)} className='mt-4'>
                
                {/* 1. 基础配置 */}
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
                  {/* ... 其他基础字段 (node_pull_interval, node_push_interval, traffic_report_threshold) 保持原有逻辑 ... */}
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
                  <FormField
                    control={form.control}
                    name='traffic_report_threshold'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('server_config.fields.traffic_report_threshold')}</FormLabel>
                        <FormControl>
                          <EnhancedInput
                            type='number'
                            suffix='MB'
                            value={unitConversion('bitsToMb', field.value as number | undefined)}
                            onValueChange={(v) => field.onChange(unitConversion('mbToBits', v))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* 2. DNS 配置 (使用 TagInput) */}
                <TabsContent value='dns' className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='ip_strategy'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('server_config.fields.ip_strategy')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value='prefer_ipv4'>{t('server_config.fields.ip_strategy_ipv4')}</SelectItem>
                            <SelectItem value='prefer_ipv6'>{t('server_config.fields.ip_strategy_ipv6')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='dns'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('server_config.fields.dns_config')}</FormLabel>
                        <FormControl>
                          <ArrayInput
                            className='grid grid-cols-2 gap-2'
                            fields={[
                              {
                                name: 'proto',
                                type: 'select',
                                options: [
                                  { label: 'TCP', value: 'tcp' },
                                  { label: 'UDP', value: 'udp' },
                                  { label: 'TLS', value: 'tls' },
                                  { label: 'HTTPS', value: 'https' },
                                  { label: 'QUIC', value: 'quic' },
                                ],
                              },
                              { name: 'address', type: 'text', placeholder: '8.8.8.8:53' },
                              {
                                name: 'domains',
                                type: 'textarea',
                                className: 'col-span-2',
                                placeholder: t('server_config.fields.dns_domains_placeholder'),
                              },
                              {
                                name: 'node_ids',
                                className: 'col-span-2',
                                render: (itemProps: any) => (
                                  <TagInput
                                    placeholder={t('server_config.fields.node_ids_placeholder')}
                                    value={itemProps.value || []}
                                    onChange={itemProps.onChange}
                                  />
                                ),
                              },
                            ]}
                            value={(field.value || []).map((item) => ({
                              ...item,
                              domains: Array.isArray(item.domains) ? item.domains.join('\n') : '',
                              node_ids: item.node_ids || [], // 直接传递数组
                            }))}
                            onChange={(values) => {
                              const converted = values.map((item: any) => ({
                                proto: item.proto,
                                address: item.address,
                                domains: typeof item.domains === 'string'
                                  ? item.domains.split('\n').map((d: string) => d.trim()).filter(Boolean)
                                  : item.domains || [],
                                node_ids: item.node_ids || [], // 保持数组格式
                              }));
                              field.onChange(converted);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* 3. 出站配置 (使用 TagInput) */}
                <TabsContent value='outbound' className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='outbound'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ArrayInput
                            className='grid grid-cols-2 gap-2'
                            fields={[
                              { name: 'name', type: 'text', className: 'col-span-2' },
                              {
                                name: 'protocol',
                                type: 'select',
                                options: [
                                  { label: 'HTTP', value: 'http' },
                                  { label: 'SOCKS', value: 'socks' },
                                  { label: 'Shadowsocks', value: 'shadowsocks' },
                                  { label: 'VMess', value: 'vmess' },
                                  { label: 'VLESS', value: 'vless' },
                                  { label: 'Trojan', value: 'trojan' },
                                  { label: 'Direct', value: 'direct' },
                                  { label: 'Reject', value: 'reject' },
                                ],
                              },
                              {
                                name: 'cipher',
                                type: 'select',
                                options: SS_CIPHERS.map((c) => ({ label: c, value: c })),
                                visible: (item: any) => item.protocol === 'shadowsocks',
                              },
                              { name: 'address', type: 'text' },
                              { name: 'port', type: 'number' },
                              { name: 'password', type: 'text' },
                              { name: 'rules', type: 'textarea', className: 'col-span-2' },
                              {
                                name: 'node_ids',
                                className: 'col-span-2',
                                render: (itemProps: any) => (
                                  <TagInput
                                    placeholder={t('server_config.fields.node_ids_placeholder')}
                                    value={itemProps.value || []}
                                    onChange={itemProps.onChange}
                                  />
                                ),
                              },
                            ]}
                            value={(field.value || []).map((item) => ({
                              ...item,
                              rules: Array.isArray(item.rules) ? item.rules.join('\n') : '',
                              node_ids: item.node_ids || [],
                            }))}
                            onChange={(values) => {
                              const converted = values.map((item: any) => ({
                                ...item,
                                rules: typeof item.rules === 'string'
                                  ? item.rules.split('\n').map((r: string) => r.trim()).filter(Boolean)
                                  : item.rules || [],
                                node_ids: item.node_ids || [],
                              }));
                              field.onChange(converted);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* 4. 阻断规则 */}
                <TabsContent value='block' className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='block'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={t('server_config.fields.block_rules_placeholder')}
                            value={(field.value || []).join('\n')}
                            onChange={(e) => field.onChange(e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))}
                            rows={10}
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

        <SheetFooter className='flex-row justify-end gap-2 pt-3'>
          <Button variant='outline' disabled={saving} onClick={() => setOpen(false)}>
            {t('actions.cancel')}
          </Button>
          <Button disabled={saving} type='submit' form='server-config-form'>
            <Icon icon='mdi:loading' className={saving ? 'mr-2 animate-spin' : 'hidden'} />
            {t('actions.save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
