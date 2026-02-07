import React, { useState, useEffect } from 'react';
import { proxyManager, type ProxyStats } from '../services/proxyManager';
import { Activity, AlertCircle, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';

const getHealthColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400';
  if (score >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getHealthBgColor = (score: number): string => {
  if (score >= 0.8) return 'bg-green-50 dark:bg-green-900';
  if (score >= 0.5) return 'bg-yellow-50 dark:bg-yellow-900';
  return 'bg-red-50 dark:bg-red-900';
};

const getHealthBorderColor = (score: number): string => {
  if (score >= 0.8) return 'border-green-200 dark:border-green-700';
  if (score >= 0.5) return 'border-yellow-200 dark:border-yellow-700';
  return 'border-red-200 dark:border-red-700';
};

const getHealthIcon = (score: number) => {
  if (score >= 0.8) return <CheckCircle className="w-4 h-4" />;
  if (score >= 0.5) return <AlertCircle className="w-4 h-4" />;
  return <AlertCircle className="w-4 h-4" />;
};

const formatTime = (timestamp: number | undefined, currentTime: number): string => {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((currentTime - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const ProxyHealthSummary: React.FC = () => {
  const [proxyStats, setProxyStats] = useState<Map<string, ProxyStats>>(new Map());
  const [enabledMap, setEnabledMap] = useState<Map<string, boolean>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const refresh = () => {
      const stats = proxyManager.getProxyStats();
      setProxyStats(new Map(Object.entries(stats)));
      const configs = proxyManager.getProxyConfigs();
      const map = new Map<string, boolean>();
      configs.forEach(c => map.set(c.name, c.enabled));
      setEnabledMap(map);
      const now = Date.now();
      setLastUpdate(now);
      setCurrentTime(now);
    };

    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  const sortedStats = Array.from(proxyStats.entries()).sort(([, a], [, b]) => b.healthScore - a.healthScore);

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Proxy Network Health</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Real-time performance monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Updated {formatTime(lastUpdate, currentTime)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Overall Health</p>
              <p className={`text-2xl font-bold mt-1 ${getHealthColor(sortedStats.reduce((acc, [, s]) => acc + s.healthScore, 0) / Math.max(1, sortedStats.length))}`}>{Math.round((sortedStats.reduce((acc, [, s]) => acc + s.healthScore, 0) / Math.max(1, sortedStats.length)) * 100)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Success Rate</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{(() => {
                let totalRequests = 0, totalSuccess = 0;
                proxyStats.forEach(s => { totalRequests += s.totalRequests; totalSuccess += s.success; });
                return totalRequests ? `${Math.round((totalSuccess / totalRequests) * 100)}%` : '—';
              })()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Requests</p>
              <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{Array.from(proxyStats.values()).reduce((s, v) => s + v.totalRequests, 0).toLocaleString()}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">Proxy Performance</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedStats.map(([proxyName, stats]) => {
            const successRate = stats.totalRequests ? Math.round((stats.success / stats.totalRequests) * 100) : 0;
            const healthPercent = Math.round(stats.healthScore * 100);
            const enabled = enabledMap.get(proxyName) ?? true;

            return (
              <div key={proxyName} className={`${getHealthBgColor(stats.healthScore)} border ${getHealthBorderColor(stats.healthScore)} rounded-lg p-4 transition-all hover:shadow-md relative`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 font-semibold text-sm ${getHealthColor(stats.healthScore)}`}>
                        {getHealthIcon(stats.healthScore)} {proxyName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded font-mono">{healthPercent}%</span>
                    <button
                      onClick={() => {
                        if (enabled) proxyManager.disableProxy(proxyName);
                        else proxyManager.enableProxy(proxyName);
                        const stats = proxyManager.getProxyStats();
                        setProxyStats(new Map(Object.entries(stats)));
                        const configs = proxyManager.getProxyConfigs();
                        const map = new Map<string, boolean>();
                        configs.forEach(c => map.set(c.name, c.enabled));
                        setEnabledMap(map);
                      }}
                      className={`px-2 py-1 text-xs rounded ${enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                      {enabled ? 'Ativo' : 'Desativado'}
                    </button>
                  </div>
                </div>

                <div className="mb-3 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${healthPercent >= 80 ? 'bg-emerald-500' : healthPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${healthPercent}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-700 bg-opacity-50 rounded p-2">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Success Rate</p>
                    <p className="font-semibold mt-0.5">{successRate}%</p>
                    <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">{stats.success}/{stats.totalRequests}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 bg-opacity-50 rounded p-2">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Avg Response</p>
                    <p className="font-semibold mt-0.5">{stats.avgResponseTime.toFixed(0)}ms</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 bg-opacity-50 rounded p-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Last Used</span>
                    </div>
                    <p className="font-semibold mt-0.5">{formatTime(stats.lastUsed, currentTime)}</p>
                  </div>
                  <div className={`${stats.consecutiveFailures > 2 ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700' : 'bg-white dark:bg-slate-700 bg-opacity-50'} rounded p-2`}>
                    <p className={`${stats.consecutiveFailures > 2 ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'} font-medium`}>Failures</p>
                    <p className={`font-semibold mt-0.5 ${stats.consecutiveFailures > 2 ? 'text-red-700 dark:text-red-300' : ''}`}>{stats.consecutiveFailures}</p>
                  </div>
                </div>

                {stats.consecutiveFailures > 2 && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">⚠️ {proxyName} has {stats.consecutiveFailures} consecutive failures</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">💡 Stats refresh every 5 seconds. Proxy health is calculated from success rate and response times.</p>
      </div>
    </div>
  );
};

export default ProxyHealthSummary;
