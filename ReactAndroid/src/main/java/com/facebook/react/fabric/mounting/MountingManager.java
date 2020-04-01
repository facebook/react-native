/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting;

import static com.facebook.infer.annotation.ThreadConfined.ANY;
import static com.facebook.infer.annotation.ThreadConfined.UI;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.AnyThread;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.RootViewManager;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.yoga.YogaMeasureMode;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Class responsible for actually dispatching view updates enqueued via {@link
 * FabricUIManager#scheduleMountItems(int, MountItem[])} on the UI thread.
 */
public class MountingManager {
  public static final String TAG = MountingManager.class.getSimpleName();

  @NonNull private final ConcurrentHashMap<Integer, ViewState> mTagToViewState;
  @NonNull private final JSResponderHandler mJSResponderHandler = new JSResponderHandler();
  @NonNull private final ViewManagerRegistry mViewManagerRegistry;
  @NonNull private final RootViewManager mRootViewManager = new RootViewManager();

  public MountingManager(@NonNull ViewManagerRegistry viewManagerRegistry) {
    mTagToViewState = new ConcurrentHashMap<>();
    mViewManagerRegistry = viewManagerRegistry;
  }

  /**
   * This mutates the rootView, which is an Android View, so this should only be called on the UI
   * thread.
   *
   * @param reactRootTag
   * @param rootView
   */
  @ThreadConfined(UI)
  public void addRootView(int reactRootTag, @NonNull View rootView) {
    if (rootView.getId() != View.NO_ID) {
      throw new IllegalViewOperationException(
          "Trying to add a root view with an explicit id already set. React Native uses "
              + "the id field to track react tags and will overwrite this field. If that is fine, "
              + "explicitly overwrite the id field to View.NO_ID before calling addRootView.");
    }

    mTagToViewState.put(
        reactRootTag, new ViewState(reactRootTag, rootView, mRootViewManager, true));
    rootView.setId(reactRootTag);
  }

  /** Releases all references to given native View. */
  @UiThread
  private void dropView(@NonNull View view) {
    UiThreadUtil.assertOnUiThread();

    int reactTag = view.getId();
    ViewState state = getViewState(reactTag);
    ViewManager viewManager = state.mViewManager;

    if (!state.mIsRoot && viewManager != null) {
      // For non-root views we notify viewmanager with {@link ViewManager#onDropInstance}
      viewManager.onDropViewInstance(view);
    }
    if (view instanceof ViewGroup && viewManager instanceof ViewGroupManager) {
      ViewGroup viewGroup = (ViewGroup) view;
      ViewGroupManager<ViewGroup> viewGroupManager = getViewGroupManager(state);
      for (int i = viewGroupManager.getChildCount(viewGroup) - 1; i >= 0; i--) {
        View child = viewGroupManager.getChildAt(viewGroup, i);
        if (getNullableViewState(child.getId()) != null) {
          dropView(child);
        }
        viewGroupManager.removeViewAt(viewGroup, i);
      }
    }

    mTagToViewState.remove(reactTag);
  }

  @UiThread
  public void addViewAt(int parentTag, int tag, int index) {
    UiThreadUtil.assertOnUiThread();
    ViewState parentViewState = getViewState(parentTag);
    if (!(parentViewState.mView instanceof ViewGroup)) {
      String message =
          "Unable to add a view into a view that is not a ViewGroup. ParentTag: "
              + parentTag
              + " - Tag: "
              + tag
              + " - Index: "
              + index;
      FLog.e(TAG, message);
      throw new IllegalStateException(message);
    }
    final ViewGroup parentView = (ViewGroup) parentViewState.mView;
    ViewState viewState = getViewState(tag);
    final View view = viewState.mView;
    if (view == null) {
      throw new IllegalStateException(
          "Unable to find view for viewState " + viewState + " and tag " + tag);
    }
    getViewGroupManager(parentViewState).addView(parentView, view, index);
  }

  private @NonNull ViewState getViewState(int tag) {
    ViewState viewState = mTagToViewState.get(tag);
    if (viewState == null) {
      throw new IllegalStateException("Unable to find viewState view for tag " + tag);
    }
    return viewState;
  }

  private @Nullable ViewState getNullableViewState(int tag) {
    return mTagToViewState.get(tag);
  }

  @Deprecated
  public void receiveCommand(int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    ViewState viewState = getNullableViewState(reactTag);

    // It's not uncommon for JS to send events as/after a component is being removed from the
    // view hierarchy. For example, TextInput may send a "blur" command in response to the view
    // disappearing. Throw `ReactNoCrashSoftException` so they're logged but don't crash in dev
    // for now.
    if (viewState == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState for tag: " + reactTag + " for commandId: " + commandId);
    }

    if (viewState.mViewManager == null) {
      throw new RetryableMountingLayerException("Unable to find viewManager for tag " + reactTag);
    }

    if (viewState.mView == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState view for tag " + reactTag);
    }

    viewState.mViewManager.receiveCommand(viewState.mView, commandId, commandArgs);
  }

  public void receiveCommand(
      int reactTag, @NonNull String commandId, @Nullable ReadableArray commandArgs) {
    ViewState viewState = getNullableViewState(reactTag);

    // It's not uncommon for JS to send events as/after a component is being removed from the
    // view hierarchy. For example, TextInput may send a "blur" command in response to the view
    // disappearing. Throw `ReactNoCrashSoftException` so they're logged but don't crash in dev
    // for now.
    if (viewState == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState for tag: " + reactTag + " for commandId: " + commandId);
    }

    if (viewState.mViewManager == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState manager for tag " + reactTag);
    }

    if (viewState.mView == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState view for tag " + reactTag);
    }

    viewState.mViewManager.receiveCommand(viewState.mView, commandId, commandArgs);
  }

  public void sendAccessibilityEvent(int reactTag, int eventType) {
    ViewState viewState = getViewState(reactTag);

    if (viewState.mViewManager == null) {
      throw new IllegalStateException("Unable to find viewState manager for tag " + reactTag);
    }

    if (viewState.mView == null) {
      throw new IllegalStateException("Unable to find viewState view for tag " + reactTag);
    }

    viewState.mView.sendAccessibilityEvent(eventType);
  }

  @SuppressWarnings("unchecked") // prevents unchecked conversion warn of the <ViewGroup> type
  private static @NonNull ViewGroupManager<ViewGroup> getViewGroupManager(
      @NonNull ViewState viewState) {
    if (viewState.mViewManager == null) {
      throw new IllegalStateException("Unable to find ViewManager for view: " + viewState);
    }
    return (ViewGroupManager<ViewGroup>) viewState.mViewManager;
  }

  @UiThread
  public void removeViewAt(int parentTag, int index) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getNullableViewState(parentTag);

    if (viewState == null) {
      ReactSoftException.logSoftException(
          MountingManager.TAG,
          new IllegalStateException(
              "Unable to find viewState for tag: " + parentTag + " for removeViewAt"));
      return;
    }

    final ViewGroup parentView = (ViewGroup) viewState.mView;

    if (parentView == null) {
      throw new IllegalStateException("Unable to find view for tag " + parentTag);
    }

    getViewGroupManager(viewState).removeViewAt(parentView, index);
  }

  @UiThread
  public void createView(
      @NonNull ThemedReactContext themedReactContext,
      @NonNull String componentName,
      int reactTag,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      boolean isLayoutable) {
    if (getNullableViewState(reactTag) != null) {
      return;
    }

    View view = null;
    ViewManager viewManager = null;

    ReactStylesDiffMap propsDiffMap = null;
    if (props != null) {
      propsDiffMap = new ReactStylesDiffMap(props);
    }

    if (isLayoutable) {
      viewManager = mViewManagerRegistry.get(componentName);
      // View Managers are responsible for dealing with initial state and props.
      view =
          viewManager.createView(
              themedReactContext, propsDiffMap, stateWrapper, mJSResponderHandler);
      view.setId(reactTag);
    }

    ViewState viewState = new ViewState(reactTag, view, viewManager);
    viewState.mCurrentProps = propsDiffMap;
    viewState.mCurrentState = (stateWrapper != null ? stateWrapper.getState() : null);

    mTagToViewState.put(reactTag, viewState);
  }

  @UiThread
  public void updateProps(int reactTag, @Nullable ReadableMap props) {
    if (props == null) {
      return;
    }
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getViewState(reactTag);
    viewState.mCurrentProps = new ReactStylesDiffMap(props);
    View view = viewState.mView;

    if (view == null) {
      throw new IllegalStateException("Unable to find view for tag " + reactTag);
    }

    Assertions.assertNotNull(viewState.mViewManager)
        .updateProperties(view, viewState.mCurrentProps);
  }

  @UiThread
  public void updateLayout(int reactTag, int x, int y, int width, int height) {
    UiThreadUtil.assertOnUiThread();

    ViewState viewState = getViewState(reactTag);
    // Do not layout Root Views
    if (viewState.mIsRoot) {
      return;
    }

    View viewToUpdate = viewState.mView;
    if (viewToUpdate == null) {
      throw new IllegalStateException("Unable to find View for tag: " + reactTag);
    }

    viewToUpdate.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));

    ViewParent parent = viewToUpdate.getParent();
    if (parent instanceof RootView) {
      parent.requestLayout();
    }

    // TODO: T31905686 Check if the parent of the view has to layout the view, or the child has
    // to lay itself out. see NativeViewHierarchyManager.updateLayout
    viewToUpdate.layout(x, y, x + width, y + height);
  }

  @UiThread
  public void updatePadding(int reactTag, int left, int top, int right, int bottom) {
    UiThreadUtil.assertOnUiThread();

    ViewState viewState = getViewState(reactTag);
    // Do not layout Root Views
    if (viewState.mIsRoot) {
      return;
    }

    View viewToUpdate = viewState.mView;
    if (viewToUpdate == null) {
      throw new IllegalStateException("Unable to find View for tag: " + reactTag);
    }

    ViewManager viewManager = viewState.mViewManager;
    if (viewManager == null) {
      throw new IllegalStateException("Unable to find ViewManager for view: " + viewState);
    }

    //noinspection unchecked
    viewManager.setPadding(viewToUpdate, left, top, right, bottom);
  }

  @UiThread
  public void deleteView(int reactTag) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getNullableViewState(reactTag);

    if (viewState == null) {
      ReactSoftException.logSoftException(
          MountingManager.TAG,
          new IllegalStateException(
              "Unable to find viewState for tag: " + reactTag + " for deleteView"));
      return;
    }

    View view = viewState.mView;
    if (view != null) {
      dropView(view);
    } else {
      mTagToViewState.remove(reactTag);
    }
  }

  @UiThread
  public void updateLocalData(int reactTag, @NonNull ReadableMap newLocalData) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getViewState(reactTag);
    if (viewState.mCurrentProps == null) {
      throw new IllegalStateException(
          "Can not update local data to view without props: " + reactTag);
    }
    if (viewState.mCurrentLocalData != null
        && newLocalData.hasKey("hash")
        && viewState.mCurrentLocalData.getDouble("hash") == newLocalData.getDouble("hash")
        && viewState.mCurrentLocalData.equals(newLocalData)) {
      return;
    }
    viewState.mCurrentLocalData = newLocalData;

    ViewManager viewManager = viewState.mViewManager;

    if (viewManager == null) {
      throw new IllegalStateException("Unable to find ViewManager for view: " + viewState);
    }
    Object extraData =
        viewManager.updateLocalData(
            viewState.mView,
            viewState.mCurrentProps,
            new ReactStylesDiffMap(viewState.mCurrentLocalData));
    if (extraData != null) {
      viewManager.updateExtraData(viewState.mView, extraData);
    }
  }

  @UiThread
  public void updateState(final int reactTag, @Nullable StateWrapper stateWrapper) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getViewState(reactTag);
    @Nullable ReadableNativeMap newState = stateWrapper == null ? null : stateWrapper.getState();
    if ((viewState.mCurrentState != null && viewState.mCurrentState.equals(newState))
        || (viewState.mCurrentState == null && stateWrapper == null)) {
      return;
    }
    viewState.mCurrentState = newState;

    ViewManager viewManager = viewState.mViewManager;

    if (viewManager == null) {
      throw new IllegalStateException("Unable to find ViewManager for tag: " + reactTag);
    }
    Object extraData =
        viewManager.updateState(viewState.mView, viewState.mCurrentProps, stateWrapper);
    if (extraData != null) {
      viewManager.updateExtraData(viewState.mView, extraData);
    }
  }

  @UiThread
  public void preallocateView(
      @NonNull ThemedReactContext reactContext,
      String componentName,
      int reactTag,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      boolean isLayoutable) {

    if (getNullableViewState(reactTag) != null) {
      throw new IllegalStateException(
          "View for component " + componentName + " with tag " + reactTag + " already exists.");
    }

    createView(reactContext, componentName, reactTag, props, stateWrapper, isLayoutable);
  }

  @UiThread
  public void updateEventEmitter(int reactTag, @NonNull EventEmitterWrapper eventEmitter) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = mTagToViewState.get(reactTag);
    if (viewState == null) {
      // TODO T62717437 - Use a flag to determine that these event emitters belong to virtual nodes
      // only.
      viewState = new ViewState(reactTag, null, null);
      mTagToViewState.put(reactTag, viewState);
    }
    viewState.mEventEmitter = eventEmitter;
  }

  /**
   * Set the JS responder for the view associated with the tags received as a parameter.
   *
   * <p>The JSResponder coordinates the return values of the onInterceptTouch method in Android
   * Views. This allows JS to coordinate when a touch should be handled by JS or by the Android
   * native views. See {@link JSResponderHandler} for more details.
   *
   * <p>This method is going to be executed on the UIThread as soon as it is delivered from JS to
   * RN.
   *
   * <p>Currently, there is no warranty that the view associated with the react tag exists, because
   * this method is not handled by the react commit process.
   *
   * @param reactTag React tag of the first parent of the view that is NOT virtual
   * @param initialReactTag React tag of the JS view that initiated the touch operation
   * @param blockNativeResponder If native responder should be blocked or not
   */
  @UiThread
  public synchronized void setJSResponder(
      int reactTag, int initialReactTag, boolean blockNativeResponder) {
    if (!blockNativeResponder) {
      mJSResponderHandler.setJSResponder(initialReactTag, null);
      return;
    }

    ViewState viewState = getViewState(reactTag);
    View view = viewState.mView;
    if (initialReactTag != reactTag && view instanceof ViewParent) {
      // In this case, initialReactTag corresponds to a virtual/layout-only View, and we already
      // have a parent of that View in reactTag, so we can use it.
      mJSResponderHandler.setJSResponder(initialReactTag, (ViewParent) view);
      return;
    } else if (view == null) {
      SoftAssertions.assertUnreachable("Cannot find view for tag " + reactTag + ".");
      return;
    }

    if (viewState.mIsRoot) {
      SoftAssertions.assertUnreachable(
          "Cannot block native responder on " + reactTag + " that is a root view");
    }
    mJSResponderHandler.setJSResponder(initialReactTag, view.getParent());
  }

  /**
   * Clears the JS Responder specified by {@link #setJSResponder(int, int, boolean)}. After this
   * method is called, all the touch events are going to be handled by JS.
   */
  @UiThread
  public void clearJSResponder() {
    mJSResponderHandler.clearJSResponder();
  }

  @AnyThread
  public long measure(
      @NonNull Context context,
      @NonNull String componentName,
      @NonNull ReadableMap localData,
      @NonNull ReadableMap props,
      @NonNull ReadableMap state,
      float width,
      @NonNull YogaMeasureMode widthMode,
      float height,
      @NonNull YogaMeasureMode heightMode,
      @Nullable int[] attachmentsPositions) {

    return mViewManagerRegistry
        .get(componentName)
        .measure(
            context,
            localData,
            props,
            state,
            width,
            widthMode,
            height,
            heightMode,
            attachmentsPositions);
  }

  @AnyThread
  @ThreadConfined(ANY)
  public @Nullable EventEmitterWrapper getEventEmitter(int reactTag) {
    ViewState viewState = getNullableViewState(reactTag);
    return viewState == null ? null : viewState.mEventEmitter;
  }

  /**
   * This class holds view state for react tags. Objects of this class are stored into the {@link
   * #mTagToViewState}, and they should be updated in the same thread.
   */
  private static class ViewState {
    @Nullable final View mView;
    final int mReactTag;
    final boolean mIsRoot;
    @Nullable final ViewManager mViewManager;
    @Nullable public ReactStylesDiffMap mCurrentProps = null;
    @Nullable public ReadableMap mCurrentLocalData = null;
    @Nullable public ReadableMap mCurrentState = null;
    @Nullable public EventEmitterWrapper mEventEmitter = null;

    private ViewState(int reactTag, @Nullable View view, @Nullable ViewManager viewManager) {
      this(reactTag, view, viewManager, false);
    }

    private ViewState(int reactTag, @Nullable View view, ViewManager viewManager, boolean isRoot) {
      mReactTag = reactTag;
      mView = view;
      mIsRoot = isRoot;
      mViewManager = viewManager;
    }

    @Override
    public String toString() {
      boolean isLayoutOnly = mViewManager == null;
      return "ViewState ["
          + mReactTag
          + "] - isRoot: "
          + mIsRoot
          + " - props: "
          + mCurrentProps
          + " - localData: "
          + mCurrentLocalData
          + " - viewManager: "
          + mViewManager
          + " - isLayoutOnly: "
          + isLayoutOnly;
    }
  }
}
