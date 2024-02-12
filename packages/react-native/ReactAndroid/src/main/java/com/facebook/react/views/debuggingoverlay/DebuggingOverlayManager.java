/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.debuggingoverlay;

import android.graphics.RectF;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.NoSuchKeyException;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import java.util.ArrayList;
import java.util.List;

@Nullsafe(Nullsafe.Mode.LOCAL)
@ReactModule(name = DebuggingOverlayManager.REACT_CLASS)
public class DebuggingOverlayManager extends SimpleViewManager<DebuggingOverlay> {

  public static final String REACT_CLASS = "DebuggingOverlay";

  public DebuggingOverlayManager() {}

  @Override
  public void receiveCommand(
      DebuggingOverlay view, String commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case "highlightTraceUpdates":
        {
          if (args == null) {
            break;
          }

          ReadableArray providedTraceUpdates = args.getArray(0);
          List<TraceUpdate> formattedTraceUpdates = new ArrayList<>();

          boolean successfullyParsedPayload = true;
          for (int i = 0; i < providedTraceUpdates.size(); i++) {
            ReadableMap traceUpdate = providedTraceUpdates.getMap(i);
            ReadableMap serializedRectangle = traceUpdate.getMap("rectangle");
            if (serializedRectangle == null) {
              ReactSoftExceptionLogger.logSoftException(
                  REACT_CLASS,
                  new ReactNoCrashSoftException(
                      "Unexpected payload for highlighting trace updates: rectangle field is null"));

              successfullyParsedPayload = false;
              break;
            }

            int id = traceUpdate.getInt("id");
            int color = traceUpdate.getInt("color");

            try {
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

              formattedTraceUpdates.add(new TraceUpdate(id, rectangle, color));
            } catch (NoSuchKeyException | UnexpectedNativeTypeException e) {
              ReactSoftExceptionLogger.logSoftException(
                  REACT_CLASS,
                  new ReactNoCrashSoftException(
                      "Unexpected payload for highlighting trace updates: rectangle field should have x, y, width, height fields"));

              successfullyParsedPayload = false;
              break;
            }
          }

          if (successfullyParsedPayload) {
            view.setTraceUpdates(formattedTraceUpdates);
          }

          break;
        }

      case "highlightElements":
        {
          if (args == null) {
            return;
          }

          ReadableArray providedElements = args.getArray(0);
          List<RectF> elementsRectangles = new ArrayList<>();

          boolean successfullyParsedPayload = true;
          for (int i = 0; i < providedElements.size(); i++) {
            ReadableMap element = providedElements.getMap(i);

            try {
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
            } catch (NoSuchKeyException | UnexpectedNativeTypeException e) {
              ReactSoftExceptionLogger.logSoftException(
                  REACT_CLASS,
                  new ReactNoCrashSoftException(
                      "Unexpected payload for highlighting elements: every element should have x, y, width, height fields"));

              successfullyParsedPayload = false;
              break;
            }
          }

          if (successfullyParsedPayload) {
            view.setHighlightedElementsRectangles(elementsRectangles);
          }

          break;
        }

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
