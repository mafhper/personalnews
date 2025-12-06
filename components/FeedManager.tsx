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
import DOMPurify from 'dompurify';
import { FeedCategoryManager } from "./FeedCategoryManager";
import { FeedItem } from "./FeedItem";
import { FeedDiscoveryModal } from "./FeedDiscoveryModal";
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
import { useFeedCategories } from "../hooks/useFeedCategories";
import { sanitizeArticleDescription } from "../utils/sanitization";
import { resetToDefaultFeeds, addFeedsToCollection } from "../utils/feedMigration";
import { DEFAULT_FEEDS, CURATED_FEEDS_BR, CURATED_FEEDS_INTL } from "../constants/curatedFeeds";
import { FeedAnalytics } from "./FeedAnalytics";
import { useLanguage } from "../contexts/LanguageContext";

type CuratedListType = 'default' | 'br' | 'intl';

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
}

export const FeedManager: React.FC<FeedManagerProps> = ({
  currentFeeds,
  setFeeds,
  closeModal: _closeModal,
  articles = [],
}) => {
  const logger = useLogger("FeedManager");
  const { categories, createCategory, resetToDefaults } = useFeedCategories();
  const { t } = useLanguage();
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState<string>("");
  const [processingUrl, setProcessingUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feeds" | "categories" | "analytics">(
    "feeds" as "feeds" | "categories" | "analytics"
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

  // Estados para importação de listas curadas
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedListType, setSelectedListType] = useState<CuratedListType>('br');

  const getCuratedList = (type: CuratedListType): FeedSource[] => {
    switch (type) {
      case 'br': return CURATED_FEEDS_BR;
      case 'intl': return CURATED_FEEDS_INTL;
      case 'default': return DEFAULT_FEEDS;
      default: return DEFAULT_FEEDS;
    }
  };

  const handleImportCurated = async (mode: 'merge' | 'replace') => {
    const feedsToImport = getCuratedList(selectedListType);

    if (mode === 'replace') {
      const confirmed = await confirmDanger(
        "Isso substituirá todos os seus feeds atuais pelos da lista selecionada. Deseja continuar?"
      );
      if (confirmed) {
        setFeeds(feedsToImport);
        resetToDefaults();
        await alertSuccess("Feeds substituídos com sucesso!");
        setShowImportModal(false);
      }
    } else {
      // Merge
      const merged = addFeedsToCollection(currentFeeds, feedsToImport);
      const addedCount = merged.length - currentFeeds.length;
      
      if (addedCount === 0) {
        await alertSuccess("Todos os feeds desta lista já estão na sua coleção.");
      } else {
        setFeeds(merged);
        await alertSuccess(`${addedCount} novos feeds adicionados com sucesso!`);
      }
      setShowImportModal(false);
    }
  };

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
    setProcessingUrl(url);
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
          categoryId: newFeedCategory || undefined,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");
        setNewFeedCategory("");

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
            categoryId: newFeedCategory || undefined,
          };

          setFeeds((prev) => [...prev, feedToAdd]);
          setNewFeedUrl("");
          setNewFeedCategory("");

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
          categoryId: newFeedCategory || undefined,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedUrl("");
        setNewFeedCategory("");

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
      setProcessingUrl(null);
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
          categoryId: newFeedCategory || undefined,
        };

        setFeeds((prev) => [...prev, feedToAdd]);
        setNewFeedCategory("");
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

  const validateFeed = handleRetryValidation;

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
      categoryId: newFeedCategory || undefined,
    };

    setFeeds((prev) => [...prev, feedToAdd]);
    setNewFeedUrl("");
    setNewFeedCategory("");

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

  const moveFeedToCategory = (
    feedUrl: string,
    categoryId: string,
    _currentFeeds: FeedSource[],
    setFeeds: (updater: (prev: FeedSource[]) => FeedSource[]) => void
  ) => {
    setFeeds((prev) => 
      prev.map((feed) => {
        if (feed.url === feedUrl) {
          return { ...feed, categoryId };
        }
        return feed;
      })
    );
    alertSuccess("Categoria do feed atualizada!");
  };

  const handleRemoveFeed = (urlToRemove: string) => {
    setFeeds((prev) => prev.filter((f) => f.url !== urlToRemove));
  };

  // Funções para seleção múltipla
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedFeeds(new Set());
  };

  const _handleSelectFeed = (url: string) => {
    const newSelected = new Set(selectedFeeds);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedFeeds(newSelected);
  };

  const _handleSelectAll = () => {
    if (selectedFeeds.size === currentFeeds.length) {
      setSelectedFeeds(new Set());
    } else {
      setSelectedFeeds(new Set(currentFeeds.map((feed) => feed.url)));
    }
  };

  const _handleDeleteSelected = async () => {
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

  const _handleDeleteAll = async () => {
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
  const _handleClearFilters = () => {
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
        // Sanitize OPML content to prevent XSS and other injections
        const sanitizedContent = DOMPurify.sanitize(content, {
          USE_PROFILES: { html: false, svg: false, mathMl: false }, // Disable standard profiles
        });

        const opmlFeeds = parseOpml(sanitizedContent);
        
        // Process feeds and create categories if needed
        const newFeeds: FeedSource[] = [];
        const categoriesToCreate = new Set<string>();
        
        opmlFeeds.forEach(feed => {
          if (!currentFeeds.some(f => f.url === feed.url)) {
            const newFeed: FeedSource = { 
              url: feed.url,
              customTitle: feed.title
            };
            
            if (feed.category) {
              // Normalize category ID
              const categoryId = feed.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
              newFeed.categoryId = categoryId;
              
              // Check if category exists
              if (!categories.some(c => c.id === categoryId)) {
                categoriesToCreate.add(feed.category);
              }
            }
            
            newFeeds.push(newFeed);
          }
        });

        // Create missing categories
        categoriesToCreate.forEach(catName => {
          createCategory(catName, '#6B7280'); // Default gray color
        });

        if (newFeeds.length > 0) {
          setFeeds((prev) => [...prev, ...newFeeds]);
        }
        await alertSuccess(
          `${newFeeds.length} new feeds imported successfully!`
        );
      } catch (error) {
        console.error('Error parsing OPML:', error);
        await alertError('Failed to parse OPML file');
      }
    }
  };

  // Group feeds by status
  const validFeeds = filteredFeeds.filter(f => {
    const val = feedValidations.get(f.url);
    return !val || val.isValid;
  });
  const issueFeeds = filteredFeeds.filter(f => {
    const val = feedValidations.get(f.url);
    return val && !val.isValid;
  });
  const uncheckedFeeds = filteredFeeds.filter(f => !feedValidations.has(f.url));

  // Accordion state
  const [expandedSection, setExpandedSection] = useState<'valid' | 'issues' | 'unchecked' | null>(null);

  const toggleSection = (section: 'valid' | 'issues' | 'unchecked') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-[rgb(var(--color-accent))]/20 rounded-lg text-[rgb(var(--color-accent))]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11c3.866 0 7 3.134 7 7m-7-7v7" />
              </svg>
            </span>
            {t('feeds.title')}
          </h2>
          <p className="text-gray-400 text-sm mt-1 ml-11">
            {currentFeeds.length} {t('feeds.stats.monitored')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-blue-500/20"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('feeds.import.lists')}
            </button>
            <label className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-sm font-medium border border-white/10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('feeds.import.opml')}
                <input
                    type="file"
                    accept=".opml,.xml"
                    onChange={handleFileImport}
                    className="hidden"
                />
            </label>
            <button
                onClick={handleResetToDefaults}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title={t('action.reset')}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 bg-black/10">
        <button
          onClick={() => setActiveTab("feeds")}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "feeds"
              ? "text-[rgb(var(--color-accent))] border-b-2 border-[rgb(var(--color-accent))]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11c3.866 0 7 3.134 7 7m-7-7v7" />
            </svg>
            {t('feeds.tab.feeds')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "categories"
              ? "text-[rgb(var(--color-accent))] border-b-2 border-[rgb(var(--color-accent))]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {t('feeds.tab.categories')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "analytics"
              ? "text-[rgb(var(--color-accent))] border-b-2 border-[rgb(var(--color-accent))]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('feeds.tab.analytics')}
          </span>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "feeds" ? (
        <>
          {/* Add Feed Section */}
          <div className="p-4 border-b border-white/10 bg-white/5">
            <form onSubmit={handleAddFeed} className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <input
                  type="text"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder={t('feeds.add.placeholder')}
                  disabled={!!processingUrl}
                  className="w-full bg-black/20 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="w-full sm:w-48">
                <select
                  value={newFeedCategory}
                  onChange={(e) => setNewFeedCategory(e.target.value)}
                  disabled={!!processingUrl}
                  className="w-full bg-black/20 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{t('feeds.category.none')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!!processingUrl}
                className="px-6 py-2 bg-[rgb(var(--color-accent))] text-white rounded-lg hover:bg-[rgb(var(--color-accent))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap min-w-[120px]"
              >
                {processingUrl ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('loading')}</span>
                    </>
                ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>{t('action.add')}</span>
                    </>
                )}
              </button>
            </form>

            {/* Discovery Progress Indicator */}
            {processingUrl && (
              <div className="mt-4 bg-black/30 rounded-lg p-3 border border-white/10 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-300 font-medium flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    {discoveryProgress.get(processingUrl)?.status || t('loading')}
                  </span>
                  <span className="text-xs text-gray-500">{Math.round(discoveryProgress.get(processingUrl)?.progress || 0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${discoveryProgress.get(processingUrl)?.progress || 5}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Isso pode levar alguns segundos dependendo da resposta do servidor.
                </p>
              </div>
            )}
          </div>

          {/* Search and Filters */}
      <div className="p-4 bg-white/5 border-b border-white/5 flex gap-4">
        <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/20 text-white pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
            />
        </div>
        <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-black/20 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
        >
            <option value="all">Todos</option>
            <option value="valid">{t('analytics.valid')}</option>
            <option value="invalid">{t('analytics.issues')}</option>
            <option value="unchecked">{t('analytics.pending')}</option>
        </select>
      </div>

      {/* Feed List (Accordions) */}
      <div className="space-y-3 overflow-y-auto pr-2 mb-6 custom-scrollbar flex-grow p-4"
        role="list"
        aria-label={`Current RSS feeds (${filteredFeeds.length} of ${currentFeeds.length} feeds)`}
      >
        {/* Issues Section */}
        {issueFeeds.length > 0 && (
          <div className="border border-red-500/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('issues')}
              className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center space-x-2 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">{t('analytics.attention')} ({issueFeeds.length})</span>
              </div>
              <svg className={`w-5 h-5 text-red-400 transform transition-transform ${expandedSection === 'issues' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSection === 'issues' && (
              <div className="p-4 bg-black/20 space-y-2">
                {issueFeeds.map((feed) => (
                  <FeedItem
                    key={feed.url}
                    feed={feed}
                    validation={feedValidations.get(feed.url)}
                    onRemove={handleRemoveFeed}
                    onRetry={validateFeed}
                    onEdit={handleEditFeed}
                    categories={categories}
                    onMoveCategory={(catId: string) => moveFeedToCategory(feed.url, catId, currentFeeds, setFeeds)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Valid Section */}
        {validFeeds.length > 0 && (
          <div className="border border-green-500/20 rounded-lg overflow-hidden">
             <button
              onClick={() => toggleSection('valid')}
              className="w-full flex items-center justify-between p-4 bg-green-500/10 hover:bg-green-500/20 transition-colors"
            >
              <div className="flex items-center space-x-2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{t('analytics.valid')} ({validFeeds.length})</span>
              </div>
              <svg className={`w-5 h-5 text-green-400 transform transition-transform ${expandedSection === 'valid' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
             {expandedSection === 'valid' && (
              <div className="p-4 bg-black/20 space-y-2">
                {validFeeds.map((feed) => (
                  <FeedItem
                    key={feed.url}
                    feed={feed}
                    validation={feedValidations.get(feed.url)}
                    onRemove={handleRemoveFeed}
                    onRetry={validateFeed}
                    onEdit={handleEditFeed}
                    categories={categories}
                    onMoveCategory={(catId: string) => moveFeedToCategory(feed.url, catId, currentFeeds, setFeeds)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unchecked Section */}
        {uncheckedFeeds.length > 0 && (
          <div className="border border-gray-500/20 rounded-lg overflow-hidden">
             <button
              onClick={() => toggleSection('unchecked')}
              className="w-full flex items-center justify-between p-4 bg-gray-500/10 hover:bg-gray-500/20 transition-colors"
            >
              <div className="flex items-center space-x-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{t('analytics.pending')} ({uncheckedFeeds.length})</span>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSection === 'unchecked' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
             {expandedSection === 'unchecked' && (
              <div className="p-4 bg-black/20 space-y-2">
                {uncheckedFeeds.map((feed) => (
                  <FeedItem
                    key={feed.url}
                    feed={feed}
                    validation={feedValidations.get(feed.url)}
                    onRemove={handleRemoveFeed}
                    onRetry={validateFeed}
                    onEdit={handleEditFeed}
                    categories={categories}
                    onMoveCategory={(catId: string) => moveFeedToCategory(feed.url, catId, currentFeeds, setFeeds)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
        </>
      ) : activeTab === "categories" ? (
        /* Categories Tab */
        <div className="flex-1 overflow-y-auto p-6">
          <FeedCategoryManager 
            feeds={currentFeeds} 
            setFeeds={setFeeds} 
            onClose={() => setActiveTab("feeds")} 
          />
        </div>
      ) : (
        /* Analytics Tab */
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <FeedAnalytics
            feeds={currentFeeds}
            articles={articles}
            feedValidations={feedValidations}
          />
        </div>
      )}

      {/* Feed Discovery Modal */}
      {showDiscoveryModal && currentDiscoveryResult && (
        <FeedDiscoveryModal
          isOpen={showDiscoveryModal}
          onClose={handleCancelDiscovery}
          originalUrl={currentDiscoveryResult.originalUrl}
          discoveredFeeds={currentDiscoveryResult.discoveredFeeds}
          onSelectFeed={handleSelectDiscoveredFeed}
        />
      )}

      {/* Import Curated Lists Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 my-auto">
            <h3 className="text-xl font-bold text-white mb-4">Import Curated Feeds</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select List</label>
                <select
                  value={selectedListType}
                  onChange={(e) => setSelectedListType(e.target.value as CuratedListType)}
                  className="w-full bg-black/30 text-white rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
                >
                  <option value="br">🇧🇷 Brazil Tech & Science</option>
                  <option value="intl">🌎 International Tech & Science</option>
                  <option value="default">📱 Default Starter Pack</option>
                </select>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-200">
                {selectedListType === 'br' && "A curated collection of the best Brazilian technology, science, and news sources."}
                {selectedListType === 'intl' && "Top-tier international technology and science publications."}
                {selectedListType === 'default' && "The standard starter collection of essential tech feeds."}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleImportCurated('merge')}
                className="flex-1 bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 text-white py-2 rounded-lg transition-colors font-medium"
              >
                Merge (Add New)
              </button>
              <button
                onClick={() => handleImportCurated('replace')}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg transition-colors font-medium"
              >
                Replace All
              </button>
            </div>
            
            <button
              onClick={() => setShowImportModal(false)}
              className="w-full mt-3 text-gray-400 hover:text-white text-sm py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
