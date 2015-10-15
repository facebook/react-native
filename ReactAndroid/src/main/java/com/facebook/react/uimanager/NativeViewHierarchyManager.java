/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import javax.annotation.Nullable;
import javax.annotation.concurrent.NotThreadSafe;

import android.util.SparseArray;
import android.util.SparseBooleanArray;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.PopupMenu;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.animation.Animation;
import com.facebook.react.animation.AnimationListener;
import com.facebook.react.animation.AnimationRegistry;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.touch.JSResponderHandler;

/**
 * Delegate of {@link UIManagerModule} that owns the native view hierarchy and mapping between
 * native view names used in JS and corresponding instances of {@link ViewManager}. The
 * {@link UIManagerModule} communicates with this class by it's public interface methods:
 *  - {@link #updateProperties}
 *  - {@link #updateLayout}
 *  - {@link #createView}
 *  - {@link #manageChildren}
 * executing all the scheduled UI operations at the end of JS batch.
 *
 * NB: All native view management methods listed above must be called from the UI thread.
 *
 * The {@link ReactContext} instance that is passed to views that this manager creates differs
 * from the one that we pass as a constructor. Instead we wrap the provided instance of
 * {@link ReactContext} in an instance of {@link ThemedReactContext} that additionally provide
 * a correct theme based on the root view for a view tree that we attach newly created view to.
 * Therefore this view manager will create a copy of {@link ThemedReactContext} that wraps
 * the instance of {@link ReactContext} for each root view added to the manager (see
 * {@link #addRootView}).
 *
 * TODO(5483031): Only dispatch updates when shadow views have changed
 */
