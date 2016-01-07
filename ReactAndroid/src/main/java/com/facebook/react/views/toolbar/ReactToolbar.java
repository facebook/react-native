// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.toolbar;

import javax.annotation.Nullable;

import android.content.Context;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.support.v7.widget.Toolbar;
import android.view.Menu;
import android.view.MenuItem;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.BaseControllerListener;
import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.drawable.ScalingUtils;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.drawee.view.DraweeHolder;
import com.facebook.drawee.view.MultiDraweeHolder;
import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * Custom implementation of the {@link Toolbar} widget that adds support for remote images in logo
 * and navigationIcon using fresco.
 */
public class ReactToolbar extends Toolbar {
  private static final String PROP_ACTION_ICON = "icon";
  private static final String PROP_ACTION_SHOW = "show";
  private static final String PROP_ACTION_SHOW_WITH_TEXT = "showWithText";
  private static final String PROP_ACTION_TITLE = "title";

  private final DraweeHolder mLogoHolder;
  private final DraweeHolder mNavIconHolder;
  private final DraweeHolder mOverflowIconHolder;
  private final MultiDraweeHolder<GenericDraweeHierarchy> mActionsHolder =
      new MultiDraweeHolder<>();

  private final ControllerListener<ImageInfo> mLogoControllerListener =
      new BaseControllerListener<ImageInfo>() {
        @Override
        public void onFinalImageSet(
            String id,
            @Nullable final ImageInfo imageInfo,
            @Nullable Animatable animatable) {
          if (imageInfo != null) {
            final DrawableWithIntrinsicSize logoDrawable =
                new DrawableWithIntrinsicSize(mLogoHolder.getTopLevelDrawable(), imageInfo);
            setLogo(logoDrawable);
          }
        }
      };

  private final ControllerListener<ImageInfo> mNavIconControllerListener =
      new BaseControllerListener<ImageInfo>() {
        @Override
        public void onFinalImageSet(
            String id,
            @Nullable final ImageInfo imageInfo,
            @Nullable Animatable animatable) {
          if (imageInfo != null) {
            final DrawableWithIntrinsicSize navIconDrawable =
                new DrawableWithIntrinsicSize(mNavIconHolder.getTopLevelDrawable(), imageInfo);
            setNavigationIcon(navIconDrawable);
          }
        }
      };

  private final ControllerListener<ImageInfo> mOverflowIconControllerListener =
      new BaseControllerListener<ImageInfo>() {
        @Override
        public void onFinalImageSet(
            String id,
            @Nullable final ImageInfo imageInfo,
            @Nullable Animatable animatable) {
          if (imageInfo != null) {
            final DrawableWithIntrinsicSize overflowIconDrawable =
                new DrawableWithIntrinsicSize(mOverflowIconHolder.getTopLevelDrawable(), imageInfo);
            setOverflowIcon(overflowIconDrawable);
          }
        }
      };

  private static class ActionIconControllerListener extends BaseControllerListener<ImageInfo> {
    private final MenuItem mItem;
    private final DraweeHolder mHolder;

    ActionIconControllerListener(MenuItem item, DraweeHolder holder) {
      mItem = item;
      mHolder = holder;
    }

    @Override
    public void onFinalImageSet(
        String id,
        @Nullable ImageInfo imageInfo,
        @Nullable Animatable animatable) {
      if (imageInfo != null) {
        mItem.setIcon(new DrawableWithIntrinsicSize(mHolder.getTopLevelDrawable(), imageInfo));
      }
    }
  }

  public ReactToolbar(Context context) {
    super(context);

    mLogoHolder = DraweeHolder.create(createDraweeHierarchy(), context);
    mNavIconHolder = DraweeHolder.create(createDraweeHierarchy(), context);
    mOverflowIconHolder = DraweeHolder.create(createDraweeHierarchy(), context);
  }

  private final Runnable mLayoutRunnable = new Runnable() {
    @Override
    public void run() {
      measure(
          MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };

  @Override
  public void requestLayout() {
    super.requestLayout();

    // The toolbar relies on a measure + layout pass happening after it calls requestLayout().
    // Without this, certain calls (e.g. setLogo) only take effect after a second invalidation.
    post(mLayoutRunnable);
  }

  @Override
  public void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    detachDraweeHolders();
  }

  @Override
  public void onStartTemporaryDetach() {
    super.onStartTemporaryDetach();
    detachDraweeHolders();
  }

  @Override
  public void onAttachedToWindow() {
    super.onAttachedToWindow();
    attachDraweeHolders();
  }

  @Override
  public void onFinishTemporaryDetach() {
    super.onFinishTemporaryDetach();
    attachDraweeHolders();
  }

  private void detachDraweeHolders() {
    mLogoHolder.onDetach();
    mNavIconHolder.onDetach();
    mOverflowIconHolder.onDetach();
    mActionsHolder.onDetach();
  }

  private void attachDraweeHolders() {
    mLogoHolder.onAttach();
    mNavIconHolder.onAttach();
    mOverflowIconHolder.onAttach();
    mActionsHolder.onAttach();
  }

  /* package */ void setLogoSource(@Nullable ReadableMap source) {
    String uri = source != null ? source.getString("uri") : null;
    if (uri == null) {
      setLogo(null);
    } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
      DraweeController controller = Fresco.newDraweeControllerBuilder()
          .setUri(Uri.parse(uri))
          .setControllerListener(mLogoControllerListener)
          .setOldController(mLogoHolder.getController())
          .build();
      mLogoHolder.setController(controller);
    } else {
      setLogo(getDrawableResourceByName(uri));
    }
  }

