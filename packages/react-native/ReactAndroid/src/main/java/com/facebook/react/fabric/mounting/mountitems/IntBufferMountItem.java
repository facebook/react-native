package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;

import android.view.View;

public abstract class IntBufferMountItem {
    private final InstructionType instructionType;
    private final int reactTag;
    private final View view;

    public IntBufferMountItem(InstructionType instructionType, int reactTag, View view) {
        this.instructionType = instructionType;
        this.reactTag = reactTag;
        this.view = view;
    }

    public InstructionType getInstructionType() {
        return instructionType;
    }

    public int getReactTag() {
        return reactTag;
    }

    public View getView() {
        return view;
    }
}
