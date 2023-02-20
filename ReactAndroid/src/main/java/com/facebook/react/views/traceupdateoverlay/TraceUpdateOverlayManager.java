/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.traceupdateoverlay;

import android.graphics.RectF;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.traceupdateoverlay.TraceUpdateOverlay.Overlay;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@ReactModule(name = TraceUpdateOverlayManager.REACT_CLASS)
public class TraceUpdateOverlayManager extends SimpleViewManager<TraceUpdateOverlay> {
  public static final String REACT_CLASS = "TraceUpdateOverlay";

  public TraceUpdateOverlayManager() {}

  @Override
  public void receiveCommand(
      TraceUpdateOverlay view, String commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case "draw":
        if (args == null) {
          break;
        }

        String overlaysStr = args.getString(0);
        if (overlaysStr == null) {
          return;
        }

        try {
          JSONArray overlaysArr = new JSONArray(overlaysStr);
          List<Overlay> overlays = new ArrayList<>();
          for (int i = 0; i < overlaysArr.length(); i++) {
            JSONObject overlay = overlaysArr.getJSONObject(i);
            JSONObject rectObj = overlay.getJSONObject("rect");
            float left = (float) rectObj.getDouble("left");
            float top = (float) rectObj.getDouble("top");
            float right = (float) (left + rectObj.getDouble("width"));
            float bottom = (float) (top + rectObj.getDouble("height"));
            RectF rect = new RectF(left, top, right, bottom);
            overlays.add(new Overlay(overlay.getInt("color"), rect));
          }

          view.setOverlays(overlays);
        } catch (JSONException e) {
          FLog.e(REACT_CLASS, "Failed to parse overlays: ", e);
        }
        break;

      default:
        ReactSoftExceptionLogger.logSoftException(
            REACT_CLASS,
            new ReactNoCrashSoftException(
                "Received unexpected command in TraceUpdateOverlayManager"));
    }
  }

  @Override
  public TraceUpdateOverlay createViewInstance(ThemedReactContext context) {
    return new TraceUpdateOverlay(context);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }
}
