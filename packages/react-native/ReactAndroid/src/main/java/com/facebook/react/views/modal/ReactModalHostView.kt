/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.modal

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.content.DialogInterface
import android.os.Build
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.Window
import android.view.WindowInsetsController
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import androidx.annotation.UiThread
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.common.ContextUtils
import com.facebook.react.views.view.setStatusBarTranslucency
import com.facebook.react.views.view.ReactViewGroup
import java.util.Objects

/**
 * ReactModalHostView is a view that sits in the view hierarchy representing a Modal view.
 *
 * It does a number of things:
 * 1. It creates a [Dialog]. We use this Dialog to actually display the Modal in the window.
 * 2. It creates a [DialogRootViewGroup]. This view is the view that is displayed by the Dialog. To
 *    display a view within a Dialog, that view must have its parent set to the window the Dialog
 *    creates. Because of this, we can not use the ReactModalHostView since it sits in the normal
 *    React view hierarchy. We do however want all of the layout magic to happen as if the
 *    DialogRootViewGroup were part of the hierarchy. Therefore, we forward all view changes around
 *    addition and removal of views to the DialogRootViewGroup.
 */
@SuppressLint("ViewConstructor")
public class ReactModalHostView(context: ThemedReactContext) :
    ViewGroup(context), LifecycleEventListener {

  @get:VisibleForTesting
  public var dialog: Dialog? = null
    private set

  public var transparent: Boolean = false
  public var onShowListener: DialogInterface.OnShowListener? = null
  public var onRequestCloseListener: OnRequestCloseListener? = null
  public var statusBarTranslucent: Boolean = false
    set(value) {
      field = value
      createNewDialog = true
    }

  public var animationType: String? = null
    set(value) {
      field = value
      createNewDialog = true
    }

  public var hardwareAccelerated: Boolean = false
    set(value) {
      field = value
      createNewDialog = true
    }

  public var stateWrapper: StateWrapper?
    get() = dialogRootViewGroup.stateWrapper
    public set(stateWrapper) {
      dialogRootViewGroup.stateWrapper = stateWrapper
    }

  public var eventDispatcher: EventDispatcher?
    get() = dialogRootViewGroup.eventDispatcher
    public set(eventDispatcher) {
      dialogRootViewGroup.eventDispatcher = eventDispatcher
    }

  private val dialogRootViewGroup: DialogRootViewGroup

  // Set this flag to true if changing a particular property on the view requires a new Dialog to
  // be created or Dialog was destroyed. For instance, animation does since it affects Dialog
  // creation through the theme
  // but transparency does not since we can access the window to update the property.
  private var createNewDialog = false

  init {
    context.addLifecycleEventListener(this)
    dialogRootViewGroup = DialogRootViewGroup(context)
  }

  public override fun dispatchProvideStructure(structure: ViewStructure) {
    dialogRootViewGroup.dispatchProvideStructure(structure)
  }

  protected override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // Do nothing as we are laid out by UIManager
  }

  override fun setId(id: Int) {
    super.setId(id)

    // Forward the ID to our content view, so event dispatching behaves correctly
    dialogRootViewGroup.id = id
  }

  protected override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    dismiss()
  }

  public override fun addView(child: View?, index: Int) {
    UiThreadUtil.assertOnUiThread()
    dialogRootViewGroup.addView(child, index)
  }

  public override fun getChildCount(): Int = dialogRootViewGroup.childCount

  public override fun getChildAt(index: Int): View? = dialogRootViewGroup.getChildAt(index)

  public override fun removeView(child: View?) {
    UiThreadUtil.assertOnUiThread()

    if (child != null) {
      dialogRootViewGroup.removeView(child)
    }
  }

  public override fun removeViewAt(index: Int) {
    UiThreadUtil.assertOnUiThread()
    val child = getChildAt(index)
    dialogRootViewGroup.removeView(child)
  }

  public override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the mHostView which lives in the dialog
  }

  // Explicitly override this to prevent accessibility events being passed down to children
  // Those will be handled by the mHostView which lives in the dialog
  public override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean = false

  public fun onDropInstance() {
    (context as ThemedReactContext).removeLifecycleEventListener(this)
    dismiss()
  }

  private fun dismiss() {
    UiThreadUtil.assertOnUiThread()

    dialog?.let { nonNullDialog ->
      if (nonNullDialog.isShowing) {
        val dialogContext =
            ContextUtils.findContextOfType(nonNullDialog.context, Activity::class.java)
        if (dialogContext == null || !dialogContext.isFinishing) {
          nonNullDialog.dismiss()
        }
      }
      dialog = null
      createNewDialog = true

      // We need to remove the mHostView from the parent
      // It is possible we are dismissing this dialog and reattaching the hostView to another
      (dialogRootViewGroup.parent as? ViewGroup)?.removeViewAt(0)
    }
  }

  public override fun onHostResume() {
    // We show the dialog again when the host resumes
    showOrUpdate()
  }

  public override fun onHostPause() {
    // do nothing
  }

  public override fun onHostDestroy() {
    // Drop the instance if the host is destroyed which will dismiss the dialog
    onDropInstance()
  }

  private fun getCurrentActivity(): Activity? = (context as ThemedReactContext).currentActivity

  /**
   * showOrUpdate will display the Dialog. It is called by the manager once all properties are set
   * because we need to know all of them before creating the Dialog. It is also smart during updates
   * if the changed properties can be applied directly to the Dialog or require the recreation of a
   * new Dialog.
   */
  public fun showOrUpdate() {
    UiThreadUtil.assertOnUiThread()

    // If the existing Dialog is currently up, we may need to redraw it or we may be able to update
    // the property without having to recreate the dialog
    if (createNewDialog) {
      dismiss()
    } else {
      updateProperties()
      return
    }

    // Reset the flag since we are going to create a new dialog
    createNewDialog = false
    val theme: Int =
        when (animationType) {
          "fade" -> R.style.Theme_FullScreenDialogAnimatedFade
          "slide" -> R.style.Theme_FullScreenDialogAnimatedSlide
          else -> R.style.Theme_FullScreenDialog
        }

    val currentActivity = getCurrentActivity()
    val newDialog = Dialog(currentActivity ?: context, theme)
    dialog = newDialog
    Objects.requireNonNull<Window>(newDialog.window)
        .setFlags(
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE)

    newDialog.setContentView(contentView)
    updateProperties()

    newDialog.setOnShowListener(onShowListener)
    newDialog.setOnKeyListener(
        object : DialogInterface.OnKeyListener {
          override fun onKey(dialog: DialogInterface, keyCode: Int, event: KeyEvent): Boolean {
            if (event.action == KeyEvent.ACTION_UP) {
              // We need to stop the BACK button and ESCAPE key from closing the dialog by default
              // so we capture that event and instead inform JS so that it can make the decision as
              // to whether or not to allow the back/escape key to close the dialog. If it chooses
              // to, it can just set visible to false on the Modal and the Modal will go away
              if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_ESCAPE) {
                val listener =
                    checkNotNull(onRequestCloseListener) {
                      "onRequestClose callback must be set if back key is expected to close the modal"
                    }
                listener.onRequestClose(dialog)
                return true
              } else {
                // We redirect the rest of the key events to the current activity, since the
                // activity expects to receive those events and react to them, ie. in the case of
                // the dev menu
                val innerCurrentActivity =
                    (this@ReactModalHostView.context as ReactContext).currentActivity
                if (innerCurrentActivity != null) {
                  return innerCurrentActivity.onKeyUp(keyCode, event)
                }
              }
            }
            return false
          }
        })

    newDialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
    if (hardwareAccelerated) {
      newDialog.window?.addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED)
    }
    if (currentActivity?.isFinishing == false) {
      newDialog.show()
      updateSystemAppearance()
      newDialog.window?.clearFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE)
    }
  }

  private val contentView: View
    /**
     * Returns the view that will be the root view of the dialog. We are wrapping this in a
     * FrameLayout because this is the system's way of notifying us that the dialog size has
     * changed. This has the pleasant side-effect of us not having to preface all Modals with "top:
     * statusBarHeight", since that margin will be included in the FrameLayout.
     */
    get() = FrameLayout(context).apply { addView(dialogRootViewGroup) }

  /**
   * updateProperties will update the properties that do not require us to recreate the dialog
   * Properties that do require us to recreate the dialog should set mPropertyRequiresNewDialog to
   * true when the property changes
   */
  private fun updateProperties() {
    val dialog = checkNotNull(dialog) { "dialog must exist when we call updateProperties" }
    val dialogWindow =
        checkNotNull(dialog.window) { "dialog must have window when we call updateProperties" }
    val currentActivity = getCurrentActivity()
    if (currentActivity == null || currentActivity.isFinishing || currentActivity.isDestroyed) {
      // If the activity has disappeared, then we shouldn't update the window associated to the
      // Dialog.
      return
    }
    try {
      val activityWindow = currentActivity.window
      if (activityWindow != null) {
        val activityWindowFlags = activityWindow.attributes.flags
        if ((activityWindowFlags and WindowManager.LayoutParams.FLAG_FULLSCREEN) != 0) {
          dialogWindow.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        } else {
          dialogWindow.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        }
      }

      dialogWindow.setStatusBarTranslucency(statusBarTranslucent)

      if (transparent) {
        dialogWindow.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
      } else {
        dialogWindow.setDimAmount(0.5f)
        dialogWindow.setFlags(
            WindowManager.LayoutParams.FLAG_DIM_BEHIND, WindowManager.LayoutParams.FLAG_DIM_BEHIND)
      }
    } catch (e: IllegalArgumentException) {
      // This is to prevent a crash from the following error, without a clear repro steps:
      // java.lang.IllegalArgumentException: View=DecorView@c94931b[XxxActivity] not attached to
      // window manager
      FLog.e(
          ReactConstants.TAG, "ReactModalHostView: error while setting window flags: ", e.message)
    }
  }

  private fun updateSystemAppearance() {
    val currentActivity = getCurrentActivity() ?: return
    val dialog = checkNotNull(dialog) { "dialog must exist when we call updateProperties" }
    val dialogWindow =
        checkNotNull(dialog.window) { "dialog must have window when we call updateProperties" }
    val activityWindow = currentActivity.window
    // Modeled after the version check in StatusBarModule.setStyle
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) {
      val insetsController: WindowInsetsController = checkNotNull(activityWindow.insetsController)
      val activityAppearance: Int = insetsController.systemBarsAppearance

      val activityLightStatusBars =
          activityAppearance and WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS

      dialogWindow.insetsController?.setSystemBarsAppearance(
          activityLightStatusBars, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS)
    } else {
      dialogWindow.decorView.systemUiVisibility = activityWindow.decorView.systemUiVisibility
    }
  }

  // This listener is called when the user presses KeyEvent.KEYCODE_BACK
  // An event is then passed to JS which can either close or not close the Modal by setting the
  // visible property
  public fun interface OnRequestCloseListener {
    public fun onRequestClose(dialog: DialogInterface?)
  }

  private companion object {
    private const val TAG = "ReactModalHost"
  }

  /**
   * DialogRootViewGroup is the ViewGroup which contains all the children of a Modal. It gets all
   * child information forwarded from [ReactModalHostView] and uses that to create children. It is
   * also responsible for acting as a RootView and handling touch events. It does this the same way
   * as ReactRootView.
   *
   * To get layout to work properly, we need to layout all the elements within the Modal as if they
   * can fill the entire window. To do that, we need to explicitly set the styleWidth and
   * styleHeight on the LayoutShadowNode to be the window size. This is done through the
   * UIManagerModule, and will then cause the children to layout as if they can fill the window.
   */
  public class DialogRootViewGroup internal constructor(context: Context?) :
      ReactViewGroup(context), RootView {
    internal var stateWrapper: StateWrapper? = null
    internal var eventDispatcher: EventDispatcher? = null

    private var viewWidth = 0
    private var viewHeight = 0
    private val jSTouchDispatcher: JSTouchDispatcher = JSTouchDispatcher(this)
    private var jSPointerDispatcher: JSPointerDispatcher? = null

    private val reactContext: ThemedReactContext
      get() = context as ThemedReactContext

    init {
      if (ReactFeatureFlags.dispatchPointerEvents) {
        jSPointerDispatcher = JSPointerDispatcher(this)
      }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
      super.onSizeChanged(w, h, oldw, oldh)
      viewWidth = w
      viewHeight = h

      updateState(viewWidth, viewHeight)
    }

    @UiThread
    public fun updateState(width: Int, height: Int) {
      val realWidth: Float = width.toFloat().pxToDp()
      val realHeight: Float = height.toFloat().pxToDp()

      stateWrapper?.let { sw ->
        // new architecture
        val newStateData: WritableMap = WritableNativeMap()
        newStateData.putDouble("screenWidth", realWidth.toDouble())
        newStateData.putDouble("screenHeight", realHeight.toDouble())
        sw.updateState(newStateData)
      } ?: run {
          // old architecture
          // TODO: T44725185 remove after full migration to Fabric
          reactContext.runOnNativeModulesQueueThread(
              object : GuardedRunnable(reactContext) {
                override fun runGuarded() {
                  reactContext.reactApplicationContext
                      .getNativeModule(UIManagerModule::class.java)
                      ?.updateNodeSize(id, viewWidth, viewHeight)
                }
              })
        }
    }

    override fun handleException(t: Throwable) {
      reactContext.reactApplicationContext.handleException(RuntimeException(t))
    }

    override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
      eventDispatcher?.let { eventDispatcher ->
        jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
        jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
      }
      return super.onInterceptTouchEvent(event)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
      eventDispatcher?.let { eventDispatcher ->
        jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
        jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
      }
      super.onTouchEvent(event)
      // In case when there is no children interested in handling touch event, we return true from
      // the root view in order to receive subsequent events related to that gesture
      return true
    }

    override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
      eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, true) }
      return super.onHoverEvent(event)
    }

    override fun onHoverEvent(event: MotionEvent): Boolean {
      eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, false) }
      return super.onHoverEvent(event)
    }

    override fun onChildStartedNativeGesture(childView: View, ev: MotionEvent) {
      eventDispatcher?.let { eventDispatcher ->
        jSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher)
        jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, eventDispatcher)
      }
    }

    override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
      eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
      jSPointerDispatcher?.onChildEndedNativeGesture()
    }

    override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
      // No-op - override in order to still receive events to onInterceptTouchEvent
      // even when some other view disallow that
    }
  }
}
