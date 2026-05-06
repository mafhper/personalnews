/**
 * FeedDiscoveryModal.tsx
 *
 * Modal component for displaying feed discovery results and allowing user selection
 * when multiple feeds are discovered from a single URL.
 */

import React from "react";
import { Modal } from "./Modal";
import { Badge } from "./ui/Badge";
import { ActionIcons } from "./icons/ActionIcons";
import { StatusIcons } from "./icons/StatusIcons";
import { FeedIcons } from "./icons/FeedIcons";
import { sanitizeArticleDescription } from "../utils/sanitization";
import type { DiscoveredFeed } from "../services/feedDiscoveryService";

interface FeedDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  discoveredFeeds: DiscoveredFeed[];
  onSelectFeed: (feed: DiscoveredFeed) => void;
  isLoading?: boolean;
}

export const FeedDiscoveryModal: React.FC<FeedDiscoveryModalProps> = ({
  isOpen,
  onClose,
  originalUrl,
  discoveredFeeds,
  onSelectFeed,
  isLoading = false,
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "green";
    if (confidence >= 0.6) return "yellow";
    return "red";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "Alta";
    if (confidence >= 0.6) return "Media";
    return "Baixa";
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case "direct":
        return "RSS direto";
      case "link_discovery":
        return "Link descoberto";
      case "html_parsing":
        return "HTML analisado";
      case "common_paths":
        return "Caminhos comuns";
      default:
        return method;
    }
  };

  const handleSelectFeed = (feed: DiscoveredFeed) => {
    if (!isLoading) {
      onSelectFeed(feed);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title="Feeds encontrados"
      description="Encontramos mais de uma opcao RSS para a URL informada. Escolha a fonte que deve entrar na sua colecao."
      tone="selection"
      zIndexClass="z-[9999]"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
            {discoveredFeeds.length} feed{discoveredFeeds.length !== 1 ? "s" : ""} encontrado
            {discoveredFeeds.length !== 1 ? "s" : ""}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-[rgba(var(--color-border),0.24)] px-4 py-2 text-sm font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] transition hover:bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] hover:text-[rgb(var(--theme-manager-text,var(--color-text)))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[rgba(var(--color-accent),0.22)] bg-[rgba(var(--color-accent),0.08)] p-4">
          <div className="flex items-start gap-3">
            <StatusIcons.Info className="mt-0.5 h-5 w-5 text-[rgb(var(--color-accent))]" />
            <div>
              <h3 className="mb-1 font-semibold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                A URL tem multiplas fontes possiveis
              </h3>
              <p className="text-sm text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                Selecione a opcao mais confiavel ou a que melhor representa o conteudo que voce quer acompanhar.
              </p>
              <p className="mt-2 font-mono text-xs text-[rgb(var(--color-accent))] break-all">
                {originalUrl}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          {discoveredFeeds.map((feed, index) => (
            <button
              key={`${feed.url}-${index}`}
              type="button"
              disabled={isLoading}
              className="w-full rounded-2xl border border-[rgba(var(--color-border),0.12)] bg-[rgb(var(--theme-manager-control,var(--color-surfaceElevated)))] p-4 text-left transition hover:border-[rgba(var(--color-accent),0.32)] hover:bg-[rgb(var(--theme-manager-soft,var(--color-surfaceElevated)))] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handleSelectFeed(feed)}
            >
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <FeedIcons.RSS className="text-orange-500" />
                  <Badge
                    variant={getConfidenceColor(feed.confidence) as "green" | "yellow" | "red"}
                    className="text-xs"
                  >
                    Confianca {getConfidenceText(feed.confidence)}
                  </Badge>
                  <Badge variant="gray" className="text-xs">
                    {getMethodText(feed.discoveryMethod)}
                  </Badge>
                </div>

                <span
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgb(var(--color-accentSurface))] px-3 py-1.5 text-xs font-bold text-[rgb(var(--color-onAccent))]"
                  aria-hidden="true"
                >
                  <ActionIcons.Add />
                  Selecionar
                </span>
              </div>

              <h4 className="mb-2 line-clamp-2 font-semibold text-[rgb(var(--theme-manager-text,var(--color-text)))]">
                {feed.title || "Feed sem titulo"}
              </h4>

              <p className="mb-2 font-mono text-sm text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))] break-all">
                {feed.url.length > 80
                  ? `${feed.url.substring(0, 77)}...`
                  : feed.url}
              </p>

              {feed.description && (
                <p className="line-clamp-3 text-sm leading-relaxed text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                  {sanitizeArticleDescription(feed.description)}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                <span>Confianca: {Math.round(feed.confidence * 100)}%</span>
                {feed.type && <span>Tipo: {feed.type}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
