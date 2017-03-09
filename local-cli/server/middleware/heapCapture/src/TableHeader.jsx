// @flow

import React from 'react';

import Aggrow from './Aggrow';
import Draggable from './Draggable';
import DropTarget from './DropTarget';

type Props = {
  aggrow: Aggrow,
  dropAction: (sourceId: string, thisId: string) => void,
  selectedExpander: ?number,
}

export default function TableHeader(props: Props): React.Element<*> {
  const expander = props.aggrow.expander;
  const aggregators = expander.getActiveAggregators();
  const expanders = expander.getActiveExpanders();
  const headers = [];
  for (let i = 0; i < aggregators.length; i++) {
    const name = expander.getAggregatorName(aggregators[i]);
    headers.push((
      <DropTarget
        dropAction={props.dropAction}
        id={`aggregate:insert:${i}`}
        key={`aggregate:insert:${i}`}>
        <div
          style={{
            width: '16px',
            height: 'inherit',
            backgroundColor: '#8b9dc3',
            flexShrink: '0',
          }}
        />
      </DropTarget>));
    headers.push((
      <Draggable
        id={`aggregate:active:${i}`}
        key={`aggregate:active:${i}`}>
        <div style={{ width: '128px', textAlign: 'center', flexShrink: '0' }}>{name}</div>
      </Draggable>));
  }
  headers.push((
    <DropTarget
      dropAction={props.dropAction}
      id="divider:insert"
      key="divider:insert">
      <div
        style={{
          width: '16px',
          height: 'inherit',
          backgroundColor: '#3b5998',
          flexShrink: '0',
        }}
      />
    </DropTarget>));
  for (let i = 0; i < expanders.length; i++) {
    const name = expander.getExpanderName(expanders[i]);
    headers.push((
      <Draggable
        id={`expander:active:${i}`}
        key={`expander:active:${i}`}>
        <div
          style={{
            textAlign: 'center',
            flexShrink: '0',
            padding: '4px',
            backgroundColor: i === props.selectedExpander ? '#dfe3ee' : 'white',
          }}>
          {name}
        </div>
      </Draggable>));
    const sep = i + 1 < expanders.length ? '->' : '...';
    headers.push((
      <DropTarget
        dropAction={props.dropAction}
        id={`expander:insert:${i + 1}`}
        key={`expander:insert:${i + 1}`}>
        <div
          style={{
            height: 'inherit',
            backgroundColor: '#8b9dc3',
            flexShrink: '0',
          }}>
          {sep}
        </div>
      </DropTarget>)
    );
  }
  return (
    <div
      style={{
        width: '100%',
        height: '26px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: '2px solid black',
      }}>
      {headers}
    </div>
  );
}
