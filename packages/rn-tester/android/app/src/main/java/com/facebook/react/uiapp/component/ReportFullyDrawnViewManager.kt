/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.RNTReportFullyDrawnViewManagerDelegate
import com.facebook.react.viewmanagers.RNTReportFullyDrawnViewManagerInterface

/** View manager for ReportFullyDrawnView components. */
@ReactModule(name = ReportFullyDrawnViewManager.REACT_CLASS)
internal class ReportFullyDrawnViewManager :
    ViewGroupManager<ReportFullyDrawnView>(),
    RNTReportFullyDrawnViewManagerInterface<ReportFullyDrawnView> {

  companion object {
    const val REACT_CLASS = "RNTReportFullyDrawnView"
  }

  private val delegate: ViewManagerDelegate<ReportFullyDrawnView> =
      RNTReportFullyDrawnViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<ReportFullyDrawnView> = delegate

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): ReportFullyDrawnView =
      ReportFullyDrawnView(reactContext)
}
