package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;

import android.view.View;

public class IntBufferMountItemInsert extends IntBufferMountItem {

    private int parentTag;
    private View parentView;
    private int index;

    public IntBufferMountItemInsert(int reactTag, View view, int parentTag, View parentView, int index) {
        super(InstructionType.INSERT, reactTag, view);
        this.parentTag = parentTag;
        this.parentView = parentView;
        this.index = index;
    }

    public int getParentTag() {
        return parentTag;
    }

    public View getParentView() {
        return parentView;
    }

    public int getIndex() {
        return index;
    }
}
