/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
