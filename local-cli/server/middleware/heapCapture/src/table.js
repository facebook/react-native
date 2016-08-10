/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';
/*eslint no-console-disallow: "off"*/
/*global React:true*/

// TODO:
// selection and arrow keys for navigating

const rowHeight = 20;
const treeIndent = 16;

class Draggable extends React.Component { // eslint-disable-line no-unused-vars
  constructor(props) {
    super(props);
  }

  render() {
    const id = this.props.id;
    function dragStart(e) {
      e.dataTransfer.setData('text/plain', id);
    }
    return React.cloneElement(
      this.props.children,
      { draggable: 'true', onDragStart: dragStart }
    );
  }
}
Draggable.propTypes = {
  children: React.PropTypes.element.isRequired,
  id: React.PropTypes.string.isRequired,
};

class DropTarget extends React.Component { // eslint-disable-line no-unused-vars
  constructor(props) {
    super(props);
  }

  render() {
    const thisId = this.props.id;
    const dropFilter = this.props.dropFilter;
    const dropAction = this.props.dropAction;
    return React.cloneElement(
      this.props.children,
      {
        onDragOver: (e) => {
          const sourceId = e.dataTransfer.getData('text/plain');
          if (dropFilter(sourceId)) {
            e.preventDefault();
          }
        },
        onDrop: (e) => {
          const sourceId = e.dataTransfer.getData('text/plain');
          if (dropFilter(sourceId)) {
            e.preventDefault();
            dropAction(sourceId, thisId);
          }
        },
      }
    );
  }
}

DropTarget.propTypes = {
  children: React.PropTypes.element.isRequired,
  id: React.PropTypes.string.isRequired,
  dropFilter: React.PropTypes.func.isRequired,
  dropAction: React.PropTypes.func.isRequired,
};

class Table extends React.Component { // eslint-disable-line no-unused-vars
  constructor(props) {
    super(props);
    this.state = {
      aggrow: props.aggrow,
      viewport: { top: 0, height: 100 },
    };
  }

  scroll(e) {
    const viewport = e.target;
    const top = Math.floor((viewport.scrollTop - viewport.clientHeight * 1.0) / rowHeight);
    const height = Math.ceil(viewport.clientHeight * 3.0 / rowHeight);
    this.state.viewport.top = top;
    this.state.viewport.height = height;
    this.forceUpdate();
  }

  dropAggregator(s, d) {
    const aggrow = this.state.aggrow;
    console.log('dropped ' + s + ' to ' + d);
    if (s.startsWith('aggregate:active:')) {
      const sIndex = parseInt(s.substr(17), 10);
      let dIndex = -1;
      const active = aggrow.getActiveAggregators();
      const dragged = active[sIndex];
      if (d.startsWith('aggregate:insert:')) {
        dIndex = parseInt(d.substr(17), 10);
      } else if (d === 'divider:insert') {
        dIndex = active.length;
      } else {
        throw 'not allowed to drag ' + s + ' to ' + d;
      }
      if (dIndex > sIndex) {
        dIndex--;
      }
      active.splice(sIndex, 1);
      active.splice(dIndex, 0, dragged);
      aggrow.setActiveAggregators(active);
      this.forceUpdate();
    } else if (s.startsWith('expander:active:')) {
      const sIndex = parseInt(s.substr(16), 10);
      let dIndex = -1;
      const active = aggrow.getActiveExpanders();
      const dragged = active[sIndex];
      if (d.startsWith('expander:insert:')) {
        dIndex = parseInt(d.substr(16), 10);
      } else if (d === 'divider:insert') {
        dIndex = 0;
      } else {
        throw 'not allowed to drag ' + s + ' to ' + d;
      }
      if (dIndex > sIndex) {
        dIndex--;
      }
      active.splice(sIndex, 1);
      active.splice(dIndex, 0, dragged);
      aggrow.setActiveExpanders(active);
      this.forceUpdate();
    }
  }

