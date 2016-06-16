/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.UiThreadUtil;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ViewHierarchyDumper {

  public static JSONObject toJSON(View view) throws JSONException {
    UiThreadUtil.assertOnUiThread();

    JSONObject result = new JSONObject();
    result.put("n", view.getClass().getName());
    result.put("i", System.identityHashCode(view));
    Object tag = view.getTag();
    if (tag != null && tag instanceof String) {
      result.put("t", tag);
    }

    if (view instanceof ViewGroup) {
      ViewGroup viewGroup = (ViewGroup) view;
      if (viewGroup.getChildCount() > 0) {
        JSONArray children = new JSONArray();
        for (int i = 0; i < viewGroup.getChildCount(); i++) {
          children.put(i, toJSON(viewGroup.getChildAt(i)));
        }
        result.put("c", children);
      }
    }

    return result;
  }
}
