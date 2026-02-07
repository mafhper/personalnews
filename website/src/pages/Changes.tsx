import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCommit, ChevronDown, ChevronUp, ExternalLink, Rocket } from 'lucide-react';

// GitHub commit interface
interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'in-progress' | 'planned' | 'completed';
}

const roadmapItems: RoadmapItem[] = [
  { id: 'api', title: 'API Pública', description: 'Acesso programático via REST API.', status: 'in-progress' },
  { id: 'desktop', title: 'App Desktop', description: 'Windows, Mac e Linux.', status: 'in-progress' },
  { id: 'mobile', title: 'App Mobile', description: 'iOS e Android Offline.', status: 'planned' },
  { id: 'modes', title: 'Novos Modos', description: '3D e Fluidos.', status: 'planned' },
  { id: 'perf', title: 'Performance', description: 'Otimização de Render.', status: 'in-progress' },
  { id: 'video', title: 'Exportação de Vídeo', description: 'MP4/WebM para qualquer dispositivo.', status: 'planned' },
];

const statusColors = {
  'completed': 'bg-green-500',
  'in-progress': 'bg-yellow-500',
  'planned': 'bg-zinc-600',
};

export default function Changes() {
  const { t } = useTranslation();
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [showAllCommits, setShowAllCommits] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/mafhper/personalnews/commits?per_page=20')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: GitHubCommit[]) => {
        setCommits(data);
        setLoadingCommits(false);
      })
      .catch(() => {
        console.log('Could not fetch GitHub commits');
        setLoadingCommits(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const displayedCommits = showAllCommits ? commits : commits.slice(0, 2);

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">

        {/* HERO */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            {t('changes.title')}
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            {t('changes.subtitle')}
          </p>
        </div>

        {/* ROADMAP */}
        <div className="mb-24">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Rocket className="text-blue-400" />
            {t('changes.roadmap_title')}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {roadmapItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {t(`changes.roadmap_${item.id}_title`, item.title)}
                    </h3>

                    <p className="text-sm text-zinc-400">
                      {t(`changes.roadmap_${item.id}_desc`, item.description)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full">
                    <span className={`w-2 h-2 rounded-full ${statusColors[item.status]}`}></span>
                    <span className="text-xs uppercase text-zinc-500 font-medium">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMMITS */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <GitCommit className="text-purple-400" />
            {t('changes.changelog_title')}
          </h2>

          {loadingCommits ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-zinc-500">
              Carregando commits...
            </div>
          ) : commits.length > 0 ? (
            <div className="space-y-4">
              {displayedCommits.map((commit) => (
                <div
                  key={commit.sha}
                  className="bg-white/5 border border-white/10 rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <GitCommit size={16} className="text-zinc-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-white">
                        {commit.commit.message.split('\n')[0]}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="font-mono">{commit.sha.slice(0, 7)}</span>
                        <span>•</span>
                        <span>{commit.commit.author.name}</span>
                        <span>•</span>
                        <span>{formatDate(commit.commit.author.date)}</span>
                      </div>
                    </div>

                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-white transition"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}

              {/* Expand/Collapse */}
              {commits.length > 2 && (
                <button
                  onClick={() => setShowAllCommits(!showAllCommits)}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  {showAllCommits ? (
                    <>
                      {t('changes.show_less', 'Mostrar menos')}
                      <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      {t('changes.view_full_history', 'Ver histórico completo')} ({commits.length - 2} mais)
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
              )}

              <div className="text-center pt-4">
                <a
                  href="https://github.com/mafhper/personalnews/commits/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 hover:text-white transition flex items-center justify-center gap-2"
                >
                  Ver todos os commits no GitHub
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-center">Nenhum commit encontrado.</div>
          )}
        </div>

      </div>
    </div>
  );
}
