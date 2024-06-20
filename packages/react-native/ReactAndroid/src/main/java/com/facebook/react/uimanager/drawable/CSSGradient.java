package com.facebook.react.uimanager.drawable;

import android.graphics.LinearGradient;
import android.graphics.Rect;
import android.graphics.Shader;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import androidx.annotation.Nullable;

public class CSSGradient {
  private enum GradientType {
    LINEAR_GRADIENT
  }
  private final GradientType type;
  private float startX;
  private float startY;
  private float endX;
  private float endY;
  private final int[] colors;
  private final float[] positions;

  public CSSGradient(@Nullable ReadableMap gradient) {
    if (gradient == null) {
      throw new IllegalArgumentException("Gradient cannot be null");
    }

    String typeString = gradient.getString("type");
    if ("linearGradient".equals(typeString)) {
      this.type = GradientType.LINEAR_GRADIENT;
    } else {
      throw new IllegalArgumentException("Unsupported gradient type: " + typeString);
    }

    ReadableMap start = gradient.getMap("start");
    if (start != null) {
      startX = (float) start.getDouble("x");
      startY = (float) start.getDouble("y");
    }

    ReadableMap end = gradient.getMap("end");
    if (end != null) {
      endX = (float) end.getDouble("x");
      endY = (float) end.getDouble("y");
    }

    ReadableArray colorStops = gradient.getArray("colorStops");
    if (colorStops == null) {
      throw new IllegalArgumentException("Invalid colorStops array");
    }

    int size = colorStops.size();
    this.colors = new int[size];
    this.positions = new float[size];

    for (int i = 0; i < size; i++) {
      ReadableMap colorStop = colorStops.getMap(i);
      this.colors[i] = colorStop.getInt("color");
      this.positions[i] = (float) colorStop.getDouble("position");
    }
  }

  @Nullable
  public Shader getShader(Rect bounds) {
    if (type == GradientType.LINEAR_GRADIENT) {
      return new LinearGradient(
        startX * bounds.width(), startY * bounds.height(),
        endX * bounds.width(), endY * bounds.height(),
        colors, positions, Shader.TileMode.CLAMP
      );
    }
    return null;
  }
}
