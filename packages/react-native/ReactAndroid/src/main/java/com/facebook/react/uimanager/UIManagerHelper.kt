/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // CatalystInstance is deprecated

package com.facebook.react.uimanager

import android.content.Context
import android.content.ContextWrapper
import android.view.View
import android.widget.EditText
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.UIManager
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil.getUIManagerType
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherProvider

/** Helper class for [UIManager]. */
public object UIManagerHelper {
  private const val TAG = "UIManagerHelper"
  public const val PADDING_START_INDEX: Int = 0
  public const val PADDING_END_INDEX: Int = 1
  public const val PADDING_TOP_INDEX: Int = 2
  public const val PADDING_BOTTOM_INDEX: Int = 3

  /** @return a [UIManager] that can handle the react tag received by parameter. */
  @JvmStatic
  public fun getUIManagerForReactTag(context: ReactContext, reactTag: Int): UIManager? =
      getUIManager(context, getUIManagerType(reactTag))

  /** @return a [UIManager] that can handle the react tag received by parameter. */
  @JvmStatic
  public fun getUIManager(context: ReactContext, @UIManagerType uiManagerType: Int): UIManager? =
      getUIManager(context, uiManagerType, true)

  @JvmStatic
  private fun getUIManager(
      context: ReactContext,
      @UIManagerType uiManagerType: Int,
      returnNullIfCatalystIsInactive: Boolean,
  ): UIManager? {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE || context.isBridgeless()) {
      val uiManager = context.getFabricUIManager()
      if (uiManager == null) {
        ReactSoftExceptionLogger.logSoftException(
            TAG,
            ReactNoCrashSoftException(
                "Cannot get UIManager because the instance hasn't been initialized yet."
            ),
        )
        return null
      }
      return uiManager
    }

