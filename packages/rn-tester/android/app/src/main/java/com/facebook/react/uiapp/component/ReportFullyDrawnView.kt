/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

internal class ReportFullyDrawnView(context: ThemedReactContext) : ReactViewGroup(context) {
  private val reactApplicationContext = context.reactApplicationContext
  private var didReportFullyDrawn = false

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)

    if (!didReportFullyDrawn) {
      didReportFullyDrawn = true

      val activity = reactApplicationContext.currentActivity as? AppCompatActivity
      activity?.fullyDrawnReporter?.removeReporter()
    }
  }
}
