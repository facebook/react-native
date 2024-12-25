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

import {withFetchSelfSignedCertsForAllTests} from './FetchUtils';
import {
  createAndConnectTarget,
  parseJsonFromDataUri,
  sendFromDebuggerToTarget,
  sendFromTargetToDebugger,
} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {
  serveStaticJson,
  serveStaticText,
  withServerForEachTest,
} from './ServerUtils';
import {createHash} from 'crypto';
import fs from 'fs';
import path from 'path';

const fsPromise = fs.promises;

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

const fetchOriginal = fetch;
const fetchSpy: JestMockFn<
  Parameters<typeof fetch>,
  ReturnType<typeof fetch>,
> = jest.spyOn(globalThis, 'fetch');

describe.each(['HTTP', 'HTTPS'])(
  'inspector proxy CDP rewriting hacks over %s',
  protocol => {
    // Inspector proxy tests are using a self-signed certificate for HTTPS tests.
    if (protocol === 'HTTPS') {
      withFetchSelfSignedCertsForAllTests(fetchSpy, fetchOriginal);
    }

    const serverRef = withServerForEachTest({
      logger: undefined,
      projectRoot: __dirname,
      secure: protocol === 'HTTPS',
    });

    const autoCleanup = withAbortSignalForEachTest();
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('source map fetching in Debugger.scriptParsed', async () => {
      serverRef.app.use(
        '/source-map',
        serveStaticJson({
          version: 3,
          // Mojibake insurance.
          file: '\u2757.js',
        }),
      );
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              sourceMapURL: `${serverRef.serverBaseUrl}/source-map`,
            },
          },
        );
        expect(
          parseJsonFromDataUri(scriptParsedMessage.params.sourceMapURL),
        ).toEqual({version: 3, file: '\u2757.js'});
      } finally {
        device.close();
        debugger_.close();
      }
    });

    test('async source map fetching does not reorder events', async () => {
      serverRef.app.use(
        '/source-map',
        serveStaticJson({
          version: 3,
          // Mojibake insurance.
          file: '\u2757.js',
        }),
      );
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        await Promise.all([
          sendFromTargetToDebugger(device, debugger_, 'page1', {
            method: 'Debugger.scriptParsed',
            params: {
              sourceMapURL: `${serverRef.serverBaseUrl}/source-map`,
            },
          }),
          sendFromTargetToDebugger(device, debugger_, 'page1', {
            method: 'Debugger.aSubsequentEvent',
          }),
        ]);
        expect(debugger_.handle).toHaveBeenNthCalledWith(1, {
          method: 'Debugger.scriptParsed',
          params: {
            sourceMapURL: expect.stringMatching(/^data:/),
          },
        });
        expect(debugger_.handle).toHaveBeenNthCalledWith(2, {
          method: 'Debugger.aSubsequentEvent',
        });
      } finally {
        device.close();
        debugger_.close();
      }
    });

    test('handling of failure to fetch source map', async () => {
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              sourceMapURL: `${serverRef.serverBaseUrl}/source-map-missing`,
            },
          },
        );

        // We don't rewrite the message in this case.
        expect(scriptParsedMessage.params.sourceMapURL).toEqual(
          `${serverRef.serverBaseUrl}/source-map-missing`,
        );

        // We send an error through to the debugger as a console message.
        expect(debugger_.handle).toBeCalledWith(
          expect.objectContaining({
            method: 'Runtime.consoleAPICalled',
            params: {
              args: [
                {
                  type: 'string',
                  value: expect.stringMatching('Failed to fetch source map'),
                },
              ],
              executionContextId: 0,
              type: 'error',
            },
          }),
        );
      } finally {
        device.close();
        debugger_.close();
      }
    });

    test("does not rewrite urls in Debugger.scriptParsed that don't match the device connection host", async () => {
      serverRef.app.use('/source-map', serveStaticJson({version: 3}));
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
        {
          deviceHostHeader: '192.168.0.123:' + serverRef.port,
        },
      );
      try {
        let fetchCalledWithURL;
        fetchSpy.mockImplementationOnce(async url => {
          fetchCalledWithURL = url instanceof URL ? url : null;
          throw new Error('Unreachable');
        });
        const sourceMapURL = `${protocol.toLowerCase()}://127.0.0.1:${
          serverRef.port
        }/source-map`;
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              sourceMapURL,
            },
          },
        );
        expect(fetchCalledWithURL?.href).toEqual(sourceMapURL);
        expect(scriptParsedMessage.params.sourceMapURL).toEqual(
          `${protocol.toLowerCase()}://127.0.0.1:${serverRef.port}/source-map`,
        );
      } finally {
        device.close();
        debugger_.close();
      }
    });

    describe.each(['10.0.2.2:8080', '[::1]', 'example.com:2000'])(
      '%s aliasing to and from localhost',
      sourceHost => {
        test('in source map fetching during Debugger.scriptParsed', async () => {
          serverRef.app.use('/source-map', serveStaticJson({version: 3}));
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
            {
              deviceHostHeader: sourceHost,
            },
          );
          try {
            const scriptParsedMessage = await sendFromTargetToDebugger(
              device,
              debugger_,
              'page1',
              {
                method: 'Debugger.scriptParsed',
                params: {
                  sourceMapURL: `${protocol.toLowerCase()}://${sourceHost}/source-map`,
                },
              },
            );
            expect(
              parseJsonFromDataUri(scriptParsedMessage.params.sourceMapURL),
            ).toEqual({version: 3});
          } finally {
            device.close();
            debugger_.close();
          }
        });

        test('in Debugger.setBreakpointByUrl', async () => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
            {
              debuggerHostHeader: 'localhost:' + serverRef.port,
              deviceHostHeader: sourceHost,
            },
          );
          try {
            const scriptParsedMessage = await sendFromTargetToDebugger(
              device,
              debugger_,
              'page1',
              {
                method: 'Debugger.scriptParsed',
                params: {
                  url: `${protocol.toLowerCase()}://${sourceHost}/some/file.js`,
                },
              },
            );
            expect(scriptParsedMessage.params.url).toEqual(
              `${protocol.toLowerCase()}://localhost:${
                serverRef.port
              }/some/file.js`,
            );

            const setBreakpointByUrlMessage = await sendFromDebuggerToTarget(
              debugger_,
              device,
              'page1',
              {
                id: 100,
                method: 'Debugger.setBreakpointByUrl',
                params: {
                  lineNumber: 1,
                  url: `${protocol.toLowerCase()}://localhost:${
                    serverRef.port
                  }/some/file.js`,
                },
              },
            );
            expect(setBreakpointByUrlMessage.params.url).toEqual(
              `${protocol.toLowerCase()}://${sourceHost}/some/file.js`,
            );

            const setBreakpointByUrlRegexMessage =
              await sendFromDebuggerToTarget(debugger_, device, 'page1', {
                id: 200,
                method: 'Debugger.setBreakpointByUrl',
                params: {
                  lineNumber: 1,
                  urlRegex: `localhost:${serverRef.port}|example.com:2000`,
                },
              });

            // urlRegex rewriting is restricted to specific Android IPs that
            // are well-known to route to the host. In this case we only
            // replace hostname - longstanding behaviour.
            if (sourceHost === '10.0.2.2:8080') {
              expect(setBreakpointByUrlRegexMessage.params.urlRegex).toEqual(
                `10\\.0\\.2\\.2:${serverRef.port}|example.com:2000`,
              );
            } else {
              // Otherwise expect no change.
              expect(setBreakpointByUrlRegexMessage.params.urlRegex).toEqual(
                `localhost:${serverRef.port}|example.com:2000`,
              );
            }
          } finally {
            device.close();
            debugger_.close();
          }
        });

        describe('Network.loadNetworkResource', () => {
          test('should respond with an error without forwarding to the client', async () => {
            const {device, debugger_} = await createAndConnectTarget(
              serverRef,
              autoCleanup.signal,
              {
                app: 'bar-app',
                id: 'page1',
                title: 'bar-title',
                vm: 'bar-vm',
              },
              {
                deviceHostHeader: sourceHost,
              },
            );
            try {
              const response = await debugger_.sendAndGetResponse({
                id: 1,
                method: 'Network.loadNetworkResource',
                params: {
                  url: 'http://example.com',
                },
              });
              expect(response.result).toEqual(
                expect.objectContaining({
                  error: {
                    code: -32601,
                    message:
                      '[inspector-proxy]: Page lacks nativeSourceCodeFetching capability.',
                  },
                }),
              );
            } finally {
              device.close();
              debugger_.close();
            }
          });
        });
      },
    );

    test('rewrites alphanumeric script IDs to file:// URIs', async () => {
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
        {
          deviceHostHeader: '127.0.0.1:' + serverRef.port,
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              url: 'abcde12345',
            },
          },
        );
        expect(scriptParsedMessage.params.url).toBe('file://abcde12345');
      } finally {
        device.close();
        debugger_.close();
      }
    });

    describe('Debugger.getScriptSource', () => {
      test('fetches source from server', async () => {
        serverRef.app.use('/source', serveStaticText('foo'));
        const {device, debugger_} = await createAndConnectTarget(
          serverRef,
          autoCleanup.signal,
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        );
        try {
          await sendFromTargetToDebugger(device, debugger_, 'page1', {
            method: 'Debugger.scriptParsed',
            params: {
              scriptId: 'script1',
              url: `${serverRef.serverBaseUrl}/source`,
              startLine: 0,
              endLine: 0,
              startColumn: 0,
              endColumn: 0,
              hash: createHash('sha256').update('foo').digest('hex'),
            },
          });
          const response = await debugger_.sendAndGetResponse({
            id: 1,
            method: 'Debugger.getScriptSource',
            params: {
              scriptId: 'script1',
            },
          });
          expect(response.result).toEqual(
            expect.objectContaining({scriptSource: 'foo'}),
          );
          // The device does not receive the getScriptSource request, since it
          // is handled by the proxy.
          expect(device.wrappedEventParsed).not.toBeCalledWith({
            pageId: 'page1',
            wrappedEvent: expect.objectContaining({
              method: 'Debugger.getScriptSource',
            }),
          });
        } finally {
          device.close();
          debugger_.close();
        }
      });

      test('reads source from disk', async () => {
        // Should be just 'foo\n', but the newline can get mangled by the OS
        // and/or SCM, so let's read the source of truth from disk.
        const fileRealContents = await fsPromise.readFile(
          path.join(__dirname, '__fixtures__', 'mock-source-file.txt'),
          'utf8',
        );

        const {device, debugger_} = await createAndConnectTarget(
          serverRef,
          autoCleanup.signal,
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        );
        try {
          await sendFromTargetToDebugger(device, debugger_, 'page1', {
            method: 'Debugger.scriptParsed',
            params: {
              scriptId: 'script1',
              url: '__fixtures__/mock-source-file.txt',
              startLine: 0,
              endLine: 0,
              startColumn: 0,
              endColumn: 0,
              hash: createHash('sha256').update(fileRealContents).digest('hex'),
            },
          });
          const response = await debugger_.sendAndGetResponse({
            id: 1,
            method: 'Debugger.getScriptSource',
            params: {
              scriptId: 'script1',
            },
          });
          expect(response.result).toEqual(
            expect.objectContaining({scriptSource: fileRealContents}),
          );
          // The device does not receive the getScriptSource request, since it
          // is handled by the proxy.
          expect(device.wrappedEventParsed).not.toBeCalledWith({
            pageId: 'page1',
            wrappedEvent: expect.objectContaining({
              method: 'Debugger.getScriptSource',
            }),
          });
        } finally {
          device.close();
          debugger_.close();
        }
      });

      test.each(['url', 'file'])(
        'reports %s fetch error back to debugger',
        async resourceType => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          );
          try {
            await sendFromTargetToDebugger(device, debugger_, 'page1', {
              method: 'Debugger.scriptParsed',
              params: {
                scriptId: 'script1',
                url:
                  resourceType === 'url'
                    ? `${serverRef.serverBaseUrl}/source-missing`
                    : '__fixtures__/mock-source-file.does-not-exist',
                startLine: 0,
                endLine: 0,
                startColumn: 0,
                endColumn: 0,
                hash: createHash('sha256').update('foo').digest('hex'),
              },
            });
            const response = await debugger_.sendAndGetResponse({
              id: 1,
              method: 'Debugger.getScriptSource',
              params: {
                scriptId: 'script1',
              },
            });

            // We mark the request as failed.
            expect(response).toEqual({
              id: 1,
              result: {
                error: {
                  message: expect.stringMatching(
                    `Failed to fetch source ${resourceType}`,
                  ),
                },
              },
            });

            // We also send an error through to the debugger as a console message.
            expect(debugger_.handle).toBeCalledWith(
              expect.objectContaining({
                method: 'Runtime.consoleAPICalled',
                params: {
                  args: [
                    {
                      type: 'string',
                      value: expect.stringMatching(
                        `Failed to fetch source ${resourceType}`,
                      ),
                    },
                  ],
                  executionContextId: 0,
                  type: 'error',
                },
              }),
            );

            // The device does not receive the getScriptSource request, since it
            // is handled by the proxy.
            expect(device.wrappedEventParsed).not.toBeCalledWith({
              pageId: 'page1',
              wrappedEvent: expect.objectContaining({
                method: 'Debugger.getScriptSource',
              }),
            });
          } finally {
            device.close();
            debugger_.close();
          }
        },
      );
    });

    describe("disabled when target has 'nativeSourceCodeFetching' capability flag", () => {
      const pageDescription = {
        app: 'bar-app',
        id: 'page1',
        title: 'bar-title',
        capabilities: {
          nativeSourceCodeFetching: true,
        },
        vm: 'bar-vm',
      };

      describe('Debugger.scriptParsed', () => {
        test('should forward event directly to client (does not rewrite sourceMapURL host)', async () => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            pageDescription,
          );
          try {
            const message = {
              method: 'Debugger.scriptParsed',
              params: {
                sourceMapURL: `${protocol.toLowerCase()}://10.0.2.2:${
                  serverRef.port
                }/source-map`,
              },
            };
            await sendFromTargetToDebugger(device, debugger_, 'page1', message);

            expect(debugger_.handle).toBeCalledWith(message);
          } finally {
            device.close();
            debugger_.close();
          }
        });
      });

      describe('Debugger.getScriptSource', () => {
        test('should forward request directly to device (does not read source from disk in proxy)', async () => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            pageDescription,
          );
          try {
            const message = {
              id: 1,
              method: 'Debugger.getScriptSource',
              params: {
                scriptId: 'script1',
              },
            };
            await sendFromDebuggerToTarget(debugger_, device, 'page1', message);

            expect(device.wrappedEventParsed).toBeCalledWith({
              pageId: 'page1',
              wrappedEvent: message,
            });
          } finally {
            device.close();
            debugger_.close();
          }
        });
      });

      describe('Network.loadNetworkResource', () => {
        test('should forward event directly to client (does not rewrite url host)', async () => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            pageDescription,
          );
          try {
            const message = {
              id: 1,
              method: 'Network.loadNetworkResource',
              params: {
                url: `${protocol.toLowerCase()}://10.0.2.2:${serverRef.port}`,
              },
            };
            await sendFromDebuggerToTarget(debugger_, device, 'page1', message);
            expect(device.wrappedEventParsed).toBeCalledWith({
              pageId: 'page1',
              wrappedEvent: message,
            });
          } finally {
            device.close();
            debugger_.close();
          }
        });
      });
    });
  },
);
