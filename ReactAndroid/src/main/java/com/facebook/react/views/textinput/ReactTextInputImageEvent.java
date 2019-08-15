/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by EditText native view when text changes.
 * VisibleForTesting from {@link TextInputEventsTestCase}.
 */
public class ReactTextInputImageEvent extends Event<ReactTextInputImageEvent> {

  public static final String EVENT_NAME = "topImage";

  private String mUri;
  private String mLinkUri;
  private String mMime;

  public ReactTextInputImageEvent(
      int viewId,
      String uri,
      String linkUri,
      String mime) {
    super(viewId);
    mUri = uri;
    mLinkUri = linkUri;
    mMime = mime;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putString("uri", mUri);
    eventData.putString("linkUri", mLinkUri);
    eventData.putString("mime", mMime);
    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
