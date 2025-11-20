/**
 * FeedManager.tsx
 *
 * Componente para gerenciamento de feeds RSS no Personal News Dashboard.
 * Permite adicionar, remover e importar feeds via OPML.
 * Integra-se com o gerenciador de categorias para organização de feeds.
 * Suporta notificações nativas para novos artigos.
 *
 * @author Matheus Pereira
 * @version 2.1.0
 */

import React, { useState, useRef, useEffect } from "react";
import type { FeedSource, Article } from "../types";
import { parseOpml } from "../services/rssParser";
import { FeedCategoryManager } from "./FeedCategoryManager";
import { useLogger } from "../services/logger";
import {
  feedValidator,
  getFeedStatusIcon,
  getFeedStatusColor,
  getFeedStatusText,
  type FeedValidationResult,
} from "../services/feedValidator";
import {
  type DiscoveredFeed,
  getFeedTypeIcon,
  getFeedTypeColor,
  getDiscoveryMethodText,
  getConfidenceText,
  getConfidenceColor,
} from "../services/feedDiscoveryService";
import { OPMLExportService } from "../services/opmlExportService";
import {
  feedDuplicateDetector,
  type DuplicateDetectionResult,
} from "../services/feedDuplicateDetector";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { sanitizeArticleDescription } from "../utils/sanitization";
import { resetToDefaultFeeds } from "../utils/feedMigration";

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
}

