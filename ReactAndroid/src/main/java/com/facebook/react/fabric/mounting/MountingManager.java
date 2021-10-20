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
import com.facebook.react.common.build.ReactBuildConfig;
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
  private static final boolean SHOW_CHANGED_VIEW_HIERARCHIES = ReactBuildConfig.DEBUG && false;

  @NonNull private final ConcurrentHashMap<Integer, ViewState> mTagToViewState;
  @NonNull private final JSResponderHandler mJSResponderHandler = new JSResponderHandler();
  @NonNull private final ViewManagerRegistry mViewManagerRegistry;
  @NonNull private final RootViewManager mRootViewManager = new RootViewManager();

  public MountingManager(@NonNull ViewManagerRegistry viewManagerRegistry) {
    mTagToViewState = new ConcurrentHashMap<>();
    mViewManagerRegistry = viewManagerRegistry;
  }

  private static void logViewHierarchy(ViewGroup parent, boolean recurse) {
    int parentTag = parent.getId();
    FLog.e(TAG, "  <ViewGroup tag=" + parentTag + " class=" + parent.getClass().toString() + ">");
    for (int i = 0; i < parent.getChildCount(); i++) {
      FLog.e(
          TAG,
          "     <View idx="
              + i
              + " tag="
              + parent.getChildAt(i).getId()
              + " class="
              + parent.getChildAt(i).getClass().toString()
              + ">");
    }
    FLog.e(TAG, "  </ViewGroup tag=" + parentTag + ">");

    if (recurse) {
      FLog.e(TAG, "Displaying Ancestors:");
      ViewParent ancestor = parent.getParent();
      while (ancestor != null) {
        ViewGroup ancestorViewGroup = (ancestor instanceof ViewGroup ? (ViewGroup) ancestor : null);
        int ancestorId = ancestorViewGroup == null ? View.NO_ID : ancestorViewGroup.getId();
        FLog.e(
            TAG,
            "<ViewParent tag=" + ancestorId + " class=" + ancestor.getClass().toString() + ">");
        ancestor = ancestor.getParent();
      }
    }
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

  /** Delete rootView and all children/ */
  @UiThread
  public void deleteRootView(int reactRootTag) {
    if (mTagToViewState.containsKey(reactRootTag)) {
      dropView(mTagToViewState.get(reactRootTag).mView, true);
    }
  }

  /** Releases all references to given native View. */
  @UiThread
  private void dropView(@NonNull View view, boolean deleteImmediately) {
    UiThreadUtil.assertOnUiThread();

    final int reactTag = view.getId();
    ViewState state = getViewState(reactTag);
    ViewManager viewManager = state.mViewManager;

    if (!state.mIsRoot && viewManager != null) {
      // For non-root views we notify viewmanager with {@link ViewManager#onDropInstance}
      viewManager.onDropViewInstance(view);
    }
    if (view instanceof ViewGroup && viewManager instanceof ViewGroupManager) {
      final ViewGroup viewGroup = (ViewGroup) view;
      final ViewGroupManager<ViewGroup> viewGroupManager = getViewGroupManager(state);

      // As documented elsewhere, sometimes when a child is removed from a parent, that change
      // is not immediately available in the hierarchy until a future UI tick. This can cause
      // inconsistent child counts, etc, but it can _also_ cause us to drop views that shouldn't,
      // because they're removed from the parent but that change isn't immediately visible. So,
      // we do two things: 1) delay this logic until the next UI thread tick, 2) ignore children
      // who don't report the expected parent.
      // For most cases, we _do not_ want this logic to run, anyway, since it either means that we
      // don't have a correct set of MountingInstructions; or it means that we're tearing down an
      // entire screen, in which case we can safely delete everything immediately, not having
      // executed any remove instructions immediately before this.
      if (deleteImmediately) {
        dropChildren(reactTag, viewGroup, viewGroupManager);
      } else {
        UiThreadUtil.runOnUiThread(
            new Runnable() {
              @Override
              public void run() {
                dropChildren(reactTag, viewGroup, viewGroupManager);
              }
            });
      }
    }

    mTagToViewState.remove(reactTag);
  }

  @UiThread
  private void dropChildren(
      int reactTag,
      @NonNull ViewGroup viewGroup,
      @NonNull ViewGroupManager<ViewGroup> viewGroupManager) {
    for (int i = viewGroupManager.getChildCount(viewGroup) - 1; i >= 0; i--) {
      View child = viewGroupManager.getChildAt(viewGroup, i);
      if (getNullableViewState(child.getId()) != null) {
        if (SHOW_CHANGED_VIEW_HIERARCHIES) {
          FLog.e(
              TAG,
              "Automatically dropping view that is still attached to a parent being dropped. Parent: ["
                  + reactTag
                  + "] child: ["
                  + child.getId()
                  + "]");
        }
        ViewParent childParent = child.getParent();
        if (childParent == null || !childParent.equals(viewGroup)) {
          int childParentId =
              (childParent == null
                  ? -1
                  : (childParent instanceof ViewGroup ? ((ViewGroup) childParent).getId() : -1));
          FLog.e(
              TAG,
              "Recursively deleting children of ["
                  + reactTag
                  + "] but parent of child ["
                  + child.getId()
                  + "] is ["
                  + childParentId
                  + "]");
        } else {
          dropView(child, true);
        }
      }
      viewGroupManager.removeViewAt(viewGroup, i);
    }
  }

  @UiThread
  public void addViewAt(final int parentTag, final int tag, final int index) {
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

    // Display children before inserting
    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      FLog.e(TAG, "addViewAt: [" + tag + "] -> [" + parentTag + "] idx: " + index + " BEFORE");
      logViewHierarchy(parentView, false);
    }

    try {
      getViewGroupManager(parentViewState).addView(parentView, view, index);
    } catch (IllegalStateException e) {
      // Wrap error with more context for debugging
      throw new IllegalStateException(
          "addViewAt: failed to insert view ["
              + tag
              + "] into parent ["
              + parentTag
              + "] at index "
              + index,
          e);
    }

    // Display children after inserting
    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              FLog.e(
                  TAG, "addViewAt: [" + tag + "] -> [" + parentTag + "] idx: " + index + " AFTER");
              logViewHierarchy(parentView, false);
            }
          });
    }
  }

  @NonNull
  private ViewState getViewState(int tag) {
    ViewState viewState = mTagToViewState.get(tag);
    if (viewState == null) {
      throw new RetryableMountingLayerException("Unable to find viewState view for tag " + tag);
    }
    return viewState;
  }

  public boolean getViewExists(int tag) {
    return mTagToViewState.get(tag) != null;
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
      throw new RetryableMountingLayerException(
          "Unable to find viewState manager for tag " + reactTag);
    }

    if (viewState.mView == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState view for tag " + reactTag);
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
  public void removeViewAt(final int tag, final int parentTag, int index) {
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

    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      // Display children before deleting any
      FLog.e(TAG, "removeViewAt: [" + tag + "] -> [" + parentTag + "] idx: " + index + " BEFORE");
      logViewHierarchy(parentView, false);
    }

    ViewGroupManager<ViewGroup> viewGroupManager = getViewGroupManager(viewState);

    // Verify that the view we're about to remove has the same tag we expect
    View view = viewGroupManager.getChildAt(parentView, index);
    int actualTag = (view != null ? view.getId() : -1);
    if (actualTag != tag) {
      int tagActualIndex = -1;
      int parentChildrenCount = parentView.getChildCount();
      for (int i = 0; i < parentChildrenCount; i++) {
        if (parentView.getChildAt(i).getId() == tag) {
          tagActualIndex = i;
          break;
        }
      }

      // TODO T74425739: previously, we did not do this check and `removeViewAt` would be executed
      // below, sometimes crashing there. *However*, interestingly enough, `removeViewAt` would not
      // complain if you removed views from an already-empty parent. This seems necessary currently
      // for certain ViewManagers that remove their own children - like BottomSheet?
      // This workaround seems not-great, but for now, we just return here for
      // backwards-compatibility. Essentially, if a view has already been removed from the
      // hierarchy, we treat it as a noop.
      if (tagActualIndex == -1) {
        FLog.e(
            TAG,
            "removeViewAt: ["
                + tag
                + "] -> ["
                + parentTag
                + "] @"
                + index
                + ": view already removed from parent! Children in parent: "
                + parentChildrenCount);
        return;
      }

      // Here we are guaranteed that the view is still in the View hierarchy, just
      // at a different index. In debug mode we'll crash here; in production, we'll remove
      // the child from the parent and move on.
      // This is an issue that is safely recoverable 95% of the time. If this allows corruption
      // of the view hierarchy and causes bugs or a crash after this point, there will be logs
      // indicating that this happened.
      // This is likely *only* necessary because of Fabric's LayoutAnimations implementation.
      // If we can fix the bug there, or remove the need for LayoutAnimation index adjustment
      // entirely, we can just throw this exception without regression user experience.
      logViewHierarchy(parentView, true);
      ReactSoftException.logSoftException(
          TAG,
          new IllegalStateException(
              "Tried to remove view ["
                  + tag
                  + "] of parent ["
                  + parentTag
                  + "] at index "
                  + index
                  + ", but got view tag "
                  + actualTag
                  + " - actual index of view: "
                  + tagActualIndex));
      index = tagActualIndex;
    }

    try {
      viewGroupManager.removeViewAt(parentView, index);
    } catch (RuntimeException e) {
      // Note: `getChildCount` may not always be accurate!
      // We don't currently have a good explanation other than, in situations where you
      // would empirically expect to see childCount > 0, the childCount is reported as 0.
      // This is likely due to a ViewManager overriding getChildCount or some other methods
      // in a way that is strictly incorrect, but potentially only visible here.
      // The failure mode is actually that in `removeViewAt`, a NullPointerException is
      // thrown when we try to perform an operation on a View that doesn't exist, and
      // is therefore null.
      // We try to add some extra diagnostics here, but we always try to remove the View
      // from the hierarchy first because detecting by looking at childCount will not work.
      //
      // Note that the lesson here is that `getChildCount` is not /required/ to adhere to
      // any invariants. If you add 9 children to a parent, the `getChildCount` of the parent
      // may not be equal to 9. This apparently causes no issues with Android and is common
      // enough that we shouldn't try to change this invariant, without a lot of thought.
      int childCount = viewGroupManager.getChildCount(parentView);

      logViewHierarchy(parentView, true);

      throw new IllegalStateException(
          "Cannot remove child at index "
              + index
              + " from parent ViewGroup ["
              + parentView.getId()
              + "], only "
              + childCount
              + " children in parent. Warning: childCount may be incorrect!",
          e);
    }

    // Display children after deleting any
    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      final int finalIndex = index;
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              FLog.e(
                  TAG,
                  "removeViewAt: ["
                      + tag
                      + "] -> ["
                      + parentTag
                      + "] idx: "
                      + finalIndex
                      + " AFTER");
              logViewHierarchy(parentView, false);
            }
          });
    }
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

    // To delete we simply remove the tag from the registry.
    // In the past we called dropView here, but we want to rely on either
    // (1) the correct set of MountInstructions being sent to the platform
    // and/or (2) dropView being called by stopSurface.
    // If Views are orphaned at this stage and leaked, it's a problem in
    // the differ or LayoutAnimations, not MountingManager.
    // Additionally, as documented in `dropView`, we cannot always trust a
    // view's children to be up-to-date.
    mTagToViewState.remove(reactTag);

    // For non-root views we notify viewmanager with {@link ViewManager#onDropInstance}
    ViewManager viewManager = viewState.mViewManager;
    if (!viewState.mIsRoot && viewManager != null) {
      viewManager.onDropViewInstance(viewState.mView);
    }
  }

  @UiThread
  public void updateState(final int reactTag, @Nullable StateWrapper stateWrapper) {
    UiThreadUtil.assertOnUiThread();
    ViewState viewState = getViewState(reactTag);
    @Nullable ReadableNativeMap newState = stateWrapper == null ? null : stateWrapper.getState();

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
      @Nullable float[] attachmentsPositions) {

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
