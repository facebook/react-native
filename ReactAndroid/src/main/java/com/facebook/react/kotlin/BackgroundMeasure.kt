/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.kotlin

import android.content.Context
import android.widget.FrameLayout
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Composition
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MonotonicFrameClock
import androidx.compose.runtime.Recomposer
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFontLoader
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.LocalViewConfiguration
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.IntSize
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BackgroundMeasure(private val context: Context) {
  private val view = FrameLayout(context)
  private val owner =
      object : ComposeShims.BackgroundMeasureOwner(context) {
        // These methods use inline classes, so we have to override them here
        override fun calculateLocalPosition(positionInWindow: Offset): Offset = positionInWindow
        override fun calculatePositionInWindow(localPosition: Offset): Offset = localPosition
        override fun getFocusDirection(keyEvent: KeyEvent): FocusDirection? = null
        override fun requestRectangleOnScreen(rect: Rect) {}
      }
  private val root = owner.root
  private val applier = ComposeShims.createApplier(root)

  val clock =
      object : MonotonicFrameClock {
        override suspend fun <R> withFrameNanos(onFrame: (frameTimeNanos: Long) -> R): R =
            onFrame(System.nanoTime())
      }
  val coroutineContext = Dispatchers.Unconfined + clock
  val recomposer = Recomposer(coroutineContext)
  val composition = Composition(applier, recomposer)

  /** Synchronously (I hope?) measures Composable on a current thread (at least seems like so?) */
  fun measureComposable(constraints: Constraints, content: @Composable () -> Unit): IntSize {
    composition.setContent {
      CompositionLocalProvider(
          // See ProvideCommonCompositionLocals or ProvideAndroidCompositionLocals for a full list
          // Here I only added things until Text composable stopped crashing
          LocalDensity.provides(owner.density),
          LocalFontLoader.provides(owner.fontLoader),
          LocalContext.provides(context),
          LocalLayoutDirection.provides(owner.layoutDirection),
          LocalViewConfiguration.provides(owner.viewConfiguration),
          LocalView.provides(view),
          content = content)
    }

    val runRecomposeJob =
        CoroutineScope(coroutineContext).launch(start = CoroutineStart.UNDISPATCHED) {
          recomposer.runRecomposeAndApplyChanges()
        }

    ComposeShims.attachOwner(root, owner)
    owner.nodes.forEach { ComposeShims.setLayoutRequired(it) }
    (root as Measurable).measure(constraints)

    runRecomposeJob.cancel()

    return IntSize(ComposeShims.getNodeWidth(root), ComposeShims.getNodeHeight(root))
  }
}
