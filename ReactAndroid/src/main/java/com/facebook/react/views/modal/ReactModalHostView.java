/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal;

import android.annotation.TargetApi;
import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewStructure;
import android.view.Window;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.FrameLayout;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.uimanager.FabricViewStateManager;
import com.facebook.react.uimanager.JSPointerDispatcher;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.common.ContextUtils;
import com.facebook.react.views.view.ReactViewGroup;
import java.util.ArrayList;

/**
 * ReactModalHostView is a view that sits in the view hierarchy representing a Modal view.
 *
 * <p>It does a number of things:
 *
 * <ol>
 *   <li>It creates a Dialog. We use this Dialog to actually display the Modal in the window.
 *   <li>It creates a DialogRootViewGroup. This view is the view that is displayed by the Dialog. To
 *       display a view within a Dialog, that view must have its parent set to the window the Dialog
 *       creates. Because of this, we can not use the ReactModalHostView since it sits in the normal
 *       React view hierarchy. We do however want all of the layout magic to happen as if the
 *       DialogRootViewGroup were part of the hierarchy. Therefore, we forward all view changes
 *       around addition and removal of views to the DialogRootViewGroup.
 * </ol>
 */
public class ReactModalHostView extends ViewGroup
    implements LifecycleEventListener, FabricViewStateManager.HasFabricViewStateManager {

  private static final String TAG = "ReactModalHost";

  // This listener is called when the user presses KeyEvent.KEYCODE_BACK
  // An event is then passed to JS which can either close or not close the Modal by setting the
  // visible property
  public interface OnRequestCloseListener {
    void onRequestClose(DialogInterface dialog);
  }

  private DialogRootViewGroup mHostView;
  private @Nullable Dialog mDialog;
  private boolean mTransparent;
  private boolean mStatusBarTranslucent;
  private String mAnimationType;
  private boolean mHardwareAccelerated;
  // Set this flag to true if changing a particular property on the view requires a new Dialog to
  // be created.  For instance, animation does since it affects Dialog creation through the theme
  // but transparency does not since we can access the window to update the property.
  private boolean mPropertyRequiresNewDialog;
  private @Nullable DialogInterface.OnShowListener mOnShowListener;
  private @Nullable OnRequestCloseListener mOnRequestCloseListener;

  public ReactModalHostView(Context context) {
    super(context);
    ((ReactContext) context).addLifecycleEventListener(this);

    mHostView = new DialogRootViewGroup(context);
  }

  @TargetApi(23)
  @Override
  public void dispatchProvideStructure(ViewStructure structure) {
    mHostView.dispatchProvideStructure(structure);
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // Do nothing as we are laid out by UIManager
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    dismiss();
  }

  @Override
  public void addView(View child, int index) {
    UiThreadUtil.assertOnUiThread();

    mHostView.addView(child, index);
  }

  @Override
  public int getChildCount() {
    return mHostView.getChildCount();
  }

  @Override
  public View getChildAt(int index) {
    return mHostView.getChildAt(index);
  }

  @Override
  public void removeView(View child) {
    UiThreadUtil.assertOnUiThread();

    mHostView.removeView(child);
  }

  @Override
  public void removeViewAt(int index) {
    UiThreadUtil.assertOnUiThread();

    View child = getChildAt(index);
    mHostView.removeView(child);
  }

  @Override
  public void addChildrenForAccessibility(ArrayList<View> outChildren) {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the mHostView which lives in the dialog
  }

  @Override
  public boolean dispatchPopulateAccessibilityEvent(AccessibilityEvent event) {
    // Explicitly override this to prevent accessibility events being passed down to children
    // Those will be handled by the mHostView which lives in the dialog
    return false;
  }

  public void onDropInstance() {
    ((ReactContext) getContext()).removeLifecycleEventListener(this);
    dismiss();
  }

  private void dismiss() {
    UiThreadUtil.assertOnUiThread();

    if (mDialog != null) {
      if (mDialog.isShowing()) {
        Activity dialogContext =
            ContextUtils.findContextOfType(mDialog.getContext(), Activity.class);
        if (dialogContext == null || !dialogContext.isFinishing()) {
          mDialog.dismiss();
        }
      }
      mDialog = null;

      // We need to remove the mHostView from the parent
      // It is possible we are dismissing this dialog and reattaching the hostView to another
      ViewGroup parent = (ViewGroup) mHostView.getParent();
      parent.removeViewAt(0);
    }
  }

  protected void setOnRequestCloseListener(OnRequestCloseListener listener) {
    mOnRequestCloseListener = listener;
  }

  protected void setOnShowListener(DialogInterface.OnShowListener listener) {
    mOnShowListener = listener;
  }

  protected void setTransparent(boolean transparent) {
    mTransparent = transparent;
  }

  protected void setStatusBarTranslucent(boolean statusBarTranslucent) {
    mStatusBarTranslucent = statusBarTranslucent;
    mPropertyRequiresNewDialog = true;
  }

  protected void setAnimationType(String animationType) {
    mAnimationType = animationType;
    mPropertyRequiresNewDialog = true;
  }

  protected void setHardwareAccelerated(boolean hardwareAccelerated) {
    mHardwareAccelerated = hardwareAccelerated;
    mPropertyRequiresNewDialog = true;
  }

  void setEventDispatcher(EventDispatcher eventDispatcher) {
    mHostView.setEventDispatcher(eventDispatcher);
  }

  @Override
  public void onHostResume() {
    // We show the dialog again when the host resumes
    showOrUpdate();
  }

  @Override
  public void onHostPause() {
    // do nothing
  }

  @Override
  public void onHostDestroy() {
    // Drop the instance if the host is destroyed which will dismiss the dialog
    onDropInstance();
  }

  @VisibleForTesting
  public @Nullable Dialog getDialog() {
    return mDialog;
  }

  private @Nullable Activity getCurrentActivity() {
    return ((ReactContext) getContext()).getCurrentActivity();
  }

  /**
   * showOrUpdate will display the Dialog. It is called by the manager once all properties are set
   * because we need to know all of them before creating the Dialog. It is also smart during updates
   * if the changed properties can be applied directly to the Dialog or require the recreation of a
   * new Dialog.
   */
  protected void showOrUpdate() {
    UiThreadUtil.assertOnUiThread();

    // If the existing Dialog is currently up, we may need to redraw it or we may be able to update
    // the property without having to recreate the dialog
    if (mDialog != null) {
      Context dialogContext = ContextUtils.findContextOfType(mDialog.getContext(), Activity.class);
      // TODO(T85755791): remove after investigation
      FLog.e(
          TAG,
          "Updating existing dialog with context: "
              + dialogContext
              + "@"
              + dialogContext.hashCode());

      if (mPropertyRequiresNewDialog) {
        dismiss();
      } else {
        updateProperties();
        return;
      }
    }

    // Reset the flag since we are going to create a new dialog
    mPropertyRequiresNewDialog = false;
    int theme = R.style.Theme_FullScreenDialog;
    if (mAnimationType.equals("fade")) {
      theme = R.style.Theme_FullScreenDialogAnimatedFade;
    } else if (mAnimationType.equals("slide")) {
      theme = R.style.Theme_FullScreenDialogAnimatedSlide;
    }
    Activity currentActivity = getCurrentActivity();
    Context context = currentActivity == null ? getContext() : currentActivity;
    mDialog = new Dialog(context, theme);
    mDialog
        .getWindow()
        .setFlags(
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);

    // TODO(T85755791): remove after investigation
    FLog.e(TAG, "Creating new dialog from context: " + context + "@" + context.hashCode());

    mDialog.setContentView(getContentView());
    updateProperties();

    mDialog.setOnShowListener(mOnShowListener);
    mDialog.setOnKeyListener(
        new DialogInterface.OnKeyListener() {
          @Override
          public boolean onKey(DialogInterface dialog, int keyCode, KeyEvent event) {
            if (event.getAction() == KeyEvent.ACTION_UP) {
              // We need to stop the BACK button and ESCAPE key from closing the dialog by default
              // so we capture that event and instead inform JS so that it can make the decision as
              // to whether or not to allow the back/escape key to close the dialog. If it chooses
              // to, it can just set visible to false on the Modal and the Modal will go away
              if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_ESCAPE) {
                Assertions.assertNotNull(
                    mOnRequestCloseListener,
                    "setOnRequestCloseListener must be called by the manager");
                mOnRequestCloseListener.onRequestClose(dialog);
                return true;
              } else {
                // We redirect the rest of the key events to the current activity, since the
                // activity expects to receive those events and react to them, ie. in the case of
                // the dev menu
                Activity currentActivity = ((ReactContext) getContext()).getCurrentActivity();
                if (currentActivity != null) {
                  return currentActivity.onKeyUp(keyCode, event);
                }
              }
            }
            return false;
          }
        });

    mDialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
    if (mHardwareAccelerated) {
      mDialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
    }
    if (currentActivity != null && !currentActivity.isFinishing()) {
      mDialog.show();
      if (context instanceof Activity) {
        mDialog
            .getWindow()
            .getDecorView()
            .setSystemUiVisibility(
                ((Activity) context).getWindow().getDecorView().getSystemUiVisibility());
      }
      mDialog.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
    }
  }

  /**
   * Returns the view that will be the root view of the dialog. We are wrapping this in a
   * FrameLayout because this is the system's way of notifying us that the dialog size has changed.
   * This has the pleasant side-effect of us not having to preface all Modals with "top:
   * statusBarHeight", since that margin will be included in the FrameLayout.
   */
  private View getContentView() {
    FrameLayout frameLayout = new FrameLayout(getContext());
    frameLayout.addView(mHostView);
    if (mStatusBarTranslucent) {
      frameLayout.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    } else {
      frameLayout.setFitsSystemWindows(true);
    }
    return frameLayout;
  }

  /**
   * updateProperties will update the properties that do not require us to recreate the dialog
   * Properties that do require us to recreate the dialog should set mPropertyRequiresNewDialog to
   * true when the property changes
   */
  private void updateProperties() {
    Assertions.assertNotNull(mDialog, "mDialog must exist when we call updateProperties");

    Activity currentActivity = getCurrentActivity();

    Window window = mDialog.getWindow();
    if (currentActivity == null || currentActivity.isFinishing() || !window.isActive()) {
      // If the activity has disappeared, then we shouldn't update the window associated to the
      // Dialog.
      return;
    }
    int activityWindowFlags = currentActivity.getWindow().getAttributes().flags;
    if ((activityWindowFlags & WindowManager.LayoutParams.FLAG_FULLSCREEN) != 0) {
      window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
    } else {
      window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
    }

    if (mTransparent) {
      window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
    } else {
      window.setDimAmount(0.5f);
      window.setFlags(
          WindowManager.LayoutParams.FLAG_DIM_BEHIND, WindowManager.LayoutParams.FLAG_DIM_BEHIND);
    }
  }

  @Override
  public FabricViewStateManager getFabricViewStateManager() {
    return mHostView.getFabricViewStateManager();
  }

  public void updateState(final int width, final int height) {
    mHostView.updateState(width, height);
  }

  /**
   * DialogRootViewGroup is the ViewGroup which contains all the children of a Modal. It gets all
   * child information forwarded from ReactModalHostView and uses that to create children. It is
   * also responsible for acting as a RootView and handling touch events. It does this the same way
   * as ReactRootView.
   *
   * <p>To get layout to work properly, we need to layout all the elements within the Modal as if
   * they can fill the entire window. To do that, we need to explicitly set the styleWidth and
   * styleHeight on the LayoutShadowNode to be the window size. This is done through the
   * UIManagerModule, and will then cause the children to layout as if they can fill the window.
   */
  static class DialogRootViewGroup extends ReactViewGroup
      implements RootView, FabricViewStateManager.HasFabricViewStateManager {
    private boolean hasAdjustedSize = false;
    private int viewWidth;
    private int viewHeight;
    private EventDispatcher mEventDispatcher;

    private final FabricViewStateManager mFabricViewStateManager = new FabricViewStateManager();

    private final JSTouchDispatcher mJSTouchDispatcher = new JSTouchDispatcher(this);
    @Nullable private JSPointerDispatcher mJSPointerDispatcher;

    public DialogRootViewGroup(Context context) {
      super(context);
      if (ReactFeatureFlags.dispatchPointerEvents) {
        mJSPointerDispatcher = new JSPointerDispatcher(this);
      }
    }

    private void setEventDispatcher(EventDispatcher eventDispatcher) {
      mEventDispatcher = eventDispatcher;
    }

    @Override
    protected void onSizeChanged(final int w, final int h, int oldw, int oldh) {
      super.onSizeChanged(w, h, oldw, oldh);
      viewWidth = w;
      viewHeight = h;
      updateFirstChildView();
    }

    private void updateFirstChildView() {
      if (getChildCount() > 0) {
        hasAdjustedSize = false;
        final int viewTag = getChildAt(0).getId();
        if (mFabricViewStateManager.hasStateWrapper()) {
          // This will only be called under Fabric
          updateState(viewWidth, viewHeight);
        } else {
          // TODO: T44725185 remove after full migration to Fabric
          ReactContext reactContext = getReactContext();
          reactContext.runOnNativeModulesQueueThread(
              new GuardedRunnable(reactContext) {
                @Override
                public void runGuarded() {
                  UIManagerModule uiManager =
                      (getReactContext()).getNativeModule(UIManagerModule.class);

                  if (uiManager == null) {
                    return;
                  }

                  uiManager.updateNodeSize(viewTag, viewWidth, viewHeight);
                }
              });
        }
      } else {
        hasAdjustedSize = true;
      }
    }

    @UiThread
    public void updateState(final int width, final int height) {
      final float realWidth = PixelUtil.toDIPFromPixel(width);
      final float realHeight = PixelUtil.toDIPFromPixel(height);

      // Check incoming state values. If they're already the correct value, return early to prevent
      // infinite UpdateState/SetState loop.
      ReadableMap currentState = getFabricViewStateManager().getStateData();
      if (currentState != null) {
        float delta = (float) 0.9;
        float stateScreenHeight =
            currentState.hasKey("screenHeight")
                ? (float) currentState.getDouble("screenHeight")
                : 0;
        float stateScreenWidth =
            currentState.hasKey("screenWidth") ? (float) currentState.getDouble("screenWidth") : 0;

        if (Math.abs(stateScreenWidth - realWidth) < delta
            && Math.abs(stateScreenHeight - realHeight) < delta) {
          return;
        }
      }

      mFabricViewStateManager.setState(
          new FabricViewStateManager.StateUpdateCallback() {
            @Override
            public WritableMap getStateUpdate() {
              WritableMap map = new WritableNativeMap();
              map.putDouble("screenWidth", realWidth);
              map.putDouble("screenHeight", realHeight);
              return map;
            }
          });
    }

    @Override
    public void addView(View child, int index, LayoutParams params) {
      super.addView(child, index, params);
      if (hasAdjustedSize) {
        updateFirstChildView();
      }
    }

    @Override
    public void handleException(Throwable t) {
      getReactContext().handleException(new RuntimeException(t));
    }

    private ReactContext getReactContext() {
      return (ReactContext) getContext();
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent event) {
      mJSTouchDispatcher.handleTouchEvent(event, mEventDispatcher);
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.handleMotionEvent(event, mEventDispatcher);
      }
      return super.onInterceptTouchEvent(event);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
      mJSTouchDispatcher.handleTouchEvent(event, mEventDispatcher);
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.handleMotionEvent(event, mEventDispatcher);
      }
      super.onTouchEvent(event);
      // In case when there is no children interested in handling touch event, we return true from
      // the root view in order to receive subsequent events related to that gesture
      return true;
    }

    @Override
    public boolean onInterceptHoverEvent(MotionEvent event) {
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.handleMotionEvent(event, mEventDispatcher);
      }
      return super.onHoverEvent(event);
    }

    @Override
    public boolean onHoverEvent(MotionEvent event) {
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.handleMotionEvent(event, mEventDispatcher);
      }
      return super.onHoverEvent(event);
    }

    @Override
    public void onChildStartedNativeGesture(MotionEvent ev) {
      this.onChildStartedNativeGesture(null, ev);
    }

    @Override
    public void onChildStartedNativeGesture(View childView, MotionEvent ev) {
      mJSTouchDispatcher.onChildStartedNativeGesture(ev, mEventDispatcher);
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.onChildStartedNativeGesture(childView, ev, mEventDispatcher);
      }
    }

    @Override
    public void onChildEndedNativeGesture(View childView, MotionEvent ev) {
      mJSTouchDispatcher.onChildEndedNativeGesture(ev, mEventDispatcher);
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.onChildEndedNativeGesture();
      }
    }

    @Override
    public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
      // No-op - override in order to still receive events to onInterceptTouchEvent
      // even when some other view disallow that
    }

    @Override
    public FabricViewStateManager getFabricViewStateManager() {
      return mFabricViewStateManager;
    }
  }
}
