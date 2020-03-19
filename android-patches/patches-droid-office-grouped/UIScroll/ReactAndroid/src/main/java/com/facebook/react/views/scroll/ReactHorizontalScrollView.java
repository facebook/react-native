--- "e:\\github\\fb-react-native-forpatch-base\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\scroll\\ReactHorizontalScrollView.java"	2020-01-30 13:55:48.410610500 -0800
+++ "e:\\github\\ms-react-native-forpatch\\ReactAndroid\\src\\main\\java\\com\\facebook\\react\\views\\scroll\\ReactHorizontalScrollView.java"	2020-01-29 14:10:09.558927800 -0800
@@ -18,6 +18,7 @@
 import androidx.core.view.ViewCompat;
 import androidx.core.text.TextUtilsCompat;
 import android.util.Log;
+import android.view.FocusFinder;
 import android.view.MotionEvent;
 import android.view.View;
 import android.view.ViewConfiguration;
@@ -37,6 +38,8 @@
 import java.util.List;
 import java.util.Locale;
 import javax.annotation.Nullable;
+import java.util.ArrayList;
+import java.util.List;
 
 /**
  * Similar to {@link ReactScrollView} but only supports horizontal scrolling.
@@ -72,6 +75,9 @@
   private boolean mSnapToStart = true;
   private boolean mSnapToEnd = true;
   private ReactViewBackgroundManager mReactBackgroundManager;
+  private boolean mPagedArrowScrolling = false;
+
+  private final Rect mTempRect = new Rect();
 
   public ReactHorizontalScrollView(Context context) {
     this(context, null);
@@ -221,6 +227,82 @@
     scrollTo(getScrollX(), getScrollY());
   }
 
+  /**
+   * Since ReactHorizontalScrollView handles layout changes on JS side, it does not call super.onlayout
+   * due to which mIsLayoutDirty flag in HorizontalScrollView remains true and prevents scrolling to child
+   * when requestChildFocus is called.
+   * Overriding this method and scrolling to child without checking any layout dirty flag. This will fix
+   * focus navigation issue for KeyEvents which are not handled in HorizontalScrollView, for example: KEYCODE_TAB.
+   */
+  @Override
+  public void requestChildFocus(View child, View focused) {
+    if (focused != null && !mPagingEnabled) {
+      scrollToChild(focused);
+    }
+    super.requestChildFocus(child, focused);
+  }
+
+  @Override
+  public void addFocusables(ArrayList<View> views, int direction, int focusableMode) {
+    if (mPagingEnabled && !mPagedArrowScrolling) {
+      // Only add elements within the current page to list of focusables
+      ArrayList<View> candidateViews = new ArrayList<View>();
+      super.addFocusables(candidateViews, direction, focusableMode);
+      for (View candidate : candidateViews) {
+        // We must also include the currently focused in the focusables list or focus search will always
+        // return the first element within the focusables list
+        if (isScrolledInView(candidate) || isPartiallyScrolledInView(candidate) || candidate.isFocused()) {
+          views.add(candidate);
+        }
+      }
+    } else {
+      super.addFocusables(views, direction, focusableMode);
+    }
+  }
+
+  /**
+   * Calculates the x delta required to scroll the given descendent into view
+   */
+  private int getScrollDelta(View descendent) {
+    descendent.getDrawingRect(mTempRect);
+    offsetDescendantRectToMyCoords(descendent, mTempRect);
+    return computeScrollDeltaToGetChildRectOnScreen(mTempRect);
+  }
+
+  /**
+   * Returns whether the given descendent is scrolled fully in view
+   */
+  private boolean isScrolledInView(View descendent) {
+    return getScrollDelta(descendent) == 0;
+  }
+
+
+  /**
+   * Returns whether the given descendent is partially scrolled in view
+   */
+  private boolean isPartiallyScrolledInView(View descendent) {
+    int scrollDelta = getScrollDelta(descendent);
+    descendent.getDrawingRect(mTempRect);
+    return scrollDelta != 0 && Math.abs(scrollDelta) < mTempRect.width();
+  }
+
+  /**
+   * Returns whether the given descendent is "mostly" (>50%) scrolled in view
+   */
+  private boolean isMostlyScrolledInView(View descendent) {
+    int scrollDelta = getScrollDelta(descendent);
+    descendent.getDrawingRect(mTempRect);
+    return scrollDelta != 0 && Math.abs(scrollDelta) < (mTempRect.width() / 2);
+  }
+
+  private void scrollToChild(View child) {
+    int scrollDelta = getScrollDelta(child);
+
+    if (scrollDelta != 0) {
+      scrollBy(scrollDelta, 0);
+    }
+  }
+
   @Override
   protected void onScrollChanged(int x, int y, int oldX, int oldY) {
     super.onScrollChanged(x, y, oldX, oldY);
@@ -264,6 +346,48 @@
   }
 
   @Override
+  public boolean pageScroll(int direction) {
+    boolean handled = super.pageScroll(direction);
+
+    if (mPagingEnabled && handled) {
+      handlePostTouchScrolling(0, 0);
+    }
+
+    return handled;
+  }
+
+  @Override
+  public boolean arrowScroll(int direction) {
+    boolean handled = false;
+
+    if (mPagingEnabled) {
+      mPagedArrowScrolling = true;
+
+      if (getChildCount() > 0) {
+        View currentFocused = findFocus();
+        View nextFocused = FocusFinder.getInstance().findNextFocus(this, currentFocused, direction);
+        View rootChild = getChildAt(0);
+        if (rootChild != null && nextFocused != null && nextFocused.getParent() == rootChild) {
+          if (!isScrolledInView(nextFocused) && !isMostlyScrolledInView(nextFocused)) {
+            smoothScrollToNextPage(direction);
+          }
+          nextFocused.requestFocus();
+          handled = true;
+        } else {
+          smoothScrollToNextPage(direction);
+          handled = true;
+        }
+      }
+
+      mPagedArrowScrolling = false;
+    } else {
+      handled = super.arrowScroll(direction);
+    }
+
+    return handled;
+  }
+
+  @Override
   public boolean onTouchEvent(MotionEvent ev) {
     if (!mScrollEnabled) {
       return false;
@@ -661,7 +785,6 @@
     } else if (velocityX < 0) {
       // when snapping velocity can feel sluggish for slow swipes
       velocityX -= (int) ((targetOffset - smallerOffset) * 10.0);
-
       targetOffset = smallerOffset;
     } else {
       targetOffset = nearestOffset;
@@ -706,6 +829,29 @@
     }
   }
 
+  private void smoothScrollToNextPage(int direction) {
+    int width = getWidth();
+    int currentX = getScrollX();
+
+    int page = currentX / width;
+    if (currentX % width != 0) {
+      page++;
+    }
+
+    if (direction == View.FOCUS_LEFT) {
+      page = page - 1;
+    } else {
+      page = page + 1;
+    }
+
+    if (page < 0) {
+      page = 0;
+    }
+
+    smoothScrollTo(page * width, getScrollY());
+    handlePostTouchScrolling(0, 0);
+  }
+
   @Override
   public void setBackgroundColor(int color) {
     mReactBackgroundManager.setBackgroundColor(color);
