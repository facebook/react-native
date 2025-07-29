/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<View>', () => {
  describe('width and height style', () => {
    it('handles correct percentage-based dimensions', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <View style={{width: 100, height: 100}}>
            <View style={{width: '20%', height: '50%'}} collapsable={false} />
          </View>,
        );
      });

      expect(
        root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
      ).toEqual(
        <rn-view
          layoutMetrics-frame="{x:0,y:0,width:20,height:50}"
          height="50.000000%"
          layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-displayType="Flex"
          layoutMetrics-layoutDirection="LeftToRight"
          layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
          layoutMetrics-pointScaleFactor="3"
          width="20.000000%"
        />,
      );
    });

    it('handles numeric values passed in as strings', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <View style={{width: '5', height: '10'}} collapsable={false} />,
        );
      });

      expect(
        root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
      ).toEqual(
        <rn-view
          layoutMetrics-frame="{x:0,y:0,width:5,height:10}"
          height="10.000000"
          layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-displayType="Flex"
          layoutMetrics-layoutDirection="LeftToRight"
          layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
          layoutMetrics-pointScaleFactor="3"
          width="5.000000"
        />,
      );
    });

    it('handles invalid values, falling back to default', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <View style={{width: 100, height: 100}}>
            <View
              // 5pt is a valid CSS value but RN can't parse it.
              style={{width: '5pt', height: 'error 50%'}}
              collapsable={false}
            />
          </View>,
        );
      });

      expect(
        root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
      ).toEqual(
        <rn-view
          layoutMetrics-frame="{x:0,y:0,width:100,height:0}"
          height="undefined"
          layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-displayType="Flex"
          layoutMetrics-layoutDirection="LeftToRight"
          layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
          layoutMetrics-pointScaleFactor="3"
          width="undefined"
        />,
      );
    });
  });

  describe('margin style', () => {
    it('handles correct percentage-based values', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <View style={{width: 100, height: 200}}>
            <View
              style={{width: 5, height: 10, margin: '50%'}}
              collapsable={false}
            />
          </View>,
        );
      });

      expect(
        root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
      ).toEqual(
        <rn-view
          layoutMetrics-frame="{x:50,y:50,width:5,height:10}"
          height="10.000000"
          layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-displayType="Flex"
          layoutMetrics-layoutDirection="LeftToRight"
          layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
          layoutMetrics-pointScaleFactor="3"
          margin="50.000000%"
          width="5.000000"
        />,
      );
    });

    it('handles numeric values passed in as strings', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <View style={{width: 100, height: 200}}>
            <View
              style={{width: 5, height: 10, margin: '5'}}
              collapsable={false}
            />
          </View>,
        );
      });

      expect(
        root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
      ).toEqual(
        <rn-view
          layoutMetrics-frame="{x:5,y:5,width:5,height:10}"
          height="10.000000"
          layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-displayType="Flex"
          layoutMetrics-layoutDirection="LeftToRight"
          layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
          layoutMetrics-pointScaleFactor="3"
          margin="5.000000"
          width="5.000000"
        />,
      );
    });
  });

  describe('transform style', () => {
    it('causes view to be unflattened', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<View style={{transform: [{translateX: 10}]}} />);
      });

      expect(root.getRenderedOutput({props: ['transform']}).toJSX()).toEqual(
        <rn-view transform='[{"translateX": 10.000000}]' />,
      );
    });

    [
      [undefined, {x: -5, y: 0, width: 20, height: 10}],
      ['50% 50%', {x: -5, y: 0, width: 20, height: 10}],
      ['top left', {x: 0, y: 0, width: 20, height: 10}],
      ['right bottom', {x: -10, y: 0, width: 20, height: 10}],
    ].forEach(([transformOrigin, expectedBounds]) => {
      it(`applies transformOrigin correctly for ${String(transformOrigin)}`, () => {
        const root = Fantom.createRoot();

        const viewRef = createRef<HostInstance>();
        Fantom.runTask(() => {
          root.render(
            <View
              ref={viewRef}
              style={{
                width: 10,
                height: 10,
                transform: [{scaleX: 2}],
                transformOrigin,
              }}
            />,
          );
        });

        const viewElement = ensureInstance(viewRef.current, ReactNativeElement);

        const viewBounds = viewElement.getBoundingClientRect();
        expect(viewBounds.x).toBe(expectedBounds.x);
        expect(viewBounds.y).toBe(expectedBounds.y);
        expect(viewBounds.width).toBe(expectedBounds.width);
        expect(viewBounds.height).toBe(expectedBounds.height);
      });
    });
  });

  describe('props', () => {
    describe('pointerEvents', () => {
      it('auto does not propagate to the mounting layer, it is the default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View collapsable={false} pointerEvents="auto" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view />);
      });
      it('box-none propagates to the mounting layer, does not unflatten', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View collapsable={false} pointerEvents="box-none" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view pointerEvents="box-none" />);

        Fantom.runTask(() => {
          root.render(<View pointerEvents="box-none" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(null);
      });
      it('box-only propagates to the mounting layer, does not unflatten', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View collapsable={false} pointerEvents="box-only" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view pointerEvents="box-only" />);

        Fantom.runTask(() => {
          root.render(<View pointerEvents="box-only" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(null);
      });
      it('none propagates to the mounting layer, unflattens', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View pointerEvents="none" />);
        });

        expect(
          root.getRenderedOutput({props: ['pointerEvents']}).toJSX(),
        ).toEqual(<rn-view pointerEvents="none" />);
      });
    });
    describe('accessibility', () => {
      describe('accessibilityActions', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View
                accessibilityActions={[
                  {name: 'activate'},
                  {name: 'increment', label: 'random label'},
                ]}
                accessible={true}
              />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityActions']}).toJSX(),
          ).toEqual(
            <rn-view accessibilityActions="[activate, increment: 'random label']" />,
          );
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View
                accessibilityActions={[
                  {name: 'activate'},
                  {name: 'increment', label: 'random label'},
                ]}
              />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityElementsHidden', () => {
        it('is not propagated to mounting layer, it is iOS only prop', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityElementsHidden={true} />);
          });

          expect(
            root
              .getRenderedOutput({props: ['accessibilityElementsHidden']})
              .toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityHint', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityHint={'exit'} accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityHint']}).toJSX(),
          ).toEqual(<rn-view accessibilityHint="exit" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityHint={'exit'} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityHint']}).toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityLabel', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View accessibilityLabel={'custom label'} accessible={true} />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-view accessibilityLabel="custom label" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityLabel={'custom label'} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityLiveRegion', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View accessibilityLiveRegion={'polite'} accessible={true} />,
            );
          });

          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(<rn-view accessibilityLiveRegion="polite" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityLiveRegion={'polite'} />);
          });

          expect(
            root
              .getRenderedOutput({props: ['accessibilityLiveRegion']})
              .toJSX(),
          ).toEqual(null);
        });
      });

      describe('accessibilityRole', () => {
        it('is propagated to the mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <View accessibilityRole={'button'} accessible={true} />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
          ).toEqual(<rn-view accessibilityRole="button" />);
        });

        it('does not unflatten view', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<View accessibilityRole={'button'} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
          ).toEqual(null);
        });
      });
    });

    describe('accessible', () => {
      it('unflattens view', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<View />);
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          null,
        );

        Fantom.runTask(() => {
          root.render(<View accessible={true} />);
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          <rn-view accessible="true" />,
        );
      });
    });
  });
});
