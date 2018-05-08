package com.facebook.react.bridge;

import com.facebook.react.uimanager.common.MeasureSpecProvider;
import com.facebook.react.uimanager.common.SizeMonitoringFrameLayout;

public interface UIManager extends JSIModule {

  /**
   * Registers a new root view.
   */
  <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(final T rootView);

}
