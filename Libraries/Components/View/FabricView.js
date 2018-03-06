/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule FabricView
 * @flow
 * @format
 */
'use strict';

/**
 * This is a temporary fork of View.js for Fabric purpose.
 * Do not use outside of Fabric tree.
 */

const Platform = require('Platform');
const React = require('React');
const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const ViewPropTypes = require('ViewPropTypes');
const {NativeMethodsMixin} = require('ReactFabricInternals');
const {ViewContextTypes} = require('ViewContext');

const createReactClass = require('create-react-class');
const invariant = require('fbjs/lib/invariant');
const requireFabricComponent = require('requireFabricComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {ViewChildContext} from 'ViewContext';

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI.
 *
 * See http://facebook.github.io/react-native/docs/view.html
 */
const View = createReactClass({
  displayName: 'View',
  // TODO: We should probably expose the mixins, viewConfig, and statics publicly. For example,
  // one of the props is of type AccessibilityComponentType. That is defined as a const[] above,
  // but it is not rendered by the docs, since `statics` below is not rendered. So its Possible
  // values had to be hardcoded.
  mixins: [NativeMethodsMixin],

  // `propTypes` should not be accessed directly on View since this wrapper only
  // exists for DEV mode. However it's important for them to be declared.
  // If the object passed to `createClass` specifies `propTypes`, Flow will
  // create a static type from it.
  propTypes: ViewPropTypes,

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  viewConfig: {
    uiViewClassName: 'RCTView',
    validAttributes: ReactNativeViewAttributes.RCTView,
  },

  childContextTypes: ViewContextTypes,

  getChildContext(): ViewChildContext {
    return {
      isInAParentText: false,
    };
  },

  render() {
    invariant(
      !(this.context.isInAParentText && Platform.OS === 'android'),
      'Nesting of <View> within <Text> is not supported on Android.',
    );

    // WARNING: This method will not be used in production mode as in that mode we
    // replace wrapper component View with generated native wrapper RCTView. Avoid
    // adding functionality this component that you'd want to be available in both
    // dev and prod modes.
    return <RCTView {...this.props} />;
  },
});

const RCTView = requireFabricComponent('RCTView', View, {
  nativeOnly: {
    nativeBackgroundAndroid: true,
    nativeForegroundAndroid: true,
  },
  fabric: true,
});

if (__DEV__) {
  const UIManager = require('UIManager');
  const viewConfig =
    (UIManager.viewConfigs && UIManager.viewConfigs.RCTView) || {};
  for (const prop in viewConfig.nativeProps) {
    const viewAny: any = View; // Appease flow
    if (!viewAny.propTypes[prop] && !ReactNativeStyleAttributes[prop]) {
      throw new Error(
        'View is missing propType for native prop `' + prop + '`',
      );
    }
  }
}

let ViewToExport = RCTView;
if (__DEV__) {
  ViewToExport = View;
}

// No one should depend on the DEV-mode createClass View wrapper.
module.exports = ((ViewToExport: any): typeof RCTView);
