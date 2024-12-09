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

import 'react-native/Libraries/Core/InitializeCore';
import {createRoot, runTask} from '..';
import * as React from 'react';
import {Text, View} from 'react-native';

describe('Fantom', () => {
  describe('runTask', () => {
    it('should run a task synchronously', () => {
      const task = jest.fn();

      runTask(task);

      expect(task).toHaveBeenCalledTimes(1);
    });

    // TODO: fix error handling and make this pass
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
              <View style={{width: 100, height: 100}} collapsable={false} />
              <View style={{width: 100, height: 100}} collapsable={false} />
            </>,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <>
            <rn-view width="100.000000" height="100.000000" />
            <rn-view width="100.000000" height="100.000000" />
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
              <View style={{width: 100, height: 100}} collapsable={false} />
              <Text>hello world!</Text>
              <View style={{width: 200, height: 300}} collapsable={false} />
            </>,
          );
        });

        expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
          <>
            <rn-view />
            <rn-paragraph>hello world!</rn-paragraph>
            <rn-view />
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