  render() {
    const headers = [];
    const aggrow = this.state.aggrow;
    const aggregators = aggrow.getActiveAggregators();
    const expanders = aggrow.getActiveExpanders();
    // aggregators
    for (let i = 0; i < aggregators.length; i++) {
      const name = aggrow.getAggregatorName(aggregators[i]);
      headers.push((
        <DropTarget
          id={'aggregate:insert:' + i.toString()}
          dropFilter={()=>{return true; }}
          dropAction={(s, d)=>{ this.dropAggregator(s, d); }}
        >
          <div style={{
            width: '16px',
            height: 'inherit',
            backgroundColor: 'darkGray',
            flexShrink: '0' }}
          ></div>
        </DropTarget>));
      headers.push((<Draggable id={'aggregate:active:' + i.toString()}>
          <div style={{ width: '128px', textAlign: 'center', flexShrink: '0' }}>{name}</div>
        </Draggable>));
    }
    headers.push((
      <DropTarget
        id="divider:insert"
        dropFilter={()=>{return true; }}
        dropAction={(s, d)=>{ this.dropAggregator(s, d); }}
      >
        <div style={{
          width: '16px',
          height: 'inherit',
          backgroundColor: 'gold',
          flexShrink: '0'
        }}></div>
      </DropTarget>));
    for (let i = 0; i < expanders.length; i++) {
      const name = aggrow.getExpanderName(expanders[i]);
      const bg = (i % 2 === 0) ? 'white' : 'lightGray';
      headers.push((<Draggable id={'expander:active:' + i.toString()}>
          <div style={{
            width: '128px',
            textAlign: 'center',
            backgroundColor: bg,
            flexShrink: '0'
          }}>
            {name}
          </div>
        </Draggable>));
      const sep = i + 1 < expanders.length ? '->' : '...';
      headers.push((
        <DropTarget
          id={'expander:insert:' + (i + 1).toString()}
          dropFilter={()=>{return true; }}
          dropAction={(s, d)=>{ this.dropAggregator(s, d);}}
        >
          <div style={{
            height: 'inherit',
            backgroundColor: 'darkGray',
            flexShrink: '0'
          }}>
            {sep}
          </div>
        </DropTarget>)
      );
    }

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          width: '100%',
          height: '26px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          borderBottom: '2px solid black',
        }}>
          {headers}
        </div>
        <div style={{
          width: '100%',
          flexGrow: '1',
          overflow: 'scroll'
        }} onScroll={ (e) => this.scroll(e) }>
          <div style={{ position: 'relative' }}>
            { this.renderVirtualizedRows() }
          </div>
        </div>
      </div>
    );
  }

  renderVirtualizedRows() {
    const aggrow = this.state.aggrow;
    const viewport = this.state.viewport;
    const rows = aggrow.getRows(viewport.top, viewport.height);
    return (
      <div style={{
        position: 'absolute',
        width: '100%',
        height: (rowHeight * (aggrow.getHeight() + 20)).toString() + 'px'
      }}>
        { rows.map(child => this.renderRow(child)) }
      </div>
    );
  }

  renderRow(row) {
    if (row === null) {
      return null;
    }
    let bg = 'lightGray';
    const aggrow = this.state.aggrow;
    const columns = [];
    let rowText = '';
    const indent = 4 + aggrow.getRowIndent(row) * treeIndent;
    const aggregates = aggrow.getActiveAggregators();
    if (row.parent !== null && (row.parent.expander % 2 === 0)) {
      bg = 'white';
    }
    for (let i = 0; i < aggregates.length; i++) {
      var aggregate = aggrow.getRowAggregate(row, i);
      columns.push((
        <div style={{
          width: '16px',
          height: 'inherit',
          backgroundColor: 'darkGray',
          flexShrink: '0'
        }}></div>
      ));
      columns.push((
        <div style={{
          width: '128px',
          textAlign: 'right',
          flexShrink: '0'
        }}>
          {aggregate}
        </div>
      ));
    }
    columns.push((
      <div style={{
        width: '16px',
        height: 'inherit',
        backgroundColor: 'gold',
        flexShrink: '0'
      }}></div>
    ));
    if (aggrow.canExpand(row)) {
      rowText += '+';
    } else if (aggrow.canContract(row)) {
      rowText += '-';
    } else {
      rowText += ' ';
    }
    rowText += aggrow.getRowLabel(row);
    columns.push((
      <div style={{
        marginLeft: indent.toString() + 'px',
        flexShrink: '0',
        whiteSpace: 'nowrap'
      }}>
        {rowText}
      </div>
    ));
    return (
      <div style={{
          position: 'absolute',
          height: (rowHeight - 1).toString() + 'px',
          top: (rowHeight * row.top).toString() + 'px',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: bg,
          borderBottom: '1px solid gray',
        }}
        onClick={ () => {
          if (aggrow.canExpand(row)) {
            aggrow.expand(row);
            this.forceUpdate();
          } else if (aggrow.canContract(row)) {
            aggrow.contract(row);
            this.forceUpdate();
          }
        }}>
        {columns}
      </div>
    );
  }
}
