/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces;

import android.content.Context;
import android.text.SpannedString;
import androidx.annotation.Nullable;

/**
 * Interface used by {@link BridgeDevSupportManager} to allow interception on any redboxes during
 * development and handling the information from the redbox. The implementation should be passed by
 * setRedBoxHandler in ReactInstanceManager.
 */
public interface RedBoxHandler {
  /** Callback interface for {@link #reportRedbox}. */
  interface ReportCompletedListener {
    void onReportSuccess(SpannedString spannedString);

    void onReportError(SpannedString spannedString);
  }

  /** Handle the information from the redbox. */
  void handleRedbox(@Nullable String title, StackFrame[] stack, ErrorType errorType);

  /** Whether the report feature is enabled. */
  boolean isReportEnabled();

  /** Report the information from the redbox and set up a callback listener. */
  void reportRedbox(
      Context context,
      String title,
      StackFrame[] stack,
      String sourceUrl,
      ReportCompletedListener reportCompletedListener);
}
