/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('react');

import type {Category} from './Data/YellowBoxCategory';
import type {Registry, Subscription} from './Data/YellowBoxRegistry';

type Props = $ReadOnly<{||}>;
type State = $ReadOnly<{|
  registry: ?Registry,
|}>;

const YellowBoxList = require('./UI/YellowBoxList');
const YellowBoxRegistry = require('./Data/YellowBoxRegistry');

class YellowBoxContainer extends React.Component<Props, State> {
  _subscription: ?Subscription;

  state: State = {
    registry: null,
  };

  render(): React.Node {
    // TODO: Ignore warnings that fire when rendering `YellowBox` itself.
    return this.state.registry == null ? null : (
      <YellowBoxList
        onDismiss={this._handleDismiss}
        onDismissAll={this._handleDismissAll}
        registry={this.state.registry}
      />
    );
  }

  componentDidMount(): void {
    this._subscription = YellowBoxRegistry.observe(registry => {
      this.setState({registry});
    });
  }

  componentWillUnmount(): void {
    if (this._subscription != null) {
      this._subscription.unsubscribe();
    }
  }

  _handleDismiss = (category: Category): void => {
    YellowBoxRegistry.delete(category);
  };

  _handleDismissAll(): void {
    YellowBoxRegistry.clear();
  }
}

export default YellowBoxContainer;
