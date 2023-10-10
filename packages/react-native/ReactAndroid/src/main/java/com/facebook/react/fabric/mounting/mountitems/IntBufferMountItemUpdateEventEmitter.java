package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.mountitems.IntBufferMountItem;
import com.facebook.react.fabric.mounting.mountitems.InstructionType;
import com.facebook.react.fabric.events.EventEmitterWrapper;

import android.view.View;

public class IntBufferMountItemUpdateEventEmitter extends IntBufferMountItem {

    private final EventEmitterWrapper eventEmitterWrapper;

    public IntBufferMountItemUpdateEventEmitter(int reactTag, View view,
                                                EventEmitterWrapper eventEmitterWrapper) {
        super(InstructionType.UPDATE_EVENT_EMITTER, reactTag, view);
        this.eventEmitterWrapper = eventEmitterWrapper;
    }

    public EventEmitterWrapper getEventEmitterWrapper() {
        return eventEmitterWrapper;
    }
}
