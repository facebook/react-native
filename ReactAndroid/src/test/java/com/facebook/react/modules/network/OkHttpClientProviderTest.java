/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.network;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.robolectric.RobolectricTestRunner;

import okhttp3.OkHttpClient;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Tests for {@link OkHttpClientProvider}.
 */
@PrepareForTest({
    OkHttpClient.class,
    OkHttpClient.Builder.class
})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class OkHttpClientProviderTest {

  @Test
  public void testReplaceOkHttpClientBuilder() throws Exception {
    OkHttpClient httpClient = mock(OkHttpClient.class);
    OkHttpClient.Builder clientBuilder = mock(OkHttpClient.Builder.class);
    when(clientBuilder.build()).thenReturn(httpClient);
    when(httpClient.newBuilder()).thenReturn(clientBuilder);

    OkHttpClientProvider.replaceOkHttpClientBuilder(clientBuilder);
    assertThat(OkHttpClientProvider.createClient()).isEqualTo(httpClient);

    OkHttpClientProvider.replaceOkHttpClientBuilder(null);
    assertThat(OkHttpClientProvider.createClient()).isNotEqualTo(httpClient);
  }
}
