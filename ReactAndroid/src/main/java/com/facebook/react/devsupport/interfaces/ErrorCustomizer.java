/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
