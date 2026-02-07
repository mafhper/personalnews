import { createContext, useContext } from 'react';
import { FeedSource, Article } from '../types';
import { FeedLoadingState } from '../hooks/useProgressiveFeedLoading';

export interface FeedContextType {
    feeds: FeedSource[];
    setFeeds: (feeds: FeedSource[] | ((val: FeedSource[]) => FeedSource[])) => void;
    articles: Article[];
    loadingState: FeedLoadingState;
    loadFeeds: (forceRefresh?: boolean, priorityCategoryId?: string) => Promise<void>;
    startInitialLoad: () => Promise<void>;
    retryFailedFeeds: () => Promise<void>;
    cancelLoading: () => void;
    refreshFeeds: (categoryFilter?: string) => void;
}

export const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeeds = () => {
    const context = useContext(FeedContext);
    if (context === undefined) {
        throw new Error('useFeeds must be used within a FeedProvider');
    }
    return context;
};
