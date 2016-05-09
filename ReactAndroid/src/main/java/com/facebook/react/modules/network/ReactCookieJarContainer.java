package com.facebook.react.modules.network;

import java.util.Collections;
import java.util.List;

import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;

public class ReactCookieJarContainer implements CookieJarContainer {

  private CookieJar cookieJar = null;

  @Override
  public void setCookieJar(CookieJar cookieJar) {
    this.cookieJar = cookieJar;
  }

  @Override
  public void removeCookieJar() {
    this.cookieJar = null;
  }

  @Override
  public void saveFromResponse(HttpUrl url, List<Cookie> cookies) {
    if (cookieJar != null) {
      cookieJar.saveFromResponse(url, cookies);
    }
  }

  @Override
  public List<Cookie> loadForRequest(HttpUrl url) {
    if (cookieJar != null) {
      return cookieJar.loadForRequest(url);
    }
    return Collections.emptyList();
  }
}
