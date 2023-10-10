package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;

import android.view.View;

public class IntBufferMountItemUpdatePadding extends IntBufferMountItem {


    private int left;
    private int top;
    private int right;
    private int bottom;

    public IntBufferMountItemUpdatePadding(int reactTag, View view, int left, int top, int right,
                                           int bottom) {
        super(InstructionType.UPDATE_PADDING, reactTag, view);
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    public int getLeft() {
        return left;
    }

    public int getTop() {
        return top;
    }

    public int getRight() {
        return right;
    }

    public int getBottom() {
        return bottom;
    }
}
