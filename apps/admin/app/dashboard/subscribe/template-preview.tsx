'use client';

import { previewSubscribeTemplate } from '@/services/admin/application';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/ui/components/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@workspace/ui/components/sheet';
import { Icon } from '@workspace/ui/custom-components/icon';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import loader  from '@monaco-editor/loader';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface TemplatePreviewProps {
    applicationId: number;
    output_format?: string;
}

export function TemplatePreview({ applicationId, output_format }: TemplatePreviewProps) {
    const t = useTranslations('subscribe.templatePreview');
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['previewSubscribeTemplate', applicationId],
        queryFn: () => previewSubscribeTemplate({ id: applicationId }, { skipErrorHandler: true }),
        enabled: isOpen && !!applicationId,
        retry: false,
    });

    const originalContent = data?.data?.data?.template || '';
    const errorMessage = (error as any)?.data?.msg || error?.message || t('failed');
    const displayContent = originalContent || (error ? errorMessage : '');

    const getDecodedContent = () => {
        if (output_format === 'base64' && originalContent) {
            try {
                return atob(originalContent);
            } catch {
                return t('base64.decodeError');
            }
        }
        return '';
    };

    const getEditorContent = () => {
        switch (output_format) {
            case 'base64':
                return [
                    `# ${t('base64.originalContent')}`,
                    displayContent,
                    '',
                    `# ${t('base64.decodedContent')}`,
                    getDecodedContent(),
                ].join('\n');
            case 'yaml':
            case 'json':
            case 'conf':
            case 'plain':
                return displayContent;
            default:
                return displayContent;
        }
    };

    const getLanguage = () => {
        switch (output_format) {
            case 'base64':
            case 'plain':
                return 'plaintext';
            case 'yaml':
                return 'yaml';
            case 'json':
                return 'json';
            case 'conf':
                return 'ini';
            default:
                return 'plaintext';
        }
    };

    useEffect(() => setMounted(true), []);

    // 切换主题时刷新 Monaco Editor
    useEffect(() => {
        if (!mounted) return;
        loader.init().then(monaco => {
            monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs-light');
        });
    }, [theme, mounted]);

    const handleOpenChange = (newOpen: boolean) => setIsOpen(newOpen);

    return (
        <>
            <Button variant='ghost' size='sm' onClick={() => setIsOpen(true)}>
                <Icon icon='mdi:eye' className='mr-2 h-4 w-4' />
                {t('preview')}
            </Button>
            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
                <SheetContent className='w-[800px] max-w-[90vw] md:max-w-screen-md'>
                    <SheetHeader>
                        <SheetTitle>{t('title')}</SheetTitle>
                    </SheetHeader>
                    {isLoading ? (
                        <div className='flex items-center justify-center'>
                            <Icon icon='mdi:loading' className='h-6 w-6 animate-spin' />
                            <span className='ml-2'>{t('loading')}</span>
                        </div>
                    ) : (
                        <div className='h-[90vh] w-full'>
                            <Editor
                                height="100%"
                                defaultLanguage={getLanguage()}
                                value={getEditorContent()}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 14,
                                    wordWrap: 'off',
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}