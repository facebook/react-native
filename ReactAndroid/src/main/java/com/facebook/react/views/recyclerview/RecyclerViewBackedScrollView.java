// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.recyclerview;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import android.content.Context;
import android.os.SystemClock;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.views.scroll.ScrollEvent;

/**
 * Wraps {@link RecyclerView} providing interface similar to `ScrollView.js` where each children
 * will be rendered as a separate {@link RecyclerView} row.
 *
 * Currently supports only vertically positioned item. Views will not be automatically recycled but
 * they will be detache from native view hierarchy when scrolled offscreen.
 *
 * It works by storing all child views in an array within adapter and binding appropriate views to
 * rows when requested.
 */
@VisibleForTesting
public class RecyclerViewBackedScrollView extends RecyclerView {

  /**
   * Simple implementation of {@link ViewHolder} as it's an abstract class. The only thing we need
   * to hold in this implementation is the reference to {@link RecyclableWrapperViewGroup} that
   * is already stored by default.
   */
  private static class ConcreteViewHolder extends ViewHolder {
    public ConcreteViewHolder(View itemView) {
      super(itemView);
    }
  }

  /**
   * View that is going to be used as a cell in {@link RecyclerView}. It's going to be reusable and
   * we will remove/attach views for a certain positions based on the {@code mViews} array stored
   * in the adapter class.
   *
   * This method overrides {@link #onMeasure} and delegates measurements to the child view that has
   * been attached to. This is because instances of {@link RecyclableWrapperViewGroup} are created
   * outside of {@link NativeViewHierarchyManager} and their layout is not managed by that manager
   * as opposed to all the other react-native views. Instead we use dimensions of the child view
   * (dimensions has been set in layouting process) so that size of this view match the size of
   * the view it wraps.
   */
  private static class RecyclableWrapperViewGroup extends ViewGroup {

    public RecyclableWrapperViewGroup(Context context) {
      super(context);
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {
      // This view will only have one child that is managed by the `NativeViewHierarchyManager` and
      // its position and dimensions are set separately. We don't need to handle its layouting here
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
      if (getChildCount() > 0) {
        // We override measure spec and use dimensions of the children. Children is a view added
        // from the adapter and always have a correct dimensions specified as they are calculated
        // and set with NativeViewHierarchyManager
        View child = getChildAt(0);
        setMeasuredDimension(child.getMeasuredWidth(), child.getMeasuredHeight());
      } else {
        Assertions.assertUnreachable("RecyclableWrapperView measured but no view attached");
      }
    }
  }

  /*package*/ static class ReactListAdapter extends Adapter<ConcreteViewHolder> {

    private final List<View> mViews = new ArrayList<>();
    private final Map<View, Integer> mTopOffsetsFromLayout = new HashMap<>();
    private int mTotalChildrenHeight = 0;

    // The following `OnLayoutChangeListsner` is attached to the views stored in the adapter
    // `mViews` array. It's used to get layout information passed to that view from css-layout
    // and to update its layout to be enclosed in the wrapper view group.
    private final View.OnLayoutChangeListener
        mChildLayoutChangeListener = new View.OnLayoutChangeListener() {

      private boolean mReentrant = false;

      @Override
      public void onLayoutChange(
          View v,
          int left,
          int top,
          int right,
          int bottom,
          int oldLeft,
          int oldTop,
          int oldRight,
          int oldBottom) {
        // We need to get layout information from css-layout to set the size of the rows correctly
        // and we also use top position that is calculated there to provide correct offset for the
        // scroll events.
        // To achieve both we first store updated top position. Then we call layout again to
        // re-layout view at (0,0) position because each view cell needs a position in relative
        // coordinates. To prevent from this event being triggered when we call layout again, we
        // use `mReentrant` boolean as a guard.

        if (!mReentrant) {
          int oldHeight = (oldBottom - oldTop);
          int newHeight = (bottom - top);
          int width = right - left;

          // Update top positions cache and total height
          mTopOffsetsFromLayout.put(v, top);
          mTotalChildrenHeight = mTotalChildrenHeight - oldHeight + newHeight;

          // We need to re-layout view to place it in relative coordinates of cell wrapper -> (0,0)
          mReentrant = true;
          v.layout(0, 0, width, newHeight);
          mReentrant = false;

          // Since "wrapper" view position +dimensions are not managed by NativeViewHierarchyManager
          // we need to ensure that the wrapper view is properly layed out as it dimension should
          // be updated if the wrapped view dimensions are changed.
          // To achieve that we call `forceLayout()` on the view modified and on `RecyclerView`
          // instance (which is accessible with `v.getParent().getParent()` if the view is
          // attached). We rely on NativeViewHierarchyManager to call `layout` on `RecyclerView`
          // then, which will happen once all the children of `RecyclerView` have their layout
          // updated. This will trigger `layout` call on attached wrapper nodes and will let us
          // update dimensions of them through overridden onMeasure method.
          // We don't care about calling this is the view is not currently attached as it would be
          // laid out once added to the recycler.
          if (newHeight != oldHeight && v.getParent() != null
              && v.getParent().getParent() != null) {
            View wrapper = (View) v.getParent(); // native view that wraps view added to adapter
            wrapper.forceLayout();
            // wrapper.getParent() points to the recycler if the view is currently attached (it
            // could be in "scrape" state when it is attached to recyclable wrapper but not to
            // the recycler)
            ((View) wrapper.getParent()).forceLayout();
          }
        }
      }
    };

    public ReactListAdapter() {
      setHasStableIds(true);
    }

    public void addView(View child, int index) {
      mViews.add(index, child);

      mTotalChildrenHeight += child.getMeasuredHeight();
      mTopOffsetsFromLayout.put(child, child.getTop());
      child.addOnLayoutChangeListener(mChildLayoutChangeListener);

      notifyDataSetChanged();
    }

    public void removeView(View child) {
      if (mViews.remove(child)) {
        mTopOffsetsFromLayout.remove(child);
        child.removeOnLayoutChangeListener(mChildLayoutChangeListener);
        mTotalChildrenHeight -= child.getMeasuredHeight();

        notifyDataSetChanged();
      }
    }

    @Override
    public ConcreteViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
      return new ConcreteViewHolder(new RecyclableWrapperViewGroup(parent.getContext()));
    }

