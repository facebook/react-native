/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import android.util.SparseArray;
import android.util.SparseBooleanArray;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.uimanager.layoutanimation.LayoutAnimationController;
import com.facebook.react.uimanager.layoutanimation.LayoutAnimationListener;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import com.facebook.yoga.YogaDirection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import javax.annotation.concurrent.NotThreadSafe;

/**
 * Delegate of {@link UIManagerModule} that owns the native view hierarchy and mapping between
 * native view names used in JS and corresponding instances of {@link ViewManager}. The {@link
 * UIManagerModule} communicates with this class by it's public interface methods:
 *
 * <ul>
 *   <li>{@link #updateProperties}
 *   <li>{@link #updateLayout}
 *   <li>{@link #createView}
 *   <li>{@link #manageChildren}
 * </ul>
 *
 * executing all the scheduled UI operations at the end of JS batch.
 *
 * <p>NB: All native view management methods listed above must be called from the UI thread.
 *
 * <p>The {@link ReactContext} instance that is passed to views that this manager creates differs
 * from the one that we pass as a constructor. Instead we wrap the provided instance of {@link
 * ReactContext} in an instance of {@link ThemedReactContext} that additionally provide a correct
 * theme based on the root view for a view tree that we attach newly created view to. Therefore this
 * view manager will create a copy of {@link ThemedReactContext} that wraps the instance of {@link
 * ReactContext} for each root view added to the manager (see {@link #addRootView}).
 *
 * <p>TODO(5483031): Only dispatch updates when shadow views have changed
 */
@NotThreadSafe
public class NativeViewHierarchyManager {

  private static final String TAG = NativeViewHierarchyManager.class.getSimpleName();
  private final boolean DEBUG_MODE = ReactBuildConfig.DEBUG && false;

  private final SparseArray<View> mTagsToViews;
  private final SparseArray<ViewManager> mTagsToViewManagers;
  private final SparseBooleanArray mRootTags;
  private final ViewManagerRegistry mViewManagers;
  private final JSResponderHandler mJSResponderHandler = new JSResponderHandler();
  private final RootViewManager mRootViewManager;
  private final LayoutAnimationController mLayoutAnimator = new LayoutAnimationController();
  private final RectF mBoundingBox = new RectF();

  private volatile boolean mLayoutAnimationEnabled;
  private HashMap<Integer, Set<Integer>> mPendingDeletionsForTag;

  public NativeViewHierarchyManager(ViewManagerRegistry viewManagers) {
    this(viewManagers, new RootViewManager());
  }

  public NativeViewHierarchyManager(ViewManagerRegistry viewManagers, RootViewManager manager) {
    mViewManagers = viewManagers;
    mTagsToViews = new SparseArray<>();
    mTagsToViewManagers = new SparseArray<>();
    mRootTags = new SparseBooleanArray();
    mRootViewManager = manager;
  }

  public final synchronized View resolveView(int tag) {
    View view = mTagsToViews.get(tag);
    if (view == null) {
      throw new IllegalViewOperationException(
          "Trying to resolve view with tag " + tag + " which doesn't exist");
    }
    return view;
  }

  public final synchronized ViewManager resolveViewManager(int tag) {
    ViewManager viewManager = mTagsToViewManagers.get(tag);
    if (viewManager == null) {
      throw new IllegalViewOperationException(
          "ViewManager for tag " + tag + " could not be found.\n");
    }
    return viewManager;
  }

  public void setLayoutAnimationEnabled(boolean enabled) {
    mLayoutAnimationEnabled = enabled;
  }

  public synchronized void updateInstanceHandle(int tag, long instanceHandle) {
    UiThreadUtil.assertOnUiThread();

    try {
      updateInstanceHandle(resolveView(tag), instanceHandle);
    } catch (IllegalViewOperationException e) {
      FLog.e(TAG, "Unable to update properties for view tag " + tag, e);
    }
  }

