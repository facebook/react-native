/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */


package com.facebook.react.animated;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InOrder;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareEverythingForTest;
import org.robolectric.RobolectricTestRunner;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@PrepareEverythingForTest
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class NativeAnimatedModuleTest {
  private NativeAnimatedModule mNativeAnimatedModule;
  private NativeAnimatedNodesManager mNodeManager;
  private UIManagerModule mUIManager;
  private List<UIBlock> mUIBlocks;

  private void flushUIBlocks() {
    mNativeAnimatedModule.willDispatchViewUpdates(mUIManager);
    for (UIBlock block : mUIBlocks) {
      block.execute(mock(NativeViewHierarchyManager.class));
    }
    mUIBlocks.clear();
  }

  @Before
  public void setUp() {
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    mUIManager = mock(UIManagerModule.class);
    PowerMockito.doReturn(mock(EventDispatcher.class)).when(mUIManager).getEventDispatcher();
    PowerMockito.doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        mUIBlocks.add(invocation.getArgumentAt(0, UIBlock.class));
        return null;
      }
    }).when(mUIManager).addUIBlock(any(UIBlock.class));
    PowerMockito.doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        mUIBlocks.add(0, invocation.getArgumentAt(0, UIBlock.class));
        return null;
      }
    }).when(mUIManager).prependUIBlock(any(UIBlock.class));
    PowerMockito.doReturn(mUIManager).when(context).getNativeModule(UIManagerModule.class);

    ReactChoreographer.initialize();
    mNativeAnimatedModule = new NativeAnimatedModule(context);
    mNativeAnimatedModule.initialize();
    mNodeManager = mock(NativeAnimatedNodesManager.class);
    mNativeAnimatedModule.setNodesManager(mNodeManager);
    mUIBlocks = new ArrayList<>();
  }

  @Test
  public void testNodeManagerSchedulingWaitsForFlush() {
    // Make sure operations are not executed until UIManager has flushed it's queue.
    mNativeAnimatedModule.connectAnimatedNodeToView(1, 1000);
    verify(mNodeManager, never()).connectAnimatedNodeToView(anyInt(), anyInt());
    flushUIBlocks();
    verify(mNodeManager, times(1)).connectAnimatedNodeToView(anyInt(), anyInt());
  }

  @Test
  public void testNodeManagerSchedulingOperation() {
    UIBlock otherBlock = mock(UIBlock.class);
    mUIManager.addUIBlock(otherBlock);
    mNativeAnimatedModule.connectAnimatedNodeToView(1, 1000);
    flushUIBlocks();

    // Connect should be called after other UI operations.
    InOrder inOrder = inOrder(mNodeManager, otherBlock);
    inOrder.verify(otherBlock, times(1)).execute(any(NativeViewHierarchyManager.class));
    inOrder.verify(mNodeManager, times(1)).connectAnimatedNodeToView(1, 1000);
  }

  @Test
  public void testNodeManagerSchedulingPreOperation() {
    UIBlock otherBlock = mock(UIBlock.class);
    mUIManager.addUIBlock(otherBlock);
    mNativeAnimatedModule.disconnectAnimatedNodeFromView(1, 1000);
    flushUIBlocks();

    // Disconnect should be called before other UI operations.
    InOrder inOrder = inOrder(mNodeManager, otherBlock);
    inOrder.verify(mNodeManager, times(1)).restoreDefaultValues(1, 1000);
    inOrder.verify(otherBlock, times(1)).execute(any(NativeViewHierarchyManager.class));
    inOrder.verify(mNodeManager, times(1)).disconnectAnimatedNodeFromView(1, 1000);
  }
}
