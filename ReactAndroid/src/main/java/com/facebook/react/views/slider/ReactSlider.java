/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.slider;

import android.annotation.TargetApi;
import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.NinePatchDrawable;
import android.net.Uri;
import android.os.Build;
import android.support.v4.graphics.drawable.DrawableCompat;
import android.util.AttributeSet;
import android.util.Log;
import android.widget.SeekBar;

import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.ReadableMap;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.annotation.Nullable;

/**
 * Slider that behaves more like the iOS one, for consistency.
 * <p/>
 * On iOS, the value is 0..1. Android SeekBar only supports integer values.
 * For consistency, we pretend in JS that the value is 0..1 but set the
 * SeekBar value to 0..100.
 * <p/>
 * Note that the slider is _not_ a controlled component (setValue isn't called
 * during dragging).
 */
public class ReactSlider extends SeekBar {

  private static final String PROP_ICON_URI = "uri";
  /**
   * If step is 0 (unset) we default to this total number of steps.
   * Don't use 100 which leads to rounding errors (0.200000000001).
   */
  private static int DEFAULT_TOTAL_STEPS = 128;

  /**
   * We want custom min..max range.
   * Android only supports 0..max range so we implement this ourselves.
   */
  private double mMinValue = 0;
  private double mMaxValue = 0;

  /**
   * Value sent from JS (setState).
   * Doesn't get updated during drag (slider is not a controlled component).
   */
  private double mValue = 0;

  /**
   * If zero it's determined automatically.
   */
  private double mStep = 0;

  public ReactSlider(Context context, @Nullable AttributeSet attrs, int style) {
    super(context, attrs, style);
  }

  /* package */ void setMaxValue(double max) {
    mMaxValue = max;
    updateAll();
  }

  /* package */ void setMinValue(double min) {
    mMinValue = min;
    updateAll();
  }

  /* package */ void setValue(double value) {
    mValue = value;
    updateValue();
  }

  /* package */ void setStep(double step) {
    mStep = step;
    updateAll();
  }

  /**
   * Convert SeekBar's native progress value (e.g. 0..100) to a value
   * passed to JS (e.g. -1.0..2.5).
   */
  public double toRealProgress(int seekBarProgress) {
    if (seekBarProgress == getMax()) {
      return mMaxValue;
    }
    return seekBarProgress * mStep + mMinValue;
  }

  /**
   * Update underlying native SeekBar's values.
   */
  private void updateAll() {
    if (mStep == 0) {
      mStep = (mMaxValue - mMinValue) / (double) DEFAULT_TOTAL_STEPS;
    }
    setMax(getTotalSteps());
    updateValue();
  }

  /**
   * Update value only (optimization in case only value is set).
   */
  private void updateValue() {
    setProgress((int) Math.round(
      (mValue - mMinValue) / (mMaxValue - mMinValue) * getTotalSteps()));
  }

  private int getTotalSteps() {
    return (int) Math.ceil((mMaxValue - mMinValue) / mStep);
  }

  public void setThumbImage(ReadableMap source) {
    getImage(source, new PictureSubscriber() {
      @Override
      public void doBitmap(Bitmap bitmap) {
        setThumb(new BitmapDrawable(getResources(), bitmap));
      }

      @Override
      public void doDrawable(Drawable drawable) {
        setThumb(drawable);
      }
    });
  }

  private int getDrawableResourceByName(String name) {
    name = name.replace(".9", "");
    return getResources().getIdentifier(
      name,
      "drawable",
      getContext().getPackageName());
  }

  private Drawable getDrawableByName(String name) {
    int drawableResId = getDrawableResourceByName(name);
    if (drawableResId != 0) {
      return getResources().getDrawable(drawableResId);
    } else {
      return null;
    }
  }

