/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 package com.facebook.react.bridge

 import android.os.Handler
 import android.os.Looper
 import com.facebook.react.common.build.ReactBuildConfig
 
 /**
  * Utility for interacting with the UI thread.
  */
 public object UiThreadUtil {
 
     @Volatile private var mainHandlerInternal: Handler? = null
 
     /**
      * Handler associated with the main (UI) thread.
      * Exposed for Java interop as `getUiThreadHandler()`.
      */
     private val mainHandler: Handler
         get() {
             if (mainHandlerInternal == null) {
                 synchronized(this) {
                     if (mainHandlerInternal == null) {
                         mainHandlerInternal = Handler(Looper.getMainLooper())
                     }
                 }
             }
             return mainHandlerInternal!!
         }
 
     /**
     * Java-compatible static getter for the UI thread handler.
     */
     @JvmStatic
     public fun getUiThreadHandler(): Handler = mainHandler
     /**
      * Checks if the current thread is the UI thread.
      *
      * @return `true` if the current thread is the UI thread, `false` otherwise
      */
     @JvmStatic
     public fun isOnUiThread(): Boolean = Looper.getMainLooper().thread == Thread.currentThread()
 
     /**
      * Throws an [AssertionException] if the current thread is not the UI thread.
      * This method is only active in debug mode and is a no-op in production.
      */
     @JvmStatic
     public fun assertOnUiThread() {
         if (ReactBuildConfig.DEBUG) {
             SoftAssertions.assertCondition(isOnUiThread(), "Expected to run on UI thread!")
         }
     }
 
     /**
      * Throws an [AssertionException] if the current thread is the UI thread.
      * This method is only active in debug mode and is a no-op in production.
      */
     @JvmStatic
     public fun assertNotOnUiThread() {
         if (ReactBuildConfig.DEBUG) {
             SoftAssertions.assertCondition(!isOnUiThread(), "Expected not to run on UI thread!")
         }
     }
 
     /**
      * Runs the given [Runnable] on the UI thread.
      *
      * @param runnable the task to run
      * @return `true` if the runnable was successfully placed in the message queue
      */
     @JvmStatic
     public fun runOnUiThread(runnable: Runnable): Boolean =
         mainHandler.postDelayed(runnable, 0)
 
     /**
      * Posts a [Runnable] to run on the UI thread after a specified delay.
      *
      * @param runnable the task to run
      * @param delayInMs the delay in milliseconds before the task is executed
      * @return `true` if the runnable was successfully placed in the message queue
      */
     @JvmStatic
     public fun runOnUiThread(runnable: Runnable, delayInMs: Long): Boolean =
         mainHandler.postDelayed(runnable, delayInMs)
 
     /**
      * Removes the given [Runnable] from the UI thread queue.
      *
      * @param runnable the task to remove
      */
     @JvmStatic
     public fun removeOnUiThread(runnable: Runnable?) {
         runnable?.let { mainHandler.removeCallbacks(it) }
     }
 }
 