package com.facebook.react.fabric;

import com.facebook.react.bridge.JavaScriptContextHolder;

public interface FabricBinding {

  void installFabric(JavaScriptContextHolder jsContext, FabricUIManager fabricModule);

}
