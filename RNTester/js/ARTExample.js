/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ARTExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  ART,
  Platform,
  View,
} = ReactNative;

const {
  Surface,
  Path,
  Group,
  Transform,
  Shape,
} = ART;


var scale = Platform.isTVOS ? 4 : 1;

class ARTExample extends React.Component{
    render(){
        const pathRect = new Path()
            .moveTo(scale * 0,scale * 0)
            .lineTo(scale * 0,scale * 110)
            .lineTo(scale * 110,scale * 110)
            .lineTo(scale * 110,scale * 0)
            .close();

        const pathCircle0 = new Path()
            .moveTo(scale * 30,scale * 5)
            .arc(scale * 0,scale * 50,scale * 25)
            .arc(scale * 0,-scale * 50,scale * 25)
            .close();

        const pathCircle1 = new Path()
            .moveTo(scale * 30,scale * 55)
            .arc(scale * 0,scale * 50,scale * 25)
            .arc(scale * 0,-scale * 50,scale * 25)
            .close();

        const pathCircle2 = new Path()
            .moveTo(scale * 55,scale * 30)
            .arc(scale * 50,scale * 0,scale * 25)
            .arc(-scale * 50,scale * 0,scale * 25)
            .close();

        const pathCircle3 = new Path()
            .moveTo(scale * 55,scale * 80)
            .arc(scale * 50,scale * 0,scale * 25)
            .arc(-scale * 50,scale * 0,scale * 25)
            .close();

        return (
            <View>
                <Surface width={scale * 200} height={scale * 200}>
                    <Group>
                        <Shape d={pathRect} stroke="#000080" fill="#000080" strokeWidth={scale}/>
                        <Shape d={pathCircle0} stroke="#FF0000" fill="#FF0000" strokeWidth={scale}/>
                        <Shape d={pathCircle1} stroke="#00FF00" fill="#00FF00" strokeWidth={scale}/>
                        <Shape d={pathCircle2} stroke="#00FFFF" fill="#00FFFF" strokeWidth={scale}/>
                        <Shape d={pathCircle3} stroke="#FFFFFF" fill="#FFFFFF" strokeWidth={scale}/>
                    </Group>
                </Surface>
            </View>
        );
    }
}

exports.title = '<ART>';
exports.displayName = 'ARTExample';
exports.description = 'ART input for numeric values';
exports.examples = [
  {
    title: 'ART Example',
    render(): React.Element<any> {
      return <ARTExample />;
    }
  },
];
