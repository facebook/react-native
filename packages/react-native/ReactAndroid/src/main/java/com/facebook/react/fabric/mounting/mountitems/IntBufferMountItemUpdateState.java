package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;
import com.facebook.react.uimanager.StateWrapper;

import android.view.View;


public class IntBufferMountItemUpdateState extends IntBufferMountItem {

    private final StateWrapper stateWrapper;

    public IntBufferMountItemUpdateState(int reactTag, View view, StateWrapper stateWrapper) {
        super(InstructionType.UPDATE_STATE, reactTag, view);
        this.stateWrapper = stateWrapper;
    }

    public StateWrapper getStateWrapper() {
        return stateWrapper;
    }
}
