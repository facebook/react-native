/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

import android.content.Context
import android.text.SpannedString

/**
 * Interface used by [BridgeDevSupportManager] to allow interception on any redboxes during
 * development and handling the information from the redbox. The implementation should be passed by
 * setRedBoxHandler in ReactInstanceManager.
 */
public interface RedBoxHandler {
  /** Callback interface for [.reportRedbox]. */
  public interface ReportCompletedListener {
    public fun onReportSuccess(spannedString: SpannedString?)

    public fun onReportError(spannedString: SpannedString?)
  }

  /** Handle the information from the redbox. */
  public fun handleRedbox(title: String?, stack: Array<StackFrame>, errorType: ErrorType)

  /** Whether the report feature is enabled. */
  public fun isReportEnabled(): Boolean

  /** Report the information from the redbox and set up a callback listener. */
  public fun reportRedbox(
      context: Context,
      title: String,
      stack: Array<StackFrame>,
      sourceUrl: String,
      reportCompletedListener: ReportCompletedListener
  )
}
