package com.facebook.react.views.scroll;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.widget.HorizontalScrollView;

public class PagingHorizontalScrollView extends HorizontalScrollView implements
        View.OnTouchListener, GestureDetector.OnGestureListener {

    private static final int SWIPE_PAGE_ON_FACTOR = 5;
    private static final int SWIPE_PAGE_MINIMUM_VELOCITY = 500;
    private static final float SNAP_TO_INTERVAL_UNSET = -1.0f;

    private GestureDetector gestureDetector;
    private float prevScrollX = 0;
    private boolean start = true;
    private float currentScrollX;

    private boolean pagingEnabled = false;
    private float snapToInterval = SNAP_TO_INTERVAL_UNSET;

    public PagingHorizontalScrollView(Context context) {
        super(context);
        setLayoutParams(new LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
    }

    public void setPagingEnabled(boolean pagingEnabled) {
        this.pagingEnabled = pagingEnabled;
        setSnappingEnabled(pagingEnabled);
    }

    public void setSnapToInterval(float snapToInterval) {
        if (snapToInterval > 0) {
            DisplayMetrics metrics = getResources().getDisplayMetrics();
            this.snapToInterval = snapToInterval * metrics.density;
            setSnappingEnabled(true);
        } else {
            this.snapToInterval = SNAP_TO_INTERVAL_UNSET;
            setSnappingEnabled(false);
        }
    }

    private void setSnappingEnabled(boolean enabled) {
        if (enabled) {
            gestureDetector = new GestureDetector(getContext(), this);
            this.setOnTouchListener(this);
        } else {
            gestureDetector = null;
            this.setOnTouchListener(null);
        }
    }

    private float getSnapToInterval() {
        if (snapToInterval != SNAP_TO_INTERVAL_UNSET) {
            return snapToInterval;
        } else if (pagingEnabled) {
            return getMeasuredWidth();
        } else {
            return SNAP_TO_INTERVAL_UNSET;
        }
    }

    public int numPages() {
        return (int) Math.ceil(1.0 * computeHorizontalScrollRange() / getSnapToInterval());
    }

    public int currentPage(float scrollX) {
        return (int) Math.floor(1.0 * scrollX / getSnapToInterval());
    }

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        if (getSnapToInterval() == SNAP_TO_INTERVAL_UNSET) {
            return false;
        }

        if (gestureDetector.onTouchEvent(event)) {
            return true;
        }

        boolean result = gestureDetector.onTouchEvent(event);
        int x = (int) event.getRawX();

        switch (event.getAction()) {
            case MotionEvent.ACTION_MOVE:
                if (start) {
                    prevScrollX = x;
                    start = false;
                }
                break;
            case MotionEvent.ACTION_UP:
                start = true;
                currentScrollX = x;
                int minSwipe = (int) (getSnapToInterval() / SWIPE_PAGE_ON_FACTOR);
                float delta = prevScrollX - currentScrollX;
                handleMovement(delta, minSwipe);
                result = true;
                break;
        }

        return result;
    }

    @Override
    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
        if (getSnapToInterval() == SNAP_TO_INTERVAL_UNSET) {
            return false;
        }

        if (Math.abs(velocityX) < SWIPE_PAGE_MINIMUM_VELOCITY) {
            return false;
        }

        handleMovement(-1.0f * velocityX, SWIPE_PAGE_MINIMUM_VELOCITY);
        return true;
    }

    private void handleMovement(float delta, float threshold) {
        int currentPage = currentPage(computeHorizontalScrollOffset());


        int targetPage;
        if (delta > threshold && currentPage < numPages() - 1) {
            // Swipe forward, go to next page.
            targetPage = currentPage + 1;
        } else if (-1 * delta > threshold) {
            // Swipe backward; at this point currentPage is actually the previous page.
            targetPage = currentPage;
        } else if (delta < 0) {
            // Partial swipe backward, scroll forward to the page we started at.
            targetPage = currentPage + 1;
        } else {
            // Partial swipe forward, scroll back to the page we started at.
            targetPage = currentPage;
        }

        smoothScrollTo(Math.round(targetPage * getSnapToInterval()), 0);
    }

    @Override
    public boolean onDown(MotionEvent e) {
        return false;
    }

    @Override
    public void onLongPress(MotionEvent e) {}

    @Override
    public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
        return false;
    }

    @Override
    public void onShowPress(MotionEvent e) {}

    @Override
    public boolean onSingleTapUp(MotionEvent e) {
        return false;
    }
}
