/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationRootContainer
 * @flow
 */
'use strict';

const AsyncStorage = require('AsyncStorage');
const React = require('React');
const BackAndroid = require('BackAndroid');
const Platform = require('Platform');

import type {
  NavigationState,
  NavigationReducer
} from 'NavigationStateUtils';

export type NavigationRenderer = (
  navigationState: NavigationState,
  onNavigate: Function
) => ReactElement;

export type BackAction = {
  type: 'BackAction';
};

function getBackAction(): BackAction {
  return { type: 'BackAction' };
}

type Props = {
  renderNavigation: NavigationRenderer;
  reducer: NavigationReducer;
  persistenceKey: ?string;
};

class NavigationRootContainer extends React.Component {
  props: Props;
  constructor(props: Props) {
    super(props);
    this.handleNavigation = this.handleNavigation.bind(this);
    let navState = null;
    if (!this.props.persistenceKey) {
      navState = this.props.reducer(null, null);
    }
    this.state = { navState };
  }
  componentDidMount() {
    if (this.props.persistenceKey) {
      AsyncStorage.getItem(this.props.persistenceKey, (err, storedString) => {
        if (err || !storedString) {
          this.setState({
            navState: this.props.reducer(null, null),
          });
          return;
        }
        this.setState({
          navState: JSON.parse(storedString),
        });
      });
    }
  }
  getChildContext(): Object {
    return {
      onNavigate: this.handleNavigation,
    };
  }
  handleNavigation(action: Object): boolean {
    const navState = this.props.reducer(this.state.navState, action);
    if (navState === this.state.navState) {
      return false;
    }
    this.setState({
      navState,
    });
    if (this.props.persistenceKey) {
      AsyncStorage.setItem(this.props.persistenceKey, JSON.stringify(navState));
    }
    return true;
  }
  render(): ReactElement {
    const navigation = this.props.renderNavigation(
      this.state.navState,
      this.handleNavigation
    );
    return navigation;
  }
}

NavigationRootContainer.childContextTypes = {
  onNavigate: React.PropTypes.func,
};

NavigationRootContainer.getBackAction = getBackAction;

module.exports = NavigationRootContainer;
