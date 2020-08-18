--- /home/mganandraj/code/rn-macos-fb62merge-fresh/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewFocusEvent.java	1969-12-31 16:00:00.000000000 -0800
+++ /home/mganandraj/code/rn-macos-fb62merge/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewFocusEvent.java	2020-08-17 16:32:31.491113001 -0700
@@ -0,0 +1,49 @@
+/**
+ * Copyright (c) 2015-present, Facebook, Inc.
+ *
+ * This source code is licensed under the MIT license found in the
+ * LICENSE file in the root directory of this source tree.
+ */
+
+package com.facebook.react.views.view;
+
+import com.facebook.react.bridge.Arguments;
+import com.facebook.react.bridge.WritableMap;
+import com.facebook.react.uimanager.events.Event;
+import com.facebook.react.uimanager.events.RCTEventEmitter;
+
+/**
+ * Event emitted by native View when it receives focus.
+ */
+/* package */ class ReactViewFocusEvent extends Event<ReactViewFocusEvent> {
+
+  private static final String EVENT_NAME = "topOnFocusChange";
+  private boolean mHasFocus;
+
+  public ReactViewFocusEvent(int viewId, boolean hasFocus) {
+    super(viewId);
+    mHasFocus = hasFocus;
+  }
+
+  @Override
+  public String getEventName() {
+    return EVENT_NAME;
+  }
+
+  @Override
+  public boolean canCoalesce() {
+    return false;
+  }
+
+  @Override
+  public void dispatch(RCTEventEmitter rctEventEmitter) {
+    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
+  }
+
+  private WritableMap serializeEventData() {
+    WritableMap eventData = Arguments.createMap();
+    eventData.putInt("target", getViewTag());
+    eventData.putBoolean("hasFocus", mHasFocus);
+    return eventData;
+  }
+}
