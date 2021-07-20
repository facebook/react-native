/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import java.util.List;

/** Provides UIImplementation to use in {@link UIManagerModule}. */
@Deprecated
public class UIImplementationProvider {

  public UIImplementation createUIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerResolver viewManagerResolver,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "UIImplementationProvider.createUIImplementation[1]");
    try {
      return new UIImplementation(
          reactContext,
          viewManagerResolver,
          eventDispatcher,
          minTimeLeftInFrameForNonBatchedOperationMs);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  public UIImplementation createUIImplementation(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagerList,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "UIImplementationProvider.createUIImplementation[2]");
    try {
      return new UIImplementation(
          reactContext,
          viewManagerList,
          eventDispatcher,
          minTimeLeftInFrameForNonBatchedOperationMs);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  UIImplementation createUIImplementation(
      ReactApplicationContext reactContext,
      ViewManagerRegistry viewManagerRegistry,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "UIImplementationProvider.createUIImplementation[3]");
    try {
      return new UIImplementation(
          reactContext,
          viewManagerRegistry,
          eventDispatcher,
          minTimeLeftInFrameForNonBatchedOperationMs);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }
}
