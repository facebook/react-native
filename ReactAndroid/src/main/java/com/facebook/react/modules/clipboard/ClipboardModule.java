/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.clipboard;

import android.content.ClipData;
import android.content.ClipboardManager;
import com.facebook.fbreact.specs.NativeClipboardSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;

/** A module that allows JS to get/set clipboard contents. */
@ReactModule(name = ClipboardModule.NAME)
public class ClipboardModule extends NativeClipboardSpec {

  public ClipboardModule(ReactApplicationContext context) {
    super(context);
  }

  public static final String NAME = "Clipboard";

  @Override
  public String getName() {
    return ClipboardModule.NAME;
  }

  private ClipboardManager getClipboardService() {
    return (ClipboardManager)
        getReactApplicationContext()
            .getSystemService(getReactApplicationContext().CLIPBOARD_SERVICE);
  }

  @Override
  public void getString(Promise promise) {
    try {
      ClipboardManager clipboard = getClipboardService();
      ClipData clipData = clipboard.getPrimaryClip();
      if (clipData != null && clipData.getItemCount() >= 1) {
        ClipData.Item firstItem = clipboard.getPrimaryClip().getItemAt(0);
        promise.resolve("" + firstItem.getText());
      } else {
        promise.resolve("");
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @Override
  public void setString(String text) {
    ClipData clipdata = ClipData.newPlainText(null, text);
    ClipboardManager clipboard = getClipboardService();
    clipboard.setPrimaryClip(clipdata);
  }
}
