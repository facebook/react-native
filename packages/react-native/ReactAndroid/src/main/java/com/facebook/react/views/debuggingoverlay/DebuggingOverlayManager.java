/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.debuggingoverlay;

import android.graphics.RectF;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.debuggingoverlay.DebuggingOverlay.Overlay;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@ReactModule(name = DebuggingOverlayManager.REACT_CLASS)
public class DebuggingOverlayManager extends SimpleViewManager<DebuggingOverlay> {
  public static final String REACT_CLASS = "DebuggingOverlay";

  public DebuggingOverlayManager() {}

  @Override
  public void receiveCommand(
      DebuggingOverlay view, String commandId, @Nullable ReadableArray args) {
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
            float left = (float) rectObj.getDouble("x");
            float top = (float) rectObj.getDouble("y");
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

      case "highlightElements":
        if (args == null) {
          return;
        }

        String serializedElements = args.getString(0);
        if (serializedElements == null) {
          return;
        }

        try {
          JSONArray deserializedElements = new JSONArray(serializedElements);
          List<RectF> elementsRectangles = new ArrayList<>();
          for (int i = 0; i < deserializedElements.length(); i++) {
            JSONObject element = deserializedElements.getJSONObject(i);

            float left = (float) element.getDouble("x");
            float top = (float) element.getDouble("y");
            float right = (float) (left + element.getDouble("width"));
            float bottom = (float) (top + element.getDouble("height"));
            RectF rect =
                new RectF(
                    PixelUtil.toPixelFromDIP(left),
                    PixelUtil.toPixelFromDIP(top),
                    PixelUtil.toPixelFromDIP(right),
                    PixelUtil.toPixelFromDIP(bottom));

            elementsRectangles.add(rect);
          }

          view.setHighlightedElementsRectangles(elementsRectangles);
        } catch (JSONException e) {
          FLog.e(REACT_CLASS, "Failed to parse highlightElements payload: ", e);
        }
        break;

      case "clearElementsHighlights":
        view.clearElementsHighlights();

        break;

      default:
        ReactSoftExceptionLogger.logSoftException(
            REACT_CLASS,
            new ReactNoCrashSoftException(
                "Received unexpected command in DebuggingOverlayManager"));
    }
  }

  @Override
  public DebuggingOverlay createViewInstance(ThemedReactContext context) {
    return new DebuggingOverlay(context);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }
}