  @TargetApi(21)
  public void setProgressColor(Integer value) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      setProgressTintList(ColorStateList.valueOf(value));
    } else {
      if (getProgressDrawable() instanceof LayerDrawable) {
        LayerDrawable layer = (LayerDrawable) getProgressDrawable();
        DrawableCompat.setTintList(layer.findDrawableByLayerId(android.R.id.progress).mutate(), ColorStateList.valueOf(value));
      }
    }
  }

  @TargetApi(21)
  public void setProgressBackgroundColor(Integer value) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      setProgressBackgroundTintList(ColorStateList.valueOf(value));
    } else {
      if (getProgressDrawable() instanceof LayerDrawable) {
        LayerDrawable layer = (LayerDrawable) getProgressDrawable();
        DrawableCompat.setTintList(layer.findDrawableByLayerId(android.R.id.background).mutate(), ColorStateList.valueOf(value));
      }
    }
  }

  @TargetApi(21)
  public void setThumbColor(Integer value) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      setThumbTintList(ColorStateList.valueOf(value));
    } else {
      DrawableCompat.setTintList(getThumb().mutate(), ColorStateList.valueOf(value));
    }
  }

  public void setTrackImage(ReadableMap source) {
    getImage(source, new PictureSubscriber() {
      @Override
      public void doBitmap(Bitmap bitmap) {
        setProgressDrawable(createNineDrawable(bitmap));
      }

      @Override
      public void doDrawable(Drawable drawable) {
        if (drawable instanceof NinePatchDrawable) {
          setProgressDrawable(drawable);
        } else {
          setProgressDrawable(createNineDrawable(((BitmapDrawable) drawable).getBitmap()));
        }
      }
    });
  }

  private NinePatchDrawable createNineDrawable(Bitmap src) {
    if (src.getNinePatchChunk() != null) {
      return NinePatchDrawableFactory.convertBitmap(getResources(), src, null);
    }
    Bitmap desc = Bitmap.createBitmap(src.getWidth() + 4, src.getHeight() + 4, Bitmap.Config.ARGB_4444);
    PointF center = new PointF(desc.getWidth() / 2, desc.getHeight() / 2);
    Canvas canvas = new Canvas(desc);
    canvas.drawBitmap(src, 2, 2, null);
    Paint p = new Paint();
    p.setColor(Color.BLACK);
    canvas.drawLine(center.x, 0, center.x + 1, 0, p);
    canvas.drawLine(0, center.y, 0, center.y + 1, p);
    NinePatchDrawable drawable = NinePatchDrawableFactory.convertBitmap(getResources(), desc, null);
    desc.recycle();
    return drawable;
  }

  private void getImageFromUri(final String uri, final PictureSubscriber subscriber) {
    ImageRequest imageRequest = ImageRequestBuilder.newBuilderWithSource(Uri.parse(uri))
      .setAutoRotateEnabled(true)
      .build();
    DataSource<CloseableReference<CloseableImage>> dataSource = Fresco.getImagePipeline().fetchDecodedImage(imageRequest, null);
    Executor executor = Executors.newSingleThreadExecutor();
    dataSource.subscribe(new BaseBitmapDataSubscriber() {
      @Override
      public void onNewResultImpl(@Nullable Bitmap bitmap) {
        if (bitmap != null) {
          subscriber.doBitmap(bitmap);
        }
      }

      @Override
      public void onFailureImpl(DataSource dataSource) {
        Log.e("ReactSlider", String.format("onFailureImpl:uri-> %s is error", uri));
      }
    }, executor);
  }

  private void getImageFromNative(final String uri, final PictureSubscriber subscriber) {
    Drawable drawable = getDrawableByName(uri);
    subscriber.doDrawable(drawable);
  }

  private void getImage(ReadableMap source, PictureSubscriber subscriber) {
    final String uri = source != null ? source.getString(PROP_ICON_URI) : null;
    if (uri != null) {
      if (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("file://")) {
        getImageFromUri(uri, subscriber);
      } else {
        getImageFromNative(uri, subscriber);
      }
    }
  }

  public interface PictureSubscriber {
    void doBitmap(Bitmap bitmap);

    void doDrawable(Drawable drawable);
  }
}
