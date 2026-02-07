import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FlaskConical,
  FileText,
  GitCommit,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQualityData } from "@/contexts/QualityDataContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchModalSimpleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  type: "test" | "report" | "commit";
  title: string;
  subtitle: string;
  status?: "passed" | "failed" | "warning" | "success";
  href?: string;
  reportFile?: string;
}

const DEBOUNCE_MS = 300;

export function SearchModalSimple({
  open,
  onOpenChange,
}: SearchModalSimpleProps) {
  const navigate = useNavigate();
  const { currentSnapshot, recentCommits, openReport } = useQualityData();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle query changes with debounce
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const newQuery = e.target.value;
      setQuery(newQuery);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (!newQuery) {
        setDebouncedQuery("");
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      timerRef.current = setTimeout(() => {
        setDebouncedQuery(newQuery);
        setIsSearching(false);
      }, DEBOUNCE_MS);
    },
    [],
  );

  // Handle open/close with reset
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setTimeout(() => {
          setQuery("");
          setDebouncedQuery("");
          setIsSearching(false);
        }, 200);
      }
    },
    [onOpenChange],
  );

  // Search results - memoized
  const results = useMemo(() => {
    const searchLower = debouncedQuery.toLowerCase();

    if (!searchLower || !currentSnapshot) return [];

    const newResults: SearchResult[] = [];

    // Search tests
    if (currentSnapshot.metrics?.tests?.suites) {
      currentSnapshot.metrics.tests.suites.forEach((suite) => {
        if (suite.name.toLowerCase().includes(searchLower)) {
          newResults.push({
            id: `test-${suite.name}`,
            type: "test",
            title: suite.name,
            subtitle: `${suite.passed}/${suite.tests} passed • ${suite.duration}ms`,
            status: suite.failed > 0 ? "failed" : "passed",
            href: "/tests",
          });
        }
      });
    }

    // Search reports
    const reportKeywords = [
      "relatório",
      "report",
      "quality",
      "qualidade",
      "metric",
      "métrica",
    ];
    const isReportSearch = reportKeywords.some((k) => searchLower.includes(k));
    const isCommitHashMatch = currentSnapshot.commitHash
      ?.toLowerCase()
      .includes(searchLower);

    if (
      currentSnapshot.reportFile &&
      (isReportSearch || isCommitHashMatch || searchLower.length > 0)
    ) {
      newResults.push({
        id: `report-${currentSnapshot.commitHash}`,
        type: "report",
        title: `Relatório Quality Core`,
        subtitle: `Commit: ${currentSnapshot.commitHash?.substring(0, 7)} • Score: ${currentSnapshot.healthScore}`,
        status:
          currentSnapshot.healthScore >= 80
            ? "success"
            : currentSnapshot.healthScore >= 50
              ? "warning"
              : "failed",
        reportFile: currentSnapshot.reportFile,
      });
    }

    // Search commits
    if (recentCommits?.length) {
      recentCommits.forEach((commit) => {
        const hashMatch = commit.hash?.toLowerCase().includes(searchLower);
        const messageMatch = commit.message
          ?.toLowerCase()
          .includes(searchLower);
        if (hashMatch || messageMatch) {
          newResults.push({
            id: `commit-${commit.hash}`,
            type: "commit",
            title: commit.message || "Commit",
            subtitle: `${commit.hash?.substring(0, 7)} • ${commit.author} • ${commit.date}`,
            status:
              commit.healthScore >= 80
                ? "success"
                : commit.healthScore >= 50
                  ? "warning"
                  : "failed",
            href: "/history",
            reportFile: commit.reportFile,
          });
        }
      });
    }

    return newResults;
  }, [debouncedQuery, currentSnapshot, recentCommits]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);

      if (result.type === "report" && result.reportFile) {
        openReport(result.reportFile);
      } else if (result.href) {
        navigate(result.href);
      }
    },
    [navigate, openReport, onOpenChange],
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "passed":
      case "success":
        return "bg-emerald-500";
      case "failed":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-muted";
    }
  };

  const groupedResults = useMemo(
    () => ({
      tests: results.filter((r) => r.type === "test"),
      reports: results.filter((r) => r.type === "report"),
      commits: results.filter((r) => r.type === "commit"),
    }),
    [results],
  );

  const hasResults = results.length > 0;
  const displayQuery = debouncedQuery;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] p-0 gap-0 overflow-hidden"
        aria-describedby="search-description"
      >
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="sr-only">Buscar no Dashboard</DialogTitle>
          <DialogDescription id="search-description" className="sr-only">
            Digite para buscar testes, relatórios ou commits no projeto
          </DialogDescription>
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar testes, relatórios, commits..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={(e) => e.stopPropagation()}
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-4 pb-4">
            {isSearching ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Buscando...
                </span>
              </div>
            ) : displayQuery && !hasResults ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum resultado encontrado para "{displayQuery}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tente buscar por nomes de testes, commits ou relatórios
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedResults.tests.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Testes
                    </h3>
                    <div className="space-y-1">
                      {groupedResults.tests.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 py-3 px-2 rounded-md hover:bg-accent transition-colors text-left"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              getStatusColor(result.status),
                            )}
                          />
                          <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.subtitle}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0"
                          >
                            Ir para Tests
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {groupedResults.reports.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Relatórios
                    </h3>
                    <div className="space-y-1">
                      {groupedResults.reports.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 py-3 px-2 rounded-md hover:bg-accent transition-colors text-left"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              getStatusColor(result.status),
                            )}
                          />
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.subtitle}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0"
                          >
                            Abrir Relatório
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {groupedResults.commits.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Commits
                    </h3>
                    <div className="space-y-1">
                      {groupedResults.commits.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 py-3 px-2 rounded-md hover:bg-accent transition-colors text-left"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              getStatusColor(result.status),
                            )}
                          />
                          <GitCommit className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.subtitle}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0"
                          >
                            Ir para History
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!displayQuery && (
                  <div className="py-8 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Comece a digitar para buscar</p>
                    <p className="text-xs mt-1 opacity-60">
                      Busque por testes, relatórios de qualidade ou commits
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
