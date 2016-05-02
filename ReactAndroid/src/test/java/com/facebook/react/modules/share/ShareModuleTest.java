/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.share;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.JavaOnlyMap;

import javax.annotation.Nullable;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.Robolectric;
import org.robolectric.Shadows;
import org.robolectric.RobolectricTestRunner;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ShareModuleTest {

  private Activity mActivity;
  private ShareModule mShareModule;

  final static class SimplePromise implements Promise {
    private static final String DEFAULT_ERROR = "EUNSPECIFIED";

    private int mResolved;
    private int mRejected;
    private Object mValue;
    private String mErrorCode;
    private String mErrorMessage;

    public int getResolved() {
      return mResolved;
    }

    public int getRejected() {
      return mRejected;
    }
    
    public Object getValue() {
      return mValue;
    }

    public String getErrorCode() {
      return mErrorCode;
    }

    public String getErrorMessage() {
      return mErrorMessage;
    }

    @Override
    public void resolve(Object value) {
      mResolved++;
      mValue = value;
    }

    @Override
    public void reject(String code, String message) {
      reject(code, message, /*Throwable*/null);
    }

    @Override
    @Deprecated
    public void reject(String message) {
      reject(DEFAULT_ERROR, message, /*Throwable*/null);
    }

    @Override
    public void reject(String code, Throwable e) {
      reject(code, e.getMessage(), e);
    }

    @Override
    public void reject(Throwable e) {
      reject(DEFAULT_ERROR, e.getMessage(), e);
    }

    @Override
    public void reject(String code, String message, @Nullable Throwable e) {
      mRejected++;
      mErrorCode = code;
      mErrorMessage = message;
    }
  }

  @Before
  public void setUp() throws Exception {
    mActivity = Robolectric.setupActivity(Activity.class);
    ReactApplicationContext context = PowerMockito.mock(ReactApplicationContext.class);
    PowerMockito.when(context, "getCurrentActivity").thenReturn(mActivity);
    mShareModule = new ShareModule(context);
  }

  @After
  public void tearDown() {
    mActivity = null;
    mShareModule = null;
  }

  @Test
  public void testShareDialog() {
    final String title = "Title";
    final String message = "Message";
    final String dialogTitle = "Dialog Title";

    JavaOnlyMap content = new JavaOnlyMap();
    content.putString("title", title);
    content.putString("message", message);

    final SimplePromise promise = new SimplePromise();

    mShareModule.share(content, dialogTitle, promise);

    final Intent chooserIntent = Shadows.shadowOf(mActivity).getNextStartedActivity();
    assertNotNull("Dialog was not displayed", chooserIntent);
    assertEquals(Intent.ACTION_CHOOSER, chooserIntent.getAction());
    assertEquals(dialogTitle, chooserIntent.getExtras().get(Intent.EXTRA_TITLE));

    final Intent contentIntent = (Intent)chooserIntent.getExtras().get(Intent.EXTRA_INTENT);
    assertNotNull("Intent was not built correctly", contentIntent);
    assertEquals(Intent.ACTION_SEND, contentIntent.getAction());
    assertEquals(title, contentIntent.getExtras().get(Intent.EXTRA_SUBJECT));
    assertEquals(message, contentIntent.getExtras().get(Intent.EXTRA_TEXT));

    assertEquals(1, promise.getResolved());
  }

  @Test
  public void testInvalidContent() {
    final String dialogTitle = "Dialog Title";

    final SimplePromise promise = new SimplePromise();

    mShareModule.share(null, dialogTitle, promise);

    assertEquals(1, promise.getRejected());
    assertEquals(ShareModule.ERROR_INVALID_CONTENT, promise.getErrorCode());
  }

}
