/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.share;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.WritableMap;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.internal.ShadowExtractor;
import org.robolectric.shadows.ShadowApplication;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ShareModuleTest {

  private Activity mActivity;
  private ShareModule mShareModule;

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() throws Exception {
    PowerMockito.mockStatic(Arguments.class);
    Mockito
        .when(Arguments.createMap())
        .thenAnswer(new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            return new JavaOnlyMap();
          }
        });

    mShareModule = new ShareModule(ReactTestHelper.createCatalystContextForTest());
  }

  @After
  public void cleanUp() {
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

    final Intent chooserIntent =
        ((ShadowApplication) ShadowExtractor.extract(RuntimeEnvironment.application)).getNextStartedActivity();
    assertNotNull("Dialog was not displayed", chooserIntent);
    assertEquals(Intent.ACTION_CHOOSER, chooserIntent.getAction());
    assertEquals(
        dialogTitle,
        chooserIntent
            .getExtras()
            .get(Intent.EXTRA_TITLE)
    );

    final Intent contentIntent = (Intent) chooserIntent
        .getExtras()
        .get(Intent.EXTRA_INTENT);
    assertNotNull("Intent was not built correctly", contentIntent);
    assertEquals(Intent.ACTION_SEND, contentIntent.getAction());
    assertEquals(
        title,
        contentIntent
            .getExtras()
            .get(Intent.EXTRA_SUBJECT)
    );
    assertEquals(
        message,
        contentIntent
            .getExtras()
            .get(Intent.EXTRA_TEXT)
    );

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

  final static class SimplePromise implements Promise {
    private static final String ERROR_DEFAULT_CODE = "EUNSPECIFIED";
    private static final String ERROR_DEFAULT_MESSAGE = "Error not specified.";

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
      reject(code, message, /*Throwable*/null, /*WritableMap*/null);
    }

    @Override
    public void reject(String code, Throwable throwable) {
      reject(code, /*Message*/null, throwable, /*WritableMap*/null);
    }

    @Override
    public void reject(String code, String message, Throwable throwable) {
      reject(code, message, throwable, /*WritableMap*/null);
    }

    @Override
    public void reject(Throwable throwable) {
      reject(/*Code*/null, /*Message*/null, throwable, /*WritableMap*/null);
    }

    @Override
    public void reject(Throwable throwable, WritableMap userInfo) {
      reject(/*Code*/null, /*Message*/null, throwable, userInfo);
    }

    @Override
    public void reject(String code, @Nonnull WritableMap userInfo) {
      reject(code, /*Message*/null, /*Throwable*/null, userInfo);
    }

    @Override
    public void reject(String code, Throwable throwable, WritableMap userInfo) {
      reject(code, /*Message*/null, throwable, userInfo);
    }

    @Override
    public void reject(String code, String message, @Nonnull WritableMap userInfo) {
      reject(code, message, /*Throwable*/null, userInfo);
    }

    @Override
    public void reject(
        String code,
        String message,
        @Nullable Throwable throwable,
        @Nullable WritableMap userInfo
    ) {
      mRejected++;

      if (code == null) {
        mErrorCode = ERROR_DEFAULT_CODE;
      } else {
        mErrorCode = code;
      }

      if (message != null) {
        mErrorMessage = message;
      } else if (throwable != null) {
        mErrorMessage = throwable.getMessage();
      } else {
        mErrorMessage = ERROR_DEFAULT_MESSAGE;
      }
    }

    @Override
    @Deprecated
    public void reject(String message) {
      reject(/*Code*/null, message, /*Throwable*/null, /*WritableMap*/null);
    }
  }
}
