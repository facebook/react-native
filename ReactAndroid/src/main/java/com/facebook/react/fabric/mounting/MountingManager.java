/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.AnyThread;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
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

  private final ConcurrentHashMap<Integer, ViewState> mTagToViewState;
  private final ViewManagerRegistry mViewManagerRegistry;
  private final RootViewManager mRootViewManager = new RootViewManager();
  private final ViewFactory mViewFactory;

  public MountingManager(ViewManagerRegistry viewManagerRegistry) {
    mTagToViewState = new ConcurrentHashMap<>();
    mViewManagerRegistry = viewManagerRegistry;
    mViewFactory = new ViewManagerFactory(viewManagerRegistry);
  }

  public void addRootView(int reactRootTag, View rootView) {
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
  private void dropView(View view) {
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
        if (mTagToViewState.get(child.getId()) != null) {
          dropView(child);
        }
        viewGroupManager.removeViewAt(viewGroup, i);
      }
    }

    mTagToViewState.remove(reactTag);
    Context context = view.getContext();
    if (context instanceof ThemedReactContext) {
      // We only recycle views that were created by RN (its context is instance of
      // ThemedReactContext)
      mViewFactory.recycle(
          (ThemedReactContext) context, Assertions.assertNotNull(viewManager).getName(), view);
    }
  }

  /** Releases all references to react root tag. */
  @UiThread
  public void removeRootView(int reactRootTag) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = mTagToViewState.get(reactRootTag);
    if (viewState == null || !viewState.mIsRoot) {
      SoftAssertions.assertUnreachable(
          "View with tag " + reactRootTag + " is not registered as a root view");
    }
    if (viewState.mView != null) {
      dropView(viewState.mView);
    }
  }

  @UiThread
  public void addViewAt(int parentTag, int tag, int index) {
    UiThreadUtil.assertOnUiThread();
    ViewState parentViewState = getViewState(parentTag);
    final ViewGroup parentView = (ViewGroup) parentViewState.mView;
    ViewState viewState = getViewState(tag);
    final View view = viewState.mView;
    if (view == null) {
      throw new IllegalStateException("Unable to find view for viewState " + viewState);
    }
    getViewGroupManager(parentViewState).addView(parentView, view, index);
  }

  private ViewState getViewState(int tag) {
    ViewState viewState = mTagToViewState.get(tag);
    if (viewState == null) {
      throw new IllegalStateException("Unable to find viewState view " + viewState);
    }
    return viewState;
  }

  @Deprecated
  public void receiveCommand(int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    ViewState viewState = getViewState(reactTag);

    if (viewState.mViewManager == null) {
      throw new IllegalStateException("Unable to find viewState manager for tag " + reactTag);
    }

    if (viewState.mView == null) {
      throw new IllegalStateException("Unable to find viewState view for tag " + reactTag);
    }

    viewState.mViewManager.receiveCommand(viewState.mView, commandId, commandArgs);
  }

  public void receiveCommand(int reactTag, String commandId, @Nullable ReadableArray commandArgs) {
    ViewState viewState = getViewState(reactTag);

    if (viewState.mViewManager == null) {
      throw new IllegalStateException("Unable to find viewState manager for tag " + reactTag);
    }

    if (viewState.mView == null) {
      throw new IllegalStateException("Unable to find viewState view for tag " + reactTag);
    }

    viewState.mViewManager.receiveCommand(viewState.mView, commandId, commandArgs);
  }

  @SuppressWarnings("unchecked") // prevents unchecked conversion warn of the <ViewGroup> type
  private static ViewGroupManager<ViewGroup> getViewGroupManager(ViewState viewState) {
    if (viewState.mViewManager == null) {
      throw new IllegalStateException("Unable to find ViewManager for view: " + viewState);
    }
    return (ViewGroupManager<ViewGroup>) viewState.mViewManager;
  }

  @UiThread
  public void removeViewAt(int parentTag, int index) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getViewState(parentTag);
    final ViewGroup parentView = (ViewGroup) viewState.mView;
    if (parentView == null) {
      throw new IllegalStateException("Unable to find view for tag " + parentTag);
    }

    getViewGroupManager(viewState).removeViewAt(parentView, index);
  }

  @UiThread
  public void createView(
      ThemedReactContext themedReactContext,
      String componentName,
      int reactTag,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      boolean isLayoutable) {
    if (mTagToViewState.get(reactTag) != null) {
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
      view =
          mViewFactory.getOrCreateView(
              componentName, propsDiffMap, stateWrapper, themedReactContext);
      view.setId(reactTag);
      if (stateWrapper != null) {
        viewManager.updateState(view, propsDiffMap, stateWrapper);
      }
    }

    ViewState viewState = new ViewState(reactTag, view, viewManager);
    viewState.mCurrentProps = propsDiffMap;
    viewState.mCurrentState = (stateWrapper != null ? stateWrapper.getState() : null);

    mTagToViewState.put(reactTag, viewState);
  }

  @UiThread
  public void updateProps(int reactTag, ReadableMap props) {
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
  public void deleteView(int reactTag) {
    UiThreadUtil.assertOnUiThread();
    View view = getViewState(reactTag).mView;
    if (view != null) {
      dropView(view);
    } else {
      mTagToViewState.remove(reactTag);
    }
  }

  @UiThread
  public void updateLocalData(int reactTag, ReadableMap newLocalData) {
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
  public void updateState(final int reactTag, StateWrapper stateWrapper) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getViewState(reactTag);
    ReadableNativeMap newState = stateWrapper.getState();
    if (viewState.mCurrentState != null && viewState.mCurrentState.equals(newState)) {
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
      ThemedReactContext reactContext,
      String componentName,
      int reactTag,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      boolean isLayoutable) {

    if (mTagToViewState.get(reactTag) != null) {
      throw new IllegalStateException(
          "View for component " + componentName + " with tag " + reactTag + " already exists.");
    }

    createView(reactContext, componentName, reactTag, props, stateWrapper, isLayoutable);
  }

  @UiThread
  public void updateEventEmitter(int reactTag, EventEmitterWrapper eventEmitter) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getViewState(reactTag);
    viewState.mEventEmitter = eventEmitter;
  }

  @AnyThread
  public long measure(
      Context context,
      String componentName,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode) {

    return mViewManagerRegistry
        .get(componentName)
        .measure(context, localData, props, state, width, widthMode, height, heightMode);
  }

  @AnyThread
  public @Nullable EventEmitterWrapper getEventEmitter(int reactTag) {
    ViewState viewState = mTagToViewState.get(reactTag);
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
