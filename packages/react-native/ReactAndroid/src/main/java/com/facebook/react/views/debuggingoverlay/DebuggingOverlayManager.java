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
      case "highlightTraceUpdates":
        if (args == null) {
          break;
        }

        String serializedTraceUpdates = args.getString(0);
        if (serializedTraceUpdates == null) {
          return;
        }

        try {
          JSONArray traceUpdates = new JSONArray(serializedTraceUpdates);
          List<TraceUpdate> deserializedTraceUpdates = new ArrayList<>();
          for (int i = 0; i < traceUpdates.length(); i++) {
            JSONObject traceUpdate = traceUpdates.getJSONObject(i);

            int id = traceUpdate.getInt("id");
            JSONObject serializedRectangle = traceUpdate.getJSONObject("rectangle");
            int color = traceUpdate.getInt("color");

            float left = (float) serializedRectangle.getDouble("x");
            float top = (float) serializedRectangle.getDouble("y");
            float right = (float) (left + serializedRectangle.getDouble("width"));
            float bottom = (float) (top + serializedRectangle.getDouble("height"));
            RectF rectangle =
                new RectF(
                    PixelUtil.toPixelFromDIP(left),
                    PixelUtil.toPixelFromDIP(top),
                    PixelUtil.toPixelFromDIP(right),
                    PixelUtil.toPixelFromDIP(bottom));

            deserializedTraceUpdates.add(new TraceUpdate(id, rectangle, color));
          }

          view.setTraceUpdates(deserializedTraceUpdates);
        } catch (JSONException e) {
          FLog.e(REACT_CLASS, "Failed to parse highlightTraceUpdates payload: ", e);
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
