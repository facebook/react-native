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

import '../../../Core/InitializeCore.js';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';

const View = require('../View');

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

    root.destroy();
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

    root.destroy();
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

    root.destroy();
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

    root.destroy();
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

    root.destroy();
  });
});
