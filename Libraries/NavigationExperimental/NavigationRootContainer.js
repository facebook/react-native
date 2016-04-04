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
const NavigationPropTypes = require('NavigationPropTypes');
const NavigationStateUtils = require('NavigationStateUtils');
const Platform = require('Platform');
const React = require('React');

import type {
  NavigationAction,
  NavigationParentState,
  NavigationReducer,
  NavigationRenderer,
} from 'NavigationTypeDefinition';

export type BackAction = {
  type: 'BackAction',
};

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
  linkingActionMap: ?((uri: ?string) => NavigationAction),

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

type State = {
  navState: ?NavigationParentState,
};

function getBackAction(): BackAction {
  return { type: 'BackAction' };
}

const {PropTypes} = React;

class NavigationRootContainer extends React.Component<any, Props, State> {
  _handleOpenURLEvent: Function;

  props: Props;
  state: State;

  static propTypes = {
    initialAction: NavigationPropTypes.action.isRequired,
    linkingActionMap: PropTypes.func,
    persistenceKey: PropTypes.string,
    reducer: PropTypes.func.isRequired,
    renderNavigation: PropTypes.func.isRequired,
  };

  static defaultProps = {
    initialAction: { type: 'RootContainerInitialAction' },
  };

  static childContextTypes = {
    onNavigate: PropTypes.func,
  };

  constructor(props: Props) {
    super(props);

    let navState = null;
    if (!this.props.persistenceKey) {
      navState = NavigationStateUtils.getParent(
        this.props.reducer(null, props.initialAction)
      );
    }
    this.state = { navState };
  }

  componentWillMount(): void {
    this.handleNavigation = this.handleNavigation.bind(this);
    this._handleOpenURLEvent = this._handleOpenURLEvent.bind(this);
  }

  componentDidMount(): void {
    if (this.props.linkingActionMap) {
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

  componentWillUnmount(): void {
    if (Platform.OS === 'ios') {
      Linking.removeEventListener('url', this._handleOpenURLEvent);
    }
  }

  _handleOpenURLEvent(event: {url: string}): void {
    this._handleOpenURL(event.url);
  }

  _handleOpenURL(url: ?string): void {
    if (!this.props.linkingActionMap) {
      return;
    }
    const action = this.props.linkingActionMap(url);
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

NavigationRootContainer.getBackAction = getBackAction;

module.exports = NavigationRootContainer;
