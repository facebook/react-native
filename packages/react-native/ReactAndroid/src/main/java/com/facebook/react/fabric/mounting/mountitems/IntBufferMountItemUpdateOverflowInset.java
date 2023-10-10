package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;

import android.view.View;

public class IntBufferMountItemUpdateOverflowInset extends IntBufferMountItem {

    private int overflowInsetLeft;
    private int overflowInsetTop;
    private int overflowInsetRight;
    private int overflowInsetBottom;

    public IntBufferMountItemUpdateOverflowInset(int reactTag, View view, int overflowInsetLeft, int overflowInsetTop, int overflowInsetRight,
                                           int overflowInsetBottom) {
        super(InstructionType.UPDATE_OVERFLOW_INSET, reactTag, view);
        this.overflowInsetLeft = overflowInsetLeft;
        this.overflowInsetTop = overflowInsetTop;
        this.overflowInsetRight = overflowInsetRight;
        this.overflowInsetBottom = overflowInsetBottom;
    }

    public int getOverflowInsetLeft() {
        return overflowInsetLeft;
    }

    public int getOverflowInsetTop() {
        return overflowInsetTop;
    }

    public int getOverflowInsetRight() {
        return overflowInsetRight;
    }

    public int getOverflowInsetBottom() {
        return overflowInsetBottom;
    }
}
