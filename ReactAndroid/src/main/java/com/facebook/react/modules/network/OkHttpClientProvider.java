/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import android.os.Build;

import com.facebook.common.logging.FLog;

import javax.annotation.Nullable;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.ConnectionSpec;
import okhttp3.OkHttpClient;
import okhttp3.TlsVersion;

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public class OkHttpClientProvider {

  // Centralized OkHttpClient for all networking requests.
  private static @Nullable OkHttpClient sClient;

  // User-provided OkHttpClient factory
  private static @Nullable OkHttpClientFactory sFactory;

  public static void setOkHttpClientFactory(OkHttpClientFactory factory) {
    sFactory = factory;
  }

  public static OkHttpClient getOkHttpClient() {
    if (sClient == null) {
      sClient = createClient();
    }
    return sClient;
  }
  
  // okhttp3 OkHttpClient is immutable
  // This allows app to init an OkHttpClient with custom settings.
  public static void replaceOkHttpClient(OkHttpClient client) {
    sClient = client;
  }

  public static OkHttpClient createClient() {
    if (sFactory != null) {
      return sFactory.createNewNetworkModuleClient();
    }
    return createClientBuilder().build();
  }

  public static OkHttpClient.Builder createClientBuilder() {
    // No timeouts by default
    OkHttpClient.Builder client = new OkHttpClient.Builder()
      .connectTimeout(0, TimeUnit.MILLISECONDS)
      .readTimeout(0, TimeUnit.MILLISECONDS)
      .writeTimeout(0, TimeUnit.MILLISECONDS)
      .cookieJar(new ReactCookieJarContainer());

    return enableTls12OnLollipopAndBelow(client).build();
  }

  /*
    On Android 4.1-5.0 (API level 16 to 21) TLS 1.1 and 1.2 are
    available but not enabled by default. The following method
    enables it.
   */
  public static OkHttpClient.Builder enableTls12OnLollipopAndBelow(OkHttpClient.Builder client) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && Build.VERSION.SDK_INT <= Build.VERSION_CODES.LOLLIPOP) {
      try {
        TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(
                        TrustManagerFactory.getDefaultAlgorithm());
        trustManagerFactory.init((KeyStore) null);
        TrustManager[] trustManagers = trustManagerFactory.getTrustManagers();
        if (trustManagers.length != 1 || !(trustManagers[0] instanceof X509TrustManager)) {
          throw new IllegalStateException("Unexpected default trust managers:" + Arrays.toString(trustManagers));
        }
        X509TrustManager trustManager = (X509TrustManager) trustManagers[0];

        client.sslSocketFactory(new TLSSocketFactory(trustManager), trustManager);

        ConnectionSpec cs = new ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
                .tlsVersions(TlsVersion.TLS_1_0, TlsVersion.TLS_1_1, TlsVersion.TLS_1_2)
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
