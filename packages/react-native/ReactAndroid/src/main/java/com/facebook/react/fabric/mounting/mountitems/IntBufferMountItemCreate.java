package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.InstructionType;
import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.fabric.events.EventEmitterWrapper;

import android.view.View;

public class IntBufferMountItemCreate extends IntBufferMountItem {

    private final String componentName;
    private final Object props;
    private final StateWrapper stateWrapper;
    private final EventEmitterWrapper eventEmitterWrapper;
    private final boolean isLayoutable;

    public IntBufferMountItemCreate(int reactTag, View view, String componentName, Object props, StateWrapper stateWrapper, EventEmitterWrapper eventEmitterWrapper, boolean isLayoutable) {
        super(InstructionType.CREATE, reactTag, view);
        this.componentName = componentName;
        this.props = props;
        this.stateWrapper = stateWrapper;
        this.eventEmitterWrapper = eventEmitterWrapper;
        this.isLayoutable = isLayoutable;
    }

    public String getComponentName() {
        return componentName;
    }

    public Object getProps() {
        return props;
    }

    public StateWrapper getStateWrapper() {
        return stateWrapper;
    }

    public EventEmitterWrapper getEventEmitterWrapper() {
        return eventEmitterWrapper;
    }

    public boolean isLayoutable() {
        return isLayoutable;
    }
}
