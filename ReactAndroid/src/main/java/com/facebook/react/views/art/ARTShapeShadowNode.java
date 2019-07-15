/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.art;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.annotations.ReactProp;

/** Shadow node for virtual ARTShape view */
public class ARTShapeShadowNode extends ARTVirtualNode {

  private static final int CAP_BUTT = 0;
  private static final int CAP_ROUND = 1;
  private static final int CAP_SQUARE = 2;

  private static final int JOIN_BEVEL = 2;
  private static final int JOIN_MITER = 0;
  private static final int JOIN_ROUND = 1;

  private static final int PATH_TYPE_ARC = 4;
  private static final int PATH_TYPE_CLOSE = 1;
  private static final int PATH_TYPE_CURVETO = 3;
  private static final int PATH_TYPE_LINETO = 2;
  private static final int PATH_TYPE_MOVETO = 0;

  // For color type JS and ObjectiveC definitions counterparts
  // refer to ReactNativeART.js and RCTConvert+ART.m
  private static final int COLOR_TYPE_SOLID_COLOR = 0;
  private static final int COLOR_TYPE_LINEAR_GRADIENT = 1;
  private static final int COLOR_TYPE_RADIAL_GRADIENT = 2;
  private static final int COLOR_TYPE_PATTERN = 3;

  protected @Nullable Path mPath;
  private @Nullable float[] mStrokeColor;
  private @Nullable float[] mBrushData;
  private @Nullable float[] mStrokeDash;
  private float mStrokeWidth = 1;
  private int mStrokeCap = CAP_ROUND;
  private int mStrokeJoin = JOIN_ROUND;

  public ARTShapeShadowNode() {}

  @ReactProp(name = "d")
  public void setShapePath(@Nullable ReadableArray shapePath) {
    float[] pathData = PropHelper.toFloatArray(shapePath);
    mPath = createPath(pathData);
    markUpdated();
  }

  @ReactProp(name = "stroke")
  public void setStroke(@Nullable ReadableArray strokeColors) {
    mStrokeColor = PropHelper.toFloatArray(strokeColors);
    markUpdated();
  }

  @ReactProp(name = "strokeDash")
  public void setStrokeDash(@Nullable ReadableArray strokeDash) {
    mStrokeDash = PropHelper.toFloatArray(strokeDash);
    markUpdated();
  }

  @ReactProp(name = "fill")
  public void setFill(@Nullable ReadableArray fillColors) {
    mBrushData = PropHelper.toFloatArray(fillColors);
    markUpdated();
  }

  @ReactProp(name = "strokeWidth", defaultFloat = 1f)
  public void setStrokeWidth(float strokeWidth) {
    mStrokeWidth = strokeWidth;
    markUpdated();
  }

  @ReactProp(name = "strokeCap", defaultInt = CAP_ROUND)
  public void setStrokeCap(int strokeCap) {
    mStrokeCap = strokeCap;
    markUpdated();
  }

  @ReactProp(name = "strokeJoin", defaultInt = JOIN_ROUND)
  public void setStrokeJoin(int strokeJoin) {
    mStrokeJoin = strokeJoin;
    markUpdated();
  }

  @Override
  public void draw(Canvas canvas, Paint paint, float opacity) {
    opacity *= mOpacity;
    if (opacity > MIN_OPACITY_FOR_DRAW) {
      saveAndSetupCanvas(canvas);
      if (mPath == null) {
        throw new JSApplicationIllegalArgumentException("Shapes should have a valid path (d) prop");
      }
      if (setupFillPaint(paint, opacity)) {
        canvas.drawPath(mPath, paint);
      }
      if (setupStrokePaint(paint, opacity)) {
        canvas.drawPath(mPath, paint);
      }
      restoreCanvas(canvas);
    }
    markUpdateSeen();
  }

  /**
   * Sets up {@link #mPaint} according to the props set on a shadow view. Returns {@code true} if
   * the stroke should be drawn, {@code false} if not.
   */
  protected boolean setupStrokePaint(Paint paint, float opacity) {
    if (mStrokeWidth == 0 || mStrokeColor == null || mStrokeColor.length == 0) {
      return false;
    }
    paint.reset();
    paint.setFlags(Paint.ANTI_ALIAS_FLAG);
    paint.setStyle(Paint.Style.STROKE);
    switch (mStrokeCap) {
      case CAP_BUTT:
        paint.setStrokeCap(Paint.Cap.BUTT);
        break;
      case CAP_SQUARE:
        paint.setStrokeCap(Paint.Cap.SQUARE);
        break;
      case CAP_ROUND:
        paint.setStrokeCap(Paint.Cap.ROUND);
        break;
      default:
        throw new JSApplicationIllegalArgumentException(
            "strokeCap " + mStrokeCap + " unrecognized");
    }
    switch (mStrokeJoin) {
      case JOIN_MITER:
        paint.setStrokeJoin(Paint.Join.MITER);
        break;
      case JOIN_BEVEL:
        paint.setStrokeJoin(Paint.Join.BEVEL);
        break;
      case JOIN_ROUND:
        paint.setStrokeJoin(Paint.Join.ROUND);
        break;
      default:
        throw new JSApplicationIllegalArgumentException(
            "strokeJoin " + mStrokeJoin + " unrecognized");
    }
    paint.setStrokeWidth(mStrokeWidth * mScale);
    paint.setARGB(
        (int) (mStrokeColor.length > 3 ? mStrokeColor[3] * opacity * 255 : opacity * 255),
        (int) (mStrokeColor[0] * 255),
        (int) (mStrokeColor[1] * 255),
        (int) (mStrokeColor[2] * 255));
    if (mStrokeDash != null && mStrokeDash.length > 0) {
      paint.setPathEffect(new DashPathEffect(mStrokeDash, 0));
    }
    return true;
  }

