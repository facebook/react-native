/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.image;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.os.Handler;

public class CircleLoadingIndicatorDrawable extends Drawable {
    public static final int DEFAULT_COLOR = 0x800080FF;
    private static final int RADIUS_SMALL = 25;
    private static final int RADIUS_LARGE = 50;
    private static final float STROKE_SMALL = 5f;
    private static final float STROKE_LARGE = 8f;

    private final Paint mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private int mColor = DEFAULT_COLOR;
    private int radius = RADIUS_SMALL;

    private float FROM = 270;                   // any value from 0 -> 360
    private static final long INTERVAL = 30;    // millisecond
    private static final float STEP = 360/INTERVAL;
    private float start = FROM, sweep;
    private Handler handler = new Handler();
    private boolean increase = true;

    public CircleLoadingIndicatorDrawable() {
        mPaint.setStyle(Paint.Style.STROKE);
        mPaint.setStrokeWidth(STROKE_SMALL);
    }

    public void setRadius(int radius) {
        this.radius = radius;
    }

    public void setSize(ImageLoadingIndicatorSize size) {
        if (size == ImageLoadingIndicatorSize.LARGE) {
            radius = RADIUS_LARGE;
            mPaint.setStrokeWidth(STROKE_LARGE);
        } else {
            radius = RADIUS_SMALL;
            mPaint.setStrokeWidth(STROKE_SMALL);
        }
    }

    public void setColor(int color) {
        if (mColor != color) {
            mColor = color;
            invalidateSelf();
        }
    }

    public int getColor() {
        return mColor;
    }

    @Override
    public void setAlpha(int alpha) {
        mPaint.setAlpha(alpha);
    }

    @Override
    public void setColorFilter(ColorFilter cf) {
        mPaint.setColorFilter(cf);
    }

    @Override
    public int getOpacity() {
        return getOpacityFromColor(mPaint.getColor());
    }

    @Override
    public void draw(Canvas canvas) {
        drawArc(canvas, mColor);
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                drawStyle1();
                invalidateSelf();
            }
        }, INTERVAL);
    }

    private void drawStyle1() {
        sweep = 320;
        start += STEP;
        if (start >= 360) start = 0;
    }

    private void drawStyle2() {
        if (increase) {
            sweep += STEP;
            if (sweep == 360) {
                increase = false;
            }
        } else {
            sweep -= STEP;
            start += STEP;
            if (sweep == 0) {
                increase = true;
                FROM += STEP;
                if (FROM >= 360) FROM = 0;
                start = FROM;
            }
        }
    }

    private void drawArc(Canvas canvas, int color) {
        mPaint.setColor(color);
        Rect bounds = getBounds();
        int xpos = bounds.left + bounds.width() / 2;
        int ypos = bounds.bottom - bounds.height() / 2;
        RectF rectF = new RectF(xpos - radius, ypos - radius, xpos + radius, ypos + radius);
        canvas.drawArc(rectF, start, sweep, false, mPaint);
    }

    // reuse code from com.facebook.drawee.drawable.DrawableUtils.getOpacityFromColor(color)
    public static int getOpacityFromColor(int color) {
        int colorAlpha = color >>> 24;
        if (colorAlpha == 255) {
            return PixelFormat.OPAQUE;
        } else if (colorAlpha == 0) {
            return PixelFormat.TRANSPARENT;
        } else {
            return PixelFormat.TRANSLUCENT;
        }
    }
}