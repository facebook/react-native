package com.facebook.react.uimanager;

/** Interface definition for a callback to be invoked when the layout has been updated */
public interface LayoutUpdateListener {

  /** Called when the layout has been updated */
  void onLayoutUpdated(ReactShadowNode root);
}
