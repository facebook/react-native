/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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
  Text,
  Transform,
  Shape,
} = ART;


var scale = Platform.isTVOS ? 4 : 1;

class ARTExample extends React.Component{
    render(){
        const pathRect = new Path()
            .moveTo(scale*1,scale*1)
            .lineTo(scale*1,scale*99)
            .lineTo(scale*99,scale*99)
            .lineTo(scale*99,scale*1)
            .close();

        const pathCircle = new Path()
            .moveTo(scale*50,scale*1)
            .arc(scale*0,scale*99,scale*25)
            .arc(scale*0,-scale*99,scale*25)
            .close();

        const pathText = new Path()
            .moveTo(scale*75,scale*200)
            .lineTo(scale*75,scale*200);

        return(
            <View>
                <Surface width={scale*150} height={scale*200}>
                    <Group>
                        <Shape d={pathRect} stroke="#000080" fill="#000080" strokeWidth={scale*1}/>
                        <Shape d={pathCircle} stroke="#FFFFFF" fill="#FFFFFF" strokeWidth={scale*1}/>
                        <Text strokeWidth={scale*1} stroke="#080" fill="#080" font={"" + scale*30 + "px Helvetica"} path={pathText} >RN Art</Text>
                    </Group>
                </Surface>
            </View>
        )
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
