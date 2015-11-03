/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.viewpager;

import java.util.ArrayList;
import java.util.List;

import android.os.SystemClock;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.NativeGestureUtil;

/**
 * Wrapper view for {@link ViewPager}. It's forwarding calls to {@link ViewGroup#addView} to add
 * views to custom {@link PagerAdapter} instance which is used by {@link NativeViewHierarchyManager}
 * to add children nodes according to react views hierarchy.
 */
/* package */ class ReactViewPager extends ViewPager {

  private class Adapter extends PagerAdapter {

    private List<View> mViews = new ArrayList<>();

    void addView(View child, int index) {
      mViews.add(index, child);
      notifyDataSetChanged();
      // This will prevent view pager from detaching views for pages that are not currently selected
      // We need to do that since {@link ViewPager} relies on layout passes to position those views
      // in a right way (also thanks to {@link ReactViewPagerManager#needsCustomLayoutForChildren}
      // returning {@code true}). Currently we only call {@link View#measure} and
      // {@link View#layout} after CSSLayout step.

      // TODO(7323049): Remove this workaround once we figure out a way to re-layout some views on
      // request
      setOffscreenPageLimit(mViews.size());
    }

    void removeViewAt(int index) {
      mViews.remove(index);
      notifyDataSetChanged();

      // TODO(7323049): Remove this workaround once we figure out a way to re-layout some views on
      // request
      setOffscreenPageLimit(mViews.size());
    }

    View getViewAt(int index) {
      return mViews.get(index);
    }

    @Override
    public int getCount() {
      return mViews.size();
    }

    @Override
    public Object instantiateItem(ViewGroup container, int position) {
      View view = mViews.get(position);
      container.addView(view, 0, generateDefaultLayoutParams());
      return view;
    }

    @Override
    public void destroyItem(ViewGroup container, int position, Object object) {
      View view = mViews.get(position);
      container.removeView(view);
    }

    @Override
    public boolean isViewFromObject(View view, Object object) {
      return view == object;
    }
  }

  private class PageChangeListener implements OnPageChangeListener {

    @Override
    public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
      mEventDispatcher.dispatchEvent(
          new PageScrollEvent(getId(), SystemClock.uptimeMillis(), position, positionOffset));
    }

    @Override
    public void onPageSelected(int position) {
      if (!mIsCurrentItemFromJs) {
        mEventDispatcher.dispatchEvent(
            new PageSelectedEvent(getId(), SystemClock.uptimeMillis(), position));
      }
    }

    @Override
    public void onPageScrollStateChanged(int state) {
      // don't send events
    }
  }

  private final EventDispatcher mEventDispatcher;
  private boolean mIsCurrentItemFromJs;

  public ReactViewPager(ReactContext reactContext) {
    super(reactContext);
    mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    mIsCurrentItemFromJs = false;
    setOnPageChangeListener(new PageChangeListener());
    setAdapter(new Adapter());
  }

  @Override
  public Adapter getAdapter() {
    return (Adapter) super.getAdapter();
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev);
      return true;
    }
    return false;
  }

  /*package*/ void addViewToAdapter(View child, int index) {
    getAdapter().addView(child, index);
  }

  /*package*/ void removeViewFromAdapter(int index) {
    getAdapter().removeViewAt(index);
  }

  /*package*/ int getViewCountInAdapter() {
    return getAdapter().getCount();
  }

  /*package*/ View getViewFromAdapter(int index) {
    return getAdapter().getViewAt(index);
  }

  /*package*/ void setCurrentItemFromJs(int item) {
    mIsCurrentItemFromJs = true;
    setCurrentItem(item);
    mIsCurrentItemFromJs = false;
  }
}
