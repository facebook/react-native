/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.app.Activity
import android.content.Context
import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.LifecycleState
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * A ReactHost is an object that manages a single {@link ReactInstance}. A ReactHost can be
 * constructed without initializing the ReactInstance, and it will continue to exist after the
 * instance is destroyed.
 *
 * The implementation of this interface should be Thread Safe
 */
interface ReactHost {

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

  /** To be called to create and setup an ReactSurface. */
  fun createSurface(context: Context, moduleName: String, initialProps: Bundle?): ReactSurface?

  /**
   * This function can be used to initialize the ReactInstance in a background thread before a
   * surface needs to be rendered. It is not necessary to call this function; startSurface() will
   * initialize the ReactInstance if it hasn't been preloaded.
   *
   * @return A Task that completes when the instance is initialized. The task will be faulted if any
   *   errors occur during initialization, and will be cancelled if ReactHost.destroy() is called
   *   before it completes.
   */
  fun start(): TaskInterface<Void>

  /**
   * Entrypoint to reload the ReactInstance. If the ReactInstance is destroying, will wait until
   * destroy is finished, before reloading.
   *
   * @param reason describing why ReactHost is being reloaded (e.g. js error, user tap on reload
   *   button)
   * @return A task that completes when React Native reloads
   */
  fun reload(reason: String): TaskInterface<Void>

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * @param reason describing why ReactHost is being destroyed (e.g. memmory pressure)
   * @param ex exception that caused the trigger to destroy ReactHost (or null) This exception will
   *   be used to log properly the cause of destroy operation.
   * @return A task that completes when React Native gets destroyed.
   */
  fun destroy(reason: String, ex: Exception?): TaskInterface<Void>

  fun addBeforeDestroyListener(onBeforeDestroy: () -> Unit)

  fun removeBeforeDestroyListener(onBeforeDestroy: () -> Unit)
}
