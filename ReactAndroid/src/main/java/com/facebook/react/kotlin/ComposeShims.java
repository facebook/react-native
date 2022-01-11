/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.kotlin;

import static androidx.compose.ui.platform.AndroidComposeView_androidKt.getLocaleLayoutDirection;
import static androidx.compose.ui.unit.AndroidDensity_androidKt.Density;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.compose.runtime.Applier;
import androidx.compose.ui.autofill.Autofill;
import androidx.compose.ui.autofill.AutofillTree;
import androidx.compose.ui.focus.FocusManager;
import androidx.compose.ui.graphics.Canvas;
import androidx.compose.ui.hapticfeedback.HapticFeedback;
import androidx.compose.ui.layout.RootMeasurePolicy;
import androidx.compose.ui.node.LayoutNode;
import androidx.compose.ui.node.OwnedLayer;
import androidx.compose.ui.node.Owner;
import androidx.compose.ui.node.OwnerSnapshotObserver;
import androidx.compose.ui.node.RootForTest;
import androidx.compose.ui.node.UiApplier;
import androidx.compose.ui.platform.AccessibilityManager;
import androidx.compose.ui.platform.AndroidFontResourceLoader;
import androidx.compose.ui.platform.AndroidViewConfiguration;
import androidx.compose.ui.platform.ClipboardManager;
import androidx.compose.ui.platform.TextToolbar;
import androidx.compose.ui.platform.ViewConfiguration;
import androidx.compose.ui.platform.WindowInfo;
import androidx.compose.ui.text.font.Font;
import androidx.compose.ui.text.input.TextInputService;
import androidx.compose.ui.unit.Density;
import androidx.compose.ui.unit.LayoutDirection;
import java.util.ArrayList;
import java.util.List;
import kotlin.Unit;
import kotlin.jvm.functions.Function0;
import kotlin.jvm.functions.Function1;

/**
 * A lot of Compose API is internal and Kotlin compiler won't let us to access it
 *
 * <p>Thankfully, Java doesn't believe in internal, so we can do restricted things as long as we
 * don't touch inline functions/classes
 */
@SuppressWarnings("KotlinInternalInJava")
public class ComposeShims {
  public static Applier<LayoutNode> createApplier(LayoutNode root) {
    return new UiApplier(root);
  }

  public static void setLayoutRequired(LayoutNode root) {
    root.setLayoutState$ui_release(LayoutNode.LayoutState.NeedsRemeasure);
  }

  public static void attachOwner(LayoutNode root, Owner owner) {
    root.attach$ui_release(owner);
  }

  public static int getNodeWidth(LayoutNode node) {
    return node.getWidth();
  }

  public static int getNodeHeight(LayoutNode node) {
    return node.getHeight();
  }

  /**
   * Normally, Owner is a view, but it doesn't have to be! Below is minimal owner implementation to
   * measure Text composable.
   */
  public abstract static class BackgroundMeasureOwner implements Owner {
    private final LayoutNode mRoot;
    private final List<LayoutNode> mNodes;
    private final Context mContext;

    public BackgroundMeasureOwner(Context context) {
      mRoot = new LayoutNode();
      mRoot.setMeasurePolicy(RootMeasurePolicy.INSTANCE);

      mNodes = new ArrayList<>();
      mContext = context;
    }

    public List<LayoutNode> getNodes() {
      return mNodes;
    }

    @NonNull
    @Override
    public LayoutNode getRoot() {
      return mRoot;
    }

    @NonNull
    @Override
    public RootForTest getRootForTest() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public HapticFeedback getHapticFeedBack() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public ClipboardManager getClipboardManager() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public AccessibilityManager getAccessibilityManager() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public TextToolbar getTextToolbar() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public AutofillTree getAutofillTree() {
      // FIXME: don't need for poc
      return null;
    }

    @Nullable
    @Override
    public Autofill getAutofill() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public Density getDensity() {
      return Density(mContext);
    }

    @NonNull
    @Override
    public TextInputService getTextInputService() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public FocusManager getFocusManager() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public WindowInfo getWindowInfo() {
      // FIXME: don't need for poc
      return null;
    }

    @NonNull
    @Override
    public Font.ResourceLoader getFontLoader() {
      return new AndroidFontResourceLoader(mContext);
    }

    @NonNull
    @Override
    public LayoutDirection getLayoutDirection() {
      return getLocaleLayoutDirection(mContext.getResources().getConfiguration());
    }

    @Override
    public boolean getShowLayoutBounds() {
      // FIXME: don't need for poc
      return false;
    }

    @Override
    public void setShowLayoutBounds(boolean showLayoutBounds) {
      // FIXME: don't need for poc
    }

    @Override
    public void onRequestMeasure(@NonNull LayoutNode layoutNode) {
      // FIXME: don't need for poc
    }

    @Override
    public void onRequestRelayout(@NonNull LayoutNode layoutNode) {
      // FIXME: don't need for poc
    }

    @Override
    public void onAttach(@NonNull LayoutNode node) {
      mNodes.add(node);
    }

    @Override
    public void onDetach(@NonNull LayoutNode node) {
      mNodes.remove(node);
    }

    @Override
    public boolean requestFocus() {
      // FIXME: don't need for poc
      return false;
    }

    @Override
    public void measureAndLayout() {
      // FIXME: don't need for poc
    }

    @NonNull
    @Override
    public OwnedLayer createLayer(
        @NonNull Function1<? super Canvas, Unit> drawBlock,
        @NonNull Function0<Unit> invalidateParentLayer) {
      // FIXME: don't need for poc
      return null;
    }

    @Override
    public void onSemanticsChange() {
      // FIXME: don't need for poc
    }

    @Override
    public void onLayoutChange(@NonNull LayoutNode layoutNode) {
      // FIXME: don't need for poc
    }

    @Override
    public long getMeasureIteration() {
      return 0;
    }

    @NonNull
    @Override
    public ViewConfiguration getViewConfiguration() {
      return new AndroidViewConfiguration(android.view.ViewConfiguration.get(mContext));
    }

    @NonNull
    @Override
    public OwnerSnapshotObserver getSnapshotObserver() {
      return new OwnerSnapshotObserver(Function0::invoke);
    }
  }
}
