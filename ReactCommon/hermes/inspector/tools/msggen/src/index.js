/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

import fs from 'fs';

// $FlowFixMe: flow doesn't know about yargs
import yargs from 'yargs';

import {Command} from './Command';
import {Event} from './Event';
import {Graph} from './Graph';
import {Property} from './Property';
import {PropsType, Type} from './Type';

import {HeaderWriter} from './HeaderWriter';
import {ImplementationWriter} from './ImplementationWriter';

type Descriptor = {|
  types: Array<Type>,
  commands: Array<Command>,
  events: Array<Event>,
|};

function parseDomains(
  domainObjs: Array<any>,
  ignoreExperimental: boolean,
): Descriptor {
  const desc = {
    types: [],
    commands: [],
    events: [],
  };

  for (const obj of domainObjs) {
    const domain = obj.domain;

    for (const typeObj of obj.types || []) {
      const type = Type.create(domain, typeObj, ignoreExperimental);
      if (type) {
        desc.types.push(type);
      }
    }

    for (const commandObj of obj.commands || []) {
      const command = Command.create(domain, commandObj, ignoreExperimental);
      if (command) {
        desc.commands.push(command);
      }
    }

    for (const eventObj of obj.events || []) {
      const event = Event.create(domain, eventObj, ignoreExperimental);
      if (event) {
        desc.events.push(event);
      }
    }
  }

  return desc;
}

function buildGraph(desc: Descriptor): Graph {
  const graph = new Graph();

  const types = desc.types;
  const commands = desc.commands;
  const events = desc.events;

  const maybeAddPropEdges = function(nodeId: string, props: ?Array<Property>) {
    if (props) {
      for (const prop of props) {
        const refId = prop.getRefDebuggerName();
        if (refId) {
          graph.addEdge(nodeId, refId);
        }
      }
    }
  };

  for (const type of types) {
    graph.addNode(type.getDebuggerName());

    if (type instanceof PropsType) {
      maybeAddPropEdges(type.getDebuggerName(), type.properties);
    }
  }

  for (const command of commands) {
    graph.addNode(command.getDebuggerName());

    maybeAddPropEdges(command.getDebuggerName(), command.parameters);
    maybeAddPropEdges(command.getDebuggerName(), command.returns);
  }

  for (const event of events) {
    graph.addNode(event.getDebuggerName());

    maybeAddPropEdges(event.getDebuggerName(), event.parameters);
  }

  return graph;
}

function parseRoots(desc: Descriptor, rootsPath: ?string): Array<string> {
  const roots = [];

  if (rootsPath) {
    const buf = fs.readFileSync(rootsPath);
    for (let line of buf.toString().split('\n')) {
      line = line.trim();

      // ignore comments and blank lines
      if (!line.match(/\s*#/) && line.length > 0) {
        roots.push(line);
      }
    }
  } else {
    for (const type of desc.types) {
      roots.push(type.getDebuggerName());
    }
    for (const command of desc.commands) {
      roots.push(command.getDebuggerName());
    }
    for (const event of desc.events) {
      roots.push(event.getDebuggerName());
    }
  }

  return roots;
}

// only include types, commands, events that can be reached from the given
// root messages
function filterReachableFromRoots(
  desc: Descriptor,
  graph: Graph,
  roots: Array<string>,
): Descriptor {
  const topoSortedIds = graph.traverse(roots);

  // Types can include other types by value, so they need to be topologically
  // sorted in the header.
  const typeMap: Map<string, Type> = new Map();
  for (const type of desc.types) {
    typeMap.set(type.getDebuggerName(), type);
  }

  const types = [];
  for (const id of topoSortedIds) {
    const type = typeMap.get(id);
    if (type) {
      types.push(type);
    }
  }

  // Commands and events don't depend on each other, so just emit them in the
  // order we got them from the JSON file.
  const ids = new Set(topoSortedIds);
  const commands = desc.commands.filter(cmd => ids.has(cmd.getDebuggerName()));
  const events = desc.events.filter(event => ids.has(event.getDebuggerName()));

  // Sort commands and events so the code is easier to read. Types have to be
  // topologically sorted as explained above.
  const comparator = (a, b) => {
    const id1 = a.getDebuggerName();
    const id2 = b.getDebuggerName();
    return id1 < id2 ? -1 : id1 > id2 ? 1 : 0;
  };
  commands.sort(comparator);
  events.sort(comparator);

  return {types, commands, events};
}

function main() {
  const args = yargs
    .usage('Usage: msggen <proto_json_path> <header_path> <cpp_path>')
    .alias('h', 'help')
    .help('h')
    .boolean('e')
    .alias('e', 'ignore-experimental')
    .describe('e', 'ignore experimental commands, props, and types')
    .alias('r', 'roots')
    .describe('r', 'path to a file listing root types, events, and commands')
    .nargs('r', 1)
    .demandCommand(3, 3).argv;

  const ignoreExperimental = !!args.e;
  const [protoJsonPath, headerPath, implPath] = args._;

  const headerStream = fs.createWriteStream(headerPath);
  const implStream = fs.createWriteStream(implPath);

  const protoJsonBuf = fs.readFileSync(protoJsonPath);
  const proto = JSON.parse(protoJsonBuf.toString());

  const desc = parseDomains(proto.domains, ignoreExperimental);
  const graph = buildGraph(desc);
  const roots = parseRoots(desc, String(args.roots));

  const reachable = filterReachableFromRoots(desc, graph, roots);

  const hw = new HeaderWriter(
    headerStream,
    reachable.types,
    reachable.commands,
    reachable.events,
  );
  hw.write();

  const iw = new ImplementationWriter(
    implStream,
    reachable.types,
    reachable.commands,
    reachable.events,
  );
  iw.write();
}

main();
