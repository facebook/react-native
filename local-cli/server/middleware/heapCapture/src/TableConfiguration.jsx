// @flow

import React from 'react';

import Aggrow from './Aggrow';
import ExpanderConfiguration from './ExpanderConfiguration';
import StackExpanderCreator from './StackExpanderCreator';

type State = {
  expanded: boolean;
}

type Props = {
  aggrow: Aggrow,
  onUpdate: () => void,
}

export default class TableConfiguration extends React.Component {
  props: Props;

  state: State = {
    expanded: false,
  }

  _handleUpdate = () => {
    this.props.onUpdate();
  }

  _toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  renderExpander(id: number): React.Element<*> {
    return (<ExpanderConfiguration expander={this.props.aggrow.expander} id={id} />);
  }

  render(): React.Element<*> {
    const expanderText = this.state.expanded ? '>>' : '<<';
    const expander = this.props.aggrow.expander;
    let config = [];
    if (this.state.expanded) {
      config = expander.getExpanders().map(
        (ex: number): React.Element<*> => this.renderExpander(ex));
    }
    return (
      <div
        style={{
          width: this.state.expanded ? '512px' : '26px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '2px solid black',
        }}>
        <div  // eslint-disable-line jsx-a11y/no-static-element-interactions
          onClick={this._toggleExpanded}
          style={{
            width: '100%',
            height: '26px',
            border: '1px solid darkGray',
          }}>
          { expanderText }
        </div>
        <div
          style={{
            width: '100%',
            height: '26px',
            flexGrow: '1',
            display: 'flex',
            flexDirection: 'column',
          }}>
          { config }
        </div>
        <div
          style={{
            width: '100%',
            height: '256px',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid darkGray',
          }}>
          <StackExpanderCreator aggrow={this.props.aggrow} onCreate={this._handleUpdate} />
        </div>
      </div>
    );
  }
}
