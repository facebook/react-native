/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import android.app.Application;

import com.facebook.buck.android.support.exopackage.DefaultApplicationLike;

public class ReactTestApplicationImpl extends DefaultApplicationLike {

  public ReactTestApplicationImpl() {
    super();
  }

  public ReactTestApplicationImpl(Application application) {
    super(application);
  }
}
