diff --git a/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewFocusEvent.java b/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewFocusEvent.java
new file mode 100644
index 0000000000..87364957dc
--- /dev/null
+++ b/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewFocusEvent.java
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
