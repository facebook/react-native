package com.facebook.react.jstasks;

public class NoRetryPolicy implements HeadlessJsTaskRetryPolicy {

  public static final NoRetryPolicy INSTANCE = new NoRetryPolicy();

  private NoRetryPolicy() {}

  @Override
  public boolean canRetry() {
    return false;
  }

  @Override
  public int getDelay() {
    throw new IllegalStateException("Should not retrieve delay as canRetry is: " + canRetry());
  }

  @Override
  public HeadlessJsTaskRetryPolicy update() {
    throw new IllegalStateException("Should not update as canRetry is: " + canRetry());
  }

  @Override
  public HeadlessJsTaskRetryPolicy copy() {
    // Class is immutable so no need to copy
    return this;
  }
}
