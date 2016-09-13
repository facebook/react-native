/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.common;

import android.app.Application;

import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Holds the current Application Object.
 *
 * TODO(9577825): This is a bad pattern, we should thread through an Environment object instead.
 * Remove once bridge is unforked.
 */
@DoNotStrip
@Deprecated
public class ApplicationHolder {

  private static Application sApplication;

  public static void setApplication(Application application) {
    sApplication = application;
  }

  @DoNotStrip
  public static Application getApplication() {
    return Assertions.assertNotNull(sApplication);
  }
}
