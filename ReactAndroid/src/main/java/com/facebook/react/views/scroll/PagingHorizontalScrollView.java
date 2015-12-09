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
    private static final int SWIPE_PAGE_MINIMUM_VELOCITY = 1000;

    private GestureDetector gestureDetector;
    private float prevScrollX = 0;
    private boolean start = true;
    private float currentScrollX;

    private float snapToInterval = 0;

    public PagingHorizontalScrollView(Context context) {
        super(context);
        setLayoutParams(new LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
    }

    public void setSnapToInterval(float snapToInterval) {
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        this.snapToInterval = snapToInterval * metrics.density;

        if (snapToInterval != 0) {
            gestureDetector = new GestureDetector(getContext(), this);
            this.setOnTouchListener(this);
        } else {
            gestureDetector = null;
            this.setOnTouchListener(null);
        }
    }

    public int numPages() {
        return (int) Math.ceil(1.0 * computeHorizontalScrollRange() / snapToInterval);
    }

    public int currentPage(float scrollX) {
        return (int) Math.floor(1.0 * scrollX / snapToInterval);
    }

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        if (snapToInterval == 0) {
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
                int minSwipe = (int) (snapToInterval / SWIPE_PAGE_ON_FACTOR);
                float delta = prevScrollX - currentScrollX;
                handleMovement(delta, minSwipe);
                result = true;
                break;
        }

        return result;
    }

    @Override
    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
        if (snapToInterval == 0) {
            return false;
        }

        if (Math.abs(velocityX) < SWIPE_PAGE_MINIMUM_VELOCITY) {
            return false;
        }

        if (e2 == null || e1 == null) {
            return false;
        }

        handleMovement(e2.getRawX() - e1.getRawX(), SWIPE_PAGE_MINIMUM_VELOCITY);
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

        smoothScrollTo(Math.round(targetPage * snapToInterval), 0);
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
