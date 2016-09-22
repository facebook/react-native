/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.switchview;

import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by a ReactSwitchManager once a switch is fully switched on/off
 */
/*package*/ class ReactSwitchEvent extends Event<ReactSwitchEvent> {

    public static final String EVENT_NAME = "topChange";

    private final boolean mIsChecked;

    /**
     * See {@link Event#Event(int)}.
     *
     * @param viewTag
     * @param isChecked
     */
    @Deprecated
    public ReactSwitchEvent(int viewTag, boolean isChecked) {
        super(viewTag);
        mIsChecked = isChecked;
    }

    public ReactSwitchEvent(View view, boolean isChecked) {
        super(view);
        mIsChecked = isChecked;
    }

    public boolean getIsChecked() {
        return mIsChecked;
    }

    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Override
    public short getCoalescingKey() {
        // All switch events for a given view can be coalesced.
        return 0;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
    }

    private WritableMap serializeEventData() {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("target", getViewTag());
        eventData.putBoolean("value", getIsChecked());
        return eventData;
    }
}