export const FeedManager: React.FC<FeedManagerProps> = ({
  currentFeeds,
  setFeeds,
  closeModal,
  articles = [],
}) => {
  const logger = useLogger("FeedManager");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"feeds" | "categories">(
    "feeds" as "feeds" | "categories"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastArticleCount, setLastArticleCount] = useState(0);


  // Estados para validação de feeds
  const [feedValidations, setFeedValidations] = useState<
    Map<string, FeedValidationResult>
  >(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [editingFeed, setEditingFeed] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  // Estados para seleção múltipla
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(new Set());

  // Hook para notificações integradas
  const { confirm, alertSuccess, alertError, confirmDanger } =
    useNotificationReplacements();
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados para descoberta de feeds
  const [discoveryInProgress, setDiscoveryInProgress] = useState<Set<string>>(
    new Set()
  );
  const [discoveryProgress, setDiscoveryProgress] = useState<
    Map<string, { status: string; progress: number }>
  >(new Map());
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [currentDiscoveryResult, setCurrentDiscoveryResult] = useState<{
    originalUrl: string;
    discoveredFeeds: DiscoveredFeed[];
  } | null>(null);

  // Estados para detecção de duplicatas
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    result: DuplicateDetectionResult;
    newUrl: string;
  } | null>(null);

  // Validar feeds automaticamente quando a lista muda
  useEffect(() => {
    if (currentFeeds.length > 0 && activeTab === "feeds") {
      validateAllFeeds();
    }
  }, [currentFeeds, activeTab]);

  // Detectar novos artigos e enviar notificações
  useEffect(() => {
    if (articles.length > lastArticleCount && lastArticleCount > 0) {
      const newArticles = articles.slice(0, articles.length - lastArticleCount);

      if (newArticles.length > 0) {
        logger.info("New articles detected", {
          additionalData: {
            newArticlesCount: newArticles.length,
            totalArticles: articles.length,
            lastCount: lastArticleCount,
          },
        });
      }
    }

    setLastArticleCount(articles.length);
  }, [articles, lastArticleCount]);

  // Funções de validação de feeds
  const validateAllFeeds = async () => {
    if (isValidating) return;

    setIsValidating(true);
    const urls = currentFeeds.map((feed) => feed.url);

    try {
      const results = await feedValidator.validateFeeds(urls);
      const validationMap = new Map<string, FeedValidationResult>();

      results.forEach((result) => {
        validationMap.set(result.url, result);
      });

      setFeedValidations(validationMap);
      logger.info("Feed validation completed", {
        additionalData: {
          totalFeeds: urls.length,
          validFeeds: results.filter((r) => r.status === "valid").length,
          invalidFeeds: results.filter((r) => r.status !== "valid").length,
        },
      });
    } catch (error) {
      logger.error("Feed validation failed", error as Error);
    } finally {
      setIsValidating(false);
    }
  };

  const validateSingleFeed = async (url: string) => {
    try {
      const result = await feedValidator.validateFeed(url);
      setFeedValidations((prev) => new Map(prev.set(url, result)));
      return result;
    } catch (error) {
      logger.error("Single feed validation failed", error as Error, {
        additionalData: { feedUrl: url },
      });
      return null;
    }
  };

  const handleEditFeed = (oldUrl: string) => {
    setEditingFeed(oldUrl);
    setEditUrl(oldUrl);
  };

  const handleSaveEdit = async (oldUrl: string) => {
    if (editUrl && editUrl !== oldUrl) {
      const validation = await validateSingleFeed(editUrl);

      if (validation && validation.status === "valid") {
        setFeeds((prev) =>
          prev.map((feed) =>
            feed.url === oldUrl ? { ...feed, url: editUrl } : feed
          )
        );
        setEditingFeed(null);
        setEditUrl("");
      } else {
        await alertError(
          "O novo URL não é um feed RSS válido. Por favor, verifique o endereço."
        );
      }
    } else {
      setEditingFeed(null);
      setEditUrl("");
    }
  };

  const handleCancelEdit = () => {
    setEditingFeed(null);
    setEditUrl("");
  };

  // Enhanced duplicate detection using FeedDuplicateDetector
  const checkForDuplicates = async (
    newUrl: string
  ): Promise<DuplicateDetectionResult> => {
    try {
      return await feedDuplicateDetector.detectDuplicate(newUrl, currentFeeds);
    } catch (error) {
      logger.error("Duplicate detection failed", error as Error, {
        additionalData: { newUrl },
      });
      // Fallback to simple URL comparison
      const normalizedNewUrl = feedDuplicateDetector.normalizeUrl(newUrl);
      for (const feed of currentFeeds) {
        const normalizedExistingUrl = feedDuplicateDetector.normalizeUrl(
          feed.url
        );
        if (normalizedExistingUrl === normalizedNewUrl) {
          return {
            isDuplicate: true,
            duplicateOf: feed,
            confidence: 1.0,
            reason: "Identical normalized URLs (fallback detection)",
          };
        }
      }
      return {
        isDuplicate: false,
        confidence: 0,
        reason: "No duplicates detected (fallback detection)",
      };
    }
  };

  // Duplicate resolution handlers
  const handleDuplicateWarningAccept = () => {
    if (!duplicateWarning) return;

    // User chose to add anyway, proceed with adding the feed
    proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const handleDuplicateWarningReject = () => {
    setDuplicateWarning(null);
    // Keep the URL in the input for user to modify if needed
  };

  const handleDuplicateWarningReplace = () => {
    if (!duplicateWarning?.result.duplicateOf) return;

    // Remove the existing duplicate and add the new one
    setFeeds((prev) =>
      prev.filter(
        (feed) => feed.url !== duplicateWarning.result.duplicateOf!.url
      )
    );
    proceedWithFeedAddition(duplicateWarning.newUrl);
    setDuplicateWarning(null);
  };

  const proceedWithFeedAddition = async (url: string) => {
    // Start discovery process
    setDiscoveryInProgress((prev) => new Set(prev.add(url)));
    setDiscoveryProgress(
      (prev) =>
        new Map(
          prev.set(url, { status: "Starting validation...", progress: 0 })
        )
    );

    try {
      const result = await feedValidator.validateFeedWithDiscovery(
        url,
        (status: string, progress: number) => {
          setDiscoveryProgress(
            (prev) => new Map(prev.set(url, { status, progress }))
          );
        }
      );

      if (result.isValid) {
        // Feed validated successfully (either direct or single discovered feed)
        const feedToAdd: FeedSource = {
          url: result.url, // Use the final URL (might be different if discovered)
          customTitle: result.title,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");

        logger.info("Feed added successfully with discovery", {
          additionalData: {
            originalUrl: url,
            finalUrl: result.url,
            method: result.finalMethod,
            totalFeeds: currentFeeds.length + 1,
          },
        });

        // Show success message
        if (result.finalMethod === "discovery") {
          await alertError(
            `Feed discovered and added successfully!\nOriginal URL: ${url}\nFeed URL: ${result.url}`
          );
        }
      } else if (
        result.requiresUserSelection &&
        result.discoveredFeeds &&
        result.discoveredFeeds.length > 0
      ) {
        // Multiple feeds discovered, show selection modal
        setCurrentDiscoveryResult({
          originalUrl: url,
          discoveredFeeds: result.discoveredFeeds,
        });
        setShowDiscoveryModal(true);
        setNewFeedUrl(""); // Clear the input since we'll handle it in the modal
      } else {
        // No feeds found or validation failed
        await alertError(
          result.error || "Failed to validate or discover feeds from this URL"
        );
        logger.warn("Feed discovery failed", {
          additionalData: {
            url,
            error: result.error,
            suggestions: result.suggestions,
          },
        });
      }
    } catch (error: any) {
      await alertError(`Failed to process feed: ${error.message}`);
      logger.error("Feed discovery process failed", error, {
        additionalData: { url },
      });
    } finally {
      setDiscoveryInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
      setDiscoveryProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
    }
  };

  // Enhanced feed addition with flexible validation and duplicate detection
  const handleAddFeedWithDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFeedUrl.trim()) {
      await alertError("Por favor, insira uma URL válida para o feed.");
      return;
    }

    const url = newFeedUrl.trim();

    // Enhanced duplicate detection
    const duplicateResult = await checkForDuplicates(url);

    if (duplicateResult.isDuplicate) {
      // Show duplicate warning modal instead of simple alert
      setDuplicateWarning({
        show: true,
        result: duplicateResult,
        newUrl: url,
      });

      logger.info("Duplicate feed detected", {
        additionalData: {
          attemptedUrl: url,
          duplicateOf: duplicateResult.duplicateOf?.url,
          confidence: duplicateResult.confidence,
          reason: duplicateResult.reason,
        },
      });
      return;
    }

    // Start discovery process
    setDiscoveryInProgress((prev) => new Set(prev.add(url)));
    setDiscoveryProgress(
      (prev) =>
        new Map(
          prev.set(url, { status: "Starting validation...", progress: 0 })
        )
    );

    try {
      const result = await feedValidator.validateFeedWithDiscovery(
        url,
        (status: string, progress: number) => {
          setDiscoveryProgress(
            (prev) => new Map(prev.set(url, { status, progress }))
          );
        }
      );

      if (result.isValid) {
        // Feed validated successfully (either direct or single discovered feed)
        const feedToAdd: FeedSource = {
          url: result.url, // Use the final URL (might be different if discovered)
          customTitle: result.title,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");

        logger.info("Feed added successfully with discovery", {
          additionalData: {
            originalUrl: url,
            finalUrl: result.url,
            method: result.finalMethod,
            totalFeeds: currentFeeds.length + 1,
          },
        });

        // Show success message
        if (result.finalMethod === "discovery") {
          await alertError(
            `Feed discovered and added successfully!\nOriginal URL: ${url}\nFeed URL: ${result.url}`
          );
        }
      } else if (
        result.requiresUserSelection &&
        result.discoveredFeeds &&
        result.discoveredFeeds.length > 0
      ) {
        // Multiple feeds discovered, show selection modal
        setCurrentDiscoveryResult({
          originalUrl: url,
          discoveredFeeds: result.discoveredFeeds,
        });
        setShowDiscoveryModal(true);
        setNewFeedUrl(""); // Clear the input since we'll handle it in the modal
      } else {
        // Validation failed - offer to add anyway (flexible approach)
        const shouldAddAnyway = await confirm(
          `Validation failed: ${result.error || "Unknown error"}\n\n` +
          `Many feeds work despite validation errors. Would you like to add this feed anyway?\n\n` +
          `URL: ${url}\n\n` +
          `The feed will be added and you can see if it works in the main interface.`
        );

        if (shouldAddAnyway) {
          // Add the feed despite validation failure
          const feedToAdd: FeedSource = {
            url: url,
            customTitle: result.title || undefined,
          };

          setFeeds((prev) => [...prev, feedToAdd]);
          setNewFeedUrl("");

          logger.info("Feed added despite validation failure", {
            additionalData: {
              url,
              error: result.error,
              userChoice: "add_anyway",
              totalFeeds: currentFeeds.length + 1,
            },
          });

          await alertError(
            `Feed added successfully!\n\n` +
            `Note: The feed had validation issues but was added anyway. ` +
            `You can check if it works properly in the main interface.`
          );
        } else {
          logger.info("User chose not to add invalid feed", {
            additionalData: {
              url,
              error: result.error,
              userChoice: "reject",
            },
          });
        }
      }
    } catch (error: any) {
      // Even if discovery completely fails, offer to add the original URL
      const shouldAddAnyway = await confirm(
        `Failed to process feed: ${error.message}\n\n` +
        `Would you like to add this URL anyway? Many feeds work despite processing errors.\n\n` +
        `URL: ${url}\n\n` +
        `The feed will be added and you can see if it works in the main interface.`
      );

      if (shouldAddAnyway) {
        const feedToAdd: FeedSource = {
          url: url,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");

        logger.info("Feed added despite processing failure", {
          additionalData: {
            url,
            error: error.message,
            userChoice: "add_anyway",
            totalFeeds: currentFeeds.length + 1,
          },
        });

        await alertError(
          `Feed added successfully!\n\n` +
          `Note: The feed had processing issues but was added anyway. ` +
          `You can check if it works properly in the main interface.`
        );
      } else {
        logger.error("Feed discovery process failed and user rejected", error, {
          additionalData: { url, userChoice: "reject" },
        });
      }
    } finally {
      setDiscoveryInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
      setDiscoveryProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
    }
  };

  const handleSelectDiscoveredFeed = async (discoveredFeed: DiscoveredFeed) => {
    if (!currentDiscoveryResult) return;

    try {
      const result = await feedValidator.validateDiscoveredFeed(
        discoveredFeed,
        currentDiscoveryResult.originalUrl
      );

      if (result.isValid) {
        const feedToAdd: FeedSource = {
          url: discoveredFeed.url,
          customTitle: discoveredFeed.title || result.title,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setShowDiscoveryModal(false);
        setCurrentDiscoveryResult(null);

        logger.info("Discovered feed selected and added", {
          additionalData: {
            originalUrl: currentDiscoveryResult.originalUrl,
            selectedUrl: discoveredFeed.url,
            discoveryMethod: discoveredFeed.discoveryMethod,
            confidence: discoveredFeed.confidence,
          },
        });

        await alertError(
          `Feed added successfully!\nTitle: ${discoveredFeed.title || "Unknown"
          }\nURL: ${discoveredFeed.url}`
        );
      } else {
        await alertError(`Selected feed is not valid: ${result.error}`);
      }
    } catch (error: any) {
      await alertError(`Failed to validate selected feed: ${error.message}`);
      logger.error("Failed to validate selected discovered feed", error);
    }
  };

  const handleCancelDiscovery = () => {
    setShowDiscoveryModal(false);
    setCurrentDiscoveryResult(null);
  };

  // Enhanced validation handler functions
  const handleRetryValidation = async (url: string) => {
    if (isValidating) return;

    try {
      setIsValidating(true);

      // Clear cache first to force fresh validation
      feedValidator.revalidateFeed(url);

      const result = await feedValidator.validateFeed(url);
      setFeedValidations((prev) => new Map(prev.set(url, result)));

      logger.info("Feed retry validation completed", {
        additionalData: {
          feedUrl: url,
          isValid: result.isValid,
          status: result.status,
          attempts: result.validationAttempts.length,
          totalRetries: result.totalRetries,
        },
      });
    } catch (error) {
      logger.error("Feed retry validation failed", error as Error, {
        additionalData: { feedUrl: url },
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleForceDiscovery = async (url: string) => {
    if (discoveryInProgress.has(url)) return;

    setDiscoveryInProgress((prev) => new Set(prev.add(url)));
    setDiscoveryProgress(
      (prev) =>
        new Map(
          prev.set(url, { status: "Starting feed discovery...", progress: 0 })
        )
    );

    try {
      const result = await feedValidator.validateFeedWithDiscovery(
        url,
        (status: string, progress: number) => {
          setDiscoveryProgress(
            (prev) => new Map(prev.set(url, { status, progress }))
          );
        }
      );

      if (result.isValid && !result.requiresUserSelection) {
        // Update the existing feed with discovered information
        setFeeds((prev) =>
          prev.map((feed) =>
            feed.url === url
              ? {
                ...feed,
                url: result.url, // Use discovered URL if different
                customTitle: result.title || feed.customTitle,
              }
              : feed
          )
        );

        // Update validation results
        setFeedValidations((prev) => new Map(prev.set(url, result)));

        logger.info("Force discovery completed successfully", {
          additionalData: {
            originalUrl: url,
            finalUrl: result.url,
            method: result.finalMethod,
            discoveredFeeds: result.discoveredFeeds?.length || 0,
          },
        });

        await alertError(
          `Feed discovery successful!\n${result.finalMethod === "discovery"
            ? `Discovered feed: ${result.url}`
            : "Feed validated successfully"
          }`
        );
      } else if (
        result.requiresUserSelection &&
        result.discoveredFeeds &&
        result.discoveredFeeds.length > 0
      ) {
        // Show discovery modal for user selection
        setCurrentDiscoveryResult({
          originalUrl: url,
          discoveredFeeds: result.discoveredFeeds,
        });
        setShowDiscoveryModal(true);
      } else {
        // Discovery failed or no feeds found
        setFeedValidations((prev) => new Map(prev.set(url, result)));
        await alertError(
          result.error ||
          "No RSS feeds found on this website. Please check the URL."
        );
      }
    } catch (error: any) {
      logger.error("Force discovery failed", error, {
        additionalData: { url },
      });
      await alertError(`Feed discovery failed: ${error.message}`);
    } finally {
      setDiscoveryInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
      setDiscoveryProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
    }
  };

  const handleClearCache = async (url: string) => {
    try {
      // Clear cache for this specific feed
      feedValidator.revalidateFeed(url);

      // Remove from local validation state to show "unchecked" status
      setFeedValidations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });

      logger.info("Feed cache cleared", {
        additionalData: { feedUrl: url },
      });

      // Optionally trigger immediate revalidation
      setTimeout(() => {
        handleRetryValidation(url);
      }, 100);
    } catch (error) {
      logger.error("Failed to clear feed cache", error as Error, {
        additionalData: { feedUrl: url },
      });
    }
  };

  // Simple feed addition without validation (for problematic feeds that still work)
  const handleAddFeedDirectly = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFeedUrl.trim()) {
      await alertError("Por favor, insira uma URL válida para o feed.");
      return;
    }

    const url = newFeedUrl.trim();

    // Check for duplicates only
    const duplicateResult = await checkForDuplicates(url);

    if (duplicateResult.isDuplicate) {
      const shouldReplace = await confirm(
        `This feed appears to be a duplicate of an existing feed:\n\n` +
        `Existing: ${duplicateResult.duplicateOf?.url}\n` +
        `New: ${url}\n\n` +
        `Would you like to replace the existing feed with this one?`
      );

      if (shouldReplace && duplicateResult.duplicateOf) {
        // Remove the existing duplicate and add the new one
        setFeeds((prev) =>
          prev.filter((feed) => feed.url !== duplicateResult.duplicateOf!.url)
        );
      } else if (!shouldReplace) {
        return; // User chose not to add duplicate
      }
    }

    // Add feed directly without validation
    const feedToAdd: FeedSource = {
      url: url,
    };

    setFeeds((prev) => [...prev, feedToAdd]);
    setNewFeedUrl("");

    logger.info("Feed added directly without validation", {
      additionalData: {
        url,
        totalFeeds: currentFeeds.length + 1,
        method: "direct_add",
      },
    });

    await alertError(
      `Feed added successfully!\n\n` +
      `Note: The feed was added without validation. ` +
      `You can check if it works properly in the main interface.`
    );
  };

  const handleAddFeed = handleAddFeedWithDiscovery;

  const handleRemoveFeed = (urlToRemove: string) => {
    setFeeds((prev) => prev.filter((f) => f.url !== urlToRemove));
  };

  // Funções para seleção múltipla
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedFeeds(new Set());
  };

  const handleSelectFeed = (url: string) => {
    const newSelected = new Set(selectedFeeds);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedFeeds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFeeds.size === currentFeeds.length) {
      setSelectedFeeds(new Set());
    } else {
      setSelectedFeeds(new Set(currentFeeds.map((feed) => feed.url)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFeeds.size === 0) return;

    const feedCount = selectedFeeds.size;
    const confirmMessage =
      feedCount === currentFeeds.length
        ? `Tem certeza que deseja excluir TODOS os ${feedCount} feeds? Esta ação não pode ser desfeita.`
        : `Tem certeza que deseja excluir os ${feedCount} feeds selecionados? Esta ação não pode ser desfeita.`;

    if (await confirmDanger(confirmMessage)) {
      setFeeds((prev) => prev.filter((feed) => !selectedFeeds.has(feed.url)));
      setSelectedFeeds(new Set());
      setIsSelectMode(false);

      logger.info("Bulk feed deletion completed", {
        additionalData: {
          deletedCount: feedCount,
          remainingCount: currentFeeds.length - feedCount,
        },
      });
    }
  };

  const handleDeleteAll = async () => {
    if (currentFeeds.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir TODOS os ${currentFeeds.length} feeds? Esta ação não pode ser desfeita.`;

    if (await confirmDanger(confirmMessage)) {
      setFeeds([]);
      setSelectedFeeds(new Set());
      setIsSelectMode(false);

      logger.info("All feeds deleted", {
        additionalData: {
          deletedCount: currentFeeds.length,
        },
      });
    }
  };

  // Função para filtrar feeds baseado na busca e filtros
  const getFilteredFeeds = () => {
    return currentFeeds.filter((feed) => {
      const validation = feedValidations.get(feed.url);

      // Filtro por termo de busca
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        feed.url.toLowerCase().includes(searchLower) ||
        (validation?.title &&
          validation.title.toLowerCase().includes(searchLower)) ||
        (validation?.description &&
          validation.description.toLowerCase().includes(searchLower)) ||
        (feed.customTitle &&
          feed.customTitle.toLowerCase().includes(searchLower)) ||
        (feed.categoryId &&
          feed.categoryId.toLowerCase().includes(searchLower));

      // Filtro por status
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" && validation?.status === "valid") ||
        (statusFilter === "invalid" &&
          validation?.status &&
          validation.status !== "valid") ||
        (statusFilter === "unchecked" && !validation);

      return matchesSearch && matchesStatus;
    });
  };

  const filteredFeeds = getFilteredFeeds();

  // Função para limpar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleResetToDefaults = async () => {
    const confirmed = await confirmDanger(
      "Tem certeza que deseja resetar para os feeds padrão? Isso substituirá todos os seus feeds atuais pela coleção curada de 16 feeds organizados por categoria."
    );

    if (confirmed) {
      try {
        const defaultFeeds = resetToDefaultFeeds();
        setFeeds(defaultFeeds);

        await alertSuccess(
          `✅ Feeds resetados com sucesso! Agora você tem ${defaultFeeds.length} feeds organizados por categoria.`
        );

        logger.info("Feeds reset to defaults", {
          additionalData: {
            previousFeedCount: currentFeeds.length,
            newFeedCount: defaultFeeds.length,
          },
        });
      } catch (error) {
        logger.error("Failed to reset feeds to defaults", error as Error);
        await alertError("Falha ao resetar feeds. Tente novamente.");
      }
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      try {
        const urls = parseOpml(content);
        const newFeeds = urls
          .filter((url) => !currentFeeds.some((f) => f.url === url))
          .map((url) => ({ url }));
        if (newFeeds.length > 0) {
          setFeeds((prev) => [...prev, ...newFeeds]);
        }
        await alertSuccess(
          `${newFeeds.length} new feeds imported successfully!`
        );
      } catch (error) {
        await alertError(
          "Failed to parse OPML file. Please ensure it's a valid XML file."
        );
        logger.error("Failed to parse OPML file", error as Error, {
          additionalData: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
        });
      }
    }
  };

  const handleExportOPML = async () => {
    try {
      if (currentFeeds.length === 0) {
        await alertError("No feeds to export. Please add some feeds first.");
        return;
      }

      // Detect duplicates before export using enhanced detection
      const duplicateResult = await feedDuplicateDetector.removeDuplicates(
        currentFeeds,
        {
          action: "keep_first",
        }
      );

      // Generate OPML content (this will automatically remove duplicates)
      const opmlContent = await OPMLExportService.generateOPML(
        currentFeeds,
        [], // No categories for now - will be enhanced when categories are integrated
        {
          title: "Personal News Dashboard Feeds",
          description: "RSS feeds exported from Personal News Dashboard",
          ownerName: "Personal News Dashboard User",
          includeCategories: false, // Will be true when categories are integrated
          includeFeedMetadata: true,
        }
      );

      // Validate OPML before download
      const validation = OPMLExportService.validateOPML(opmlContent);
      if (!validation.isValid) {
        logger.error(
          "Generated OPML is invalid",
          new Error("OPML validation failed"),
          {
            additionalData: {
              errors: validation.errors,
              warnings: validation.warnings,
            },
          }
        );
        await alertError(
          "Failed to generate valid OPML file. Please try again."
        );
        return;
      }

      // Generate filename with timestamp
      const filename = OPMLExportService.generateFilename(
        "personal-news-dashboard-feeds"
      );

      // Download the file
      OPMLExportService.downloadOPML(opmlContent, filename);

      // Log export details including duplicate information
      logger.info("OPML export completed successfully", {
        additionalData: {
          originalFeedCount: currentFeeds.length,
          uniqueFeedCount: duplicateResult.uniqueFeeds.length,
          duplicateCount: duplicateResult.removedDuplicates.length,
          filename: filename,
          hasWarnings: validation.warnings.length > 0,
          warnings: validation.warnings,
          duplicates: duplicateResult.removedDuplicates.map((d) => ({
            original: d.originalFeed.url,
            duplicateOf: d.duplicateOf.url,
            reason: d.reason,
          })),
        },
      });

      // Show success message with duplicate information
      let message = `Successfully exported ${duplicateResult.uniqueFeeds.length} unique feeds to ${filename}`;

      if (duplicateResult.removedDuplicates.length > 0) {
        message += `\n\nNote: ${duplicateResult.removedDuplicates.length
          } duplicate feed${duplicateResult.removedDuplicates.length > 1 ? "s were" : " was"
          } automatically removed during export.`;

        // Show details about duplicates if there are only a few
        if (duplicateResult.removedDuplicates.length <= 3) {
          const duplicateDetails = duplicateResult.removedDuplicates
            .map(
              (d) =>
                `• ${d.originalFeed.customTitle || d.originalFeed.url
                } (duplicate of ${d.duplicateOf.customTitle || d.duplicateOf.url
                })`
            )
            .join("\n");
          message += `\n\nDuplicates removed:\n${duplicateDetails}`;
        }
      }

      await alertError(message);
    } catch (error) {
      logger.error("OPML export failed", error as Error, {
        additionalData: {
          feedCount: currentFeeds.length,
        },
      });
      await alertError("Failed to export OPML file. Please try again.");
    }
  };

  if (activeTab === "categories") {
    return (
      <FeedCategoryManager
        feeds={currentFeeds}
        setFeeds={setFeeds}
        onClose={closeModal}
      />
    );
  }

  return (
    <div role="dialog" aria-labelledby="feed-manager-title" className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 id="feed-manager-title" className="text-3xl font-bold text-white tracking-tight">
          Manage Feeds
        </h2>
        {/* Close button handled by Modal component */}
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex p-1 space-x-1 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("feeds")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "feeds"
              ? "bg-[rgb(var(--color-accent))] text-white shadow-lg shadow-[rgb(var(--color-accent))]/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            Feeds
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${(activeTab as string) === "categories"
              ? "bg-[rgb(var(--color-accent))] text-white shadow-lg shadow-[rgb(var(--color-accent))]/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            Categories
          </button>
        </div>
      </div>

      <section aria-labelledby="add-feed-section" className="mb-8">
        <h3 id="add-feed-section" className="sr-only">
          Add New Feed
        </h3>
        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors duration-300">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="p-2 rounded-lg bg-[rgb(var(--color-accent))]/10 mr-3">
              <svg className="w-5 h-5 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
            Add New Feed
          </h4>
          <div className="mb-2">
            <form onSubmit={handleAddFeed} className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="feed-url-input" className="sr-only">
                RSS Feed URL
              </label>
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  id="feed-url-input"
                  type="url"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder="https://example.com/rss.xml"
                  className="w-full bg-black/30 text-white rounded-lg pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent transition-all placeholder-gray-500"
                  required
                  aria-label="Enter RSS feed URL"
                  aria-describedby="feed-url-help"
                />
              </div>
              <div id="feed-url-help" className="sr-only">
                Enter a valid RSS feed URL to add to your feed list
              </div>
              <button
                type="submit"
                disabled={discoveryInProgress.size > 0}
                className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-[rgb(var(--color-accent))]/20 hover:shadow-[rgb(var(--color-accent))]/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                aria-label="Add RSS feed with validation and discovery"
              >
                {discoveryInProgress.size > 0 ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Add Feed"}
              </button>
            </form>

            {/* Alternative direct add button */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleAddFeedDirectly}
                disabled={!newFeedUrl.trim() || discoveryInProgress.size > 0}
                className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center"
                aria-label="Add RSS feed directly without validation"
                title="Add feed directly without validation (for feeds that work despite validation errors)"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Add (Skip Validation)
              </button>
            </div>
          </div>
        </div>


        {/* Enhanced Discovery Progress Indicator */}
        {discoveryInProgress.size > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4 animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur opacity-20 rounded-full"></div>
                <svg
                  className="animate-spin h-5 w-5 text-blue-400 relative z-10"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <div className="flex-grow">
                <div className="text-sm font-medium text-blue-300">
                  Processing feed discovery...
                </div>
                {Array.from(discoveryProgress.entries()).map(
                  ([url, progress]) => (
                    <div key={url} className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                        <span className="truncate max-w-xs font-mono text-blue-200/70">{url}</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {progress.status}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feed Discovery Results Modal */}
        {showDiscoveryModal && currentDiscoveryResult && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">
                  Multiple Feeds Discovered
                </h3>
                <button
                  onClick={handleCancelDiscovery}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  aria-label="Close discovery modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                  <p className="text-gray-300 text-sm mb-1">
                    Found {currentDiscoveryResult.discoveredFeeds.length} RSS
                    feeds on{" "}
                    <span className="font-mono text-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))]/10 px-2 py-0.5 rounded">
                      {currentDiscoveryResult.originalUrl}
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs">
                    Select the feed you want to add to your collection:
                  </p>
                </div>

                <div className="space-y-3">
                  {currentDiscoveryResult.discoveredFeeds.map((feed, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 rounded-xl p-4 border border-white/5 hover:border-[rgb(var(--color-accent))]/50 hover:bg-gray-800/80 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span
                              className="text-xl"
                              title={`${feed.type.toUpperCase()} feed`}
                            >
                              {getFeedTypeIcon(feed.type)}
                            </span>
                            <h4 className="font-medium text-white truncate text-lg group-hover:text-[rgb(var(--color-accent))] transition-colors">
                              {feed.title || "Untitled Feed"}
                            </h4>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getFeedTypeColor(
                                feed.type
                              )} bg-opacity-20 border border-opacity-20`}
                            >
                              {getFeedTypeIcon(feed.type)} {feed.type.toUpperCase()}
                            </span>
                          </div>

                          {feed.description && (
                            <p className="text-sm text-gray-300 mb-2 line-clamp-2 leading-relaxed">
                              {sanitizeArticleDescription(feed.description)}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="font-mono bg-black/20 px-2 py-1 rounded truncate max-w-[200px]">
                              {feed.url}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              {getDiscoveryMethodText(feed.discoveryMethod)}
                            </span>
                            <span className={`flex items-center ${getConfidenceColor(feed.confidence)}`}>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {getConfidenceText(feed.confidence)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectDiscoveredFeed(feed)}
                          className="ml-4 bg-[rgb(var(--color-accent))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-accent))]/90 transition-all shadow-lg shadow-[rgb(var(--color-accent))]/20 hover:shadow-[rgb(var(--color-accent))]/40 text-sm font-medium whitespace-nowrap"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-white/10 bg-gray-900/50">
                <button
                  onClick={handleCancelDiscovery}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="current-feeds-section" className="flex-grow flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
          <h3
            id="current-feeds-section"
            className="text-xl font-semibold text-white flex items-center"
          >
            Current Feeds
            <span className="ml-3 px-2.5 py-0.5 rounded-full bg-white/10 text-sm text-gray-300 font-normal">
              {currentFeeds.length}
            </span>
            {isSelectMode && selectedFeeds.size > 0 && (
              <span className="text-sm text-[rgb(var(--color-accent))] ml-2 font-normal animate-in fade-in">
                ({selectedFeeds.size} selected)
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {isValidating && (
              <div className="flex items-center text-blue-400 text-sm bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Validating...
              </div>
            )}
            <button
              onClick={validateAllFeeds}
              disabled={isValidating}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-all border border-white/10 hover:border-white/20 disabled:opacity-50 flex items-center"
              title="Revalidate all feeds"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verify All
            </button>
            {currentFeeds.length > 0 && (
              <button
                onClick={handleToggleSelectMode}
                className={`text-xs px-3 py-2 rounded-lg transition-all flex items-center border ${isSelectMode
                  ? "bg-[rgb(var(--color-accent))] border-[rgb(var(--color-accent))] text-white shadow-lg shadow-[rgb(var(--color-accent))]/20"
                  : "bg-gray-800 border-white/10 hover:bg-gray-700 text-white hover:border-white/20"
                  }`}
                title={isSelectMode ? "Cancel selection" : "Select feeds"}
              >
                {isSelectMode ? (
                  <>
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Select
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bulk Selection Controls */}
        {isSelectMode && currentFeeds.length > 0 && (
          <div className="bg-[rgb(var(--color-accent))]/10 p-4 rounded-xl mb-6 border border-[rgb(var(--color-accent))]/20 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent))]/80 transition-colors flex items-center"
                >
                  {selectedFeeds.size === currentFeeds.length ? (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Deselect All
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Select All
                    </>
                  )}
                </button>
                <span className="text-sm text-gray-400 border-l border-[rgb(var(--color-accent))]/20 pl-4">
                  {selectedFeeds.size} of {currentFeeds.length} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {selectedFeeds.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm px-4 py-2 rounded-lg transition-colors border border-red-500/20 flex items-center"
                    title={`Delete ${selectedFeeds.size} selected feeds`}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={handleDeleteAll}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm px-4 py-2 rounded-lg transition-colors border border-red-500/20 flex items-center"
                  title="Delete all feeds"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {currentFeeds.length > 0 && (
          <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-xl p-4 mb-6">
            <div className="flex flex-col space-y-4">
              {/* Top row: Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by URL, title, description or category..."
                    className="w-full bg-black/30 text-white rounded-lg px-4 py-2.5 pl-10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] text-sm placeholder-gray-500"
                    aria-label="Search feeds"
                  />
                  <svg
                    className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Status Filter */}
                <div className="relative min-w-[180px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-black/30 text-white rounded-lg px-4 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] text-sm appearance-none cursor-pointer"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="valid">✅ Valid</option>
                    <option value="invalid">❌ Issues</option>
                    <option value="unchecked">❓ Unchecked</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || statusFilter !== "all") && (
                  <button
                    onClick={handleClearFilters}
                    className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-lg transition-colors text-sm border border-white/10 whitespace-nowrap"
                    title="Clear filters"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Bottom row: Results info */}
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>
                  {filteredFeeds.length === currentFeeds.length
                    ? `Showing all ${currentFeeds.length} feeds`
                    : `Showing ${filteredFeeds.length} of ${currentFeeds.length} feeds`}
                </span>

                {(searchTerm || statusFilter !== "all") && (
                  <span className="text-[rgb(var(--color-accent))] flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-accent))] mr-2"></span>
                    {searchTerm && `Search: "${searchTerm}"`}
                    {searchTerm && statusFilter !== "all" && " • "}
                    {statusFilter !== "all" &&
                      `Status: ${statusFilter === "valid"
                        ? "Valid"
                        : statusFilter === "invalid"
                          ? "Issues"
                          : "Unchecked"
                      }`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className="space-y-3 overflow-y-auto pr-2 mb-6 custom-scrollbar flex-grow"
          role="list"
          aria-label={`Current RSS feeds (${filteredFeeds.length} of ${currentFeeds.length} feeds)`}
        >
          {filteredFeeds.length > 0 ? (
            filteredFeeds.map((feed, index) => {
              const validation = feedValidations.get(feed.url);
              const isEditing = editingFeed === feed.url;

              return (
                <div
                  key={feed.url}
                  className="group bg-gray-800/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200 hover:bg-gray-800/60"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor:
                      validation?.status === "valid"
                        ? "#10b981"
                        : validation?.status === "invalid"
                          ? "#ef4444"
                          : validation?.status === "timeout"
                            ? "#f59e0b"
                            : validation?.status === "checking"
                              ? "#3b82f6"
                              : "#6b7280",
                  }}
                  role="listitem"
                  aria-label={`Feed ${index + 1}: ${feed.url}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-grow min-w-0">
                      {/* Checkbox for multiple selection */}
                      {isSelectMode && (
                        <div className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={selectedFeeds.has(feed.url)}
                            onChange={() => handleSelectFeed(feed.url)}
                            className="w-5 h-5 text-[rgb(var(--color-accent))] bg-black/30 border-white/20 rounded focus:ring-[rgb(var(--color-accent))] focus:ring-offset-0 cursor-pointer"
                            aria-label={`Select feed ${validation?.title || feed.url
                              }`}
                          />
                        </div>
                      )}

                      <div className="flex-grow min-w-0">
                        {/* Status and title */}
                        <div className="flex items-center space-x-3 mb-1.5">
                          <span
                            className="text-lg"
                            title={
                              validation
                                ? getFeedStatusText(validation.status)
                                : "Unchecked"
                            }
                          >
                            {validation
                              ? getFeedStatusIcon(validation.status)
                              : "❓"}
                          </span>
                          <div className="flex-grow min-w-0">
                            {isEditing ? (
                              <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="w-full bg-black/30 text-white text-sm rounded-lg px-3 py-1.5 border border-[rgb(var(--color-accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]/50"
                                placeholder="https://example.com/rss.xml"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="font-medium text-white truncate group-hover:text-[rgb(var(--color-accent))] transition-colors"
                                title={feed.url}
                              >
                                {validation?.title ||
                                  feed.customTitle ||
                                  feed.url}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* URL and additional info */}
                        {!isEditing && (
                          <>
                            {(validation?.title || feed.customTitle) && (
                              <div
                                className="text-xs text-gray-500 truncate mb-1"
                                title={feed.url}
                              >
                                {feed.url}
                              </div>
                            )}

                            {validation?.description && (
                              <div
                                className="text-xs text-gray-400 truncate mb-1"
                                title={validation.description}
                              >
                                {sanitizeArticleDescription(validation.description)}
                              </div>
                            )}

                            {feed.categoryId && (
                              <div className="text-xs text-[rgb(var(--color-accent))] mb-1 inline-flex items-center bg-[rgb(var(--color-accent))]/10 px-2 py-0.5 rounded-full">
                                Category: {feed.categoryId}
                              </div>
                            )}

                            {/* Enhanced Status and Validation Details */}
                            {validation && (
                              <div className="space-y-2 mt-2">
                                <div className="flex items-center space-x-3 text-xs">
                                  <span
                                    className={`font-medium ${getFeedStatusColor(
                                      validation.status
                                    )}`}
                                  >
                                    {getFeedStatusText(validation.status)}
                                  </span>
                                  {validation.responseTime && (
                                    <span className="text-gray-500">
                                      {validation.responseTime}ms
                                    </span>
                                  )}
                                  {validation.totalRetries > 0 && (
                                    <span className="text-yellow-400">
                                      {validation.totalRetries} retries
                                    </span>
                                  )}
                                  {validation.finalMethod &&
                                    validation.finalMethod !== "direct" && (
                                      <span className="text-blue-400 capitalize">
                                        via {validation.finalMethod}
                                      </span>
                                    )}
                                </div>

                                {/* Error Message with Suggestions */}
                                {validation.error && (
                                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-xs">
                                    <div className="text-red-300 font-medium mb-1">
                                      {validation.error}
                                    </div>
                                    {validation.suggestions &&
                                      validation.suggestions.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                          <div className="text-red-200 text-xs font-medium">
                                            Suggestions:
                                          </div>
                                          <ul className="text-red-200/80 text-xs space-y-0.5 ml-2">
                                            {validation.suggestions
                                              .slice(0, 3)
                                              .map((suggestion, idx) => (
                                                <li
                                                  key={idx}
                                                  className="flex items-start"
                                                >
                                                  <span className="mr-1">
                                                    •
                                                  </span>
                                                  <span>{suggestion}</span>
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                )}

                                {/* Validation Attempt History */}
                                {validation.validationAttempts &&
                                  validation.validationAttempts.length > 1 && (
                                    <details className="text-xs group/details">
                                      <summary className="text-gray-400 cursor-pointer hover:text-gray-300 select-none flex items-center">
                                        <svg className="w-3 h-3 mr-1 transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        View validation history (
                                        {validation.validationAttempts.length}{" "}
                                        attempts)
                                      </summary>
                                      <div className="mt-2 space-y-1 bg-black/20 rounded-lg p-2 max-h-32 overflow-y-auto">
                                        {validation.validationAttempts.map(
                                          (attempt, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center justify-between text-xs"
                                            >
                                              <div className="flex items-center space-x-2">
                                                <span
                                                  className={
                                                    attempt.success
                                                      ? "text-green-400"
                                                      : "text-red-400"
                                                  }
                                                >
                                                  {attempt.success ? "✓" : "✗"}
                                                </span>
                                                <span className="text-gray-300 capitalize">
                                                  {attempt.method}
                                                </span>
                                                {attempt.proxyUsed && (
                                                  <span className="text-blue-300 text-xs">
                                                    ({attempt.proxyUsed})
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center space-x-2 text-gray-400">
                                                {attempt.responseTime && (
                                                  <span>
                                                    {attempt.responseTime}ms
                                                  </span>
                                                )}
                                                <span>
                                                  {new Date(
                                                    attempt.timestamp
                                                  ).toLocaleTimeString()}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </details>
                                  )}

                                {/* Discovery Information */}
                                {validation.discoveredFeeds &&
                                  validation.discoveredFeeds.length > 0 && (
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs">
                                      <div className="text-blue-300 font-medium mb-1">
                                        Feed discovered from website
                                      </div>
                                      <div className="text-blue-200/80 space-y-0.5">
                                        <div>
                                          Method:{" "}
                                          {
                                            validation.discoveredFeeds[0]
                                              .discoveryMethod
                                          }
                                        </div>
                                        <div>
                                          Confidence:{" "}
                                          {Math.round(
                                            (validation.discoveredFeeds[0]
                                              .confidence || 0) * 100
                                          )}
                                          %
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center space-x-1 ml-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(feed.url)}
                            className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-green-400/10 transition-colors"
                            title="Save changes"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-400 hover:text-gray-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                            title="Cancel edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Retry/Revalidate Button */}
                          <button
                            onClick={() => handleRetryValidation(feed.url)}
                            disabled={isValidating}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              validation?.status === "valid"
                                ? "Revalidate this feed"
                                : validation?.finalError?.retryable
                                  ? "Retry validation with fresh attempt"
                                  : "Revalidate this feed"
                            }
                          >
                            {isValidating ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>

                          {/* Force Discovery Button (for failed feeds) */}
                          {validation && validation.status !== "valid" && (
                            <button
                              onClick={() => handleForceDiscovery(feed.url)}
                              disabled={discoveryInProgress.has(feed.url)}
                              className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-purple-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Try feed discovery on this URL"
                            >
                              {discoveryInProgress.has(feed.url) ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Clear Cache Button */}
                          {validation && (
                            <button
                              onClick={() => handleClearCache(feed.url)}
                              className="text-orange-400 hover:text-orange-300 p-2 rounded-lg hover:bg-orange-400/10 transition-colors"
                              title="Clear cache and force fresh validation"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}

                          <button
                            onClick={() => handleEditFeed(feed.url)}
                            className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-yellow-400/10 transition-colors"
                            title="Edit feed URL"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveFeed(feed.url)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                            title="Remove feed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : currentFeeds.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/20 rounded-xl border border-white/5 border-dashed">
              <div className="bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No feeds added yet</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Add your first RSS feed above or import an OPML file to get started.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/20 rounded-xl border border-white/5 border-dashed">
              <div className="bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No feeds match your filters</h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your search terms or filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] text-sm font-medium transition-colors flex items-center justify-center mx-auto"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-all border border-white/10 hover:border-white/20 flex items-center"
            aria-label="Import feeds from OPML file"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Import OPML
          </button>
          <button
            onClick={handleExportOPML}
            disabled={currentFeeds.length === 0}
            className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-[rgb(var(--color-accent))]/20 hover:shadow-[rgb(var(--color-accent))]/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            aria-label="Export feeds to OPML file"
            title={
              currentFeeds.length === 0
                ? "No feeds to export"
                : `Export ${currentFeeds.length} feeds to OPML`
            }
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export OPML
          </button>
          <button
            onClick={handleResetToDefaults}
            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 font-medium px-4 py-2 rounded-lg transition-all border border-orange-500/20 flex items-center"
            aria-label="Reset to default feeds"
            title="Reset to curated collection of 16 feeds organized by category"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Defaults
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".xml,.opml"
          className="hidden"
          aria-label="Select OPML file to import"
        />
        <div className="text-gray-400 text-sm flex items-center">
          <svg className="w-4 h-4 mr-2 text-[rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Switch to Categories tab to organize feeds
        </div>
      </footer>

      {/* Duplicate Feed Warning Modal */}
      {duplicateWarning?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 bg-yellow-500/10 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-white">
                  Duplicate Feed Detected
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  This feed appears to be a duplicate of an existing one.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Existing feed</div>
                <div className="text-white font-medium text-lg mb-1">
                  {duplicateWarning.result.duplicateOf?.customTitle ||
                    duplicateWarning.result.duplicateOf?.url}
                </div>
                <div className="text-[rgb(var(--color-accent))] text-sm font-mono truncate">
                  {duplicateWarning.result.duplicateOf?.url}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">New feed</div>
                <div className="text-white font-medium text-lg mb-1">
                  {duplicateWarning.newUrl}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 px-2">
                <span>Detection confidence:</span>
                <span
                  className={`font-bold ${duplicateWarning.result.confidence > 0.9
                    ? "text-red-400"
                    : duplicateWarning.result.confidence > 0.7
                      ? "text-yellow-400"
                      : "text-green-400"
                    }`}
                >
                  {Math.round(duplicateWarning.result.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleDuplicateWarningReject}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-all font-medium"
              >
                Cancel - Don't Add Feed
              </button>

              <button
                onClick={handleDuplicateWarningReplace}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-3 rounded-xl transition-all font-medium shadow-lg shadow-yellow-600/20"
              >
                Replace Existing Feed
              </button>

              <button
                onClick={handleDuplicateWarningAccept}
                className="w-full bg-transparent border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white px-4 py-3 rounded-xl transition-all font-medium"
              >
                Add Anyway (Keep Both)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