    // The following code is compiled-out when `context.isBridgeless() == true &&
    // ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE == true ` because:
    // - BridgelessReactContext.isBridgeless() is set to true statically
    // - BridgeReactContext is compiled-out when UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE == true
    //
    // To detect a potential regression we add the following assertion ERROR
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "UIManagerHelper.getUIManager(context, uiManagerType)",
        LegacyArchitectureLogLevel.ERROR,
    )
    if (!context.hasCatalystInstance()) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException(
              "Cannot get UIManager because the context doesn't contain a CatalystInstance."
          ),
      )
      return null
    }
    // TODO T60461551: add tests to verify emission of events when the ReactContext is being turn
    // down.
    if (!context.hasActiveReactInstance()) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException(
              "Cannot get UIManager because the context doesn't contain an active" +
                  " CatalystInstance."
          ),
      )
      if (returnNullIfCatalystIsInactive) {
        return null
      }
    }
    val catalystInstance: CatalystInstance = context.getCatalystInstance()
    try {
      return if (uiManagerType == UIManagerType.Companion.FABRIC) context.getFabricUIManager()
      else catalystInstance.getNativeModule<UIManagerModule>(UIManagerModule::class.java)
    } catch (_: IllegalArgumentException) {
      // TODO T67518514 Clean this up once we migrate everything over to bridgeless mode
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException("Cannot get UIManager for UIManagerType: $uiManagerType"),
      )
      return catalystInstance.getNativeModule<UIManagerModule>(UIManagerModule::class.java)
    }
  }

  /** @return the [EventDispatcher] that handles events for the reactTag received as a parameter. */
  @JvmStatic
  public fun getEventDispatcherForReactTag(context: ReactContext, reactTag: Int): EventDispatcher? {
    val eventDispatcher = getEventDispatcher(context, getUIManagerType(reactTag))
    if (eventDispatcher == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException("Cannot get EventDispatcher for reactTag $reactTag"),
      )
    }
    return eventDispatcher
  }

  /**
   * @return the [EventDispatcher] that handles events for the [UIManagerType] received as a
   *   parameter.
   */
  @JvmStatic
  public fun getEventDispatcher(
      context: ReactContext,
      @UIManagerType uiManagerType: Int,
  ): EventDispatcher? {
    // TODO T67518514 Clean this up once we migrate everything over to bridgeless mode
    var localContext = context
    if (localContext.isBridgeless()) {
      if (localContext is ThemedReactContext) {
        localContext = localContext.reactApplicationContext
      }
      return (localContext as EventDispatcherProvider).getEventDispatcher()
    }
    val uiManager = getUIManager(localContext, uiManagerType, false)
    if (uiManager == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException("Unable to find UIManager for UIManagerType $uiManagerType"),
      )
      return null
    }
    val eventDispatcher = uiManager.eventDispatcher
    // Linter shows "Condition is always 'false'."
    // Keeping it for now as it was in the original Java code.
    @Suppress("SENSELESS_COMPARISON")
    if (eventDispatcher == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException("Cannot get EventDispatcher for UIManagerType $uiManagerType"),
      )
    }
    return eventDispatcher
  }

  /**
   * @return The [ReactContext] associated to the [View] received as a parameter.
   *
   * We can't rely that the method View.getContext() will return the same context that was passed as
   * a parameter during the construction of the View.
   *
   * For example the AppCompatEditText class wraps the context received as a parameter in the
   * constructor of the View into a TintContextWrapper object. See:
   * https://android.googlesource.com/platform/frameworks/support/+/dd55716/v7/appcompat/src/android/support/v7/widget/AppCompatEditText.java#55
   */
  @JvmStatic
  public fun getReactContext(view: View): ReactContext {
    var context = view.context
    if (context !is ReactContext && context is ContextWrapper) {
      context = context.baseContext
    }
    return context as ReactContext
  }

  /**
   * @return Gets the surfaceId for the [ThemedReactContext] associated with a View, if possible,
   *   and then call getSurfaceId on it. See above [getReactContext] for additional context.
   *
   * For RootViews, the root's rootViewTag is returned.
   *
   * Returns -1 for non-Fabric views.
   */
  @JvmStatic
  public fun getSurfaceId(view: View): Int {
    if (view is ReactRoot) {
      val rootView = view as ReactRoot
      return if (rootView.getUIManagerType() == UIManagerType.FABRIC) rootView.getRootViewTag()
      else -1
    }

    val reactTag = view.id

    // In non-Fabric we don't have (or use) SurfaceId
    if (getUIManagerType(reactTag) == UIManagerType.LEGACY) {
      return -1
    }

    var context = view.context
    if (context !is ThemedReactContext && context is ContextWrapper) {
      context = context.baseContext
    }

    val surfaceId = getSurfaceId(context)
    if (surfaceId == -1) {
      // All Fabric-managed Views (should) have a ThemedReactContext attached.
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException(
              "Fabric View [$reactTag] does not have SurfaceId associated with it"
          ),
      )
    }
    return surfaceId
  }

  @JvmStatic
  public fun getSurfaceId(context: Context?): Int =
      if (context is ThemedReactContext) {
        context.surfaceId
      } else {
        -1
      }

  /**
   * @return the default padding used by Android EditText's. This method returns the padding in an
   *   array to avoid extra classloading during hot-path of RN Android.
   */
  @JvmStatic
  public fun getDefaultTextInputPadding(context: Context?): FloatArray {
    val editText = EditText(context)
    val padding = FloatArray(4)
    padding[PADDING_START_INDEX] =
        PixelUtil.toDIPFromPixel(ViewCompat.getPaddingStart(editText).toFloat())
    padding[PADDING_END_INDEX] =
        PixelUtil.toDIPFromPixel(ViewCompat.getPaddingEnd(editText).toFloat())
    padding[PADDING_TOP_INDEX] = PixelUtil.toDIPFromPixel(editText.paddingTop.toFloat())
    padding[PADDING_BOTTOM_INDEX] = PixelUtil.toDIPFromPixel(editText.paddingBottom.toFloat())
    return padding
  }
}