@NotThreadSafe
/* package */ final class NativeViewHierarchyManager {

  private final AnimationRegistry mAnimationRegistry;
  private final SparseArray<View> mTagsToViews;
  private final SparseArray<ViewManager> mTagsToViewManagers;
  private final SparseBooleanArray mRootTags;
  private final SparseArray<ThemedReactContext> mRootViewsContext;
  private final ViewManagerRegistry mViewManagers;
  private final JSResponderHandler mJSResponderHandler = new JSResponderHandler();
  private final RootViewManager mRootViewManager = new RootViewManager();

  public NativeViewHierarchyManager(
      AnimationRegistry animationRegistry,
      ViewManagerRegistry viewManagers) {
    mAnimationRegistry = animationRegistry;
    mViewManagers = viewManagers;
    mTagsToViews = new SparseArray<>();
    mTagsToViewManagers = new SparseArray<>();
    mRootTags = new SparseBooleanArray();
    mRootViewsContext = new SparseArray<>();
  }

  public void updateProperties(int tag, CatalystStylesDiffMap props) {
    UiThreadUtil.assertOnUiThread();

    ViewManager viewManager = mTagsToViewManagers.get(tag);
    if (viewManager == null) {
      throw new IllegalViewOperationException("ViewManager for tag " + tag + " could not be found");
    }

    View viewToUpdate = mTagsToViews.get(tag);
    if (viewToUpdate == null) {
      throw new IllegalViewOperationException("Trying to update view with tag " + tag
          + " which doesn't exist");
    }
    viewManager.updateProperties(viewToUpdate, props);
  }

  public void updateViewExtraData(int tag, Object extraData) {
    UiThreadUtil.assertOnUiThread();

    ViewManager viewManager = mTagsToViewManagers.get(tag);
    if (viewManager == null) {
      throw new IllegalViewOperationException("ViewManager for tag " + tag + " could not be found");
    }

    View viewToUpdate = mTagsToViews.get(tag);
    if (viewToUpdate == null) {
      throw new IllegalViewOperationException("Trying to update view with tag " + tag + " which " +
          "doesn't exist");
    }
    viewManager.updateExtraData(viewToUpdate, extraData);
  }

  public void updateLayout(
      int parentTag,
      int tag,
      int x,
      int y,
      int width,
      int height) {
    UiThreadUtil.assertOnUiThread();

    View viewToUpdate = mTagsToViews.get(tag);
    if (viewToUpdate == null) {
      throw new IllegalViewOperationException("Trying to update view with tag " + tag + " which " +
          "doesn't exist");
    }

    // Even though we have exact dimensions, we still call measure because some platform views (e.g.
    // Switch) assume that method will always be called before onLayout and onDraw. They use it to
    // calculate and cache information used in the draw pass. For most views, onMeasure can be
    // stubbed out to only call setMeasuredDimensions. For ViewGroups, onLayout should be stubbed
    // out to not recursively call layout on its children: React Native already handles doing that.
    //
    // Also, note measure and layout need to be called *after* all View properties have been updated
    // because of caching and calculation that may occur in onMeasure and onLayout. Layout
    // operations should also follow the native view hierarchy and go top to bottom for consistency
    // with standard layout passes (some views may depend on this).

    viewToUpdate.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));

    // Check if the parent of the view has to layout the view, or the child has to lay itself out.
    if (!mRootTags.get(parentTag)) {
      ViewManager parentViewManager = mTagsToViewManagers.get(parentTag);
      ViewGroupManager parentViewGroupManager;
      if (parentViewManager instanceof ViewGroupManager) {
        parentViewGroupManager = (ViewGroupManager) parentViewManager;
      } else {
        throw new IllegalViewOperationException("Trying to use view with tag " + tag +
            " as a parent, but its Manager doesn't extends ViewGroupManager");
      }
      if (parentViewGroupManager != null
          && !parentViewGroupManager.needsCustomLayoutForChildren()) {
        viewToUpdate.layout(x, y, x + width, y + height);
      }
    } else {
      viewToUpdate.layout(x, y, x + width, y + height);
    }
  }

  public void createView(
      int rootViewTagForContext,
      int tag,
      String className,
      @Nullable CatalystStylesDiffMap initialProps) {
    UiThreadUtil.assertOnUiThread();
    ViewManager viewManager = mViewManagers.get(className);

    View view =
        viewManager.createView(mRootViewsContext.get(rootViewTagForContext), mJSResponderHandler);
    mTagsToViews.put(tag, view);
    mTagsToViewManagers.put(tag, viewManager);

    // Use android View id field to store React tag. This is possible since we don't inflate
    // React views from layout xmls. Thus it is easier to just reuse that field instead of
    // creating another (potentially much more expensive) mapping from view to React tag
    view.setId(tag);
    if (initialProps != null) {
      viewManager.updateProperties(view, initialProps);
    }
  }

  private static String constructManageChildrenErrorMessage(
      ViewGroup viewToManage,
      ViewGroupManager viewManager,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {
    StringBuilder stringBuilder = new StringBuilder();

    stringBuilder.append("View tag:" + viewToManage.getId() + "\n");
    stringBuilder.append("  children(" + viewManager.getChildCount(viewToManage) + "): [\n");
    for (int index=0; index<viewManager.getChildCount(viewToManage); index+=16) {
      for (int innerOffset=0;
           ((index+innerOffset) < viewManager.getChildCount(viewToManage)) && innerOffset < 16;
           innerOffset++) {
        stringBuilder.append(viewManager.getChildAt(viewToManage, index+innerOffset).getId() + ",");
      }
      stringBuilder.append("\n");
    }
    stringBuilder.append(" ],\n");
    if (indicesToRemove != null) {
      stringBuilder.append("  indicesToRemove(" + indicesToRemove.length + "): [\n");
      for (int index = 0; index < indicesToRemove.length; index += 16) {
        for (
            int innerOffset = 0;
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
        for (
            int innerOffset = 0;
            ((index + innerOffset) < viewsToAdd.length) && innerOffset < 16;
            innerOffset++) {
          stringBuilder.append(
              "[" + viewsToAdd[index + innerOffset].mIndex + "," +
                  viewsToAdd[index + innerOffset].mTag + "],");
        }
        stringBuilder.append("\n");
      }
      stringBuilder.append(" ],\n");
    }
    if (tagsToDelete != null) {
      stringBuilder.append("  tagsToDelete(" + tagsToDelete.length + "): [\n");
      for (int index = 0; index < tagsToDelete.length; index += 16) {
        for (
            int innerOffset = 0;
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

  /**
   * @param tag react tag of the node we want to manage
   * @param indicesToRemove ordered (asc) list of indicies at which view should be removed
   * @param viewsToAdd ordered (asc based on mIndex property) list of tag-index pairs that represent
   * a view which should be added at the specified index
   * @param tagsToDelete list of tags corresponding to views that should be removed
   */
  public void manageChildren(
      int tag,
      @Nullable int[] indicesToRemove,
      @Nullable ViewAtIndex[] viewsToAdd,
      @Nullable int[] tagsToDelete) {
    ViewGroup viewToManage = (ViewGroup) mTagsToViews.get(tag);
    ViewGroupManager viewManager = (ViewGroupManager) mTagsToViewManagers.get(tag);
    if (viewManager == null) {
      throw new IllegalViewOperationException("ViewManager for tag " + tag + " could not be found");
    }
    if (viewToManage == null) {
      throw new IllegalViewOperationException("Trying to manageChildren view with tag " + tag +
        " which doesn't exist\n detail: " +
            constructManageChildrenErrorMessage(
                viewToManage,
                viewManager,
                indicesToRemove,
                viewsToAdd,
                tagsToDelete));
    }

    int lastIndexToRemove = viewManager.getChildCount(viewToManage);
    if (indicesToRemove != null) {
      for (int i = indicesToRemove.length - 1; i >= 0; i--) {
        int indexToRemove = indicesToRemove[i];
        if (indexToRemove < 0) {
          throw new IllegalViewOperationException(
              "Trying to remove a negative view index:"
                  + indexToRemove + " view tag: " + tag + "\n detail: " +
                  constructManageChildrenErrorMessage(
                      viewToManage,
                      viewManager,
                      indicesToRemove,
                      viewsToAdd,
                      tagsToDelete));
        }
        if (indexToRemove >= viewManager.getChildCount(viewToManage)) {
          throw new IllegalViewOperationException(
              "Trying to remove a view index above child " +
                  "count " + indexToRemove + " view tag: " + tag + "\n detail: " +
                  constructManageChildrenErrorMessage(
                      viewToManage,
                      viewManager,
                      indicesToRemove,
                      viewsToAdd,
                      tagsToDelete));
        }
        if (indexToRemove >= lastIndexToRemove) {
          throw new IllegalViewOperationException(
              "Trying to remove an out of order view index:"
                  + indexToRemove + " view tag: " + tag + "\n detail: " +
                  constructManageChildrenErrorMessage(
                      viewToManage,
                      viewManager,
                      indicesToRemove,
                      viewsToAdd,
                      tagsToDelete));
        }
        View childView = viewManager.getChildAt(viewToManage, indicesToRemove[i]);
        if (childView == null) {
          throw new IllegalViewOperationException(
              "Trying to remove a null view at index:"
                  + indexToRemove + " view tag: " + tag + "\n detail: " +
                  constructManageChildrenErrorMessage(
                      viewToManage,
                      viewManager,
                      indicesToRemove,
                      viewsToAdd,
                      tagsToDelete));
        }
        viewManager.removeView(viewToManage, childView);
        lastIndexToRemove = indexToRemove;
      }
    }

    if (viewsToAdd != null) {
      for (int i = 0; i < viewsToAdd.length; i++) {
        ViewAtIndex viewAtIndex = viewsToAdd[i];
        View viewToAdd = mTagsToViews.get(viewAtIndex.mTag);
        if (viewToAdd == null) {
          throw new IllegalViewOperationException(
              "Trying to add unknown view tag: "
                  + viewAtIndex.mTag + "\n detail: " +
                  constructManageChildrenErrorMessage(
                      viewToManage,
                      viewManager,
                      indicesToRemove,
                      viewsToAdd,
                      tagsToDelete));
        }
        viewManager.addView(viewToManage, viewToAdd, viewAtIndex.mIndex);
      }
    }

    if (tagsToDelete != null) {
      for (int i = 0; i < tagsToDelete.length; i++) {
        int tagToDelete = tagsToDelete[i];
        View viewToDestroy = mTagsToViews.get(tagToDelete);
        if (viewToDestroy == null) {
          throw new IllegalViewOperationException(
              "Trying to destroy unknown view tag: "
                  + tagToDelete + "\n detail: " +
                  constructManageChildrenErrorMessage(
                      viewToManage,
                      viewManager,
                      indicesToRemove,
                      viewsToAdd,
                      tagsToDelete));
        }
        dropView(viewToDestroy);
      }
    }
  }

  /**
   * See {@link UIManagerModule#addMeasuredRootView}.
   *
   * Must be called from the UI thread.
   */
  public void addRootView(
      int tag,
      SizeMonitoringFrameLayout view,
      ThemedReactContext themedContext) {
    UiThreadUtil.assertOnUiThread();
    if (view.getId() != View.NO_ID) {
      throw new IllegalViewOperationException(
          "Trying to add a root view with an explicit id already set. React Native uses " +
          "the id field to track react tags and will overwrite this field. If that is fine, " +
          "explicitly overwrite the id field to View.NO_ID before calling addMeasuredRootView.");
    }

    mTagsToViews.put(tag, view);
    mTagsToViewManagers.put(tag, mRootViewManager);
    mRootTags.put(tag, true);
    mRootViewsContext.put(tag, themedContext);
    view.setId(tag);
  }

  /**
   * Releases all references to given native View.
   */
  private void dropView(View view) {
    UiThreadUtil.assertOnUiThread();
    if (!mRootTags.get(view.getId())) {
      // For non-root views we notify viewmanager with {@link ViewManager#onDropInstance}
      Assertions.assertNotNull(mTagsToViewManagers.get(view.getId())).onDropViewInstance(
          (ThemedReactContext) view.getContext(),
          view);
    }
    ViewManager viewManager = mTagsToViewManagers.get(view.getId());
    if (view instanceof ViewGroup && viewManager instanceof ViewGroupManager) {
      ViewGroup viewGroup = (ViewGroup) view;
      ViewGroupManager viewGroupManager = (ViewGroupManager) viewManager;
      for (int i = 0; i < viewGroupManager.getChildCount(viewGroup); i++) {
        View child = viewGroupManager.getChildAt(viewGroup, i);
        if (mTagsToViews.get(child.getId()) != null) {
          dropView(child);
        }
      }
    }
    mTagsToViews.remove(view.getId());
    mTagsToViewManagers.remove(view.getId());
  }

  public void removeRootView(int rootViewTag) {
    UiThreadUtil.assertOnUiThread();
    if (!mRootTags.get(rootViewTag)) {
        SoftAssertions.assertUnreachable(
            "View with tag " + rootViewTag + " is not registered as a root view");
    }
    View rootView = mTagsToViews.get(rootViewTag);
    dropView(rootView);
    mRootTags.delete(rootViewTag);
    mRootViewsContext.remove(rootViewTag);
  }

  /**
   * Returns true on success, false on failure. If successful, after calling, output buffer will be
   * {x, y, width, height}.
   */
  public void measure(int tag, int[] outputBuffer) {
    UiThreadUtil.assertOnUiThread();
    View v = mTagsToViews.get(tag);
    if (v == null) {
      throw new NoSuchNativeViewException("No native view for " + tag + " currently exists");
    }

    // Puts x/y in outputBuffer[0]/[1]
    v.getLocationOnScreen(outputBuffer);
    outputBuffer[2] = v.getWidth();
    outputBuffer[3] = v.getHeight();
  }

  public int findTargetTagForTouch(int reactTag, float touchX, float touchY) {
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + reactTag);
    }
    return TouchTargetHelper.findTargetTagForTouch(touchY, touchX, (ViewGroup) view);
  }

  public void setJSResponder(int reactTag, boolean blockNativeResponder) {
    if (mRootTags.get(reactTag)) {
      SoftAssertions.assertUnreachable(
          "Cannot block native responder on " + reactTag + " that is a root view");
    }
    ViewParent viewParent = blockNativeResponder ? mTagsToViews.get(reactTag).getParent() : null;
    mJSResponderHandler.setJSResponder(reactTag, viewParent);
  }

  public void clearJSResponder() {
    mJSResponderHandler.clearJSResponder();
  }

  /* package */ void startAnimationForNativeView(
      int reactTag,
      Animation animation,
      @Nullable final Callback animationCallback) {
    UiThreadUtil.assertOnUiThread();
    View view = mTagsToViews.get(reactTag);
    final int animationId = animation.getAnimationID();
    if (view != null) {
      animation.setAnimationListener(new AnimationListener() {
        @Override
        public void onFinished() {
          Animation removedAnimation = mAnimationRegistry.removeAnimation(animationId);

          // There's a chance that there was already a removeAnimation call enqueued on the main
          // thread when this callback got enqueued on the main thread, but the Animation class
          // should handle only calling one of onFinished and onCancel exactly once.
          Assertions.assertNotNull(removedAnimation, "Animation was already removed somehow!");
          if (animationCallback != null) {
            animationCallback.invoke(true);
          }
        }

        @Override
        public void onCancel() {
          Animation removedAnimation = mAnimationRegistry.removeAnimation(animationId);

          Assertions.assertNotNull(removedAnimation, "Animation was already removed somehow!");
          if (animationCallback != null) {
            animationCallback.invoke(false);
          }
        }
      });
      animation.start(view);
    } else {
      // TODO(5712813): cleanup callback in JS callbacks table in case of an error
      throw new IllegalViewOperationException("View with tag " + reactTag + " not found");
    }
  }

  public void dispatchCommand(int reactTag, int commandId, @Nullable ReadableArray args) {
    UiThreadUtil.assertOnUiThread();
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new IllegalViewOperationException("Trying to send command to a non-existing view " +
          "with tag " + reactTag);
    }

    ViewManager viewManager = mTagsToViewManagers.get(reactTag);
    if (viewManager == null) {
      throw new IllegalViewOperationException(
          "ViewManager for view tag " + reactTag + " could not be found");
    }

    viewManager.receiveCommand(view, commandId, args);
  }

  /**
   * Show a {@link PopupMenu}.
   *
   * @param reactTag the tag of the anchor view (the PopupMenu is displayed next to this view); this
   *        needs to be the tag of a native view (shadow views can not be anchors)
   * @param items the menu items as an array of strings
   * @param success will be called with the position of the selected item as the first argument, or
   *        no arguments if the menu is dismissed
   */
  public void showPopupMenu(int reactTag, ReadableArray items, Callback success) {
    UiThreadUtil.assertOnUiThread();
    View anchor = mTagsToViews.get(reactTag);
    if (anchor == null) {
      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + reactTag);
    }
    PopupMenu popupMenu = new PopupMenu(getReactContextForView(reactTag), anchor);

    Menu menu = popupMenu.getMenu();
    for (int i = 0; i < items.size(); i++) {
      menu.add(Menu.NONE, Menu.NONE, i, items.getString(i));
    }

    PopupMenuCallbackHandler handler = new PopupMenuCallbackHandler(success);
    popupMenu.setOnMenuItemClickListener(handler);
    popupMenu.setOnDismissListener(handler);

    popupMenu.show();
  }

  private static class PopupMenuCallbackHandler implements PopupMenu.OnMenuItemClickListener,
      PopupMenu.OnDismissListener {

    final Callback mSuccess;
    boolean mConsumed = false;

    private PopupMenuCallbackHandler(Callback success) {
      mSuccess = success;
    }

    @Override
    public void onDismiss(PopupMenu menu) {
      if (!mConsumed) {
        mSuccess.invoke(UIManagerModuleConstants.ACTION_DISMISSED);
        mConsumed = true;
      }
    }

    @Override
    public boolean onMenuItemClick(MenuItem item) {
      if (!mConsumed) {
        mSuccess.invoke(UIManagerModuleConstants.ACTION_ITEM_SELECTED, item.getOrder());
        mConsumed = true;
        return true;
      }
      return false;
    }
  }

  /**
   * @return Themed React context for view with a given {@param reactTag} - in the case of root
   * view it returns the context from {@link #mRootViewsContext} and all the other cases it gets the
   * context directly from the view using {@link View#getContext}.
   */
  private ThemedReactContext getReactContextForView(int reactTag) {
    if (mRootTags.get(reactTag)) {
      return Assertions.assertNotNull(mRootViewsContext.get(reactTag));
    }
    View view = mTagsToViews.get(reactTag);
    if (view == null) {
      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + reactTag);
    }
    return (ThemedReactContext) view.getContext();
  }

  public void sendAccessibilityEvent(int tag, int eventType) {
    View view = mTagsToViews.get(tag);
    if (view == null) {
      throw new JSApplicationIllegalArgumentException("Could not find view with tag " + tag);
    }
    AccessibilityHelper.sendAccessibilityEvent(view, eventType);
  }

}
