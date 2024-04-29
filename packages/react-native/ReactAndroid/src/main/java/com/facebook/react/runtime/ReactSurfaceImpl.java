/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.content.Context;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.View.MeasureSpec;
import android.view.ViewGroup;
import androidx.annotation.UiThread;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.fabric.SurfaceHandlerBinding;
import com.facebook.react.interfaces.TaskInterface;
import com.facebook.react.interfaces.fabric.ReactSurface;
import com.facebook.react.interfaces.fabric.SurfaceHandler;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.runtime.internal.bolts.Task;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.util.concurrent.atomic.AtomicReference;
import javax.annotation.Nullable;

/** A class responsible for creating and rendering a full-screen React surface. */
@Nullsafe(Nullsafe.Mode.LOCAL)
@ThreadSafe
public class ReactSurfaceImpl implements ReactSurface {

  private final AtomicReference<ReactSurfaceView> mSurfaceView = new AtomicReference<>(null);

  private final AtomicReference<ReactHostImpl> mReactHost = new AtomicReference<>(null);

  private final SurfaceHandler mSurfaceHandler;

  /**
   * Surface can hold two types of context: one used to init the surface without view (e.g. during
   * prerendering), and themed view context later, whenever it is available. The assumption is that
   * custom theming is applied to both the same way, so changing them SHOULD NOT change the visual
   * output.
   */
  private Context mContext;

  public static ReactSurfaceImpl createWithView(
      Context context, String moduleName, @Nullable Bundle initialProps) {
    ReactSurfaceImpl surface = new ReactSurfaceImpl(context, moduleName, initialProps);
    surface.attachView(new ReactSurfaceView(context, surface));
    return surface;
  }

  /**
   * @param context The Android Context to use to render the ReactSurfaceView
   * @param moduleName The string key used to register this surface in JS with SurfaceRegistry
   * @param initialProps A Bundle of properties to be passed to the root React component
   */
  public ReactSurfaceImpl(Context context, String moduleName, @Nullable Bundle initialProps) {
    this(new SurfaceHandlerBinding(moduleName), context);

    NativeMap nativeProps =
        initialProps == null
            ? new WritableNativeMap()
            : (NativeMap) Arguments.fromBundle(initialProps);
    mSurfaceHandler.setProps(nativeProps);

    DisplayMetrics displayMetrics = context.getResources().getDisplayMetrics();
    mSurfaceHandler.setLayoutConstraints(
        MeasureSpec.makeMeasureSpec(displayMetrics.widthPixels, MeasureSpec.AT_MOST),
        MeasureSpec.makeMeasureSpec(displayMetrics.heightPixels, MeasureSpec.AT_MOST),
        0,
        0,
        doRTLSwap(context),
        isRTL(context),
        getPixelDensity(context));
  }

  @VisibleForTesting
  ReactSurfaceImpl(SurfaceHandler surfaceHandler, Context context) {
    mSurfaceHandler = surfaceHandler;
    mContext = context;
  }

  /**
   * Attach a ReactHost to the ReactSurface.
   *
   * @param host The ReactHost to attach.
   */
  public void attach(ReactHostImpl host) {
    if (!mReactHost.compareAndSet(null, host)) {
      throw new IllegalStateException("This surface is already attached to a host!");
    }
  }

  /**
   * Attaches a view to the surface. View can be attached only once and should not be detached
   * after.
   */
  public void attachView(ReactSurfaceView view) {
    if (!mSurfaceView.compareAndSet(null, view)) {
      throw new IllegalStateException(
          "Trying to call ReactSurface.attachView(), but the view is already attached.");
    }
    // re: thread safety. Context can be changed only once, during view init, so view atomic above
    // already guards the context update.
    mContext = view.getContext();
  }

  public void updateInitProps(Bundle newProps) {
    mSurfaceHandler.setProps((NativeMap) Arguments.fromBundle(newProps));
  }

  @VisibleForTesting
  ReactHostImpl getReactHost() {
    // NULLSAFE_FIXME[Return Not Nullable]
    return mReactHost.get();
  }

  /** Detach the ReactSurface from its ReactHost. */
  @Override
  public void detach() {
    mReactHost.set(null);
  }

  /** package */
  SurfaceHandler getSurfaceHandler() {
    return mSurfaceHandler;
  }

  @Override
  public @Nullable ViewGroup getView() {
    return mSurfaceView.get();
  }

  @Override
  public TaskInterface<Void> prerender() {
    ReactHostImpl host = mReactHost.get();
    if (host == null) {
      return Task.forError(
          new IllegalStateException(
              "Trying to call ReactSurface.prerender(), but no ReactHost is attached."));
    }
    return host.prerenderSurface(this);
  }

  @Override
  public TaskInterface<Void> start() {
    if (mSurfaceView.get() == null) {
      return Task.forError(
          new IllegalStateException(
              "Trying to call ReactSurface.start(), but view is not created."));
    }

    ReactHostImpl host = mReactHost.get();
    if (host == null) {
      return Task.forError(
          new IllegalStateException(
              "Trying to call ReactSurface.start(), but no ReactHost is attached."));
    }
    return host.startSurface(this);
  }

  @Override
  public TaskInterface<Void> stop() {
    ReactHostImpl host = mReactHost.get();
    if (host == null) {
      return Task.forError(
          new IllegalStateException(
              "Trying to call ReactSurface.stop(), but no ReactHost is attached."));
    }
    return host.stopSurface(this);
  }

  @Override
  public int getSurfaceID() {
    return mSurfaceHandler.getSurfaceId();
  }

  @Override
  public String getModuleName() {
    return mSurfaceHandler.getModuleName();
  }

  @Override
  public void clear() {
    UiThreadUtil.runOnUiThread(
        () -> {
          ReactSurfaceView view = (ReactSurfaceView) getView();
          if (view != null) {
            view.removeAllViews();
            view.setId(View.NO_ID);
          }
        });
  }

  @UiThread
  /* package */ synchronized void updateLayoutSpecs(
      int widthMeasureSpec, int heightMeasureSpec, int offsetX, int offsetY) {
    mSurfaceHandler.setLayoutConstraints(
        widthMeasureSpec,
        heightMeasureSpec,
        offsetX,
        offsetY,
        doRTLSwap(mContext),
        isRTL(mContext),
        getPixelDensity(mContext));
  }

  /* package */ @Nullable
  EventDispatcher getEventDispatcher() {
    ReactHostImpl host = mReactHost.get();
    if (host == null) {
      return null;
    }
    return host.getEventDispatcher();
  }

  @VisibleForTesting
  boolean isAttached() {
    return mReactHost.get() != null;
  }

  @Override
  public boolean isRunning() {
    return mSurfaceHandler.isRunning();
  }

  @Override
  public Context getContext() {
    return mContext;
  }

  private static float getPixelDensity(Context context) {
    return context.getResources().getDisplayMetrics().density;
  }

  private static boolean isRTL(Context context) {
    return I18nUtil.getInstance().isRTL(context);
  }

  private static boolean doRTLSwap(Context context) {
    return I18nUtil.getInstance().doLeftAndRightSwapInRTL(context);
  }
}
