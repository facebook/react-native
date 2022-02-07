/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import okhttp3.CookieJar;

public interface CookieJarContainer extends CookieJar {

  void setCookieJar(CookieJar cookieJar);

  void removeCookieJar();
}
