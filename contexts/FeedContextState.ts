import { createContext, useContext } from 'react';
import { FeedSource, Article, FeedLoadRequest } from '../types';
import { FeedLoadingState } from '../hooks/useProgressiveFeedLoading';

export interface FeedContextType {
    feeds: FeedSource[];
    setFeeds: (feeds: FeedSource[] | ((val: FeedSource[]) => FeedSource[])) => void;
    articles: Article[];
    loadingState: FeedLoadingState;
    loadFeeds: (request?: FeedLoadRequest) => Promise<void>;
    startInitialLoad: () => Promise<void>;
    retryFailedFeeds: () => Promise<void>;
    cancelLoading: () => void;
    refreshFeeds: (request?: FeedLoadRequest) => void;
}

export const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeeds = () => {
    const context = useContext(FeedContext);
    if (context === undefined) {
        throw new Error('useFeeds must be used within a FeedProvider');
    }
    return context;
};
