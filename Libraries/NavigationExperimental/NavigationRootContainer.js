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
const Linking = require('Linking');
const Platform = require('Platform');
const React = require('React');
const NavigationPropTypes = require('NavigationPropTypes');

import type {
  NavigationAction,
  NavigationReducer,
  NavigationRenderer,
} from 'NavigationTypeDefinition';

export type BackAction = {
  type: 'BackAction',
};

function getBackAction(): BackAction {
  return { type: 'BackAction' };
}

type Props = {
  /*
   * The default action to be passed into the reducer when getting the first
   * state. Defaults to {type: 'RootContainerInitialAction'}
   */
  initialAction: NavigationAction,

  /*
   * Provide linkingActionMap to instruct the container to subscribe to linking
   * events, and use this mapper to convert URIs into actions that your app can
   * handle
   */
  linkingActionMap: ?((uri: string) => NavigationAction),

  /*
   * Provide this key, and the container will store the navigation state in
   * AsyncStorage through refreshes, with the provided key
   */
  persistenceKey: ?string,


  /*
   * A function that will output the latest navigation state as a function of
   * the (optional) previous state, and an action
   */
  reducer: NavigationReducer,


  /*
   * Set up the rendering of the app for a given navigation state
   */
  renderNavigation: NavigationRenderer,
};

const {PropTypes} = React;

const propTypes = {
  initialAction: NavigationPropTypes.action.isRequired,
  linkingActionMap: PropTypes.func,
  persistenceKey: PropTypes.string,
  reducer: PropTypes.func.isRequired,
  renderNavigation: PropTypes.func.isRequired,
};

const defaultProps = {
  initialAction: {
    type: 'RootContainerInitialAction',
  },
};

class NavigationRootContainer extends React.Component {
  _handleOpenURLEvent: Function;

  props: Props;

  constructor(props: Props) {
    super(props);
    this.handleNavigation = this.handleNavigation.bind(this);
    this._handleOpenURLEvent = this._handleOpenURLEvent.bind(this);
    let navState = null;
    if (!this.props.persistenceKey) {
      navState = this.props.reducer(null, props.initialAction);
    }
    this.state = { navState };
  }

  componentDidMount() {
    if (this.props.LinkingActionMap) {
      Linking.getInitialURL().then(this._handleOpenURL.bind(this));
      Platform.OS === 'ios' && Linking.addEventListener('url', this._handleOpenURLEvent);
    }
    if (this.props.persistenceKey) {
      AsyncStorage.getItem(this.props.persistenceKey, (err, storedString) => {
        if (err || !storedString) {
          this.setState({
            navState: this.props.reducer(null, this.props.initialAction),
          });
          return;
        }
        this.setState({
          navState: JSON.parse(storedString),
        });
      });
    }
  }

  componentWillUnmount() {
    Platform.OS === 'ios' && Linking.removeEventListener('url', this._handleOpenURLEvent);
  }

  _handleOpenURLEvent(event: {url: string}) {
    this._handleOpenURL(event.url);
  }

  _handleOpenURL(url: ?string) {
    if (!this.props.LinkingActionMap) {
      return;
    }
    const action = this.props.LinkingActionMap(url);
    if (action) {
      this.handleNavigation(action);
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
  onNavigate: PropTypes.func,
};

NavigationRootContainer.propTypes = propTypes;
NavigationRootContainer.defaultProps = defaultProps;
NavigationRootContainer.getBackAction = getBackAction;

module.exports = NavigationRootContainer;
