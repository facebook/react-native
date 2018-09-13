/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;

/**
 * Custom implementation of {@link org.junit.runners.model.MultipleFailureException} that includes
 * stack information of collected exception as a part of the message.
 */
public class MultipleFailureException extends org.junit.runners.model.MultipleFailureException {

  public MultipleFailureException(List<Throwable> errors) {
    super(errors);
  }

  @Override
  public String getMessage() {
    StringBuilder sb = new StringBuilder();
    List<Throwable> errors = getFailures();

    sb.append(String.format("There were %d errors:", errors.size()));

    int i = 0;
    for (Throwable e : errors) {
      sb.append(String.format("%n---- Error #%d", i));
      sb.append("\n" + getStackTraceAsString(e));
      i++;
    }
    sb.append("\n");
    return sb.toString();
  }

  private static String getStackTraceAsString(Throwable throwable) {
    StringWriter stringWriter = new StringWriter();
    throwable.printStackTrace(new PrintWriter(stringWriter));
    return stringWriter.toString();
  }
}
