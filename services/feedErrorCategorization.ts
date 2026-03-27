import {
  classifyFeedFailureCause,
  type FeedFailureCause,
} from "./feedDiagnostics";

export type FeedErrorType = FeedFailureCause;

export const categorizeFeedError = (error: string): FeedErrorType => {
  return classifyFeedFailureCause(error);
};