  public synchronized void updateProperties(int tag, ReactStylesDiffMap props) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "updateProperties[%d]: %s", tag, props.toString());
    }
    UiThreadUtil.assertOnUiThread();

    try {
      ViewManager viewManager = resolveViewManager(tag);
      View viewToUpdate = resolveView(tag);

      if (props != null) {
        viewManager.updateProperties(viewToUpdate, props);
      }
    } catch (IllegalViewOperationException e) {
      FLog.e(TAG, "Unable to update properties for view tag " + tag, e);
    }
  }

  public synchronized void updateViewExtraData(int tag, Object extraData) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "updateViewExtraData[%d]: %s", tag, extraData.toString());
    }
    UiThreadUtil.assertOnUiThread();

    ViewManager viewManager = resolveViewManager(tag);
    View viewToUpdate = resolveView(tag);
    viewManager.updateExtraData(viewToUpdate, extraData);
  }

  /**
   * @deprecated Please use {@link #updateLayout(int tag, int x, int y, int width, int height,
   *     YogaDirection layoutDirection)} instead.
   */
  @Deprecated
  public void updateLayout(int tag, int x, int y, int width, int height) {
    updateLayout(tag, tag, x, y, width, height, YogaDirection.INHERIT);
  }

  public synchronized void updateLayout(
      int parentTag, int tag, int x, int y, int width, int height, YogaDirection layoutDirection) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "updateLayout[%d]->[%d]: %d %d %d %d", tag, parentTag, x, y, width, height);
    }
    UiThreadUtil.assertOnUiThread();
    SystraceMessage.beginSection(
            Systrace.TRACE_TAG_REACT_VIEW, "NativeViewHierarchyManager_updateLayout")
        .arg("parentTag", parentTag)
        .arg("tag", tag)
        .flush();
    try {
      View viewToUpdate = resolveView(tag);

      viewToUpdate.setLayoutDirection(LayoutDirectionUtil.toAndroidFromYoga(layoutDirection));

      // Even though we have exact dimensions, we still call measure because some platform views
      // (e.g.
      // Switch) assume that method will always be called before onLayout and onDraw. They use it to
      // calculate and cache information used in the draw pass. For most views, onMeasure can be
      // stubbed out to only call setMeasuredDimensions. For ViewGroups, onLayout should be stubbed
      // out to not recursively call layout on its children: React Native already handles doing
      // that.
      //
      // Also, note measure and layout need to be called *after* all View properties have been
      // updated
      // because of caching and calculation that may occur in onMeasure and onLayout. Layout
      // operations should also follow the native view hierarchy and go top to bottom for
      // consistency
      // with standard layout passes (some views may depend on this).

      viewToUpdate.measure(
          View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
          View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));

      // We update the layout of the ReactRootView when there is a change in the layout of its
      // child.
      // This is required to re-measure the size of the native View container (usually a
      // FrameLayout) that is configured with layout_height = WRAP_CONTENT or layout_width =
      // WRAP_CONTENT
      //
      // This code is going to be executed ONLY when there is a change in the size of the Root
      // View defined in the js side. Changes in the layout of inner views will not trigger an
      // update
      // on the layout of the Root View.
      ViewParent parent = viewToUpdate.getParent();
      if (parent instanceof RootView) {
        parent.requestLayout();
      }

      // Check if the parent of the view has to layout the view, or the child has to lay itself out.
      if (!mRootTags.get(parentTag)) {
        ViewManager parentViewManager = mTagsToViewManagers.get(parentTag);
        IViewManagerWithChildren parentViewManagerWithChildren;
        if (parentViewManager instanceof IViewManagerWithChildren) {
          parentViewManagerWithChildren = (IViewManagerWithChildren) parentViewManager;
        } else {
          throw new IllegalViewOperationException(
              "Trying to use view with tag "
                  + parentTag
                  + " as a parent, but its Manager doesn't implement IViewManagerWithChildren");
        }
        if (parentViewManagerWithChildren != null
            && !parentViewManagerWithChildren.needsCustomLayoutForChildren()) {
          updateLayout(viewToUpdate, x, y, width, height);
        }
      } else {
        updateLayout(viewToUpdate, x, y, width, height);
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_VIEW);
    }
  }

  private void updateInstanceHandle(View viewToUpdate, long instanceHandle) {
    UiThreadUtil.assertOnUiThread();
    viewToUpdate.setTag(R.id.view_tag_instance_handle, instanceHandle);
  }

  @Nullable
  public synchronized long getInstanceHandle(int reactTag) {
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new IllegalViewOperationException("Unable to find view for tag: " + reactTag);
    }
    Long instanceHandle = (Long) view.getTag(R.id.view_tag_instance_handle);
    if (instanceHandle == null) {
      throw new IllegalViewOperationException("Unable to find instanceHandle for tag: " + reactTag);
    }
    return instanceHandle;
  }

  private void updateLayout(View viewToUpdate, int x, int y, int width, int height) {
    if (mLayoutAnimationEnabled && mLayoutAnimator.shouldAnimateLayout(viewToUpdate)) {
      mLayoutAnimator.applyLayoutUpdate(viewToUpdate, x, y, width, height);
    } else {
      viewToUpdate.layout(x, y, x + width, y + height);
    }
  }

  public synchronized void createView(
      ThemedReactContext themedContext,
      int tag,
      String className,
      @Nullable ReactStylesDiffMap initialProps) {
    if (DEBUG_MODE) {
      FLog.d(
          TAG,
          "createView[%d]: %s %s",
          tag,
          className,
          (initialProps != null ? initialProps.toString() : "<null>"));
    }
    UiThreadUtil.assertOnUiThread();
    SystraceMessage.beginSection(
            Systrace.TRACE_TAG_REACT_VIEW, "NativeViewHierarchyManager_createView")
        .arg("tag", tag)
        .arg("className", className)
        .flush();
    try {
      ViewManager viewManager = mViewManagers.get(className);

      View view =
          viewManager.createView(tag, themedContext, initialProps, null, mJSResponderHandler);
      mTagsToViews.put(tag, view);
      mTagsToViewManagers.put(tag, viewManager);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_VIEW);
    }
  }

  private static String constructManageChildrenErrorMessage(
      ViewGroup viewToManage,
      ViewGroupManager viewManager,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {
    StringBuilder stringBuilder = new StringBuilder();

    if (null != viewToManage) {
      stringBuilder.append(
          "View tag:"
              + viewToManage.getId()
              + " View Type:"
              + viewToManage.getClass().toString()
              + "\n");
      stringBuilder.append("  children(" + viewManager.getChildCount(viewToManage) + "): [\n");
      for (int index = 0; viewManager.getChildAt(viewToManage, index) != null; index += 16) {
        for (int innerOffset = 0;
            viewManager.getChildAt(viewToManage, index + innerOffset) != null && innerOffset < 16;
            innerOffset++) {
          stringBuilder.append(
              viewManager.getChildAt(viewToManage, index + innerOffset).getId() + ",");
        }
        stringBuilder.append("\n");
      }
      stringBuilder.append(" ],\n");
    }

    if (indicesToRemove != null) {
      stringBuilder.append("  indicesToRemove(" + indicesToRemove.length + "): [\n");
      for (int index = 0; index < indicesToRemove.length; index += 16) {
        for (int innerOffset = 0;
            ((index + innerOffset) < indicesToRemove.length) && innerOffset < 16;
            innerOffset++) {
          stringBuilder.append(indicesToRemove[index + innerOffset] + ",");
        }
        stringBuilder.append("\n");
      }
      stringBuilder.append(" ],\n");
    }
    if (viewsToAdd != null) {
      stringBuilder.append("  viewsToAdd(" + viewsToAdd.length + "): [\n");
      for (int index = 0; index < viewsToAdd.length; index += 16) {
        for (int innerOffset = 0;
            ((index + innerOffset) < viewsToAdd.length) && innerOffset < 16;
            innerOffset++) {
          stringBuilder.append(
              "["
                  + viewsToAdd[index + innerOffset].mIndex
                  + ","
                  + viewsToAdd[index + innerOffset].mTag
                  + "],");
        }
        stringBuilder.append("\n");
      }
      stringBuilder.append(" ],\n");
    }
    if (tagsToDelete != null) {
      stringBuilder.append("  tagsToDelete(" + tagsToDelete.length + "): [\n");
      for (int index = 0; index < tagsToDelete.length; index += 16) {
        for (int innerOffset = 0;
            ((index + innerOffset) < tagsToDelete.length) && innerOffset < 16;
            innerOffset++) {
          stringBuilder.append(tagsToDelete[index + innerOffset] + ",");
        }
        stringBuilder.append("\n");
      }
      stringBuilder.append(" ]\n");
    }

    return stringBuilder.toString();
  }

  private Set<Integer> getPendingDeletionsForTag(int tag) {
    if (mPendingDeletionsForTag == null) {
      mPendingDeletionsForTag = new HashMap<>();
    }

    if (!mPendingDeletionsForTag.containsKey(tag)) {
      mPendingDeletionsForTag.put(tag, new HashSet<Integer>());
    }

    return mPendingDeletionsForTag.get(tag);
  }

  /**
   * @param tag react tag of the node we want to manage
   * @param indicesToRemove ordered (asc) list of indices at which view should be removed
   * @param viewsToAdd ordered (asc based on mIndex property) list of tag-index pairs that represent
   *     a view which should be added at the specified index
   * @param tagsToDelete list of tags corresponding to views that should be removed
   */
  public synchronized void manageChildren(
      final int tag,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {
    if (DEBUG_MODE) {
      FLog.d(
          TAG,
          "createView[%d]: %s %s %s",
          tag,
          (indicesToRemove != null ? indicesToRemove.toString() : "<null>"),
          (viewsToAdd != null ? viewsToAdd.toString() : "<null>"),
          (tagsToDelete != null ? tagsToDelete.toString() : "<null>"));
    }
    UiThreadUtil.assertOnUiThread();

    final Set<Integer> pendingDeletionTags = getPendingDeletionsForTag(tag);
    final ViewGroup viewToManage = (ViewGroup) mTagsToViews.get(tag);
    final ViewGroupManager viewManager = (ViewGroupManager) resolveViewManager(tag);
    if (viewToManage == null) {
      throw new IllegalViewOperationException(
          "Trying to manageChildren view with tag "
              + tag
              + " which doesn't exist\n detail: "
              + constructManageChildrenErrorMessage(
                  viewToManage, viewManager, indicesToRemove, viewsToAdd, tagsToDelete));
    }

    int lastIndexToRemove = viewManager.getChildCount(viewToManage);

    if (indicesToRemove != null) {
      for (int i = indicesToRemove.length - 1; i >= 0; i--) {
        int indexToRemove = indicesToRemove[i];
        if (indexToRemove < 0) {
          throw new IllegalViewOperationException(
              "Trying to remove a negative view index:"
                  + indexToRemove
                  + " view tag: "
                  + tag
                  + "\n detail: "
                  + constructManageChildrenErrorMessage(
                      viewToManage, viewManager, indicesToRemove, viewsToAdd, tagsToDelete));
        }
        if (viewManager.getChildAt(viewToManage, indexToRemove) == null) {
          if (mRootTags.get(tag) && viewManager.getChildCount(viewToManage) == 0) {
            // This root node has already been removed (likely due to a threading issue caused by
            // async js execution). Ignore this root removal.
            return;
          }
          throw new IllegalViewOperationException(
              "Trying to remove a view index above child "
                  + "count "
                  + indexToRemove
                  + " view tag: "
                  + tag
                  + "\n detail: "
                  + constructManageChildrenErrorMessage(
                      viewToManage, viewManager, indicesToRemove, viewsToAdd, tagsToDelete));
        }
        if (indexToRemove >= lastIndexToRemove) {
          throw new IllegalViewOperationException(
              "Trying to remove an out of order view index:"
                  + indexToRemove
                  + " view tag: "
                  + tag
                  + "\n detail: "
                  + constructManageChildrenErrorMessage(
                      viewToManage, viewManager, indicesToRemove, viewsToAdd, tagsToDelete));
        }

        View viewToRemove = viewManager.getChildAt(viewToManage, indexToRemove);

        if (mLayoutAnimationEnabled
            && mLayoutAnimator.shouldAnimateLayout(viewToRemove)
            && arrayContains(tagsToDelete, viewToRemove.getId())) {
          // The view will be removed and dropped by the 'delete' layout animation
          // instead, so do nothing
        } else {
          viewManager.removeViewAt(viewToManage, indexToRemove);
        }

        lastIndexToRemove = indexToRemove;
      }
    }

    if (tagsToDelete != null) {
      for (int i = 0; i < tagsToDelete.length; i++) {
        int tagToDelete = tagsToDelete[i];
        final View viewToDestroy = mTagsToViews.get(tagToDelete);
        if (viewToDestroy == null) {
          throw new IllegalViewOperationException(
              "Trying to destroy unknown view tag: "
                  + tagToDelete
                  + "\n detail: "
                  + constructManageChildrenErrorMessage(
                      viewToManage, viewManager, indicesToRemove, viewsToAdd, tagsToDelete));
        }

        if (mLayoutAnimationEnabled && mLayoutAnimator.shouldAnimateLayout(viewToDestroy)) {
          pendingDeletionTags.add(tagToDelete);
          mLayoutAnimator.deleteView(
              viewToDestroy,
              new LayoutAnimationListener() {
                @Override
                public void onAnimationEnd() {
                  // This should be called only on the UI thread, because
                  // onAnimationEnd is called (indirectly) by Android View Animation.
                  UiThreadUtil.assertOnUiThread();

                  viewManager.removeView(viewToManage, viewToDestroy);
                  dropView(viewToDestroy);
                  pendingDeletionTags.remove(viewToDestroy.getId());
                  if (pendingDeletionTags.isEmpty()) {
                    mPendingDeletionsForTag.remove(tag);
                  }
                }
              });
        } else {
          dropView(viewToDestroy);
        }
      }
    }

    if (viewsToAdd != null) {
      for (int i = 0; i < viewsToAdd.length; i++) {
        ViewAtIndex viewAtIndex = viewsToAdd[i];
        View viewToAdd = mTagsToViews.get(viewAtIndex.mTag);
        if (viewToAdd == null) {
          throw new IllegalViewOperationException(
              "Trying to add unknown view tag: "
                  + viewAtIndex.mTag
                  + "\n detail: "
                  + constructManageChildrenErrorMessage(
                      viewToManage, viewManager, indicesToRemove, viewsToAdd, tagsToDelete));
        }

        int normalizedIndex = viewAtIndex.mIndex;
        if (!pendingDeletionTags.isEmpty()) {
          normalizedIndex = 0;
          int counter = 0;
          while (normalizedIndex < viewToManage.getChildCount()) {
            if (counter == viewAtIndex.mIndex) {
              break;
            }
            View v = viewToManage.getChildAt(normalizedIndex);
            if (!pendingDeletionTags.contains(v.getId())) {
              counter++;
            }
            normalizedIndex++;
          }
        }

        viewManager.addView(viewToManage, viewToAdd, normalizedIndex);
      }
    }
    if (pendingDeletionTags.isEmpty()) {
      mPendingDeletionsForTag.remove(tag);
    }
  }

  private boolean arrayContains(@Nullable int[] array, int ele) {
    if (array == null) {
      return false;
    }
    for (int curEle : array) {
      if (curEle == ele) {
        return true;
      }
    }
    return false;
  }

  /**
   * Simplified version of constructManageChildrenErrorMessage that only deals with adding children
   * views
   */
  private static String constructSetChildrenErrorMessage(
      ViewGroup viewToManage, ViewGroupManager viewManager, ReadableArray childrenTags) {
    ViewAtIndex[] viewsToAdd = new ViewAtIndex[childrenTags.size()];
    for (int i = 0; i < childrenTags.size(); i++) {
      viewsToAdd[i] = new ViewAtIndex(childrenTags.getInt(i), i);
    }
    return constructManageChildrenErrorMessage(viewToManage, viewManager, null, viewsToAdd, null);
  }

  /** Simplified version of manageChildren that only deals with adding children views */
  public synchronized void setChildren(int tag, ReadableArray childrenTags) {
    if (DEBUG_MODE) {
      FLog.d(
          TAG,
          "setChildren[%d]: %s",
          tag,
          (childrenTags != null ? childrenTags.toString() : "<null>"));
    }
    UiThreadUtil.assertOnUiThread();
    ViewGroup viewToManage = (ViewGroup) mTagsToViews.get(tag);
    ViewGroupManager viewManager = (ViewGroupManager) resolveViewManager(tag);

    for (int i = 0; i < childrenTags.size(); i++) {
      View viewToAdd = mTagsToViews.get(childrenTags.getInt(i));
      if (viewToAdd == null) {
        throw new IllegalViewOperationException(
            "Trying to add unknown view tag: "
                + childrenTags.getInt(i)
                + "\n detail: "
                + constructSetChildrenErrorMessage(viewToManage, viewManager, childrenTags));
      }
      viewManager.addView(viewToManage, viewToAdd, i);
    }
  }

  /** See {@link UIManagerModule#addRootView}. */
  public synchronized void addRootView(int tag, View view) {
    addRootViewGroup(tag, view);
  }

  protected final synchronized void addRootViewGroup(int tag, View view) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "addRootViewGroup[%d]: %s", tag, (view != null ? view.toString() : "<null>"));
    }
    if (view.getId() != View.NO_ID) {
      FLog.e(
          TAG,
          "Trying to add a root view with an explicit id ("
              + view.getId()
              + ") already set. React Native uses the id field to track react tags and will"
              + " overwrite this field. If that is fine, explicitly overwrite the id field to"
              + " View.NO_ID before calling addRootView.");
    }

    mTagsToViews.put(tag, view);
    mTagsToViewManagers.put(tag, mRootViewManager);
    mRootTags.put(tag, true);
    view.setId(tag);
  }

  /** Releases all references to given native View. */
  protected synchronized void dropView(View view) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "dropView[%d]", (view != null ? view.getId() : -1));
    }
    UiThreadUtil.assertOnUiThread();
    if (view == null) {
      // Ignore this drop operation when view is null.
      return;
    }
    if (mTagsToViewManagers.get(view.getId()) == null) {
      // This view has already been dropped (likely due to a threading issue caused by async js
      // execution). Ignore this drop operation.
      return;
    }
    if (!mRootTags.get(view.getId())) {
      // For non-root views we notify viewmanager with {@link ViewManager#onDropInstance}
      resolveViewManager(view.getId()).onDropViewInstance(view);
    }
    ViewManager viewManager = mTagsToViewManagers.get(view.getId());
    if (view instanceof ViewGroup && viewManager instanceof ViewGroupManager) {
      ViewGroup viewGroup = (ViewGroup) view;
      ViewGroupManager viewGroupManager = (ViewGroupManager) viewManager;
      for (int i = viewGroupManager.getChildCount(viewGroup) - 1; i >= 0; i--) {
        View child = viewGroupManager.getChildAt(viewGroup, i);
        if (child == null) {
          FLog.e(TAG, "Unable to drop null child view");
        } else if (mTagsToViews.get(child.getId()) != null) {
          dropView(child);
        }
      }
      viewGroupManager.removeAllViews(viewGroup);
    }
    mTagsToViews.remove(view.getId());
    mTagsToViewManagers.remove(view.getId());
  }

  public synchronized void removeRootView(int rootViewTag) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "removeRootView[%d]", rootViewTag);
    }
    UiThreadUtil.assertOnUiThread();
    if (!mRootTags.get(rootViewTag)) {
      SoftAssertions.assertUnreachable(
          "View with tag " + rootViewTag + " is not registered as a root view");
    }
    View rootView = mTagsToViews.get(rootViewTag);
    dropView(rootView);
    mRootTags.delete(rootViewTag);
    if (rootView != null) {
      rootView.setId(View.NO_ID);
    }
  }

  /**
   * Return root view num
   *
   * @return The num of root view
   */
  public synchronized int getRootViewNum() {
    return mRootTags.size();
  }

  /**
   * Returns true on success, false on failure. If successful, after calling, output buffer will be
   * {x, y, width, height}.
   */
  public synchronized void measure(int tag, int[] outputBuffer) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "measure[%d]", tag);
    }
    UiThreadUtil.assertOnUiThread();
    View v = mTagsToViews.get(tag);
    if (v == null) {
      throw new NoSuchNativeViewException("No native view for " + tag + " currently exists");
    }

    View rootView = (View) RootViewUtil.getRootView(v);
    // It is possible that the RootView can't be found because this view is no longer on the screen
    // and has been removed by clipping
    if (rootView == null) {
      throw new NoSuchNativeViewException("Native view " + tag + " is no longer on screen");
    }
    computeBoundingBox(rootView, outputBuffer);
    int rootX = outputBuffer[0];
    int rootY = outputBuffer[1];
    computeBoundingBox(v, outputBuffer);
    outputBuffer[0] -= rootX;
    outputBuffer[1] -= rootY;
  }

  private void computeBoundingBox(View view, int[] outputBuffer) {
    mBoundingBox.set(0, 0, view.getWidth(), view.getHeight());
    mapRectFromViewToWindowCoords(view, mBoundingBox);

    outputBuffer[0] = Math.round(mBoundingBox.left);
    outputBuffer[1] = Math.round(mBoundingBox.top);
    outputBuffer[2] = Math.round(mBoundingBox.right - mBoundingBox.left);
    outputBuffer[3] = Math.round(mBoundingBox.bottom - mBoundingBox.top);
  }

  private void mapRectFromViewToWindowCoords(View view, RectF rect) {
    Matrix matrix = view.getMatrix();
    if (!matrix.isIdentity()) {
      matrix.mapRect(rect);
    }

    rect.offset(view.getLeft(), view.getTop());

    ViewParent parent = view.getParent();
    while (parent instanceof View) {
      View parentView = (View) parent;

      rect.offset(-parentView.getScrollX(), -parentView.getScrollY());

      matrix = parentView.getMatrix();
      if (!matrix.isIdentity()) {
        matrix.mapRect(rect);
      }

      rect.offset(parentView.getLeft(), parentView.getTop());

      parent = parentView.getParent();
    }
  }

  /**
   * Returns the coordinates of a view relative to the window (not just the RootView which is what
   * measure will return)
   *
   * @param tag - the tag for the view
   * @param outputBuffer - output buffer that contains [x,y,width,height] of the view in coordinates
   *     relative to the device window
   */
  public synchronized void measureInWindow(int tag, int[] outputBuffer) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "measureInWindow[%d]", tag);
    }
    UiThreadUtil.assertOnUiThread();
    View v = mTagsToViews.get(tag);
    if (v == null) {
      throw new NoSuchNativeViewException("No native view for " + tag + " currently exists");
    }

    v.getLocationOnScreen(outputBuffer);

    // we need to subtract visibleWindowCoords - to subtract possible window insets, split screen or
    // multi window
    Rect visibleWindowFrame = new Rect();
    v.getWindowVisibleDisplayFrame(visibleWindowFrame);
    outputBuffer[0] = outputBuffer[0] - visibleWindowFrame.left;
    outputBuffer[1] = outputBuffer[1] - visibleWindowFrame.top;

    // outputBuffer[0,1] already contain what we want
    outputBuffer[2] = v.getWidth();
    outputBuffer[3] = v.getHeight();
  }

  public synchronized int findTargetTagForTouch(int reactTag, float touchX, float touchY) {
    if (DEBUG_MODE) {
      FLog.d(TAG, "findTargetTagForTouch[%d]: %f %f", reactTag, touchX, touchY);
    }
    UiThreadUtil.assertOnUiThread();
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + reactTag);
    }
    return TouchTargetHelper.findTargetTagForTouch(touchX, touchY, (ViewGroup) view);
  }

  public synchronized void setJSResponder(
      int reactTag, int initialReactTag, boolean blockNativeResponder) {
    if (!blockNativeResponder) {
      mJSResponderHandler.setJSResponder(initialReactTag, null);
      return;
    }

    View view = mTagsToViews.get(reactTag);
    if (initialReactTag != reactTag && view instanceof ViewParent) {
      // In this case, initialReactTag corresponds to a virtual/layout-only View, and we already
      // have a parent of that View in reactTag, so we can use it.
      mJSResponderHandler.setJSResponder(initialReactTag, (ViewParent) view);
      return;
    }

    if (mRootTags.get(reactTag)) {
      SoftAssertions.assertUnreachable(
          "Cannot block native responder on " + reactTag + " that is a root view");
    }
    mJSResponderHandler.setJSResponder(initialReactTag, view.getParent());
  }

  public synchronized void clearJSResponder() {
    mJSResponderHandler.clearJSResponder();
  }

  synchronized void configureLayoutAnimation(
      final ReadableMap config, final Callback onAnimationComplete) {
    mLayoutAnimator.initializeFromConfig(config, onAnimationComplete);
  }

  synchronized void clearLayoutAnimation() {
    mLayoutAnimator.reset();
  }

  @Deprecated
  public synchronized void dispatchCommand(
      int reactTag, int commandId, @Nullable ReadableArray args) {
    if (DEBUG_MODE) {
      FLog.d(
          TAG,
          "dispatchCommand[%d]: %d %s",
          reactTag,
          commandId,
          (args != null ? args.toString() : "<null>"));
    }
    UiThreadUtil.assertOnUiThread();
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new RetryableMountingLayerException(
          "Trying to send command to a non-existing view with tag ["
              + reactTag
              + "] and command "
              + commandId);
    }
    ViewManager viewManager = resolveViewManager(reactTag);
    viewManager.receiveCommand(view, commandId, args);
  }

  public synchronized void dispatchCommand(
      int reactTag, String commandId, @Nullable ReadableArray args) {
    if (DEBUG_MODE) {
      FLog.d(
          TAG,
          "dispatchCommand[%d]: %s %s",
          reactTag,
          commandId,
          (args != null ? args.toString() : "<null>"));
    }
    UiThreadUtil.assertOnUiThread();
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new RetryableMountingLayerException(
          "Trying to send command to a non-existing view with tag ["
              + reactTag
              + "] and command "
              + commandId);
    }
    ViewManager viewManager = resolveViewManager(reactTag);
    viewManager.receiveCommand(view, commandId, args);
  }

  /**
   * @return Themed React context for view with a given {@param reactTag} - it gets the context
   *     directly from the view using {@link View#getContext}.
   */
  private ThemedReactContext getReactContextForView(int reactTag) {
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + reactTag);
    }
    return (ThemedReactContext) view.getContext();
  }

  public synchronized void sendAccessibilityEvent(int tag, int eventType) {
    View view = mTagsToViews.get(tag);
    if (view == null) {
      throw new RetryableMountingLayerException("Could not find view with tag " + tag);
    }
    view.sendAccessibilityEvent(eventType);
  }
}
