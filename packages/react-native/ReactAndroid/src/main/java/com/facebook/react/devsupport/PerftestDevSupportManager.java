/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;

/**
 * Interface for accessing and interacting with development features related to performance testing.
 * Communication is enabled via the Inspector, but everything else is disabled.
 */
public final class PerftestDevSupportManager extends DisabledDevSupportManager {
  private final DevServerHelper mDevServerHelper;
  private final DevInternalSettings mDevSettings;
  private final InspectorPackagerConnection.BundleStatus mBundleStatus;

  public PerftestDevSupportManager(Context applicationContext) {
    mDevSettings =
        new DevInternalSettings(
            applicationContext,
            new DevInternalSettings.Listener() {
              @Override
              public void onInternalSettingsChanged() {}
            });
    mBundleStatus = new InspectorPackagerConnection.BundleStatus();
    mDevServerHelper =
        new DevServerHelper(
            mDevSettings,
            applicationContext.getPackageName(),
            (InspectorPackagerConnection.BundleStatusProvider) () -> mBundleStatus,
            mDevSettings.getPackagerConnectionSettings());
  }

  @Override
  public DevInternalSettings getDevSettings() {
    return mDevSettings;
  }

  @Override
  public void startInspector() {
    mDevServerHelper.openInspectorConnection();
  }

  @Override
  public void stopInspector() {
    mDevServerHelper.closeInspectorConnection();
  }
}
