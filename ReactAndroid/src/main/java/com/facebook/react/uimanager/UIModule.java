package com.facebook.react.uimanager;

public interface UIModule {

  <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(final T rootView);

}
