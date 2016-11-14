/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package com.facebook.react.uiapp;

import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import static com.facebook.react.common.ApplicationHolder.getApplication;

public class FlexibleSizeExampleView extends LinearLayout {

  ReactRootView resizableRootView;
  TextView currentSizeTextView;
  boolean sizeUpdated;

  public FlexibleSizeExampleView(ReactContext context) {
    super(context);

    setOrientation(VERTICAL);

    sizeUpdated = false;

    currentSizeTextView = new TextView(context);
    currentSizeTextView.setText("Resizable view has not been resized yet");
    currentSizeTextView.setBackgroundColor(Color.WHITE);
    currentSizeTextView.setTextSize(10);

    int textViewHeight = (int)PixelUtil.toPixelFromDIP(60);
    LayoutParams textViewLayoutParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, textViewHeight);
    addView(currentSizeTextView, textViewLayoutParams);

    ReactApplication reactApplication = (ReactApplication)getApplication();
    ReactNativeHost reactNativeHost = reactApplication.getReactNativeHost();
    ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();

    resizableRootView = new ReactRootView(context);
    resizableRootView.setSizeFlexibility(ReactRootView.SizeFlexibilityHeight);
    resizableRootView.startReactApplication(reactInstanceManager, "RootViewSizeFlexibilityExampleApp");

    int spacingHeight = (int)PixelUtil.toPixelFromDIP(10);
    final LayoutParams rootViewLayoutParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    rootViewLayoutParams.setMargins(0, spacingHeight, 0, 0);
    addView(resizableRootView, rootViewLayoutParams);

    resizableRootView.setOnIntrinsicSizeChangedListener(new ReactRootView.OnIntrinsicSizeChangedListener() {
      @Override
      public void onSizeChanged(ReactRootView rootView, int width, int height) {
        if (!sizeUpdated) {
          sizeUpdated = true;
          currentSizeTextView.setText("OnIntrinsicSizeChangedListener: content with initially unknown size has appeared, updating root view's size so the content fits.");
        } else {
          String text = String.format("OnIntrinsicSizeChangedListener: content size has been changed to (%d, %d), updating root view's size.", width, height);
          currentSizeTextView.setText(text);
        }
        rootViewLayoutParams.width = width;
        rootViewLayoutParams.height = height;
        rootView.setLayoutParams(rootViewLayoutParams);
      }
    });
  }

  @Override
  public void onDetachedFromWindow() {
    super.onDetachedFromWindow();

    resizableRootView.unmountReactApplication();
    removeView(resizableRootView);
    resizableRootView = null;
  }

  private final Runnable measureAndLayout = new Runnable() {
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

    // Since FlexibleSizeExampleView is managed by react-native,
    // we need to simulate a measure + layout pass here.
    post(measureAndLayout);
  }

  public static class Manager extends ViewGroupManager<FlexibleSizeExampleView> {

    @Override
    public String getName() {
      return "FlexibleSizeExampleView";
    }

    @Override
    public void addView(FlexibleSizeExampleView parent, View child, int index) {
      //Do nothing
    }

    @Override
    protected FlexibleSizeExampleView createViewInstance(ThemedReactContext reactContext) {
      return new FlexibleSizeExampleView(reactContext);
    }
  }
}
