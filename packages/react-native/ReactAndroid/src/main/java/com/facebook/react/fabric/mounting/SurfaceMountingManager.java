/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting;

import static com.facebook.infer.annotation.ThreadConfined.ANY;
import static com.facebook.infer.annotation.ThreadConfined.UI;

import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.AnyThread;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import androidx.collection.SparseArrayCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.uimanager.IViewGroupManager;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.ReactOverflowViewWithInset;
import com.facebook.react.uimanager.ReactRoot;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.RootViewManager;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.events.EventCategoryDef;
import com.facebook.systrace.Systrace;
import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class SurfaceMountingManager {
  public static final String TAG = SurfaceMountingManager.class.getSimpleName();

  private static final boolean SHOW_CHANGED_VIEW_HIERARCHIES = ReactBuildConfig.DEBUG && false;

  private volatile boolean mIsStopped = false;
  private volatile boolean mRootViewAttached = false;

  @Nullable private ThemedReactContext mThemedReactContext;

  // These are all non-null, until StopSurface is called
  private ConcurrentHashMap<Integer, ViewState> mTagToViewState =
      new ConcurrentHashMap<>(); // any thread
  private Queue<MountItem> mOnViewAttachMountItems = new ArrayDeque<>();
  private JSResponderHandler mJSResponderHandler;
  private ViewManagerRegistry mViewManagerRegistry;
  private RootViewManager mRootViewManager;
  private MountItemExecutor mMountItemExecutor;

  @ThreadConfined(UI)
  private final Set<Integer> mErroneouslyReaddedReactTags = new HashSet<>();

  // This set is used to keep track of views that are currently being interacted with (i.e.
  // views that saw a ACTION_DOWN but not a ACTION_UP event yet). This is used to prevent
  // views from being removed while they are being interacted with as their event emitter will
  // also be removed, and `Pressables` will look "stuck".
  @ThreadConfined(UI)
  private final Set<Integer> mViewsWithActiveTouches = new HashSet<>();

  // This set contains the views that are scheduled to be removed after their touch finishes.
  @ThreadConfined(UI)
  private final Set<Integer> mViewsToDeleteAfterTouchFinishes = new HashSet<>();

  // This is null *until* StopSurface is called.
  private SparseArrayCompat<Object> mTagSetForStoppedSurface;

  private final int mSurfaceId;

  public SurfaceMountingManager(
      int surfaceId,
      @NonNull JSResponderHandler jsResponderHandler,
      @NonNull ViewManagerRegistry viewManagerRegistry,
      @NonNull RootViewManager rootViewManager,
      @NonNull MountItemExecutor mountItemExecutor,
      @NonNull ThemedReactContext reactContext) {
    mSurfaceId = surfaceId;
    mJSResponderHandler = jsResponderHandler;
    mViewManagerRegistry = viewManagerRegistry;
    mRootViewManager = rootViewManager;
    mMountItemExecutor = mountItemExecutor;
    mThemedReactContext = reactContext;
  }

  public boolean isStopped() {
    return mIsStopped;
  }

  public void attachRootView(View rootView, ThemedReactContext themedReactContext) {
    mThemedReactContext = themedReactContext;
    addRootView(rootView);
  }

  public int getSurfaceId() {
    return mSurfaceId;
  }

  public boolean isRootViewAttached() {
    return mRootViewAttached;
  }

  @Nullable
  public ThemedReactContext getContext() {
    return mThemedReactContext;
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

  public boolean getViewExists(int tag) {
    // If Surface stopped, check if tag *was* associated with this Surface, even though it's been
    // deleted. This helps distinguish between scenarios where an invalid tag is referenced, vs
    // race conditions where an imperative method is called on a tag during/just after StopSurface.
    if (mTagSetForStoppedSurface != null && mTagSetForStoppedSurface.containsKey(tag)) {
      return true;
    }
    if (mTagToViewState == null) {
      return false;
    }
    return mTagToViewState.containsKey(tag);
  }

  @UiThread
  @ThreadConfined(UI)
  public void scheduleMountItemOnViewAttach(MountItem item) {
    mOnViewAttachMountItems.add(item);
  }

  @AnyThread
  private void addRootView(@NonNull final View rootView) {
    if (isStopped()) {
      return;
    }

    mTagToViewState.put(mSurfaceId, new ViewState(mSurfaceId, rootView, mRootViewManager, true));

    Runnable runnable =
        new GuardedRunnable(Assertions.assertNotNull(mThemedReactContext)) {
          @Override
          public void runGuarded() {
            // The CPU has ticked since `addRootView` was called, so the surface could technically
            // have already stopped here.
            if (isStopped()) {
              return;
            }

            if (rootView.getId() == mSurfaceId) {
              ReactSoftExceptionLogger.logSoftException(
                  TAG,
                  new IllegalViewOperationException(
                      "Race condition in addRootView detected. Trying to set an id of ["
                          + mSurfaceId
                          + "] on the RootView, but that id has already been set. "));
            } else if (rootView.getId() != View.NO_ID) {
              FLog.e(
                  TAG,
                  "Trying to add RootTag to RootView that already has a tag: existing tag: [%d] new"
                      + " tag: [%d]",
                  rootView.getId(),
                  mSurfaceId);
              // This behavior can not be guaranteed in hybrid apps that have a native android layer
              // over which reactRootViews are added and the native views need to have ids on them
              // in order to work. Hence this can cause unnecessary crashes at runtime for hybrid
              // apps. So converting this to a soft exception such that pure react-native devs can
              // still see the warning while hybrid apps continue to run without crashes
              ReactSoftExceptionLogger.logSoftException(
                  TAG,
                  new IllegalViewOperationException(
                      "Trying to add a root view with an explicit id already set. React Native uses"
                          + " the id field to track react tags and will overwrite this field. If"
                          + " that is fine, explicitly overwrite the id field to View.NO_ID before"
                          + " calling addRootView."));
            }
            rootView.setId(mSurfaceId);

            if (rootView instanceof ReactRoot) {
              ((ReactRoot) rootView).setRootViewTag(mSurfaceId);
            }

            executeMountItemsOnViewAttach();

            // By doing this after `executeMountItemsOnViewAttach`, we ensure that any operations
            // scheduled while processing this queue are also added to the queue, instead of being
            // processed immediately through the queue in `MountItemDispatcher`.
            mRootViewAttached = true;
          }
        };

    if (UiThreadUtil.isOnUiThread()) {
      runnable.run();
    } else {
      UiThreadUtil.runOnUiThread(runnable);
    }
  }

  @UiThread
  @ThreadConfined(UI)
  private void executeMountItemsOnViewAttach() {
    mMountItemExecutor.executeItems(mOnViewAttachMountItems);
  }

  /**
   * Stop surface and all operations within it. Garbage-collect Views (caller is responsible for
   * removing RootView from View layer).
   *
   * <p>Delete rootView from cache. Since RN does not control the RootView, in a sense, the fragment
   * is responsible for actually removing the RootView from the hierarchy / tearing down the
   * fragment.
   *
   * <p>In the original version(s) of this function, we recursively went through all children of the
   * View and dropped those Views as well; ad infinitum. This was before we had a
   * SurfaceMountingManager, and all tags were in one global map. Doing this was particularly
   * important in the case of StopSurface, where race conditions between threads meant you couldn't
   * rely on DELETE instructions actually deleting all Views in the Surface.
   *
   * <p>Now that we have SurfaceMountingManager, we can simply drop our local reference to the View.
   * Since it will be removed from the View hierarchy entirely (outside of the scope of this class),
   * garbage collection will take care of destroying it and all descendents.
   */
  @AnyThread
  public void stopSurface() {
    FLog.e(TAG, "Stopping surface [" + mSurfaceId + "]");
    if (isStopped()) {
      return;
    }

    // Prevent more views from being created, or the hierarchy from being manipulated at all. This
    // causes further operations to noop.
    mIsStopped = true;

    // Reset all StateWrapper objects
    // Since this can happen on any thread, is it possible to race between StateWrapper destruction
    // and some accesses from View classes in the UI thread?
    for (ViewState viewState : mTagToViewState.values()) {
      if (viewState.mStateWrapper != null) {
        viewState.mStateWrapper.destroyState();
        viewState.mStateWrapper = null;
      }
      if (viewState.mEventEmitter != null) {
        viewState.mEventEmitter.destroy();
        viewState.mEventEmitter = null;
      }
    }

    Runnable runnable =
        () -> {
          if (ReactNativeFeatureFlags.enableViewRecycling()) {
            mViewManagerRegistry.onSurfaceStopped(mSurfaceId);
          }
          mTagSetForStoppedSurface = new SparseArrayCompat<>();
          for (Map.Entry<Integer, ViewState> entry : mTagToViewState.entrySet()) {
            // Using this as a placeholder value in the map. We're using SparseArrayCompat
            // since it can efficiently represent the list of pending tags
            mTagSetForStoppedSurface.put(entry.getKey(), this);

            // We must call `onDropViewInstance` on all remaining Views
            onViewStateDeleted(entry.getValue());
          }

          // Evict all views from cache and memory
          // TODO: clear instead of nulling out to simplify null-safety in this class
          mTagToViewState = null;
          mJSResponderHandler = null;
          mRootViewManager = null;
          mMountItemExecutor = null;
          mThemedReactContext = null;
          mOnViewAttachMountItems.clear();

          FLog.e(TAG, "Surface [" + mSurfaceId + "] was stopped on SurfaceMountingManager.");
        };

    if (UiThreadUtil.isOnUiThread()) {
      runnable.run();
    } else {
      UiThreadUtil.runOnUiThread(runnable);
    }
  }

  @UiThread
  public void addViewAt(final int parentTag, final int tag, final int index) {
    UiThreadUtil.assertOnUiThread();
    if (isStopped()) {
      return;
    }

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

    ViewParent viewParent = view.getParent();
    if (viewParent != null) {
      int actualParentId =
          viewParent instanceof ViewGroup ? ((ViewGroup) viewParent).getId() : View.NO_ID;
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalStateException(
              "addViewAt: cannot insert view ["
                  + tag
                  + "] into parent ["
                  + parentTag
                  + "]: View already has a parent: ["
                  + actualParentId
                  + "] "
                  + " Parent: "
                  + viewParent.getClass().getSimpleName()
                  + " View: "
                  + view.getClass().getSimpleName()));

      // We've hit an error case, and `addView` will crash below
      // if we don't take evasive action (it is an error to add a View
      // to the hierarchy if it already has a parent).
      // We don't know /why/ this happens yet, but it does happen
      // very infrequently in production.
      // Thus, we do three things here:
      // (1) We logged a SoftException above, so if there's a crash later
      // on, we might have some hints about what caused it.
      // (2) We remove the View from its parent.
      // (3) In case the View was removed from the hierarchy with the
      // RemoveDeleteTree instruction, and is now being readded - which
      // should be impossible - we mark this as a "readded" View and
      // thus prevent the RemoveDeleteTree worker from deleting this
      // View in the future.
      if (viewParent instanceof ViewGroup) {
        ((ViewGroup) viewParent).removeView(view);
      }
      mErroneouslyReaddedReactTags.add(tag);
    }

    try {
      getViewGroupManager(parentViewState).addView(parentView, view, index);
    } catch (IllegalStateException | IndexOutOfBoundsException e) {
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
      // Why are we calling `runOnUiThread`? We're already on the UI thread, right?!
      // Yes - but if you get the children of the View here and display them, *it might show you
      // the previous children*. Without getting too much into Android internals, basically if we
      // wait a tick, everything is what we expect.
      // tldr is that `parent.children == []; parent.addView(x); parent.children == []`
      // and you need to wait a tick for `parent.children == [x]`.
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

  @UiThread
  public void removeViewAt(final int tag, final int parentTag, int index) {
    if (isStopped()) {
      return;
    }

    // This is "impossible". See comments above.
    if (mErroneouslyReaddedReactTags.contains(tag)) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "removeViewAt tried to remove a React View that was actually reused. This indicates a"
                  + " bug in the Differ (specifically instruction ordering). ["
                  + tag
                  + "]"));
      return;
    }

    UiThreadUtil.assertOnUiThread();
    ViewState parentViewState = getNullableViewState(parentTag);

    // TODO: throw exception here?
    if (parentViewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          new IllegalStateException(
              "Unable to find viewState for tag: [" + parentTag + "] for removeViewAt"));
      return;
    }

    if (!(parentViewState.mView instanceof ViewGroup)) {
      String message =
          "Unable to remove a view from a view that is not a ViewGroup. ParentTag: "
              + parentTag
              + " - Tag: "
              + tag
              + " - Index: "
              + index;
      FLog.e(TAG, message);
      throw new IllegalStateException(message);
    }

    final ViewGroup parentView = (ViewGroup) parentViewState.mView;

    if (parentView == null) {
      throw new IllegalStateException("Unable to find view for tag [" + parentTag + "]");
    }

    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      // Display children before deleting any
      FLog.e(TAG, "removeViewAt: [" + tag + "] -> [" + parentTag + "] idx: " + index + " BEFORE");
      logViewHierarchy(parentView, false);
    }

    IViewGroupManager<ViewGroup> viewGroupManager = getViewGroupManager(parentViewState);

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
      ReactSoftExceptionLogger.logSoftException(
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
      @NonNull String componentName,
      int reactTag,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      @Nullable EventEmitterWrapper eventEmitterWrapper,
      boolean isLayoutable) {
    if (isStopped()) {
      return;
    }
    // We treat this as a perf problem and not a logical error. View Preallocation or unexpected
    // changes to Differ or C++ Binding could cause some redundant Create instructions.
    // There are cases where preallocation happens and a node is recreated: if a node is
    // preallocated and then committed with revision 2+, an extra CREATE instruction will be
    // generated.
    // This represents a perf issue only, not a correctness issue. In the future we need to
    // refactor View preallocation to correct the currently incorrect assumptions.
    ViewState viewState = getNullableViewState(reactTag);
    if (viewState != null && viewState.mView != null) {
      return;
    }

    createViewUnsafe(
        componentName, reactTag, props, stateWrapper, eventEmitterWrapper, isLayoutable);
  }

  /**
   * Perform view creation without any safety checks. You must ensure safety before calling this
   * method (see existing callsites).
   *
   * @param componentName
   * @param reactTag
   * @param props
   * @param stateWrapper
   * @param eventEmitterWrapper
   * @param isLayoutable
   */
  @UiThread
  public void createViewUnsafe(
      @NonNull String componentName,
      int reactTag,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      @Nullable EventEmitterWrapper eventEmitterWrapper,
      boolean isLayoutable) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT,
        "SurfaceMountingManager::createViewUnsafe(" + componentName + ")");
    try {
      ReactStylesDiffMap propMap = new ReactStylesDiffMap(props);

      ViewState viewState = new ViewState(reactTag);
      viewState.mCurrentProps = propMap;
      viewState.mStateWrapper = stateWrapper;
      viewState.mEventEmitter = eventEmitterWrapper;
      mTagToViewState.put(reactTag, viewState);

      if (isLayoutable) {
        ViewManager viewManager = mViewManagerRegistry.get(componentName);
        // View Managers are responsible for dealing with inital state and props.
        viewState.mView =
            viewManager.createView(
                reactTag, mThemedReactContext, propMap, stateWrapper, mJSResponderHandler);
        viewState.mViewManager = viewManager;
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT);
    }
  }

  public void updateProps(int reactTag, ReadableMap props) {
    if (isStopped()) {
      return;
    }

    ViewState viewState = getViewState(reactTag);
    viewState.mCurrentProps = new ReactStylesDiffMap(props);
    View view = viewState.mView;

    if (view == null) {
      throw new IllegalStateException("Unable to find view for tag [" + reactTag + "]");
    }

    Assertions.assertNotNull(viewState.mViewManager)
        .updateProperties(view, viewState.mCurrentProps);
  }

  @Deprecated
  public void receiveCommand(int reactTag, int commandId, ReadableArray commandArgs) {
    if (isStopped()) {
      return;
    }

    ViewState viewState = getNullableViewState(reactTag);

    // It's not uncommon for JS to send events as/after a component is being removed from the
    // view hierarchy. For example, TextInput may send a "blur" command in response to the view
    // disappearing. Throw `ReactNoCrashSoftException` so they're logged but don't crash in dev
    // for now.
    if (viewState == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState for tag: [" + reactTag + "] for commandId: " + commandId);
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

  public void receiveCommand(int reactTag, @NonNull String commandId, ReadableArray commandArgs) {
    if (isStopped()) {
      return;
    }

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
    if (isStopped()) {
      return;
    }

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

  @UiThread
  public void updateLayout(
      int reactTag,
      int parentTag,
      int x,
      int y,
      int width,
      int height,
      int displayType,
      int layoutDirection) {
    if (isStopped()) {
      return;
    }

    ViewState viewState = getViewState(reactTag);
    // Do not layout Root Views
    if (viewState.mIsRoot) {
      return;
    }

    View viewToUpdate = viewState.mView;
    if (viewToUpdate == null) {
      throw new IllegalStateException("Unable to find View for tag: " + reactTag);
    }

    viewToUpdate.setLayoutDirection(
        layoutDirection == 1
            ? View.LAYOUT_DIRECTION_LTR
            : layoutDirection == 2 ? View.LAYOUT_DIRECTION_RTL : View.LAYOUT_DIRECTION_INHERIT);

    // Even though we have exact dimensions, we still call measure because some platform views (e.g.
    // Switch) assume that method will always be called before onLayout and onDraw. They use it to
    // calculate and cache information used in the draw pass. For most views, onMeasure can be
    // stubbed out to only call setMeasuredDimensions. For ViewGroups, onLayout should be stubbed
    // out to not recursively call layout on its children: React Native already handles doing
    // that.
    //
    // Also, note measure and layout need to be called *after* all View properties have been updated
    // because of caching and calculation that may occur in onMeasure and onLayout. Layout
    // operations should also follow the native view hierarchy and go top to bottom for
    // consistency with standard layout passes (some views may depend on this).
    viewToUpdate.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));

    // We update the layout of the RootView when there is a change in the layout of its child. This
    // is required to re-measure the size of the native View container (usually a FrameLayout) that
    // is configured with layout_height = WRAP_CONTENT or layout_width = WRAP_CONTENT
    //
    // This code is going to be executed ONLY when there is a change in the size of the root view
    // defined in the JS side. Changes in the layout of inner views will not trigger an update  on
    // the layout of the root view.
    ViewParent parent = viewToUpdate.getParent();
    if (parent instanceof RootView) {
      parent.requestLayout();
    }

    // TODO T212247085: Make this non-nullable again after rolling out
    // disableMountItemReorderingAndroid
    ViewState parentViewState = getNullableViewState(parentTag);
    IViewGroupManager<?> parentViewManager = null;
    if (parentViewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          new ReactNoCrashSoftException(
              "Unable to find viewState for tag: " + parentTag + " for updateLayout"));
    } else if (parentViewState.mViewManager != null) {
      parentViewManager = (IViewGroupManager) parentViewState.mViewManager;
    }
    if (parentViewManager == null || !parentViewManager.needsCustomLayoutForChildren()) {
      viewToUpdate.layout(x, y, x + width, y + height);
    }

    // displayType: 0 represents display: 'none'
    int visibility = displayType == 0 ? View.INVISIBLE : View.VISIBLE;
    if (viewToUpdate.getVisibility() != visibility) {
      viewToUpdate.setVisibility(visibility);
    }
  }

  @UiThread
  public void updatePadding(int reactTag, int left, int top, int right, int bottom) {
    UiThreadUtil.assertOnUiThread();
    if (isStopped()) {
      return;
    }

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
  public void updateOverflowInset(
      int reactTag,
      int overflowInsetLeft,
      int overflowInsetTop,
      int overflowInsetRight,
      int overflowInsetBottom) {
    if (isStopped()) {
      return;
    }

    ViewState viewState = getViewState(reactTag);
    // Do not layout Root Views
    if (viewState.mIsRoot) {
      return;
    }

    View viewToUpdate = viewState.mView;
    if (viewToUpdate == null) {
      throw new IllegalStateException("Unable to find View for tag: " + reactTag);
    }

    if (viewToUpdate instanceof ReactOverflowViewWithInset) {
      ((ReactOverflowViewWithInset) viewToUpdate)
          .setOverflowInset(
              overflowInsetLeft, overflowInsetTop, overflowInsetRight, overflowInsetBottom);
    }
  }

  @UiThread
  public void updateState(final int reactTag, @Nullable StateWrapper stateWrapper) {
    UiThreadUtil.assertOnUiThread();
    if (isStopped()) {
      return;
    }

    ViewState viewState = getViewState(reactTag);

    StateWrapper prevStateWrapper = viewState.mStateWrapper;
    viewState.mStateWrapper = stateWrapper;

    ViewManager viewManager = viewState.mViewManager;

    if (viewManager == null) {
      throw new IllegalStateException("Unable to find ViewManager for tag: " + reactTag);
    }
    Object extraData =
        viewManager.updateState(viewState.mView, viewState.mCurrentProps, stateWrapper);
    if (extraData != null) {
      viewManager.updateExtraData(viewState.mView, extraData);
    }

    // Immediately clear native side of previous state wrapper. This causes the State object in C++
    // to be destroyed immediately instead of waiting for Java GC to kick in.
    if (prevStateWrapper != null) {
      prevStateWrapper.destroyState();
    }
  }

  /** We update the event emitter from the main thread when the view is mounted. */
  @UiThread
  public void updateEventEmitter(int reactTag, @NonNull EventEmitterWrapper eventEmitter) {
    UiThreadUtil.assertOnUiThread();
    if (isStopped()) {
      return;
    }

    ViewState viewState = mTagToViewState.get(reactTag);
    if (viewState == null) {
      // TODO T62717437 - Use a flag to determine that these event emitters belong to virtual nodes
      // only.
      viewState = new ViewState(reactTag);
      mTagToViewState.put(reactTag, viewState);
    }
    EventEmitterWrapper previousEventEmitterWrapper = viewState.mEventEmitter;
    viewState.mEventEmitter = eventEmitter;

    // Immediately destroy native side of wrapper, instead of waiting for Java GC.
    if (previousEventEmitterWrapper != eventEmitter && previousEventEmitterWrapper != null) {
      previousEventEmitterWrapper.destroy();
    }

    Queue<PendingViewEvent> pendingEventQueue = viewState.mPendingEventQueue;
    if (pendingEventQueue != null) {
      // Invoke pending event queued to the view state
      for (PendingViewEvent viewEvent : pendingEventQueue) {
        viewEvent.dispatch(eventEmitter);
      }
      viewState.mPendingEventQueue = null;
    }
  }

  @UiThread
  public synchronized void setJSResponder(
      int reactTag, int initialReactTag, boolean blockNativeResponder) {
    UiThreadUtil.assertOnUiThread();
    if (isStopped()) {
      return;
    }

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
      SoftAssertions.assertUnreachable("Cannot find view for tag [" + reactTag + "].");
      return;
    }

    if (viewState.mIsRoot) {
      SoftAssertions.assertUnreachable(
          "Cannot block native responder on [" + reactTag + "] that is a root view");
    }
    mJSResponderHandler.setJSResponder(initialReactTag, view.getParent());
  }

  @UiThread
  private void onViewStateDeleted(ViewState viewState) {
    // Destroy state immediately instead of waiting for Java GC.
    if (viewState.mStateWrapper != null) {
      viewState.mStateWrapper.destroyState();
      viewState.mStateWrapper = null;
    }

    // Destroy EventEmitterWrapper immediately instead of waiting for Java GC.
    // Notably, this is also required to ensure that the EventEmitterWrapper is deallocated
    // before the JS VM is deallocated, since it holds onto a JSI::Pointer.
    if (viewState.mEventEmitter != null) {
      viewState.mEventEmitter.destroy();
      viewState.mEventEmitter = null;
    }

    // For non-root views we notify viewmanager with {@link ViewManager#onDropInstance}
    ViewManager viewManager = viewState.mViewManager;
    if (!viewState.mIsRoot && viewManager != null) {
      viewManager.onDropViewInstance(viewState.mView);
    }
  }

  @UiThread
  public void deleteView(int reactTag) {
    UiThreadUtil.assertOnUiThread();
    if (isStopped()) {
      return;
    }

    ViewState viewState = getNullableViewState(reactTag);

    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          new ReactNoCrashSoftException(
              "Unable to find viewState for tag: " + reactTag + " for deleteView"));
      return;
    }

    if (mViewsWithActiveTouches.contains(reactTag)) {
      // If the view that went offscreen is still being touched, we can't delete it yet.
      // We have to delay the deletion till the touch is completed.
      // This is causing bugs like those otherwise:
      // - https://github.com/facebook/react-native/issues/44610
      // - https://github.com/facebook/react-native/issues/45126
      mViewsToDeleteAfterTouchFinishes.add(reactTag);
    } else {
      // To delete we simply remove the tag from the registry.
      // We want to rely on the correct set of MountInstructions being sent to the platform,
      // or StopSurface being called, so we do not handle deleting descendants of the View.
      mTagToViewState.remove(reactTag);

      onViewStateDeleted(viewState);
    }
  }

  @UiThread
  public void preallocateView(
      @NonNull String componentName,
      int reactTag,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      boolean isLayoutable) {
    UiThreadUtil.assertOnUiThread();

    if (isStopped()) {
      return;
    }
    // We treat this as a perf problem and not a logical error. View Preallocation or unexpected
    // changes to Differ or C++ Binding could cause some redundant Create instructions.
    if (getNullableViewState(reactTag) != null) {
      return;
    }

    createViewUnsafe(componentName, reactTag, props, stateWrapper, null, isLayoutable);
  }

  @AnyThread
  @ThreadConfined(ANY)
  public @Nullable EventEmitterWrapper getEventEmitter(int reactTag) {
    ViewState viewState = getNullableViewState(reactTag);
    return viewState == null ? null : viewState.mEventEmitter;
  }

  @UiThread
  public View getView(int reactTag) {
    ViewState state = getNullableViewState(reactTag);
    View view = state == null ? null : state.mView;
    if (view == null) {
      throw new IllegalViewOperationException(
          "Trying to resolve view with tag " + reactTag + " which doesn't exist");
    }
    return view;
  }

  private @NonNull ViewState getViewState(int tag) {
    ViewState viewState = mTagToViewState.get(tag);
    if (viewState == null) {
      throw new RetryableMountingLayerException(
          "Unable to find viewState for tag " + tag + ". Surface stopped: " + isStopped());
    }
    return viewState;
  }

  private @Nullable ViewState getNullableViewState(int tag) {
    ConcurrentHashMap<Integer, ViewState> viewStates = mTagToViewState;
    if (viewStates == null) {
      return null;
    }
    return viewStates.get(tag);
  }

  @SuppressWarnings("unchecked") // prevents unchecked conversion warn of the <ViewGroup> type
  private static @NonNull IViewGroupManager<ViewGroup> getViewGroupManager(
      @NonNull ViewState viewState) {
    if (viewState.mViewManager == null) {
      throw new IllegalStateException("Unable to find ViewManager for view: " + viewState);
    }
    return (IViewGroupManager<ViewGroup>) viewState.mViewManager;
  }

  public void printSurfaceState() {
    FLog.e(TAG, "Views created for surface {%d}:", getSurfaceId());
    for (ViewState viewState : mTagToViewState.values()) {
      String viewManagerName =
          viewState.mViewManager != null ? viewState.mViewManager.getName() : null;
      @Nullable View view = viewState.mView;
      @Nullable View parent = view != null ? (View) view.getParent() : null;
      @Nullable Integer parentTag = parent != null ? parent.getId() : null;

      FLog.e(
          TAG,
          "<%s id=%d parentTag=%s isRoot=%b />",
          viewManagerName,
          viewState.mReactTag,
          parentTag,
          viewState.mIsRoot);
    }
  }

  @AnyThread
  public void enqueuePendingEvent(
      int reactTag,
      String eventName,
      boolean canCoalesceEvent,
      @Nullable WritableMap params,
      @EventCategoryDef int eventCategory) {
    // When the surface stopped we will reset the view state map. We are not going to enqueue
    // pending events as they are not expected to be dispatched anyways.
    if (mTagToViewState == null) {
      return;
    }

    ViewState viewState = mTagToViewState.get(reactTag);
    if (viewState == null) {
      // Cannot queue event without view state. Do nothing here.
      return;
    }

    PendingViewEvent viewEvent =
        new PendingViewEvent(eventName, params, eventCategory, canCoalesceEvent);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (viewState.mEventEmitter != null) {
              viewEvent.dispatch(viewState.mEventEmitter);
            } else {
              if (viewState.mPendingEventQueue == null) {
                viewState.mPendingEventQueue = new LinkedList<>();
              }
              viewState.mPendingEventQueue.add(viewEvent);
            }
          }
        });
  }

  public void markActiveTouchForTag(int reactTag) {
    mViewsWithActiveTouches.add(reactTag);
  }

  public void sweepActiveTouchForTag(int reactTag) {
    mViewsWithActiveTouches.remove(reactTag);
    if (mViewsToDeleteAfterTouchFinishes.contains(reactTag)) {
      mViewsToDeleteAfterTouchFinishes.remove(reactTag);
      deleteView(reactTag);
    }
  }

  /**
   * This class holds view state for react tags. Objects of this class are stored into the {@link
   * #mTagToViewState}, and they should be updated in the same thread.
   */
  private static class ViewState {
    @Nullable View mView = null;
    final int mReactTag;
    final boolean mIsRoot;
    @Nullable ViewManager mViewManager = null;
    @Nullable ReactStylesDiffMap mCurrentProps = null;
    @Nullable ReadableMap mCurrentLocalData = null;
    @Nullable StateWrapper mStateWrapper = null;
    @Nullable EventEmitterWrapper mEventEmitter = null;

    @ThreadConfined(UI)
    @Nullable
    Queue<PendingViewEvent> mPendingEventQueue = null;

    private ViewState(int reactTag) {
      this(reactTag, null, null, false);
    }

    private ViewState(
        int reactTag, @Nullable View view, @Nullable ViewManager viewManager, boolean isRoot) {
      mReactTag = reactTag;
      mView = view;
      mIsRoot = isRoot;
      mViewManager = viewManager;
    }

    @NonNull
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

  private static class PendingViewEvent {
    private final String mEventName;
    private final boolean mCanCoalesceEvent;
    private final @EventCategoryDef int mEventCategory;
    private final @Nullable WritableMap mParams;

    public PendingViewEvent(
        String eventName,
        @Nullable WritableMap params,
        @EventCategoryDef int eventCategory,
        boolean canCoalesceEvent) {
      mEventName = eventName;
      mParams = params;
      mEventCategory = eventCategory;
      mCanCoalesceEvent = canCoalesceEvent;
    }

    public void dispatch(EventEmitterWrapper eventEmitter) {
      if (mCanCoalesceEvent) {
        eventEmitter.dispatchUnique(mEventName, mParams);
      } else {
        eventEmitter.dispatch(mEventName, mParams, mEventCategory);
      }
    }
  }
}
