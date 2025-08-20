import withTM from 'next-transpile-modules';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./locales/request.ts');

const tm = withTM(['@workspace/ui', 'monaco-editor']);

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.**.**',
            },
            {
                protocol: 'https',
                hostname: '**.**',
            },
        ],
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
        };
        return config;
    },
};

export default withNextIntl(tm(nextConfig));