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

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactRootView;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import static com.facebook.react.common.ApplicationHolder.getApplication;

public class UpdatePropertiesExampleView extends LinearLayout {

  ReactRootView rootView;
  Button button;
  boolean beige;

  public UpdatePropertiesExampleView(Context context) {
    super(context);

    setOrientation(VERTICAL);

    beige = true;

    ReactApplication reactApplication = (ReactApplication)getApplication();
    ReactNativeHost reactNativeHost = reactApplication.getReactNativeHost();
    ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();

    Bundle launchOptions = new Bundle();
    launchOptions.putString("color", "beige");

    rootView = new ReactRootView(context);
    rootView.startReactApplication(reactInstanceManager, "SetPropertiesExampleApp", launchOptions);

    int spaceHeight = (int)PixelUtil.toPixelFromDIP(20);
    LayoutParams rootViewLayoutParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1);
    rootViewLayoutParams.setMargins(0, 0, 0, spaceHeight);

    addView(rootView, rootViewLayoutParams);

    button = new Button(context);
    button.setText("Native Button");
    button.setTextColor(Color.WHITE);
    button.setBackgroundColor(Color.GRAY);
    button.setOnClickListener(new OnClickListener() {
      @Override
      public void onClick(View v) {
        UpdatePropertiesExampleView.this.changeColor();
      }
    });

    int buttonHeight = (int)PixelUtil.toPixelFromDIP(40);
    LayoutParams buttonLayoutParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, buttonHeight);

    addView(button, buttonLayoutParams);
  }

  @Override
  public void onDetachedFromWindow() {
    super.onDetachedFromWindow();

    rootView.unmountReactApplication();
    removeView(rootView);
    rootView = null;
  }

  public void changeColor() {
    beige = !beige;

    Bundle launchOptions = new Bundle();
    launchOptions.putString("color", beige ? "beige" : "purple");

    rootView.updateLaunchOptions(launchOptions);
  }

  public static class Manager extends ViewGroupManager<UpdatePropertiesExampleView> {

    @Override
    public String getName() {
      return "UpdatePropertiesExampleView";
    }

    @Override
    public void addView(UpdatePropertiesExampleView parent, View child, int index) {
      //Do nothing
    }

    @Override
    protected UpdatePropertiesExampleView createViewInstance(ThemedReactContext reactContext) {
      return new UpdatePropertiesExampleView(reactContext);
    }
  }
}
