package com.facebook.react.modules.core;

import com.facebook.react.bridge.ReadableArray;

/**
 * Handler for runtime JS error.
 */
public interface JavascriptExceptionHandler {
  /**
   * Javascript runtime error occurred for the first time.
   */
  void handleNewError(String title, ReadableArray details, int exceptionId, String exceptionMessage);

  /**
   * Update detail of error which was already passed to {@link #handleNewError(String, ReadableArray, int, String)}.
   *
   */
  void updateError(String title, ReadableArray details, int exceptionId,String exceptionMessage);
}
