package com.facebook.react.shell;

import com.facebook.react.modules.network.OkHttpClientProvider;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;

public class MainPackageConfigTest {

  OkHttpClientProvider httpProvider = mock(OkHttpClientProvider.class);

  @Test
  public void setOkHttpClientProvider() throws Exception {
    MainPackageConfig config = new MainPackageConfig.Builder().setHttpClientProvider(httpProvider).build();
    assertEquals(config.getHttpClientProvider(), httpProvider);
  }

}
