/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {PageDescription} from '../inspector-proxy/types';

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {baseUrlForServer, createServer} from './ServerUtils';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

describe('inspector proxy device message middleware', () => {
  const autoCleanup = withAbortSignalForEachTest();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('middleware is created with device information', async () => {
    const createMiddleware = jest.fn().mockImplementation(() => null);
    const {server} = await createServer({
      logger: undefined,
      projectRoot: '',
      unstable_deviceMessageMiddleware: createMiddleware,
    });

    let device_;
    try {
      // Create and connect the device
      device_ = await createDeviceMock(
        `${baseUrlForServer(server, 'ws')}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      const page = {
        app: 'bar',
        id: 'page1',
        // NOTE: 'React' is a magic string used to detect React Native pages.
        title: 'React Native (mock)',
        vm: 'vm',
      };
      device_.getPages.mockImplementation(() => [page]);

      // Ensure the middleware was created with the device information
      await until(() =>
        expect(createMiddleware).toBeCalledWith(
          expect.objectContaining({
            deviceId: 'device1',
            deviceName: 'foo',
            deviceSocket: expect.anything(), // Websocket
            appId: 'bar',
            projectRoot: '',
            page: expect.objectContaining({
              ...page,
              capabilities: expect.any(Object),
            }),
          }),
        ),
      );
    } finally {
      device_?.close();
      await closeServer(server);
    }
  });

  test('device message is passed to message middleware', async () => {
    const handleDeviceMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      projectRoot: '',
      unstable_deviceMessageMiddleware: () => ({
        handleDeviceMessage,
        handleDebuggerMessage() {},
      }),
    });

    let device_, debugger_;
    try {
      // Create and connect the device
      device_ = await createDeviceMock(
        `${baseUrlForServer(server, 'ws')}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device_.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'page1',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);

      // Find the debugger URL
      const [{webSocketDebuggerUrl}] = await fetchPageList(server);
      expect(webSocketDebuggerUrl).toBeDefined();

      // Create and connect the debugger
      debugger_ = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );
      await until(() => expect(device_.connect).toBeCalled());

      // Send a message from the device, and ensure the middleware received it
      device_.sendWrappedEvent('page1', {id: 1337});

      // Ensure the debugger received the message
      await until(() => expect(debugger_.handle).toBeCalledWith({id: 1337}));
      // Ensure the middleware received the message
      await until(() => expect(handleDeviceMessage).toBeCalled());
    } finally {
      device_?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('device disconnect is passed to message middleware', async () => {
    const handleDeviceMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      projectRoot: '',
      unstable_deviceMessageMiddleware: () => ({
        handleDeviceMessage,
        handleDebuggerMessage() {},
      }),
    });

    let device_, debugger_;
    try {
      // Create and connect the device
      device_ = await createDeviceMock(
        `${baseUrlForServer(server, 'ws')}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device_.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'page1',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);

      // Find the debugger URL
      const [{webSocketDebuggerUrl}] = await fetchPageList(server);
      expect(webSocketDebuggerUrl).toBeDefined();

      // Create and connect the debugger
      debugger_ = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );
      await until(() => expect(device_.connect).toBeCalled());

      // Send a message from the device, and ensure the middleware received it
      const message = {
        event: 'disconnect',
        payload: {pageId: 'page1'},
      };
      device_.send(message);

      await until(() =>
        expect(handleDeviceMessage).toBeCalledWith(
          message, // CDP event
          expect.any(Object), // Debugger info
        ),
      );
    } finally {
      device_?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('device message stops propagating when handled by middleware', async () => {
    const handleDeviceMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      projectRoot: '',
      unstable_deviceMessageMiddleware: () => ({
        handleDeviceMessage,
        handleDebuggerMessage() {},
      }),
    });

    let device_, debugger_;
    try {
      // Create and connect the device
      device_ = await createDeviceMock(
        `${baseUrlForServer(server, 'ws')}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device_.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'page1',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);

      // Find the debugger URL
      const [{webSocketDebuggerUrl}] = await fetchPageList(server);
      expect(webSocketDebuggerUrl).toBeDefined();

      // Create and connect the debugger
      debugger_ = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );
      await until(() => expect(device_.connect).toBeCalled());

      // Stop the first message from propagating by returning true (once) from middleware
      handleDeviceMessage.mockReturnValueOnce(true);

      // Send the first message which should NOT be received by the debugger
      device_.sendWrappedEvent('page1', {id: -1});
      await until(() => expect(handleDeviceMessage).toBeCalled());

      // Send the second message which should be received by the debugger
      device_.sendWrappedEvent('page1', {id: 1337});

      // Ensure only the last message was received by the debugger
      await until(() => expect(debugger_.handle).toBeCalledWith({id: 1337}));
      // Ensure the first message was not received by the debugger
      expect(debugger_.handle).not.toBeCalledWith({id: -1});
    } finally {
      device_?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('debugger message is passed to message middleware', async () => {
    const handleDebuggerMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      projectRoot: '',
      unstable_deviceMessageMiddleware: () => ({
        handleDeviceMessage() {},
        handleDebuggerMessage,
      }),
    });

    let device_, debugger_;
    try {
      // Create and connect the device
      device_ = await createDeviceMock(
        `${baseUrlForServer(server, 'ws')}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device_.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'page1',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);

      // Find the debugger URL
      const [{webSocketDebuggerUrl}] = await fetchPageList(server);
      expect(webSocketDebuggerUrl).toBeDefined();

      // Create and connect the debugger
      debugger_ = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );
      await until(() => expect(device_.connect).toBeCalled());

      // Send a message from the debugger
      const message = {
        method: 'Runtime.enable',
        id: 1337,
      };
      debugger_.send(message);

      // Ensure the device received the message
      await until(() => expect(device_.wrappedEvent).toBeCalled());
      // Ensure the middleware received the message
      await until(() =>
        expect(handleDebuggerMessage).toBeCalledWith(
          message, // CDP event
          expect.any(Object), // Debugger info
        ),
      );
    } finally {
      device_?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });

  test('debugger message stops propagating when handled by middleware', async () => {
    const handleDebuggerMessage = jest.fn();
    const {server} = await createServer({
      logger: undefined,
      projectRoot: '',
      unstable_deviceMessageMiddleware: () => ({
        handleDeviceMessage() {},
        handleDebuggerMessage,
      }),
    });

    let device_, debugger_;
    try {
      // Create and connect the device
      device_ = await createDeviceMock(
        `${baseUrlForServer(server, 'ws')}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device_.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'page1',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);

      // Find the debugger URL
      const [{webSocketDebuggerUrl}] = await fetchPageList(server);
      expect(webSocketDebuggerUrl).toBeDefined();

      // Create and connect the debugger
      debugger_ = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );
      await until(() => expect(device_.connect).toBeCalled());

      // Stop the first message from propagating by returning true (once) from middleware
      handleDebuggerMessage.mockReturnValueOnce(true);

      // Send the first emssage which should not be received by the device
      debugger_.send({id: -1});
      // Send the second message which should be received by the device
      debugger_.send({id: 1337});

      // Ensure only the last message was received by the device
      await until(() =>
        expect(device_.wrappedEvent).toBeCalledWith({
          event: 'wrappedEvent',
          payload: {pageId: 'page1', wrappedEvent: JSON.stringify({id: 1337})},
        }),
      );
      // Ensure the first message was not received by the device
      expect(device_.wrappedEvent).not.toBeCalledWith({id: -1});
    } finally {
      device_?.close();
      debugger_?.close();
      await closeServer(server);
    }
  });
});

async function fetchPageList(
  server: http$Server | https$Server,
): Promise<PageDescription[]> {
  let pageList: Array<PageDescription> = [];
  await until(async () => {
    pageList = (await fetchJson(
      `${baseUrlForServer(server, 'http')}/json`,
      // $FlowIgnore[unclear-type]
    ): any);
    expect(pageList.length).toBeGreaterThanOrEqual(1);
  });

  return pageList;
}

async function closeServer(server: http$Server | https$Server): Promise<void> {
  return new Promise(resolve => server.close(() => resolve()));
}
