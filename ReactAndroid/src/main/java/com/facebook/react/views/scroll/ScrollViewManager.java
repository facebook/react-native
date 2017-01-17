/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;

public class ScrollViewManager extends ReactContextBaseJavaModule {
    public ScrollViewManager(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
    }

    @Override
    public String getName() {
        return "ScrollViewManager";
    }

    @ReactMethod
    public void calculateChildFrames(int tag, Callback callback) {
        ReactApplicationContext reactCtx = getReactApplicationContext();
        UIManagerModule uiManager = reactCtx.getNativeModule(UIManagerModule.class);

        View view = uiManager.getUIImplementation().getView(tag);

        if (view instanceof ReactScrollView) {
            View contentView = ((ReactScrollView)view).getChildAt(0);

            if (contentView == null) {
                return;
            }

            ArrayList<ChildFrame> mUpdatedChildFrames = ReactScrollViewHelper.calculateChildFrames((ReactViewGroup)contentView);

            WritableArray updatedFrames = Arguments.createArray();

            if (mUpdatedChildFrames != null) {
                for (int i = 0; i < mUpdatedChildFrames.size(); i++) {
                    ChildFrame childFrame = mUpdatedChildFrames.get(i);

                    WritableMap map = Arguments.createMap();
                    map.putInt("index", childFrame.index);
                    map.putDouble("height", PixelUtil.toDIPFromPixel(childFrame.height));
                    map.putDouble("width", PixelUtil.toDIPFromPixel(childFrame.width));
                    map.putDouble("x", PixelUtil.toDIPFromPixel(childFrame.x));
                    map.putDouble("y", PixelUtil.toDIPFromPixel(childFrame.y));

                    updatedFrames.pushMap(map);
                }
            }

            callback.invoke(updatedFrames);
        }
    }
}