  /* package */ void setNavIconSource(@Nullable ReadableMap source) {
    String uri = source != null ? source.getString("uri") : null;
    if (uri == null) {
      setNavigationIcon(null);
    } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
      DraweeController controller = Fresco.newDraweeControllerBuilder()
          .setUri(Uri.parse(uri))
          .setControllerListener(mNavIconControllerListener)
          .setOldController(mNavIconHolder.getController())
          .build();
      mNavIconHolder.setController(controller);
    } else {
      setNavigationIcon(getDrawableResourceByName(uri));
    }
  }

  /* package */ void setOverflowIconSource(@Nullable ReadableMap source) {
    String uri = source != null ? source.getString("uri") : null;
    if (uri == null) {
      setOverflowIcon(null);
    } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
      DraweeController controller = Fresco.newDraweeControllerBuilder()
          .setUri(Uri.parse(uri))
          .setControllerListener(mOverflowIconControllerListener)
          .setOldController(mOverflowIconHolder.getController())
          .build();
      mOverflowIconHolder.setController(controller);
    } else {
      setOverflowIcon(getDrawableByName(uri));
    }
  }

  /* package */ void setActions(@Nullable ReadableArray actions) {
    Menu menu = getMenu();
    menu.clear();
    mActionsHolder.clear();
    if (actions != null) {
      for (int i = 0; i < actions.size(); i++) {
        ReadableMap action = actions.getMap(i);
        MenuItem item = menu.add(Menu.NONE, Menu.NONE, i, action.getString(PROP_ACTION_TITLE));
        ReadableMap icon = action.hasKey(PROP_ACTION_ICON) ? action.getMap(PROP_ACTION_ICON) : null;
        if (icon != null) {
          String iconSource = icon.getString("uri");
          if (iconSource.startsWith("http://") || iconSource.startsWith("https://")) {
            setMenuItemIcon(item, icon);
          } else {
            item.setIcon(getDrawableResourceByName(iconSource));
          }
        }
        int showAsAction = action.hasKey(PROP_ACTION_SHOW)
            ? action.getInt(PROP_ACTION_SHOW)
            : MenuItem.SHOW_AS_ACTION_NEVER;
        if (action.hasKey(PROP_ACTION_SHOW_WITH_TEXT) &&
            action.getBoolean(PROP_ACTION_SHOW_WITH_TEXT)) {
          showAsAction = showAsAction | MenuItem.SHOW_AS_ACTION_WITH_TEXT;
        }
        item.setShowAsAction(showAsAction);
      }
    }
  }

  /**
   * This is only used when the icon is remote (http/s). Creates & adds a new {@link DraweeHolder}
   * to {@link #mActionsHolder} and attaches a {@link ActionIconControllerListener} that just sets
   * the top level drawable when it's loaded.
   */
  private void setMenuItemIcon(MenuItem item, ReadableMap icon) {
    String iconSource = icon.getString("uri");

    DraweeHolder<GenericDraweeHierarchy> holder =
        DraweeHolder.create(createDraweeHierarchy(), getContext());
    DraweeController controller = Fresco.newDraweeControllerBuilder()
        .setUri(Uri.parse(iconSource))
        .setControllerListener(new ActionIconControllerListener(item, holder))
        .setOldController(holder.getController())
        .build();
    holder.setController(controller);

    mActionsHolder.add(holder);
  }

  private GenericDraweeHierarchy createDraweeHierarchy() {
    return new GenericDraweeHierarchyBuilder(getResources())
        .setActualImageScaleType(ScalingUtils.ScaleType.FIT_CENTER)
        .setFadeDuration(0)
        .build();
  }

  private int getDrawableResourceByName(String name) {
    return getResources().getIdentifier(
        name,
        "drawable",
        getContext().getPackageName());
  }

  private Drawable getDrawableByName(String name) {
    return getResources().getDrawable(getDrawableResourceByName(name));
  }

}
