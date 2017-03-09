// @flow

import invariant from 'invariant';
import React from 'react';

import AggrowData from './AggrowData';
import type { AggrowColumn } from './AggrowData';

type Props = {
  aggrow: AggrowData,
  filter: (column: AggrowColumn) => boolean,
  onSelect: (columnName: string) => void,
  selected?: string,
}

export default class DataColumnSelector extends React.Component {
  static defaultProps = {
    filter: (): boolean => true,
  };

  props: Props;

  _handleChange = (e: SyntheticEvent) => {
    invariant(e.target instanceof HTMLSelectElement, 'Expected element');
    const changed = Number.parseInt(e.target.value, 10);
    this.props.onSelect(this.props.aggrow.columns[changed].name);
  }

  render(): React.Element<*> {
    const columns = this.props.aggrow.columns.filter(this.props.filter);
    const selected = columns.findIndex(
      (c: AggrowColumn): boolean => c.name === this.props.selected);
    return (
      <select
        onChange={this._handleChange}
        value={selected.toString()}>
        {columns.map((c: AggrowColumn, i: number): React.Element<*> =>
          <option key={`${c.name}-${i}`} value={i.toString()}>{c.name}</option>)}
      </select>
    );
  }
}
