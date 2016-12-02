// @flow

import React from 'react';

type Props = {
  id: string,
  children?: any,
}

export default class Draggable extends React.Component {
  props: Props;

  _handleDragStart = (e: SyntheticDragEvent) => {
    e.dataTransfer.setData('text', this.props.id);
  }

  render(): React.Element<*> {
    return React.cloneElement(
      React.Children.only(this.props.children),
      {
        draggable: 'true',
        onDragStart: this._handleDragStart,
      }
    );
  }
}