    @Override
    public void onBindViewHolder(ConcreteViewHolder holder, int position) {
      RecyclableWrapperViewGroup vg = (RecyclableWrapperViewGroup) holder.itemView;
      View row = mViews.get(position);
      if (row.getParent() != vg) {
        vg.addView(row, 0);
      }
    }

    @Override
    public void onViewRecycled(ConcreteViewHolder holder) {
      super.onViewRecycled(holder);
      ((RecyclableWrapperViewGroup) holder.itemView).removeAllViews();
    }

    @Override
    public int getItemCount() {
      return mViews.size();
    }

    @Override
    public long getItemId(int position) {
      return mViews.get(position).getId();
    }

    public View getView(int index) {
      return mViews.get(index);
    }

    public int getTotalChildrenHeight() {
      return mTotalChildrenHeight;
    }

    public int getTopOffsetForItem(int index) {
      return Assertions.assertNotNull(
          mTopOffsetsFromLayout.get(Assertions.assertNotNull(mViews.get(index))));
    }
  }

  @Override
  protected void onScrollChanged(int l, int t, int oldl, int oldt) {
    super.onScrollChanged(l, t, oldl, oldt);

    ReactListAdapter adapter = (ReactListAdapter) getAdapter();

    int offsetY = 0;
    if (getChildCount() > 0) {
      View recyclerViewChild = getChildAt(0);
      int childPosition = getChildAdapterPosition(recyclerViewChild);
      offsetY = adapter.getTopOffsetForItem(childPosition) - recyclerViewChild.getTop();
    }

    ScrollEvent event = new ScrollEvent(
        getId(),
        SystemClock.uptimeMillis(),
        0, /* offsetX = 0, horizontal scrolling only */
        offsetY,
        getWidth(),
        adapter.getTotalChildrenHeight(),
        getWidth(),
        getHeight());
    ((ReactContext) getContext()).getNativeModule(UIManagerModule.class).getEventDispatcher()
        .dispatchEvent(event);
  }

  public RecyclerViewBackedScrollView(Context context) {
    super(context);
    setHasFixedSize(true);
    setItemAnimator(new NotAnimatedItemAnimator());
    setLayoutManager(new LinearLayoutManager(context));
    setAdapter(new ReactListAdapter());
  }

  /*package*/ void addViewToAdapter(View child, int index) {
    ((ReactListAdapter) getAdapter()).addView(child, index);
  }

  /*package*/ void removeViewFromAdapter(View child) {
    ((ReactListAdapter) getAdapter()).removeView(child);
  }

  /*package*/ View getChildAtFromAdapter(int index) {
    return ((ReactListAdapter) getAdapter()).getView(index);
  }

  /*package*/ int getChildCountFromAdapter() {
    return getAdapter().getItemCount();
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev);
      return true;
    }
    return false;
  }
}
