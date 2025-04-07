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
 
/** Utility for interacting with the UI thread. */
public object UiThreadUtil {
 
    @Volatile private var _mainHandler: Handler? = null
 
    private val mainHandler: Handler
        get() {
             if (_mainHandler == null) {
                 synchronized(this) {
                     if (_mainHandler == null) {
                         _mainHandler = Handler(Looper.getMainLooper())
                     }
                 }
             }
             return _mainHandler!!
        }
 
    /** Exposed for Java interop (e.g. Java calls to `UiThreadUtil.getUiThreadHandler()`) */
    @JvmStatic
    public fun getUiThreadHandler(): Handler {
         return mainHandler
    }
 
    /** @return `true` if current thread is the UI thread. */
    @JvmStatic
    public fun isOnUiThread(): Boolean {
         return Looper.getMainLooper().thread == Thread.currentThread()
    }
 
    /**
      * Throws an {@link AssertionException} if the current thread is not the UI thread. This is a
      * noop in production, and is only meant to run in debug mode! If you need to check for
      * incorrect-thread issues in production, duplicate this code and call it elsewhere.
    */
    @JvmStatic
    public fun assertOnUiThread() {
         if (ReactBuildConfig.DEBUG) {
             SoftAssertions.assertCondition(isOnUiThread(), "Expected to run on UI thread!")
         }
    }
 
    /**
      * Throws an {@link AssertionException} if the current thread is the UI thread. This is a noop
      * in production, and is only meant to run in debug mode! If you need to check for
      * incorrect-thread issues in production, duplicate this code and call it elsewhere.
      */
    @JvmStatic
    public fun assertNotOnUiThread() {
         if (ReactBuildConfig.DEBUG) {
             SoftAssertions.assertCondition(!isOnUiThread(), "Expected not to run on UI thread!")
         }
    }
 
     /** Runs the given {@code Runnable} on the UI thread. */
    @JvmStatic
    public fun runOnUiThread(runnable: Runnable): Boolean {
         return mainHandler.postDelayed(runnable, 0)
    }
 
    /** Posts a Runnable on the UI thread after a delay. */
    @JvmStatic
    public fun runOnUiThread(runnable: Runnable, delayInMs: Long): Boolean {
         return mainHandler.postDelayed(runnable, delayInMs)
     }
 
    /** Removes the given {@code Runnable} on the UI thread. */
    @JvmStatic
    public fun removeOnUiThread(runnable: Runnable?) {
         runnable?.let { mainHandler.removeCallbacks(it) }
    }
 }
 