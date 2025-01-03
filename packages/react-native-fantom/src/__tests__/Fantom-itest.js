/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

import 'react-native/Libraries/Core/InitializeCore';

import type {Root} from '..';

import {createRoot, runTask} from '..';
import * as React from 'react';
import {Text, View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function getActualViewportDimensions(root: Root): {
  viewportWidth: number,
  viewportHeight: number,
} {
  let maybeNode;

  runTask(() => {
    root.render(
      <View
        style={{width: '100%', height: '100%'}}
        ref={node => {
          maybeNode = node;
        }}
      />,
    );
  });

  if (!(maybeNode instanceof ReactNativeElement)) {
    throw new Error(
      `Expected instance of ReactNativeElement but got ${String(maybeNode)}`,
    );
  }

  const rect = maybeNode.getBoundingClientRect();
  return {
    viewportWidth: rect.width,
    viewportHeight: rect.height,
  };
}

describe('Fantom', () => {
  describe('runTask', () => {
    it('should run a task synchronously', () => {
      const task = jest.fn();

      runTask(task);

      expect(task).toHaveBeenCalledTimes(1);
    });

    // TODO: fix error handling and make this pass
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('should re-throw errors from the task synchronously', () => {
      expect(() => {
        runTask(() => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });

    it('should exhaust the microtask queue synchronously', () => {
      const lastMicrotask = jest.fn();

      runTask(() => {
        queueMicrotask(() => {
          queueMicrotask(() => {
            queueMicrotask(() => {
              queueMicrotask(lastMicrotask);
            });
          });
        });
      });

      expect(lastMicrotask).toHaveBeenCalledTimes(1);
    });

    // TODO: fix error handling and make this pass
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('should re-throw errors from microtasks synchronously', () => {
      expect(() => {
        runTask(() => {
          queueMicrotask(() => {
            throw new Error('test error');
          });
        });
      }).toThrow('test error');
    });

    it('should run async tasks synchronously', () => {
      let completed = false;

      runTask(async () => {
        await Promise.resolve(6);
        completed = true;
      });

      expect(completed).toBe(true);
    });

    // TODO: when error handling is fixed, this should verify using `toThrow`
    it('should throw when running a task inside another task', () => {
      let threw = false;

      runTask(() => {
        // TODO replace with expect(() => { ... }).toThrow() when error handling is fixed
        try {
          runTask(() => {});
        } catch {
          threw = true;
        }
      });
      expect(threw).toBe(true);

      threw = false;

      runTask(() => {
        queueMicrotask(() => {
          try {
            runTask(() => {});
          } catch {
            threw = true;
          }
        });
      });
      expect(threw).toBe(true);
    });
  });

  describe('createRoot', () => {
    it('allows creating a root with specific dimensions', () => {
      const rootWithDefaults = createRoot();

      expect(getActualViewportDimensions(rootWithDefaults)).toEqual({
        viewportWidth: 1000,
        viewportHeight: 1000,
      });

      const rootWithCustomWidthAndHeight = createRoot({
        viewportWidth: 200,
        viewportHeight: 600,
      });

      expect(getActualViewportDimensions(rootWithCustomWidthAndHeight)).toEqual(
        {
          viewportWidth: 200,
          viewportHeight: 600,
        },
      );
    });
  });

  describe('getRenderedOutput', () => {
    describe('toJSX', () => {
      it('default config', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view height="100.000000" width="100.000000" />,
        );

        root.destroy();
      });

      it('default config, list of children', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <>
              <View
                key="first"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
              <View
                key="second"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
            </>,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <>
            <rn-view key="0" width="100.000000" height="100.000000" />
            <rn-view key="1" width="100.000000" height="100.000000" />
          </>,
        );

        root.destroy();
      });

      it('include root', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(root.getRenderedOutput({includeRoot: true}).toJSX()).toEqual(
          <rn-rootView>
            <rn-view width="100.000000" height="100.000000" />
          </rn-rootView>,
        );

        root.destroy();
      });

      it('include layout metrics', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
        ).toEqual(
          <rn-view
            height="100.000000"
            layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
            layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
            layoutMetrics-displayType="Flex"
            layoutMetrics-frame="{x:0,y:0,width:100,height:100}"
            layoutMetrics-layoutDirection="LeftToRight"
            layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
            layoutMetrics-pointScaleFactor="1"
            width="100.000000"
          />,
        );

        root.destroy();
      });

      it('take props', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['width'],
            })
            .toJSX(),
        ).toEqual(<rn-view width="100.000000" />);

        root.destroy();
      });

      it('skip props', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['!width'],
            })
            .toJSX(),
        ).toEqual(<rn-view height="100.000000" />);

        root.destroy();
      });

      it('filter out all props', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <>
              <View
                key="first"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
              <Text key="second">hello world!</Text>
              <View
                key="third"
                style={{width: 200, height: 300}}
                collapsable={false}
              />
            </>,
          );
        });

        expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
          <>
            <rn-view key="0" />
            <rn-paragraph key="1">hello world!</rn-paragraph>
            <rn-view key="2" />
          </>,
        );

        root.destroy();
      });
    });

    describe('toJSON', () => {
      it('nested text', () => {
        const root = createRoot();

        runTask(() => {
          root.render(
            <Text>
              Testing native{' '}
              <Text style={{color: 'red'}}>
                JSX is <Text style={{color: 'blue'}}>easy!</Text>
              </Text>
            </Text>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['foreground*']}).toJSON(),
        ).toEqual({
          children: [
            'Testing native ',
            {
              children: 'JSX is ',
              props: {
                foregroundColor: 'rgba(255, 0, 0, 255)',
              },
              type: 'Text',
            },
            {
              children: 'easy!',
              props: {
                foregroundColor: 'rgba(0, 0, 255, 255)',
              },
              type: 'Text',
            },
          ],
          props: {
            foregroundColor: 'rgba(255, 255, 255, 127)',
          },
          type: 'Paragraph',
        });

        root.destroy();
      });
    });
  });
});
