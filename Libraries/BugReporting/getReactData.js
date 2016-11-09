/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getReactData
 * @flow
 */
'use strict';

/**
 * Convert a react internal instance to a sanitized data object.
 *
 * This is shamelessly stolen from react-devtools:
 * https://github.com/facebook/react-devtools/blob/master/backend/getData.js
 */
function getData(element: Object): Object {
  var children = null;
  var props = null;
  var state = null;
  var context = null;
  var updater = null;
  var name = null;
  var type = null;
  var text = null;
  var publicInstance = null;
  var nodeType = 'Native';
  // If the parent is a native node without rendered children, but with
  // multiple string children, then the `element` that gets passed in here is
  // a plain value -- a string or number.
  if (typeof element !== 'object') {
    nodeType = 'Text';
    text = element + '';
  } else if (element._currentElement === null || element._currentElement === false) {
    nodeType = 'Empty';
  } else if (element._renderedComponent) {
    nodeType = 'NativeWrapper';
    children = [element._renderedComponent];
    props = element._instance.props;
    state = element._instance.state;
    context = element._instance.context;
    if (context && Object.keys(context).length === 0) {
      context = null;
    }
  } else if (element._renderedChildren) {
    children = childrenList(element._renderedChildren);
  } else if (element._currentElement && element._currentElement.props) {
    // This is a native node without rendered children -- meaning the children
    // prop is just a string or (in the case of the <option>) a list of
    // strings & numbers.
    children = element._currentElement.props.children;
  }

  if (!props && element._currentElement && element._currentElement.props) {
    props = element._currentElement.props;
  }

  // != used deliberately here to catch undefined and null
  if (element._currentElement != null) {
    type = element._currentElement.type;
    if (typeof type === 'string') {
      name = type;
    } else if (element.getName) {
      nodeType = 'Composite';
      name = element.getName();
      // 0.14 top-level wrapper
      // TODO(jared): The backend should just act as if these don't exist.
      if (element._renderedComponent && element._currentElement.props === element._renderedComponent._currentElement) {
        nodeType = 'Wrapper';
      }
      if (name === null) {
        name = 'No display name';
      }
    } else if (element._stringText) {
      nodeType = 'Text';
      text = element._stringText;
    } else {
      name = type.displayName || type.name || 'Unknown';
    }
  }

  if (element._instance) {
    var inst = element._instance;
    updater = {
      setState: inst.setState && inst.setState.bind(inst),
      forceUpdate: inst.forceUpdate && inst.forceUpdate.bind(inst),
      setInProps: inst.forceUpdate && setInProps.bind(null, element),
      setInState: inst.forceUpdate && setInState.bind(null, inst),
      setInContext: inst.forceUpdate && setInContext.bind(null, inst),
    };
    publicInstance = inst;

    // TODO: React ART currently falls in this bucket, but this doesn't
    // actually make sense and we should clean this up after stabilizing our
    // API for backends
    if (inst._renderedChildren) {
      children = childrenList(inst._renderedChildren);
    }
  }

  return {
    nodeType,
    type,
    name,
    props,
    state,
    context,
    children,
    text,
    updater,
    publicInstance,
  };
}

function setInProps(internalInst, path: Array<string | number>, value: any) {
  var element = internalInst._currentElement;
  internalInst._currentElement = {
    ...element,
    props: copyWithSet(element.props, path, value),
  };
  internalInst._instance.forceUpdate();
}

function setInState(inst, path: Array<string | number>, value: any) {
  setIn(inst.state, path, value);
  inst.forceUpdate();
}

function setInContext(inst, path: Array<string | number>, value: any) {
  setIn(inst.context, path, value);
  inst.forceUpdate();
}

function setIn(obj: Object, path: Array<string | number>, value: any) {
  var last = path.pop();
  var parent = path.reduce((obj_, attr) => obj_ ? obj_[attr] : null, obj);
  if (parent) {
    parent[last] = value;
  }
}

function childrenList(children) {
  var res = [];
  for (var name in children) {
    res.push(children[name]);
  }
  return res;
}

function copyWithSetImpl(obj, path, idx, value) {
  if (idx >= path.length) {
    return value;
  }
  var key = path[idx];
  var updated = Array.isArray(obj) ? obj.slice() : {...obj};
  // $FlowFixMe number or string is fine here
  updated[key] = copyWithSetImpl(obj[key], path, idx + 1, value);
  return updated;
}

function copyWithSet(obj: Object | Array<any>, path: Array<string | number>, value: any): Object | Array<any> {
  return copyWithSetImpl(obj, path, 0, value);
}

module.exports = getData;
