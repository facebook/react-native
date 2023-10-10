package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;

import android.view.View;

public class IntBufferMountItemUpdateProps extends IntBufferMountItem {

    private final Object props;

    public IntBufferMountItemUpdateProps(int reactTag, View view, Object props) {
        super(InstructionType.UPDATE_PROPS, reactTag, view);
        this.props = props;
    }

    public Object getProps() {
        return props;
    }
}
