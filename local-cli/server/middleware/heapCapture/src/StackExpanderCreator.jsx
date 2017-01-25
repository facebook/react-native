// @flow
/* eslint-disable jsx-a11y/label-has-for */

import invariant from 'invariant';
import React from 'react';

import Aggrow from './Aggrow';
import { AggrowStackColumn } from './AggrowData';
import type { AggrowColumn } from './AggrowData';
import type { FocusConfig } from './Aggrow';

type Props = {
  aggrow: Aggrow,
  onCreate: (expanderId: number) => void,
}

type State = {
  column: string,
  pattern: string,
  reverse: boolean,
  leftSide: boolean,
  firstMatch: boolean,
}

export default class StackExpanderCreator extends React.Component {
  constructor(props: Props) {
    super(props);
    const data = this.props.aggrow.data;
    const firstColumn = data.columns.find(isStackColumn);
    this.state = {
      column: firstColumn ? firstColumn.name : '',
      pattern: '',
      reverse: false,
      leftSide: false,
      firstMatch: true,
    };
  }
  props: Props;

  state: State;

  _handleColumnSelected = (e: SyntheticEvent) => {
    invariant(e.target instanceof HTMLSelectElement, 'Expected select element');
    this.setState({ column: e.target.value });
  }

  _handlePatternSelected = (e: SyntheticEvent) => {
    invariant(e.target instanceof HTMLInputElement, 'Expected input element');
    this.setState({ pattern: e.target.value });
  }

  _handleReverseSelected = (e: SyntheticEvent) => {
    invariant(e.target instanceof HTMLInputElement, 'Expected input element');
    this.setState({ reverse: e.target.checked });
  }

  _handleFirstMatchSelected = (e: SyntheticEvent) => {
    invariant(e.target instanceof HTMLInputElement, 'Expected input element');
    this.setState({ firstMatch: e.target.checked });
  }

  _handleLeftSideSelected = (e: SyntheticEvent) => {
    invariant(e.target instanceof HTMLInputElement, 'Expected input element');
    this.setState({ leftSide: e.target.checked });
  }

  _handleCreateClicked = () => {
    let focus: FocusConfig;
    let expanderName = this.state.column;
    if (this.state.pattern !== '') {
      focus = {
        pattern: new RegExp(this.state.pattern),
        firstMatch: this.state.firstMatch,
        leftSide: this.state.leftSide,
      };
      expanderName += this.state.reverse ? ' reversed' : '';
      expanderName += this.state.leftSide ? ' before' : ' after';
      expanderName += this.state.firstMatch ? ' first ' : ' last ';
      expanderName += this.state.pattern;
    }

    this.props.onCreate(
      this.props.aggrow.addStackExpander(
        expanderName,
        this.state.column,
        this.state.reverse,
        focus,
      ));
  }

  render(): React.Element<*> {
    const data = this.props.aggrow.data;
    const stackColumns = data.columns.filter(isStackColumn);
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <select
          key="columnselect"
          onChange={this._handleColumnSelected}
          value={this.state.column}>
          {stackColumns.map((c: AggrowColumn): React.Element<*> =>
            <option key={c.name} value={c.name}>{c.name}</option>
          )}
        </select>
        <input
          key="pattern"
          onChange={this._handlePatternSelected}
          type="text"
          value={this.state.pattern}
        />
        <label key="reverse">
          <input
            checked={this.state.reverse}
            onChange={this._handleReverseSelected}
            type="checkbox"
          />
          Reverse
        </label>
        <label key="firstmatch">
          <input
            checked={this.state.firstMatch}
            onChange={this._handleFirstMatchSelected}
            type="checkbox"
          />
          First Match
        </label>
        <label key="leftside">
          <input
            checked={this.state.leftSide}
            onChange={this._handleLeftSideSelected}
            type="checkbox"
          />
          Left of Match
        </label>
        <button
          key="create"
          onClick={this._handleCreateClicked}>
          Create
        </button>
      </div>
    );
  }
}

function isStackColumn(c: AggrowColumn): boolean {
  return c instanceof AggrowStackColumn;
}
