package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;

import android.view.View;

public class IntBufferMountItemDelete extends IntBufferMountItem {

    public IntBufferMountItemDelete(int reactTag, View view) {
        super(InstructionType.DELETE, reactTag, view);
    }
}
