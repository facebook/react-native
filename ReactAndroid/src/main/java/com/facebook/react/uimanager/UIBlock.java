package com.facebook.react.uimanager;

import android.view.View;

/**
 * A task to execute on the UI View for third party libraries.
 */
public interface UIBlock {
  public void execute(NativeViewHierarchyManager nativeViewHierarchyManager);
}
