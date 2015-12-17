/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.dialog;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.app.Activity;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.SimpleMap;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.util.ActivityController;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class DialogModuleTest {

  private ActivityController<Activity> mActivityController;
  private Activity mActivity;
  private DialogModule mDialogModule;

  final static class SimpleCallback implements Callback {
    private Object[] mArgs;
    private int mCalls;

    @Override
    public void invoke(Object... args) {
      mCalls++;
      mArgs = args;
    }

    public int getCalls() {
      return mCalls;
    }

    public Object[] getArgs() {
      return mArgs;
    }
  }

  @Before
  public void setUp() throws Exception {
    mActivityController = Robolectric.buildActivity(Activity.class);
    mActivity = mActivityController
        .create()
        .start()
        .resume()
        .get();

    final ReactApplicationContext context = PowerMockito.mock(ReactApplicationContext.class);
    PowerMockito.when(context.hasActiveCatalystInstance()).thenReturn(true);
    PowerMockito.when(context, "getCurrentActivity").thenReturn(mActivity);

    mDialogModule = new DialogModule(context);
    mDialogModule.onHostResume();
  }

  @After
  public void tearDown() {
    mActivityController.pause().stop().destroy();

    mActivityController = null;
    mDialogModule = null;
  }

  @Test
  public void testAllOptions() {
    final SimpleMap options = new SimpleMap();
    options.putString("title", "Title");
    options.putString("message", "Message");
    options.putString("buttonPositive", "OK");
    options.putString("buttonNegative", "Cancel");
    options.putString("buttonNeutral", "Later");

    mDialogModule.showAlert(options, null, null);

    final AlertFragment fragment = getFragment();
    assertNotNull("Fragment was not displayed", fragment);

    final AlertDialog dialog = (AlertDialog) fragment.getDialog();
    assertEquals("OK", dialog.getButton(DialogInterface.BUTTON_POSITIVE).getText().toString());
    assertEquals("Cancel", dialog.getButton(DialogInterface.BUTTON_NEGATIVE).getText().toString());
    assertEquals("Later", dialog.getButton(DialogInterface.BUTTON_NEUTRAL).getText().toString());
  }

  @Test
  public void testCallbackPositive() {
    final SimpleMap options = new SimpleMap();
    options.putString("buttonPositive", "OK");

    final SimpleCallback actionCallback = new SimpleCallback();
    mDialogModule.showAlert(options, null, actionCallback);

    final AlertDialog dialog = (AlertDialog) getFragment().getDialog();
    dialog.getButton(DialogInterface.BUTTON_POSITIVE).performClick();

    assertEquals(1, actionCallback.getCalls());
    assertEquals(DialogModule.ACTION_BUTTON_CLICKED, actionCallback.getArgs()[0]);
    assertEquals(DialogInterface.BUTTON_POSITIVE, actionCallback.getArgs()[1]);
  }

  @Test
  public void testCallbackNegative() {
    final SimpleMap options = new SimpleMap();
    options.putString("buttonNegative", "Cancel");

    final SimpleCallback actionCallback = new SimpleCallback();
    mDialogModule.showAlert(options, null, actionCallback);

    final AlertDialog dialog = (AlertDialog) getFragment().getDialog();
    dialog.getButton(DialogInterface.BUTTON_NEGATIVE).performClick();

    assertEquals(1, actionCallback.getCalls());
    assertEquals(DialogModule.ACTION_BUTTON_CLICKED, actionCallback.getArgs()[0]);
    assertEquals(DialogInterface.BUTTON_NEGATIVE, actionCallback.getArgs()[1]);
  }

  @Test
  public void testCallbackNeutral() {
    final SimpleMap options = new SimpleMap();
    options.putString("buttonNeutral", "Later");

    final SimpleCallback actionCallback = new SimpleCallback();
    mDialogModule.showAlert(options, null, actionCallback);

    final AlertDialog dialog = (AlertDialog) getFragment().getDialog();
    dialog.getButton(DialogInterface.BUTTON_NEUTRAL).performClick();

    assertEquals(1, actionCallback.getCalls());
    assertEquals(DialogModule.ACTION_BUTTON_CLICKED, actionCallback.getArgs()[0]);
    assertEquals(DialogInterface.BUTTON_NEUTRAL, actionCallback.getArgs()[1]);
  }

  @Test
  public void testCallbackDismiss() {
    final SimpleMap options = new SimpleMap();

    final SimpleCallback actionCallback = new SimpleCallback();
    mDialogModule.showAlert(options, null, actionCallback);

    getFragment().getDialog().dismiss();

    assertEquals(1, actionCallback.getCalls());
    assertEquals(DialogModule.ACTION_DISMISSED, actionCallback.getArgs()[0]);
  }

  private AlertFragment getFragment() {
    return (AlertFragment) mActivity.getFragmentManager()
        .findFragmentByTag(DialogModule.FRAGMENT_TAG);
  }
}
