/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
package com.facebook.react.devsupport.interfaces;

import android.util.Pair;

/**
 * Interface that lets parts of the app process the errors before showing the redbox
 */
public interface ErrorCustomizer {

  /**
   * The function that need to be registered using {@link DevSupportManager}.registerErrorCustomizer
   * and is called before passing the error to the RedBox.
   */
  Pair<String, StackFrame[]> customizeErrorInfo(Pair<String, StackFrame[]> errorInfo);
}
