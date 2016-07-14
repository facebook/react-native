/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p/>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.webview;

import android.webkit.WebView;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ReactWebViewManagerTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ThemedReactContext mThemeContext;
  private static final String HTML = "<html/>";
  private static final String CUSTOM_MIME_TYPE = "text/html";
  private static final String BASE_URL = "base url";

  @Before
  public void setup() {
    ReactApplicationContext mContext = new ReactApplicationContext(RuntimeEnvironment.application);
    CatalystInstance mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mContext.initializeWithInstance(mCatalystInstanceMock);
    mThemeContext = new ThemedReactContext(mContext, mContext);
  }

  public ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  @Test
  public void testSetSourceWithHtml() {
    ReactWebViewManager viewManager = new ReactWebViewManager();
    WebView view = viewManager.createViewInstance(mThemeContext);
    view = Mockito.spy(view);
    Mockito.doNothing().when(view).loadData(
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString());
    JavaOnlyMap javaOnlyMap = JavaOnlyMap.of("html", HTML);
    viewManager.updateProperties(view, buildStyles("source", javaOnlyMap));

    Mockito.verify(view).loadData(
            Mockito.eq(HTML),
            Mockito.eq(ReactWebViewManager.HTML_MIME_TYPE),
            Mockito.anyString());
  }

  @Test
  public void testSetSourceWithHtmlAndMimeType() {
    ReactWebViewManager viewManager = new ReactWebViewManager();
    WebView view = viewManager.createViewInstance(mThemeContext);
    view = Mockito.spy(view);
    Mockito.doNothing().when(view).loadData(
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString());
    JavaOnlyMap javaOnlyMap = JavaOnlyMap.of("html", HTML, "mimeType", CUSTOM_MIME_TYPE);
    viewManager.updateProperties(view, buildStyles("source", javaOnlyMap));

    Mockito.verify(view).loadData(
            Mockito.eq(HTML),
            Mockito.eq(CUSTOM_MIME_TYPE),
            Mockito.anyString());
  }

  @Test
  public void testSetSourceWithHtmlAndBaseUrl() {
    ReactWebViewManager viewManager = new ReactWebViewManager();
    WebView view = viewManager.createViewInstance(mThemeContext);
    view = Mockito.spy(view);
    Mockito.doNothing().when(view).loadDataWithBaseURL(
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString());
    JavaOnlyMap javaOnlyMap = JavaOnlyMap.of("html", HTML, "baseUrl", BASE_URL);
    viewManager.updateProperties(view, buildStyles("source", javaOnlyMap));

    Mockito.verify(view).loadDataWithBaseURL(
            Mockito.eq(BASE_URL),
            Mockito.eq(HTML),
            Mockito.eq(ReactWebViewManager.HTML_MIME_TYPE),
            Mockito.anyString(),
            Mockito.anyString());
  }

  @Test
  public void testSetSourceWithHtmlAndBaseUrlAndMimeType() {
    ReactWebViewManager viewManager = new ReactWebViewManager();
    WebView view = viewManager.createViewInstance(mThemeContext);
    view = Mockito.spy(view);
    Mockito.doNothing().when(view).loadDataWithBaseURL(
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString());
    JavaOnlyMap javaOnlyMap = JavaOnlyMap.of(
            "html", HTML, "baseUrl", BASE_URL, "mimeType", CUSTOM_MIME_TYPE);
    viewManager.updateProperties(view, buildStyles("source", javaOnlyMap));

    Mockito.verify(view).loadDataWithBaseURL(
            Mockito.eq(BASE_URL),
            Mockito.eq(HTML),
            Mockito.eq(CUSTOM_MIME_TYPE),
            Mockito.anyString(),
            Mockito.anyString());
  }

  @Test
  public void testSetJavaScriptEnabled() {
    ReactWebViewManager viewManager = new ReactWebViewManager();
    WebView view = viewManager.createViewInstance(mThemeContext);
    viewManager.updateProperties(view, buildStyles("javaScriptEnabled", true));

    assertTrue(view.getSettings().getJavaScriptEnabled());
  }

  @Test
  public void testSetScalesPageToFit() {
    ReactWebViewManager viewManager = new ReactWebViewManager();
    WebView view = viewManager.createViewInstance(mThemeContext);
    viewManager.updateProperties(view, buildStyles("setScalesPageToFit", true));

    assertFalse(view.getSettings().getUseWideViewPort());
  }

}
