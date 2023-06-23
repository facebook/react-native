/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces

import android.app.Activity
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.LifecycleState
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * A ReactHost is an object that manages a single {@link ReactInstance}. A ReactHost can be
 * constructed without initializing the ReactInstance, and it will continue to exist after the
 * instance is destroyed.
 *
 * The implementation of this interface should be Thread Safe
 */
@UnstableReactNativeAPI
interface ReactHostInterface {

  /** The current [LifecycleState] for React Host */
  val lifecycleState: LifecycleState

  /**
   * The current [ReactContext] associated with ReactInstance. It could be nullable if ReactInstance
   * hasn't been created.
   */
  val currentReactContext: ReactContext?

  // TODO: review if DevSupportManager should be nullable
  /** [DevSupportManager] used by this ReactHost */
  val devSupportManager: DevSupportManager?

  // TODO: review if possible to remove ReactQueueConfiguration
  /** [ReactQueueConfiguration] for caller to post jobs in React Native threads */
  val reactQueueConfiguration: ReactQueueConfiguration?

  /** To be called when back button is pressed */
  fun onBackPressed(): Boolean

  // TODO: review why activity is nullable in all of the lifecycle methods
  /** To be called when the host activity is resumed. */
  fun onHostResume(activity: Activity?, defaultBackButtonImpl: DefaultHardwareBackBtnHandler?)

  /** To be called when the host activity is resumed. */
  fun onHostResume(activity: Activity?)

  /** To be called when the host activity is paused. */
  fun onHostPause(activity: Activity?)

  /** To be called when the host activity is paused. */
  fun onHostPause()

  /** To be called when the host activity is destroyed. */
  fun onHostDestroy()

  /** To be called when the host activity is destroyed. */
  fun onHostDestroy(activity: Activity?)
}
