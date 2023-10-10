package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;

import android.view.View;

public class IntBufferMountItemUpdateLayout extends IntBufferMountItem {

    private int parentTag;
    private View parentView;
    private int x;
    private int y;
    private int width;
    private int height;
    private int displayType;

    public IntBufferMountItemUpdateLayout(int reactTag, View view, int parentTag, View parentView,
                                          int x, int y, int width, int height, int displayType) {
        super(InstructionType.UPDATE_LAYOUT, reactTag, view);
        this.parentTag = parentTag;
        this.parentView = parentView;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.displayType = displayType;
    }

    public int getParentTag() {
        return parentTag;
    }

    public View getParentView() {
        return parentView;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public int getDisplayType() {
        return displayType;
    }
}
