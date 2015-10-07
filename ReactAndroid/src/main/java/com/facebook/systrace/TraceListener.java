// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.systrace;

public interface TraceListener {
  void onTraceStarted();
  void onTraceStopped();
}
