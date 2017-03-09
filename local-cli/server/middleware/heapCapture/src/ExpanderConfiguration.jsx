// @flow

import React from 'react';

import AggrowExpander from './AggrowExpander';
import Draggable from './Draggable';

type Props = {
  expander: AggrowExpander;
  id: number;
}

export default function ExpanderConfiguration(props: Props): React.Element<*> {
  const expander = props.expander;
  const id = props.id;
  return (
    <Draggable id={`expander:add:${id}`}>
      <div
        style={{
          width: 'auto',
          height: '26px',
          border: '1px solid darkGray',
          margin: '2px',
        }}>
        {expander.getExpanderName(id)}
      </div>
    </Draggable>
  );
}
