/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import com.facebook.buck.android.support.exopackage.ApplicationLike;
import com.facebook.buck.android.support.exopackage.ExopackageApplication;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.soloader.SoLoader;

/**
 * Application class for the Catalyst Launcher to allow it to work as an exopackage.
 *
 * Any app-specific code that should run before secondary dex files are loaded
 * (like setting up crash reporting) should go in onBaseContextAttached.
 * Anything that should run after secondary dex should go in CatalystApplicationImpl.onCreate.
 */
public class ReactTestAppShell extends ExopackageApplication<ApplicationLike> {

  public ReactTestAppShell() {
    super("com.facebook.react.testing.ReactTestApplicationImpl", ReactBuildConfig.EXOPACKAGE_FLAGS);
  }

  @Override
  protected void onBaseContextAttached() {
    // This is a terrible hack.  Don't copy it.
    // It's unfortunate that Instagram does the same thing.
    // We need to do this here because internal apps use SoLoader,
    // and Open Source Buck uses ExopackageSoLoader.
    // If you feel the need to copy this, we should refactor it
    // into an FB-specific subclass of ExopackageApplication.
    SoLoader.init(this, (ReactBuildConfig.EXOPACKAGE_FLAGS & 2) != 0);
  }
}
