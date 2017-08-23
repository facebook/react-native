/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AnimatedValueXY
 * @flow
 * @format
 */
'use strict';

const AnimatedValue = require('./AnimatedValue');
const AnimatedWithChildren = require('./AnimatedWithChildren');

const invariant = require('fbjs/lib/invariant');

type ValueXYListenerCallback = (value: {x: number, y: number}) => void;

let _uniqueId = 1;

/**
 * 2D Value for driving 2D animations, such as pan gestures.  Almost identical
 * API to normal `Animated.Value`, but multiplexed.  Contains two regular
 * `Animated.Value`s under the hood.
 *
 * #### Example
 *
 *```javascript
 *  class DraggableView extends React.Component {
 *    constructor(props) {
 *      super(props);
 *      this.state = {
 *        pan: new Animated.ValueXY(), // inits to zero
 *      };
 *      this.state.panResponder = PanResponder.create({
 *        onStartShouldSetPanResponder: () => true,
 *        onPanResponderMove: Animated.event([null, {
 *          dx: this.state.pan.x, // x,y are Animated.Value
 *          dy: this.state.pan.y,
 *        }]),
 *        onPanResponderRelease: () => {
 *          Animated.spring(
 *            this.state.pan,         // Auto-multiplexed
 *            {toValue: {x: 0, y: 0}} // Back to zero
 *          ).start();
 *        },
 *      });
 *    }
 *    render() {
 *      return (
 *        <Animated.View
 *          {...this.state.panResponder.panHandlers}
 *          style={this.state.pan.getLayout()}>
 *          {this.props.children}
 *        </Animated.View>
 *      );
 *    }
 *  }
 *```
 */
class AnimatedValueXY extends AnimatedWithChildren {
  x: AnimatedValue;
  y: AnimatedValue;
  _listeners: {[key: string]: {x: string, y: string}};

  constructor(
    valueIn?: ?{x: number | AnimatedValue, y: number | AnimatedValue},
  ) {
    super();
    const value: any = valueIn || {x: 0, y: 0}; // @flowfixme: shouldn't need `: any`
    if (typeof value.x === 'number' && typeof value.y === 'number') {
      this.x = new AnimatedValue(value.x);
      this.y = new AnimatedValue(value.y);
    } else {
      invariant(
        value.x instanceof AnimatedValue && value.y instanceof AnimatedValue,
        'AnimatedValueXY must be initalized with an object of numbers or ' +
          'AnimatedValues.',
      );
      this.x = value.x;
      this.y = value.y;
    }
    this._listeners = {};
  }

  setValue(value: {x: number, y: number}) {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }

  setOffset(offset: {x: number, y: number}) {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }

  flattenOffset(): void {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }

  extractOffset(): void {
    this.x.extractOffset();
    this.y.extractOffset();
  }

  __getValue(): {x: number, y: number} {
    return {
      x: this.x.__getValue(),
      y: this.y.__getValue(),
    };
  }

  resetAnimation(callback?: (value: {x: number, y: number}) => void): void {
    this.x.resetAnimation();
    this.y.resetAnimation();
    callback && callback(this.__getValue());
  }

  stopAnimation(callback?: (value: {x: number, y: number}) => void): void {
    this.x.stopAnimation();
    this.y.stopAnimation();
    callback && callback(this.__getValue());
  }

  addListener(callback: ValueXYListenerCallback): string {
    const id = String(_uniqueId++);
    const jointCallback = ({value: number}) => {
      callback(this.__getValue());
    };
    this._listeners[id] = {
      x: this.x.addListener(jointCallback),
      y: this.y.addListener(jointCallback),
    };
    return id;
  }

  removeListener(id: string): void {
    this.x.removeListener(this._listeners[id].x);
    this.y.removeListener(this._listeners[id].y);
    delete this._listeners[id];
  }

  removeAllListeners(): void {
    this.x.removeAllListeners();
    this.y.removeAllListeners();
    this._listeners = {};
  }

  /**
   * Converts `{x, y}` into `{left, top}` for use in style, e.g.
   *
   *```javascript
   *  style={this.state.anim.getLayout()}
   *```
   */
  getLayout(): {[key: string]: AnimatedValue} {
    return {
      left: this.x,
      top: this.y,
    };
  }

  /**
   * Converts `{x, y}` into a useable translation transform, e.g.
   *
   *```javascript
   *  style={{
   *    transform: this.state.anim.getTranslateTransform()
   *  }}
   *```
   */
  getTranslateTransform(): Array<{[key: string]: AnimatedValue}> {
    return [{translateX: this.x}, {translateY: this.y}];
  }
}

module.exports = AnimatedValueXY;
