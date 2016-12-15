// @flow

import invariant from 'invariant';
import React from 'react';

import Aggrow from './Aggrow';
import type { Row } from './AggrowExpander';
import TableConfiguration from './TableConfiguration';
import TableHeader from './TableHeader';

const rowHeight = 20;
const treeIndent = 16;

type Props = {
  aggrow: Aggrow,
  enableConfigurationPane: boolean,
  onSelectionChange?: (row: Row) => void,
}

type State = {
  aggrow: Aggrow,
  viewport: {
    top: number,
    height: number,
  },
  cursor: number,
  searchValue: string,
}

export default class AggrowTable extends React.Component {
  static defaultProps = {
    enableConfigurationPane: true,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      aggrow: props.aggrow,
      viewport: { top: 0, height: 100 },
      cursor: 0,
      searchValue: '',
    };
  }

  props: Props;

  state: State;

  componentDidMount() {
    document.body.addEventListener('keydown', this.keydown);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.aggrow !== nextProps.aggrow) {
      this.setState({
        aggrow: nextProps.aggrow,
        viewport: { top: 0, height: 100 },
        cursor: 0,
      });
    }
  }

  componentWillUnmount() {
    document.body.removeEventListener('keydown', this.keydown);
  }

  scroll = (e: SyntheticUIEvent) => {
    const viewport = e.target;
    invariant(viewport instanceof HTMLElement, 'Expected an HTML element');
    const top = Math.floor((viewport.scrollTop - (viewport.clientHeight * 1.0)) / rowHeight);
    const height = Math.ceil(viewport.clientHeight * 3.0 / rowHeight);
    if (top !== this.state.viewport.top || height !== this.state.viewport.height) {
      this.setState({ viewport: { top, height } });
    }
  }

  _updateCursor(position: number) {
    this.setState({ cursor: position });
    const onSelectionChange = this.props.onSelectionChange;
    if (onSelectionChange) {
      const row = this.state.aggrow.expander.getRows(position, 1)[0];
      invariant(row, 'Expected a row');
      onSelectionChange(row);
    }
  }

  _contractRow(row: Row) {
    let newCursor = this.state.cursor;
    if (newCursor > row.top && newCursor < row.top + row.height) { // in contracted section
      newCursor = row.top;
    } else if (newCursor >= row.top + row.height) { // below contracted section
      newCursor -= row.height - 1;
    }
    this.state.aggrow.expander.contract(row);
    this._updateCursor(newCursor);
  }

  _expandRow(row: Row) {
    let newCursor = this.state.cursor;
    this.state.aggrow.expander.expand(row);
    if (newCursor > row.top) {  // below expanded section
      newCursor += row.height - 1;
    }
    this._updateCursor(newCursor);
  }

  _scrollDiv: ?HTMLDivElement = null;

  _setScrollDiv = (div: ?HTMLDivElement) => {
    this._scrollDiv = div;
  }

  _keepCursorInViewport() {
    if (this._scrollDiv) {
      const cursor = this.state.cursor;
      const scrollDiv = this._scrollDiv;
      if (cursor * rowHeight < scrollDiv.scrollTop + (scrollDiv.clientHeight * 0.1)) {
        scrollDiv.scrollTop = (cursor * rowHeight) - (scrollDiv.clientHeight * 0.1);
      } else if ((cursor + 1) * rowHeight > scrollDiv.scrollTop + (scrollDiv.clientHeight * 0.9)) {
        scrollDiv.scrollTop = ((cursor + 1) * rowHeight) - (scrollDiv.clientHeight * 0.9);
      }
    }
  }

  keydown = (e: KeyboardEvent) => {
    const expander = this.state.aggrow.expander;
    let cursor = this.state.cursor;
    let row = expander.getRows(cursor, 1)[0];
    invariant(row, 'Expected a row');
    switch (e.keyCode) {
      case 38: // up
        if (cursor > 0) {
          this._updateCursor(cursor - 1);
          this._keepCursorInViewport();
        }
        e.preventDefault();
        break;
      case 40: // down
        if (cursor < expander.getHeight() - 1) {
          this._updateCursor(cursor + 1);
          this._keepCursorInViewport();
        }
        e.preventDefault();
        break;
      case 37: // left
        if (expander.canContract(row)) {
          this._contractRow(row);
        } else if (expander.getRowIndent(row) > 0) {
          const indent = expander.getRowIndent(row) - 1;
          while (expander.getRowIndent(row) > indent) {
            cursor -= 1;
            row = expander.getRows(cursor, 1)[0];
          }
          this._updateCursor(cursor);
          this._keepCursorInViewport();
        }
        e.preventDefault();
        break;
      case 39: // right
        if (expander.canExpand(row)) {
          this._expandRow(row);
        } else if (cursor < expander.getHeight() - 1) {
          this._updateCursor(cursor + 1);
          this._keepCursorInViewport();
        }
        e.preventDefault();
        break;
      default:
        // Do nothing
        break;
    }
  }

  dropAction = (s: string, d: string) => {
    const expander = this.state.aggrow.expander;
    if (s.startsWith('aggregate:active:')) {
      const sIndex = parseInt(s.substr(17), 10);
      let dIndex = -1;
      const active = expander.getActiveAggregators();
      const dragged = active[sIndex];
      if (d.startsWith('aggregate:insert:')) {
        dIndex = parseInt(d.substr(17), 10);
      } else if (d === 'divider:insert') {
        dIndex = active.length;
      } else {
        throw new Error(`not allowed to drag ${s} to ${d}`);
      }
      if (dIndex > sIndex) {
        dIndex -= 1;
      }
      active.splice(sIndex, 1);
      active.splice(dIndex, 0, dragged);
      expander.setActiveAggregators(active);
      this._updateCursor(0);
    } else if (s.startsWith('expander:active:')) {
      const sIndex = parseInt(s.substr(16), 10);
      let dIndex = -1;
      const active = expander.getActiveExpanders();
      const dragged = active[sIndex];
      if (d.startsWith('expander:insert:')) {
        dIndex = parseInt(d.substr(16), 10);
      } else if (d === 'divider:insert') {
        dIndex = 0;
      } else {
        throw new Error(`not allowed to drag ${s} to ${d}`);
      }
      if (dIndex > sIndex) {
        dIndex -= 1;
      }
      active.splice(sIndex, 1);
      active.splice(dIndex, 0, dragged);
      expander.setActiveExpanders(active);
      this._updateCursor(0);
    } else if (s.startsWith('expander:add:')) {
      let dIndex = -1;
      const sExpander = parseInt(s.substring(13), 10);
      if (d.startsWith('expander:insert:')) {
        dIndex = parseInt(d.substr(16), 10);
      } else if (d === 'divider:insert') {
        dIndex = 0;
      } else {
        throw new Error(`not allowed to drag ${s} to ${d}`);
      }
      const active = expander.getActiveExpanders();
      active.splice(dIndex, 0, sExpander);
      expander.setActiveExpanders(active);
      this._updateCursor(0);
    }
  }

  _handleUpdate = () => {
    this.setState({ aggrow: this.state.aggrow });
  }

  renderVirtualizedRows(): React.Element<*> {
    const expander = this.state.aggrow.expander;
    const viewport = this.state.viewport;
    const rows = expander.getRows(viewport.top, viewport.height);
    return (
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: `${(rowHeight * (expander.getHeight() + 20))}px`,
        }}>
        { rows.map((child: Row | null): ?React.Element<*> => this.renderRow(child)) }
      </div>
    );
  }

  renderRow(toRender: Row | null): ?React.Element<*> {
    if (toRender === null) {
      return null;
    }
    const row = toRender;
    let bg = 'white';
    const expander = this.state.aggrow.expander;
    const columns = [];
    let rowText = '';
    const indent = 4 + (expander.getRowIndent(row) * treeIndent);
    const aggregates = expander.getActiveAggregators();
    if (expander.getRowExpanderIndex(row) % 2 === 1) {
      bg = '#f0f0f0';
    }
    if (row.top === this.state.cursor) {
      bg = '#dfe3ee';
    }
    for (let i = 0; i < aggregates.length; i++) {
      const aggregate = expander.getRowAggregate(row, i);
      columns.push((
        <div
          key={`ag${i}`}
          style={{
            width: '16px',
            height: 'inherit',
            backgroundColor: '#8b9dc3',
            flexShrink: '0',
          }}
        />
      ));
      columns.push((
        <div
          key={`agsep${i}`}
          style={{
            width: '128px',
            textAlign: 'right',
            backgroundColor: bg,
            flexShrink: '0',
          }}>
          {aggregate}
        </div>
      ));
    }
    columns.push((
      <div
        key="sep"
        style={{
          width: '16px',
          height: 'inherit',
          backgroundColor: '#3b5998',
          flexShrink: '0',
        }}
      />
    ));
    if (expander.canExpand(row)) {
      columns.push((
        <div  // eslint-disable-line jsx-a11y/no-static-element-interactions
          key="indent"
          // TODO: Fix this to not need an arrow function
          // eslint-disable-next-line react/jsx-no-bind
          onClick={(): void => this._expandRow(row)}
          style={{
            marginLeft: `${indent}px`,
            flexShrink: '0',
            width: '12px',
            textAlign: 'center',
            border: '1px solid gray',
          }}>
          +
        </div>
      ));
    } else if (expander.canContract(row)) {
      columns.push((
        <div  // eslint-disable-line jsx-a11y/no-static-element-interactions
          key="indent"
          // TODO: Fix this to not need an arrow function
          // eslint-disable-next-line react/jsx-no-bind
          onClick={(): void => this._contractRow(row)}
          style={{
            marginLeft: `${indent}px`,
            flexShrink: '0',
            width: '12px',
            textAlign: 'center',
            border: '1px solid gray',
          }}>
          -
        </div>
      ));
    } else {
      columns.push((
        <div
          key="indent"
          style={{
            marginLeft: `${indent}px`,
          }}
        />
      ));
    }
    rowText += expander.getRowLabel(row);
    columns.push((
      <div
        key="data"
        style={{
          flexShrink: '0',
          whiteSpace: 'nowrap',
          marginRight: '20px',
        }}>
        {rowText}
      </div>
    ));
    return (
      <div  // eslint-disable-line jsx-a11y/no-static-element-interactions
        key={row.top}
        // TODO: Fix this to not need an arrow function
        onClick={() => {  // eslint-disable-line react/jsx-no-bind
          this._updateCursor(row.top);
        }}
        style={{
          position: 'absolute',
          height: `${(rowHeight - 1)}px`,
          top: `${(rowHeight * row.top)}px`,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: bg,
          borderBottom: '1px solid gray',
        }}>
        {columns}
      </div>
    );
  }

  render(): React.Element<*> {
    const expander = this.state.aggrow.expander;
    const cursor = this.state.cursor;
    const row = expander.getRows(cursor, 1)[0];
    invariant(row, 'Expected a row');
    const selectedExpander = expander.getRowExpanderIndex(row);
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
          <div>
            <input type="text" value={this.state.searchValue} onChange={(event) => {this.setState({searchValue: event.target.value});}} />
            <input type="button" value="search!" onClick={() => {
              const re = new RegExp(this.state.searchValue);
              const i = this.state.aggrow.expander.findRow((row) => re.test(row.label), this.state.cursor);
              if (i >= 0) {
                this._updateCursor(i);
                this._keepCursorInViewport();
              }
            }} />
          </div>
          <TableHeader
            aggrow={this.state.aggrow}
            dropAction={this.dropAction}
            selectedExpander={selectedExpander}
          />
          <div
            onScroll={this.scroll}
            ref={this._setScrollDiv}
            style={{
              width: '100%',
              flexGrow: '1',
              overflow: 'scroll',
            }}>
            <div style={{ position: 'relative' }}>
              { this.renderVirtualizedRows() }
            </div>
          </div>
        </div>
        {
          this.props.enableConfigurationPane ?
            <TableConfiguration
              aggrow={this.state.aggrow}
              onUpdate={this._handleUpdate}
            /> :
            undefined
        }
      </div>
    );
  }
}
