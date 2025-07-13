/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import androidx.annotation.GuardedBy
import com.facebook.common.logging.FLog
import com.facebook.debug.holder.PrinterHolder
import com.facebook.debug.tags.ReactDebugOverlayTags
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.systrace.Systrace.TRACE_TAG_REACT
import com.facebook.systrace.SystraceMessage
import java.util.concurrent.atomic.AtomicInteger
import javax.inject.Provider

/**
 * Holder to enable us to lazy create native modules.
 *
 * This works by taking a provider instead of an instance, when it is first required we'll create
 * and initialize it. Initialization currently always happens on the UI thread but this is due to
 * change for performance reasons.
 *
 * Lifecycle events via a [LifecycleEventListener] will still always happen on the UI thread.
 */
@DoNotStrip
public class ModuleHolder {
  private val instanceKey = instanceKeyCounter.getAndIncrement()
  @get:DoNotStrip public val name: String
  private val reactModuleInfo: ReactModuleInfo

  private var provider: Provider<out NativeModule>? = null
  // Outside of the constructor, this should only be checked or set when synchronized on this
  @GuardedBy("this") private var internalModule: NativeModule? = null
  // This is used to communicate phases of creation and initialization across threads
  @GuardedBy("this") private var initializable = false
  @GuardedBy("this") private var isCreating = false
  @GuardedBy("this") private var isInitializing = false

  public constructor(moduleInfo: ReactModuleInfo, provider: Provider<out NativeModule?>) {
    name = moduleInfo.name
    this.provider = provider
    reactModuleInfo = moduleInfo
    if (moduleInfo.needsEagerInit) {
      internalModule = create()
    }
  }

  public constructor(nativeModule: NativeModule) {
    name = nativeModule.name
    @Suppress("DEPRECATION")
    reactModuleInfo =
        ReactModuleInfo(
            nativeModule.name,
            nativeModule.javaClass.simpleName,
            nativeModule.canOverrideExistingModule(),
            true,
            CxxModuleWrapper::class.java.isAssignableFrom(nativeModule.javaClass),
            ReactModuleInfo.classIsTurboModule(nativeModule.javaClass))

    internalModule = nativeModule
    PrinterHolder.printer.logMessage(
        ReactDebugOverlayTags.NATIVE_MODULE, "NativeModule init: %s", name)
  }

  /*
   * Checks if [internalModule] has been created, and if so tries to initialize the module unless another
   * thread is already doing the initialization.
   * If [internalModule] has not been created, records that initialization is needed.
   */
  internal fun markInitializable() {
    var shouldInitializeNow = false
    var module: NativeModule? = null
    synchronized(this) {
      initializable = true
      if (internalModule != null) {
        check(!isInitializing)
        shouldInitializeNow = true
        module = internalModule
      }
    }
    if (shouldInitializeNow) {
      checkNotNull(module)
      doInitialize(module)
    }
  }

  @Synchronized internal fun hasInstance(): Boolean = internalModule != null

  @Synchronized
  public fun destroy() {
    internalModule?.invalidate()
  }

  public val canOverrideExistingModule: Boolean
    get() = reactModuleInfo.canOverrideExistingModule

  public val isTurboModule: Boolean
    get() = reactModuleInfo.isTurboModule

  public val isCxxModule: Boolean
    get() = reactModuleInfo.isCxxModule

  public val className: String
    get() = reactModuleInfo.className

  @get:DoNotStrip
  public val module: NativeModule
    get() {
      val module: NativeModule
      var shouldCreate = false
      synchronized(this) {
        val safeModule = internalModule
        if (safeModule != null) {
          return safeModule
          // if `internalModule` has not been set, and no one is creating it. Then this thread
          // should call
          // create
        } else if (!isCreating) {
          shouldCreate = true
          isCreating = true
        } else {
          // Wait for `internalModule` to be created by another thread
        }
      }
      if (shouldCreate) {
        module = create()
        // Once module is built (and initialized if markInitializable has been called), modify
        // `internalModule`
        // And signal any waiting threads that it is acceptable to read the field now
        synchronized(this) {
          isCreating = false
          @Suppress("PLATFORM_CLASS_MAPPED_TO_KOTLIN") (this as Object).notifyAll()
        }
        return module
      } else {
        synchronized(this) {
          // Block waiting for another thread to build `internalModule` instance
          // Since isCreating is true until after creation and instantiation (if needed), we wait
          // until the module is ready to use.
          while (internalModule == null && isCreating) {
            try {
              @Suppress("PLATFORM_CLASS_MAPPED_TO_KOTLIN") (this as Object).wait()
            } catch (e: InterruptedException) {
              continue
            }
          }
          return checkNotNull(internalModule)
        }
      }
    }

  private fun create(): NativeModule {
    SoftAssertions.assertCondition(internalModule == null, "Creating an already created module.")
    ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_START, name, instanceKey)
    SystraceMessage.beginSection(TRACE_TAG_REACT, "ModuleHolder.createModule")
        .arg("name", name)
        .flush()
    PrinterHolder.printer.logMessage(
        ReactDebugOverlayTags.NATIVE_MODULE, "NativeModule init: %s", name)
    val module: NativeModule
    try {
      module = checkNotNull(provider).get()
      provider = null
      var shouldInitializeNow = false
      synchronized(this) {
        internalModule = module
        if (initializable && !isInitializing) {
          shouldInitializeNow = true
        }
      }
      if (shouldInitializeNow) {
        doInitialize(module)
      }
    } catch (e: Throwable) {
      /**
       * When NativeModules are created from JavaScript, any exception that occurs in the creation
       * process will have its stack trace swallowed before we display a RedBox to the user. Really,
       * we should have our HostObjects on Android understand JniExceptions and log the stack trace
       * to logcat. For now, logging to Logcat directly when creation fails is sufficient.
       *
       * @todo(T53311351)
       */
      FLog.e(ReactConstants.TAG, e, "Failed to create NativeModule '%s'", name)
      throw e
    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END, name, instanceKey)
      SystraceMessage.endSection(TRACE_TAG_REACT).flush()
    }
    return module
  }

  private fun doInitialize(module: NativeModule?) {
    SystraceMessage.beginSection(TRACE_TAG_REACT, "ModuleHolder.initialize")
        .arg("name", name)
        .flush()
    ReactMarker.logMarker(ReactMarkerConstants.INITIALIZE_MODULE_START, name, instanceKey)
    try {
      var shouldInitialize = false
      // Check to see if another thread is initializing the object, if not claim the responsibility
      synchronized(this) {
        if (initializable && !isInitializing) {
          shouldInitialize = true
          isInitializing = true
        }
      }
      if (shouldInitialize) {
        module?.initialize()
        // Once finished, set flags accordingly, but we don't expect anyone to wait for this to
        // finish, so no need to notify other threads.
        synchronized(this) { isInitializing = false }
      }
    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.INITIALIZE_MODULE_END, name, instanceKey)
      SystraceMessage.endSection(TRACE_TAG_REACT).flush()
    }
  }

  private companion object {
    private val instanceKeyCounter = AtomicInteger(1)
  }
}
