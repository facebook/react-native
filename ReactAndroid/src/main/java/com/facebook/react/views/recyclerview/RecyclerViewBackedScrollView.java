// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.recyclerview;

import java.util.ArrayList;
import java.util.List;

import android.content.Context;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.ContentSizeChangeEvent;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;

/**
 * Wraps {@link RecyclerView} providing interface similar to `ScrollView.js` where each children
 * will be rendered as a separate {@link RecyclerView} row.
 *
 * Currently supports only vertically positioned item. Views will not be automatically recycled but
 * they will be detached from native view hierarchy when scrolled offscreen.
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

  /**
   * JavaScript ListView implementation rely on getting correct scroll offset. This class helps
   * with calculating that "real" offset of items in recycler view as those are not provided by
   * android widget implementation ({@link #onScrollChanged} is called with offset 0). We can't use
   * onScrolled either as we need to take into account that if height of element that is not above
   * the visible window changes the real scroll offset will change too, but onScrolled will only
   * give us scroll deltas that comes from the user interaction.
   *
   * This class helps in calculating "real" offset of row at specified index. It's used from
   * {@link #onScrollChanged} to query for the first visible index. Since while scrolling the
   * queried index will usually increment or decrement by one it's optimize to return result in
   * that common case very quickly.
   */
  private static class ScrollOffsetTracker {

    private final ReactListAdapter mReactListAdapter;

    private int mLastRequestedPosition;
    private int mOffsetForLastPosition;

    private ScrollOffsetTracker(ReactListAdapter reactListAdapter) {
      mReactListAdapter = reactListAdapter;
    }

    public void onHeightChange(int index, int oldHeight, int newHeight) {
      if (index < mLastRequestedPosition) {
        mOffsetForLastPosition = (mOffsetForLastPosition - oldHeight + newHeight);
      }
    }

    public int getTopOffsetForItem(int index) {
      // This method is frequently called from the "onScroll" handler of the "RecyclerView" with an
      // index of first visible item of the view. Implementation of this method takes advantage of
      // that fact by caching the value for the last index that this method has been called with.
      //
      // There are a 2 cases that we optimize for:
      // 1) The visible item doesn't change between subsequent "onScroll" calls, in that case we
      //    don't need to calculate anything, just return the cached value
      // 2) The next visible item will be the one that is adjacent to the item that we store the
      //    cached value for: index + 1 when scrolling down or index - 1 when scrolling up. Then it
      //    is sufficient to add/subtract height of item at the "last index"
      //
      // The implementation accounts for the cases when next index is not necessarily a subsequent
      // number of the cached one. In which case we try to minimize the number of rows we will loop
      // through.
      if (mLastRequestedPosition != index) {
        int sum;

        if (mLastRequestedPosition < index) {
          // This can either happen when we're scrolling down or if the cached value has never been
          // calculated
          int startIndex;

          if (mLastRequestedPosition != -1) {
            // We already have the value cached, let's use it and only add heights of the items
            // starting at the index we have the cached value for
            sum = mOffsetForLastPosition;
            startIndex = mLastRequestedPosition;
          } else {
            sum = 0;
            startIndex = 0;
          }

          for (int i = startIndex; i < index; i++) {
            sum += mReactListAdapter.mViews.get(i).getMeasuredHeight();
          }
        } else {
          // We are scrolling up, we can either use cached value and subtract heights of rows
          // between mLastRequestPosition and index, or we can calculate the height starting from 0
          // (this can be quite a frequent case as well, when the list implements "jump to the top"
          // action). We just go for the option that require less calculations
          if (index < (mLastRequestedPosition - index)) {
            // index is relatively small, it's faster to calculate the sum starting from 0
            sum = 0;
            for (int i = 0; i < index; i++) {
              sum += mReactListAdapter.mViews.get(i).getMeasuredHeight();
            }
          } else {
            // index is "closer" to the last cached index than it is to 0. We can reuse cached sum
            // and calculate the new sum by subtracting heights of the elements between
            // "mLastRequestPosition" and "index"
            sum = mOffsetForLastPosition;
            for (int i = mLastRequestedPosition - 1; i >= index; i--) {
              sum -= mReactListAdapter.mViews.get(i).getMeasuredHeight();
            }
          }
        }
        mLastRequestedPosition = index;
        mOffsetForLastPosition = sum;
      }
      return mOffsetForLastPosition;
    }
  }

  /*package*/ static class ReactListAdapter extends Adapter<ConcreteViewHolder> {

    private final List<View> mViews = new ArrayList<>();
    private final ScrollOffsetTracker mScrollOffsetTracker;
    private final RecyclerViewBackedScrollView mScrollView;
    private int mTotalChildrenHeight = 0;

    // The following `OnLayoutChangeListsner` is attached to the views stored in the adapter
    // `mViews` array. It's used to get layout information passed to that view from css-layout
    // and to update its layout to be enclosed in the wrapper view group.
    private final View.OnLayoutChangeListener
        mChildLayoutChangeListener = new View.OnLayoutChangeListener() {

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
        // We need to get layout information from css-layout to set the size of the rows correctly.

        int oldHeight = (oldBottom - oldTop);
        int newHeight = (bottom - top);

        if (oldHeight != newHeight) {
          updateTotalChildrenHeight(newHeight - oldHeight);
          mScrollOffsetTracker.onHeightChange(mViews.indexOf(v), oldHeight, newHeight);

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
          if (v.getParent() != null
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

    public ReactListAdapter(RecyclerViewBackedScrollView scrollView) {
      mScrollView = scrollView;
      mScrollOffsetTracker = new ScrollOffsetTracker(this);
      setHasStableIds(true);
    }

    public void addView(View child, int index) {
      mViews.add(index, child);

      updateTotalChildrenHeight(child.getMeasuredHeight());
      child.addOnLayoutChangeListener(mChildLayoutChangeListener);

      notifyItemInserted(index);
    }

    public void removeViewAt(int index) {
      View child = mViews.get(index);
      if (child != null) {
        mViews.remove(index);
        child.removeOnLayoutChangeListener(mChildLayoutChangeListener);
        updateTotalChildrenHeight(-child.getMeasuredHeight());

        notifyItemRemoved(index);
      }
    }

    private void updateTotalChildrenHeight(int delta) {
      if (delta != 0) {
        mTotalChildrenHeight += delta;
        mScrollView.onTotalChildrenHeightChange(mTotalChildrenHeight);
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
      return mScrollOffsetTracker.getTopOffsetForItem(index);
    }
  }

  private boolean mSendContentSizeChangeEvents;

  public void setSendContentSizeChangeEvents(boolean sendContentSizeChangeEvents) {
    mSendContentSizeChangeEvents = sendContentSizeChangeEvents;
  }

  private int calculateAbsoluteOffset() {
    int offsetY = 0;
    if (getChildCount() > 0) {
      View recyclerViewChild = getChildAt(0);
      int childPosition = getChildViewHolder(recyclerViewChild).getLayoutPosition();
      offsetY = ((ReactListAdapter) getAdapter()).getTopOffsetForItem(childPosition) -
          recyclerViewChild.getTop();
    }
    return offsetY;
  }

  /*package*/ void scrollTo(int scrollX, int scrollY, boolean animated) {
    int deltaY = scrollY - calculateAbsoluteOffset();
    if (animated) {
      smoothScrollBy(0, deltaY);
    } else {
      scrollBy(0, deltaY);
    }
  }

  @Override
  protected void onScrollChanged(int l, int t, int oldl, int oldt) {
    super.onScrollChanged(l, t, oldl, oldt);

    ((ReactContext) getContext()).getNativeModule(UIManagerModule.class).getEventDispatcher()
        .dispatchEvent(ScrollEvent.obtain(
                getId(),
                ScrollEventType.SCROLL,
                0, /* offsetX = 0, horizontal scrolling only */
                calculateAbsoluteOffset(),
                getWidth(),
                ((ReactListAdapter) getAdapter()).getTotalChildrenHeight(),
                getWidth(),
                getHeight()));
  }

  private void onTotalChildrenHeightChange(int newTotalChildrenHeight) {
    if (mSendContentSizeChangeEvents) {
      ((ReactContext) getContext()).getNativeModule(UIManagerModule.class).getEventDispatcher()
          .dispatchEvent(new ContentSizeChangeEvent(
                  getId(),
                  getWidth(),
                  newTotalChildrenHeight));
    }
  }

  public RecyclerViewBackedScrollView(Context context) {
    super(context);
    setHasFixedSize(true);
    setItemAnimator(new NotAnimatedItemAnimator());
    setLayoutManager(new LinearLayoutManager(context));
    setAdapter(new ReactListAdapter(this));
  }

  /*package*/ void addViewToAdapter(View child, int index) {
    ((ReactListAdapter) getAdapter()).addView(child, index);
  }

  /*package*/ void removeViewFromAdapter(int index) {
    ((ReactListAdapter) getAdapter()).removeViewAt(index);
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
