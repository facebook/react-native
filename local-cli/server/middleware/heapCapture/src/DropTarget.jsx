// @flow

import React from 'react';

type Props = {
  id: string,
  dropAction: (sourceId: string, thisId: string) => void,
  children?: any,
}

export default class DropTarget extends React.Component {
  props: Props;

  _handleDragOver = (e: SyntheticDragEvent) => {
    e.preventDefault();
  }

  _handleDrop = (e: SyntheticDragEvent) => {
    const sourceId = e.dataTransfer.getData('text');
    e.preventDefault();
    this.props.dropAction(sourceId, this.props.id);
  }

  render(): React.Element<*> {
    return React.cloneElement(
      React.Children.only(this.props.children),
      {
        onDragOver: this._handleDragOver,
        onDrop: this._handleDrop,
      }
    );
  }
}
