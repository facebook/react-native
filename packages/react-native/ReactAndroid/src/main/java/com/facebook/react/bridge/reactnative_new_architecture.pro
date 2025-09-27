# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

-keepnames class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keepclassmembers class * extends com.facebook.react.turbomodule.core.interfaces.TurboModule {
    @com.facebook.react.bridge.ReactMethod *;
    public <init>(...);
}

-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }
-keepnames class * extends com.facebook.react.uimanager.ViewManager
-keep class **$$PropsSetter
-keep class **$$ReactModuleInfoProvider
-keep class com.facebook.react.bridge.ReadableType { *; }

-keepclassmembers class com.facebook.react.bridge.queue.MessageQueueThread {
  public boolean isOnThread();
}
