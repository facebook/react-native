/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static org.assertj.core.api.Assertions.assertThat;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.BridgeReactContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.views.view.ReactViewManager;
import java.util.Arrays;
import java.util.List;
import java.util.Queue;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/** Tests {@link FabricUIManager} */
@RunWith(RobolectricTestRunner.class)
public class MountingManagerTest {

  private MountingManager mMountingManager;
  private MountingManager.MountItemExecutor mMountItemExecutor;
  private ThemedReactContext mThemedReactContext;
  private int mNextRootTag = 1;

  @Before
  public void setUp() {
    ReactNativeFeatureFlagsForTests.INSTANCE.setUp();

    BridgeReactContext reactContext = new BridgeReactContext(RuntimeEnvironment.application);
    reactContext.initializeWithInstance(ReactTestHelper.createMockCatalystInstance());
    mThemedReactContext = new ThemedReactContext(reactContext, reactContext);
    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(new ReactViewManager());
    mMountItemExecutor =
        new MountingManager.MountItemExecutor() {
          @Override
          public void executeItems(Queue<MountItem> items) {
            // no-op
          }
        };
    mMountingManager =
        new MountingManager(new ViewManagerRegistry(viewManagers), mMountItemExecutor);
  }

  @Test
  public void addRootView() {
    ReactRootView reactRootView = new ReactRootView(mThemedReactContext);
    int rootReactTag = mNextRootTag++;
    mMountingManager.startSurface(rootReactTag, mThemedReactContext, reactRootView);
    assertThat(reactRootView.getId()).isEqualTo(rootReactTag);
  }

  @Test
  public void unableToAddRootViewTwice() {
    ReactRootView reactRootView = new ReactRootView(mThemedReactContext);
    int rootReactTag = mNextRootTag++;
    mMountingManager.startSurface(rootReactTag, mThemedReactContext, reactRootView);
    assertThat(reactRootView.getId()).isEqualTo(rootReactTag);

    // This is now a SoftException because it indicates a race condition in starting
    // a single surface with a single View, and is concerning but not necessarily fatal.
    // To be clear: in this case we're still guaranteed a single SurfaceMountingManager
    // and therefore a single View involved.
    mMountingManager.startSurface(rootReactTag, mThemedReactContext, reactRootView);
  }

  @Test(expected = IllegalViewOperationException.class)
  public void unableToAddHandledRootView() {
    ReactRootView reactRootView = new ReactRootView(mThemedReactContext);
    reactRootView.setId(1234567);
    int rootReactTag = mNextRootTag++;
    mMountingManager.startSurface(rootReactTag, mThemedReactContext, reactRootView);
  }
}
