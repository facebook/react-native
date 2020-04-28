package com.facebook.react.jstasks;

public class LinearCountingRetryPolicy implements HeadlessJsTaskRetryPolicy {

  private final int mRetryAttempts;
  private final int mDelayBetweenAttemptsInMs;

  public LinearCountingRetryPolicy(int retryAttempts, int delayBetweenAttemptsInMs) {
    mRetryAttempts = retryAttempts;
    mDelayBetweenAttemptsInMs = delayBetweenAttemptsInMs;
  }

  @Override
  public boolean canRetry() {
    return mRetryAttempts > 0;
  }

  @Override
  public int getDelay() {
    return mDelayBetweenAttemptsInMs;
  }

  @Override
  public HeadlessJsTaskRetryPolicy update() {
    final int remainingRetryAttempts = mRetryAttempts - 1;

    if (remainingRetryAttempts > 0) {
      return new LinearCountingRetryPolicy(remainingRetryAttempts, mDelayBetweenAttemptsInMs);
    } else {
      return NoRetryPolicy.INSTANCE;
    }
  }

  @Override
  public HeadlessJsTaskRetryPolicy copy() {
    return new LinearCountingRetryPolicy(mRetryAttempts, mDelayBetweenAttemptsInMs);
  }
}
