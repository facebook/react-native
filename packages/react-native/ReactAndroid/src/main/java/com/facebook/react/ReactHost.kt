/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.LifecycleState
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * A ReactHost is an object that manages a single [ReactInstance]. A ReactHost can be constructed
 * without initializing the ReactInstance, and it will continue to exist after the instance is
 * destroyed.
 *
 * The implementation of this interface should be Thread Safe
 */
public interface ReactHost {

  /** The current [LifecycleState] for React Host */
  public val lifecycleState: LifecycleState

  /**
   * The current [ReactContext] associated with ReactInstance. It could be nullable if ReactInstance
   * hasn't been created.
   */
  public val currentReactContext: ReactContext?

  // TODO: review if DevSupportManager should be nullable
  /** [DevSupportManager] used by this ReactHost */
  public val devSupportManager: DevSupportManager?

  // TODO: review if possible to remove ReactQueueConfiguration
  /** [ReactQueueConfiguration] for caller to post jobs in React Native threads */
  public val reactQueueConfiguration: ReactQueueConfiguration?

  /** Routes memory pressure events to interested components */
  public val memoryPressureRouter: MemoryPressureRouter

  /** To be called when back button is pressed */
  public fun onBackPressed(): Boolean

  // TODO: review why activity is nullable in all of the lifecycle methods
  /** To be called when the host activity is resumed. */
  public fun onHostResume(
      activity: Activity?,
      defaultBackButtonImpl: DefaultHardwareBackBtnHandler?
  )

  /** To be called when the host activity is resumed. */
  public fun onHostResume(activity: Activity?)

  /**
   * To be called when the host activity is about to go into the background as the result of user
   * choice.
   */
  public fun onHostLeaveHint(activity: Activity?)

  /** To be called when the host activity is paused. */
  public fun onHostPause(activity: Activity?)

  /** To be called when the host activity is paused. */
  public fun onHostPause()

  /** To be called when the host activity is destroyed. */
  public fun onHostDestroy()

  /** To be called when the host activity is destroyed. */
  public fun onHostDestroy(activity: Activity?)

  /** To be called to create and setup an ReactSurface. */
  public fun createSurface(
      context: Context,
      moduleName: String,
      initialProps: Bundle?
  ): ReactSurface

  /**
   * This function can be used to initialize the ReactInstance in a background thread before a
   * surface needs to be rendered. It is not necessary to call this function; startSurface() will
   * initialize the ReactInstance if it hasn't been preloaded.
   *
   * @return A Task that completes when the instance is initialized. The task will be faulted if any
   *   errors occur during initialization, and will be cancelled if ReactHost.destroy() is called
   *   before it completes.
   */
  public fun start(): TaskInterface<Void>

  /**
   * Entrypoint to reload the ReactInstance. If the ReactInstance is destroying, will wait until
   * destroy is finished, before reloading.
   *
   * @param reason describing why ReactHost is being reloaded (e.g. js error, user tap on reload
   *   button)
   * @return A task that completes when React Native reloads
   */
  public fun reload(reason: String): TaskInterface<Void>

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * The destroy operation is asynchronous and the task returned by this method will complete when
   * React Native gets destroyed. Note that the destroy operation will execute in multiple threads,
   * in particular some of the sub-tasks will run in the UIThread. Calling
   * [TaskInterface.waitForCompletion] from the UIThread will lead into a deadlock. Use [destroy]
   * passing the onDestroyFinished callback to be notified when React Native gets destroyed.
   *
   * @param reason describing why ReactHost is being destroyed (e.g. memory pressure)
   * @param ex exception that caused the trigger to destroy ReactHost (or null) This exception will
   *   be used to log properly the cause of destroy operation.
   * @return A task that completes when React Native gets destroyed.
   */
  public fun destroy(
      reason: String,
      ex: Exception?,
  ): TaskInterface<Void>

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * The destroy operation is asynchronous and the task returned by this method will complete when
   * React Native gets destroyed. Note that the destroy operation will execute in multiple threads,
   * in particular some of the sub-tasks will run in the UIThread. Calling
   * [TaskInterface.waitForCompletion] from the UIThread will lead into a deadlock. Use
   * onDestroyFinished callback to be notified when React Native gets destroyed.
   *
   * @param reason describing why ReactHost is being destroyed (e.g. memory pressure)
   * @param ex exception that caused the trigger to destroy ReactHost (or null) This exception will
   *   be used to log properly the cause of destroy operation.
   * @param onDestroyFinished callback that will be called when React Native gets destroyed, the
   *   callback will run on a background thread.
   * @return A task that completes when React Native gets destroyed.
   */
  public fun destroy(
      reason: String,
      ex: Exception?,
      onDestroyFinished: (instanceDestroyedSuccessfully: Boolean) -> Unit = {}
  ): TaskInterface<Void>

  /**
   * Permanently destroys the ReactHost, including the ReactInstance (if any). The application MUST
   * NOT call any further methods on an invalidated ReactHost.
   *
   * Applications where the ReactHost may be destroyed before the end of the process SHOULD call
   * invalidate() before releasing the reference to the ReactHost, to ensure resources are freed in
   * a timely manner.
   *
   * NOTE: This method is designed for complex integrations. Integrators MAY instead hold a
   * long-lived reference to a single ReactHost for the lifetime of the Application, without ever
   * calling invalidate(). This is explicitly allowed.
   */
  public fun invalidate()

  /* To be called when the host activity receives an activity result. */
  public fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
  )

  /* To be called when focus has changed for the hosting window. */
  public fun onWindowFocusChange(hasFocus: Boolean)

  /* This method will give JS the opportunity to receive intents via Linking. */
  public fun onNewIntent(intent: Intent)

  public fun onConfigurationChanged(context: Context)

  public fun addBeforeDestroyListener(onBeforeDestroy: () -> Unit)

  public fun removeBeforeDestroyListener(onBeforeDestroy: () -> Unit)

  /** Add a listener to be notified of ReactInstance events. */
  public fun addReactInstanceEventListener(listener: ReactInstanceEventListener)

  /** Remove a listener previously added with [addReactInstanceEventListener]. */
  public fun removeReactInstanceEventListener(listener: ReactInstanceEventListener)
}
