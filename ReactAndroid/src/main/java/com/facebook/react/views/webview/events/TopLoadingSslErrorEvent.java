package com.facebook.react.views.webview.events;


import com.facebook.react.bridge.WritableMap;

public class TopLoadingSslErrorEvent extends TopLoadingErrorEvent {

  public static final String EVENT_NAME = "topLoadingSslError";

  public TopLoadingSslErrorEvent(int viewId, WritableMap eventData) {
    super(viewId, eventData);
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }
}
