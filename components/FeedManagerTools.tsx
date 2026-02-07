import React, { useState, useEffect } from 'react';
import { ProxyManager } from '../services/proxyManager';
import { Check, X, Copy, Loader, Key, Shield } from 'lucide-react';
import { HealthReportExporter } from './HealthReportExporter';

interface ApiKeyStatus {
    isSet: boolean;
    isValid: boolean;
    isChecking: boolean;
    remaining?: number;
    error?: string;
}

export const FeedManagerTools: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({
        isSet: false,
        isValid: false,
        isChecking: false,
    });
    const [preferLocalProxy, setPreferLocalProxy] = useState(
        ProxyManager.getPreferLocalProxy()
    );
    const [copied, setCopied] = useState(false);
    const isDev = import.meta.env.DEV;

    // Load initial values
    useEffect(() => {
        const savedKey = ProxyManager.getRss2jsonApiKey();
        if (savedKey) {
            setApiKey('');
            setApiKeyStatus((prev) => ({
                ...prev,
                isSet: true,
            }));
        }
    }, []);

    const validateApiKey = async (key: string) => {
        if (!key.trim()) {
            setApiKeyStatus({
                isSet: false,
                isValid: false,
                isChecking: false,
            });
            return;
        }

        setApiKeyStatus((prev) => ({ ...prev, isChecking: true }));

        try {
            // Test the API key with a simple feed
            const testUrl = 'https://feeds.arstechnica.com/arstechnica/index.rss';
            const encodedUrl = encodeURIComponent(testUrl);
            const apiUrl = `https://api.rss2json.com/v1/api.json?api_key=${encodeURIComponent(key)}&rss_url=${encodedUrl}`;

            console.log('[RSS2JSON Validation] Testing API key against:', testUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(8000),
                headers: {
                    'Accept': 'application/json',
                }
            });

            console.log('[RSS2JSON Validation] Response status:', response.status);

            const contentType = response.headers.get('content-type') || '';
            let data: Record<string, unknown>;

            if (contentType.includes('application/json')) {
                data = (await response.json()) as Record<string, unknown>;
                console.log('[RSS2JSON Validation] Response data:', data);
            } else {
                const text = await response.text();
                console.log('[RSS2JSON Validation] Unexpected content type:', contentType, 'Body:', text.substring(0, 200));
                throw new Error(`Unexpected response format: ${contentType}`);
            }

            // Check for API errors
            if (!response.ok || data.status === 'error') {
                const errorMsg =
                    (typeof data.message === 'string' ? data.message : undefined) ||
                    (typeof data.error === 'string' ? data.error : undefined) ||
                    `HTTP ${response.status}`;
                console.error('[RSS2JSON Validation] API returned error:', errorMsg);
                setApiKeyStatus({
                    isSet: true,
                    isValid: false,
                    isChecking: false,
                    error: errorMsg,
                });
                return;
            }

            // Check if response looks valid
            if (!data.items && !data.feed) {
                console.warn('[RSS2JSON Validation] Response missing expected fields');
            }

            // Successfully validated
            const remaining = data.remaining_requests || '(unknown)';
            console.log('[RSS2JSON Validation] API key valid! Remaining requests:', remaining);

            setApiKeyStatus({
                isSet: true,
                isValid: true,
                isChecking: false,
                remaining: typeof remaining === 'number' ? remaining : undefined,
            });

            // Save the key
            ProxyManager.setRss2jsonApiKey(key);
            setApiKey('');
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Connection failed';
            console.error('[RSS2JSON Validation] Validation failed:', errorMessage);

            setApiKeyStatus({
                isSet: true,
                isValid: false,
                isChecking: false,
                error: errorMessage,
            });
        }
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
    };

    const handleValidateKey = () => {
        validateApiKey(apiKey);
    };

    const handleRemoveKey = () => {
        ProxyManager.setRss2jsonApiKey('');
        setApiKey('');
        setApiKeyStatus({
            isSet: false,
            isValid: false,
            isChecking: false,
        });
    };

    const handleLocalProxyToggle = (checked: boolean) => {
        setPreferLocalProxy(checked);
        ProxyManager.setPreferLocalProxy(checked);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(ProxyManager.getRss2jsonApiKey());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* API Key Management Section */}
            <div className="space-y-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        RSS2JSON API Management
                    </h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get a free API key from{' '}
                    <a
                        href="https://rss2json.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        rss2json.com
                    </a>
                    {' '}to unlock higher rate limits (up to 10,000 requests/day)
                </p>

                {apiKeyStatus.isSet && apiKeyStatus.isValid ? (
                    // API Key is valid
                    <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                    ✅ API Key Valid
                                </p>
                                {apiKeyStatus.remaining !== undefined && (
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                        {apiKeyStatus.remaining} requests remaining today
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-lg transition-colors"
                                title="Copy API Key"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <Copy className="w-4 h-4 text-slate-500" />
                                )}
                            </button>
                            <button
                                onClick={handleRemoveKey}
                                className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-lg transition-colors"
                                title="Remove API Key"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                    </div>
                ) : apiKeyStatus.isSet && !apiKeyStatus.isValid ? (
                    // API Key is invalid
                    <div className="flex items-start justify-between bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <div className="flex gap-3 flex-1">
                            <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                                    ❌ Invalid API Key
                                </p>
                                {apiKeyStatus.error && (
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                        {apiKeyStatus.error}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveKey}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors flex-shrink-0"
                            title="Remove API Key"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                ) : null}

                {/* API Key Input */}
                <div className="flex gap-2">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={handleKeyChange}
                        placeholder="Paste your RSS2JSON API key..."
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleValidateKey}
                        disabled={!apiKey.trim() || apiKeyStatus.isChecking}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        {apiKeyStatus.isChecking && (
                            <Loader className="w-4 h-4 animate-spin" />
                        )}
                        {apiKeyStatus.isChecking ? 'Validating...' : 'Validate'}
                    </button>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <p className="text-xs text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <Shield className="w-4 h-4 flex-shrink-0" />
                        <span>API key is stored securely in your browser's localStorage and never sent to external servers.</span>
                    </p>
                </div>
            </div>

            {/* Local Proxy Toggle - Dev Only */}
            {isDev && (
                <div className="space-y-4 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700 shadow-sm">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        Development Options
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                Prefer Local Proxy
                            </p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                Use local development proxy (faster, dev-only)
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferLocalProxy}
                            onChange={(e) => handleLocalProxyToggle(e.target.checked)}
                            className="w-5 h-5 cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>
            )}

            {/* Health Report Exporter */}
            <HealthReportExporter />
        </div>
    );
};
