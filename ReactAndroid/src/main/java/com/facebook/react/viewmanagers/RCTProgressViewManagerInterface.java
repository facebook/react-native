/**
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* @generated by codegen project: GeneratePropsJavaInterface.js
*/

package com.facebook.react.viewmanagers;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;

public interface RCTProgressViewManagerInterface<T extends View> {
  void setProgressViewStyle(T view, @Nullable String value);
  void setProgress(T view, float value);
  void setProgressTintColor(T view, @Nullable Integer value);
  void setTrackTintColor(T view, @Nullable Integer value);
  void setProgressImage(T view, @Nullable ReadableMap value);
  void setTrackImage(T view, @Nullable ReadableMap value);
}
