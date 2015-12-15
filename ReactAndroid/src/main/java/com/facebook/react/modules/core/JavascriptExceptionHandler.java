package com.facebook.react.modules.core;

import com.facebook.react.bridge.ReadableArray;

/**
 * Handler for runtime JS error.
 */
public interface JavascriptExceptionHandler {
  /**
   * Javascript runtime error occurred. This is the first place a javascript
   */
  void handleNewError(String title, ReadableArray details, int exceptionId, String exceptionMessage);

  /**
   * Update error detail
   */
  void updateError(String title, ReadableArray details, int exceptionId,String exceptionMessage);
}
