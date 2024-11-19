/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import android.content.DialogInterface.OnShowListener
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.ModalHostViewManagerDelegate
import com.facebook.react.viewmanagers.ModalHostViewManagerInterface
import com.facebook.react.views.modal.ReactModalHostView.OnRequestCloseListener

/** View manager for [ReactModalHostView] components. */
@ReactModule(name = ReactModalHostManager.REACT_CLASS)
public class ReactModalHostManager :
    ViewGroupManager<ReactModalHostView>(), ModalHostViewManagerInterface<ReactModalHostView> {
  private val delegate: ViewManagerDelegate<ReactModalHostView> = ModalHostViewManagerDelegate(this)

  public override fun getName(): String = REACT_CLASS

  protected override fun createViewInstance(reactContext: ThemedReactContext): ReactModalHostView =
      ReactModalHostView(reactContext)

  public override fun onDropViewInstance(view: ReactModalHostView) {
    super.onDropViewInstance(view)
    view.onDropInstance()
  }

  @ReactProp(name = "animationType")
  public override fun setAnimationType(view: ReactModalHostView, animationType: String?) {
    if (animationType != null) {
      view.animationType = animationType
    }
  }

  @ReactProp(name = "transparent")
  public override fun setTransparent(view: ReactModalHostView, transparent: Boolean) {
    view.transparent = transparent
  }

  @ReactProp(name = "statusBarTranslucent")
  public override fun setStatusBarTranslucent(
      view: ReactModalHostView,
      statusBarTranslucent: Boolean
  ) {
    view.statusBarTranslucent = statusBarTranslucent
  }

  @ReactProp(name = "navigationBarTranslucent")
  public override fun setNavigationBarTranslucent(
      view: ReactModalHostView,
      navigationBarTranslucent: Boolean
  ) {
    view.navigationBarTranslucent = navigationBarTranslucent
  }

  @ReactProp(name = "hardwareAccelerated")
  public override fun setHardwareAccelerated(
      view: ReactModalHostView,
      hardwareAccelerated: Boolean
  ) {
    view.hardwareAccelerated = hardwareAccelerated
  }

  @ReactProp(name = "visible")
  public override fun setVisible(view: ReactModalHostView, visible: Boolean) {
    // iOS only
  }

  @ReactProp(name = "presentationStyle")
  public override fun setPresentationStyle(view: ReactModalHostView, value: String?): Unit = Unit

  @ReactProp(name = "animated")
  public override fun setAnimated(view: ReactModalHostView, value: Boolean): Unit = Unit

  @ReactProp(name = "supportedOrientations")
  public override fun setSupportedOrientations(
      view: ReactModalHostView,
      value: ReadableArray?
  ): Unit = Unit

  @ReactProp(name = "identifier")
  public override fun setIdentifier(view: ReactModalHostView, value: Int): Unit = Unit

  protected override fun addEventEmitters(
      reactContext: ThemedReactContext,
      view: ReactModalHostView
  ) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    if (dispatcher != null) {
      view.onRequestCloseListener = OnRequestCloseListener {
        dispatcher.dispatchEvent(
            RequestCloseEvent(UIManagerHelper.getSurfaceId(reactContext), view.id))
      }
      view.onShowListener = OnShowListener {
        dispatcher.dispatchEvent(ShowEvent(UIManagerHelper.getSurfaceId(reactContext), view.id))
      }
      view.eventDispatcher = dispatcher
    }
  }

  public override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
      (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()).apply {
        put(RequestCloseEvent.EVENT_NAME, mapOf("registrationName" to "onRequestClose"))
        put(ShowEvent.EVENT_NAME, mapOf("registrationName" to "onShow")) // iOS only
        put("topDismiss", mapOf("registrationName" to "onDismiss")) // iOS only
        put("topOrientationChange", mapOf("registrationName" to "onOrientationChange"))
      }

  protected override fun onAfterUpdateTransaction(view: ReactModalHostView) {
    super.onAfterUpdateTransaction(view)
    view.showOrUpdate()
  }

  public override fun updateState(
      view: ReactModalHostView,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  public override fun getDelegate(): ViewManagerDelegate<ReactModalHostView> = delegate

  public companion object {
    public const val REACT_CLASS: String = "RCTModalHostView"
  }
}
