/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import android.text.SpannedString;

import com.facebook.react.devsupport.interfaces.StackFrame;

/**
 * Interface used by {@link DevSupportManagerImpl} to allow interception on any redboxes
 * during development and handling the information from the redbox.
 * The implementation should be passed by setRedBoxHandler in ReactInstanceManager.
 */
public interface RedBoxHandler {
  enum ErrorType {
    JS("JS"),
    NATIVE("Native");

    private final String name;
    ErrorType(String name) {
      this.name = name;
    }
    public String getName() {
      return name;
    }
  }

  /**
   * Callback interface for {@link #reportRedbox}.
   */
  interface ReportCompletedListener {
    void onReportSuccess(SpannedString spannedString);
    void onReportError(SpannedString spannedString);
  }

  /**
   * Handle the information from the redbox.
   */
  void handleRedbox(String title, StackFrame[] stack, ErrorType errorType);

  /**
   * Whether the report feature is enabled.
   */
  boolean isReportEnabled();

  /**
   * Report the information from the redbox and set up a callback listener.
   */
  void reportRedbox(
      Context context,
      String title,
      StackFrame[] stack,
      String sourceUrl,
      ReportCompletedListener reportCompletedListener);
}