  /**
   * Sets up {@link #mPaint} according to the props set on a shadow view. Returns {@code true} if
   * the fill should be drawn, {@code false} if not.
   */
  protected boolean setupFillPaint(Paint paint, float opacity) {
    if (mBrushData != null && mBrushData.length > 0) {
      paint.reset();
      paint.setFlags(Paint.ANTI_ALIAS_FLAG);
      paint.setStyle(Paint.Style.FILL);
      int colorType = (int) mBrushData[0];
      switch (colorType) {
        case COLOR_TYPE_SOLID_COLOR:
          paint.setARGB(
              (int) (mBrushData.length > 4 ? mBrushData[4] * opacity * 255 : opacity * 255),
              (int) (mBrushData[1] * 255),
              (int) (mBrushData[2] * 255),
              (int) (mBrushData[3] * 255));
          break;
        case COLOR_TYPE_LINEAR_GRADIENT:
          // For mBrushData format refer to LinearGradient and insertColorStopsIntoArray functions
          // in ReactNativeART.js
          if (mBrushData.length < 5) {
            FLog.w(
                ReactConstants.TAG,
                "[ARTShapeShadowNode setupFillPaint] expects 5 elements, received "
                    + mBrushData.length);
            return false;
          }
          float gradientStartX = mBrushData[1] * mScale;
          float gradientStartY = mBrushData[2] * mScale;
          float gradientEndX = mBrushData[3] * mScale;
          float gradientEndY = mBrushData[4] * mScale;
          int stops = (mBrushData.length - 5) / 5;
          int[] colors = null;
          float[] positions = null;
          if (stops > 0) {
            colors = new int[stops];
            positions = new float[stops];
            for (int i = 0; i < stops; i++) {
              positions[i] = mBrushData[5 + 4 * stops + i];
              int r = (int) (255 * mBrushData[5 + 4 * i + 0]);
              int g = (int) (255 * mBrushData[5 + 4 * i + 1]);
              int b = (int) (255 * mBrushData[5 + 4 * i + 2]);
              int a = (int) (255 * mBrushData[5 + 4 * i + 3]);
              colors[i] = Color.argb(a, r, g, b);
            }
          }
          paint.setShader(
              new LinearGradient(
                  gradientStartX,
                  gradientStartY,
                  gradientEndX,
                  gradientEndY,
                  colors,
                  positions,
                  Shader.TileMode.CLAMP));
          break;
        case COLOR_TYPE_RADIAL_GRADIENT:
          // TODO(6352048): Support radial gradient etc.
        case COLOR_TYPE_PATTERN:
          // TODO(6352048): Support patterns etc.
        default:
          FLog.w(ReactConstants.TAG, "ART: Color type " + colorType + " not supported!");
      }
      return true;
    }
    return false;
  }

  /**
   * Returns the floor modulus of the float arguments. Java modulus will return a negative remainder
   * when the divisor is negative. Modulus should always be positive. This mimics the behavior of
   * Math.floorMod, introduced in Java 8.
   */
  private float modulus(float x, float y) {
    float remainder = x % y;
    float modulus = remainder;
    if (remainder < 0) {
      modulus += y;
    }
    return modulus;
  }

  /**
   * Creates a {@link Path} from an array of instructions constructed by JS (see
   * ARTSerializablePath.js). Each instruction starts with a type (see PATH_TYPE_*) followed by
   * arguments for that instruction. For example, to create a line the instruction will be 2
   * (PATH_LINE_TO), x, y. This will draw a line from the last draw point (or 0,0) to x,y.
   *
   * @param data the array of instructions
   * @return the {@link Path} that can be drawn to a canvas
   */
  private Path createPath(float[] data) {
    Path path = new Path();
    path.moveTo(0, 0);
    int i = 0;
    while (i < data.length) {
      int type = (int) data[i++];
      switch (type) {
        case PATH_TYPE_MOVETO:
          path.moveTo(data[i++] * mScale, data[i++] * mScale);
          break;
        case PATH_TYPE_CLOSE:
          path.close();
          break;
        case PATH_TYPE_LINETO:
          path.lineTo(data[i++] * mScale, data[i++] * mScale);
          break;
        case PATH_TYPE_CURVETO:
          path.cubicTo(
              data[i++] * mScale,
              data[i++] * mScale,
              data[i++] * mScale,
              data[i++] * mScale,
              data[i++] * mScale,
              data[i++] * mScale);
          break;
        case PATH_TYPE_ARC:
          {
            float x = data[i++] * mScale;
            float y = data[i++] * mScale;
            float r = data[i++] * mScale;
            float start = (float) Math.toDegrees(data[i++]);
            float end = (float) Math.toDegrees(data[i++]);

            boolean counterClockwise = !(data[i++] == 1f);
            float sweep = end - start;
            if (Math.abs(sweep) >= 360) {
              path.addCircle(x, y, r, counterClockwise ? Path.Direction.CCW : Path.Direction.CW);
            } else {
              sweep = modulus(sweep, 360);
              if (counterClockwise && sweep < 360) {
                // Counter-clockwise sweeps are negative
                sweep = -1 * (360 - sweep);
              }

              RectF oval = new RectF(x - r, y - r, x + r, y + r);
              path.arcTo(oval, start, sweep);
            }
            break;
          }
        default:
          throw new JSApplicationIllegalArgumentException(
              "Unrecognized drawing instruction " + type);
      }
    }
    return path;
  }
}
