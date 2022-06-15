/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const React = require('react');
import {AsyncStorage} from 'react-native';

export type PassProps<State> = {
  state: State,
  setState: (stateLamda: (state: State) => State) => void,
  ...
};

/**
 * A simple container for persisting some state and passing it into the wrapped component as
 * `props.persister.state`. Update it with `props.persister.setState`. The component is initially
 * rendered using `getInitialState` in the spec and is then re-rendered with the persisted data
 * once it's fetched.
 *
 * This is currently tied to RNTester because it's generally not good to use AsyncStorage like
 * this in real apps with user data, but we could maybe pull it out for other internal settings-type
 * usage.
 */
function createContainer<Props: Object, State>(
  Component: React.ComponentType<Props & {persister: PassProps<State>, ...}>,
  spec: {
    cacheKeySuffix: (props: Props) => string,
    getInitialState: (props: Props) => State,
    version?: string,
    ...
  },
): React.ComponentType<Props> {
  return class ComponentWithPersistedState extends React.Component<
    Props,
    $FlowFixMeState,
  > {
    static displayName = `RNTesterStatePersister(${String(
      Component.displayName ?? Component.name,
    )})`;
    state = {value: spec.getInitialState(this.props)};
    _cacheKey = `RNTester:${spec.version || 'v1'}:${spec.cacheKeySuffix(
      this.props,
    )}`;
    componentDidMount() {
      AsyncStorage.getItem(this._cacheKey, (err, value) => {
        if (!err && value) {
          this.setState({value: JSON.parse(value)});
        }
      });
    }
    _passSetState = (stateLamda: (state: State) => State): void => {
      this.setState(state => {
        const value = stateLamda(state.value);
        // $FlowFixMe[incompatible-call]
        AsyncStorage.setItem(this._cacheKey, JSON.stringify(value));
        return {value};
      });
    };
    render(): React.Node {
      return (
        <Component
          {...this.props}
          persister={{
            state: this.state.value,
            setState: this._passSetState,
          }}
        />
      );
    }
  };
}

const RNTesterStatePersister = {
  createContainer,
};

module.exports = RNTesterStatePersister;
