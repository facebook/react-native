/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component;

import android.content.Context;
import android.net.Uri;
import androidx.annotation.Nullable;
import com.facebook.drawee.view.SimpleDraweeView;
import com.facebook.react.bridge.ReadableMap;

class NativeViewWithState extends SimpleDraweeView {

  public NativeViewWithState(Context context) {
    super(context);
  }

  void setImageSource(@Nullable ReadableMap source) {
    String uri = source != null ? source.getString("uri") : null;
    Uri imageUri = Uri.parse(uri);
    this.setImageURI(imageUri);
  }
}
