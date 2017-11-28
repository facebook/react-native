/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import android.os.Build;

import com.facebook.common.logging.FLog;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import javax.annotation.Nullable;

import okhttp3.ConnectionSpec;
import okhttp3.OkHttpClient;
import okhttp3.TlsVersion;

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public class OkHttpClientProvider {

  public interface IProvider {
    OkHttpClient create();

    OkHttpClient get();
  }

  public static class DefaultProvider implements OkHttpClientProvider.IProvider {
    // Centralized OkHttpClient for all networking requests.
    private @Nullable OkHttpClient client;

    @Override
    public OkHttpClient create() {
      // No timeouts by default
      OkHttpClient.Builder client = new OkHttpClient.Builder()
        .connectTimeout(0, TimeUnit.MILLISECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .writeTimeout(0, TimeUnit.MILLISECONDS)
        .cookieJar(new ReactCookieJarContainer());

      return enableTls12OnPreLollipop(client).build();
    }

    @Override
    public OkHttpClient get() {
      if (client == null) {
        client = create();
      }
      return client;
    }
  }

  private static @Nullable OkHttpClientProvider.IProvider sPprovider;

  private static OkHttpClientProvider.IProvider getProvider() {
    if (sPprovider == null) {
      sPprovider = new DefaultProvider();
    }
    return sPprovider;
  }

  // okhttp3 OkHttpClientProvider.IProvider is immutable
  // This allows app to init an OkHttpClientProvider.IProvider with custom settings.
  public static void replaceProvider(OkHttpClientProvider.IProvider provider) {
    sPprovider = provider;
  }

  public static OkHttpClient getOkHttpClient() {
    return getProvider().get();
  }

  public static OkHttpClient createClient() {
    return getProvider().create();
  }

  /*
    On Android 4.1-4.4 (API level 16 to 19) TLS 1.1 and 1.2 are
    available but not enabled by default. The following method
    enables it.
   */
  public static OkHttpClient.Builder enableTls12OnPreLollipop(OkHttpClient.Builder client) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && Build.VERSION.SDK_INT <= Build.VERSION_CODES.KITKAT) {
      try {
        client.sslSocketFactory(new TLSSocketFactory());

        ConnectionSpec cs = new ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
                .tlsVersions(TlsVersion.TLS_1_2)
                .build();

        List<ConnectionSpec> specs = new ArrayList<>();
        specs.add(cs);
        specs.add(ConnectionSpec.COMPATIBLE_TLS);
        specs.add(ConnectionSpec.CLEARTEXT);

        client.connectionSpecs(specs);
      } catch (Exception exc) {
        FLog.e("OkHttpClientProvider", "Error while enabling TLS 1.2", exc);
      }
    }

    return client;
  }

}