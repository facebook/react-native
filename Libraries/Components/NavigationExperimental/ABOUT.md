# About

This is the proposal to simplify the current <Navigator /> component by removing
its navigation management logics and make navigation state a separate object.

The goal is to make <Navigator /> a pure view that renders the navigation state
and handles UI interaction.

# Navigation State

## Basic Data Structure

The data structure of the navigation state is a tree that is composed of
NavigationNode.

```
class TreeNode {
  get parentNode(): ?NavigationNode {}
  get nextNode(): ?NavigationNode {}
  get prevNode(): ?NavigationNode {}
  appendNode(child: NavigationNode): void {}
  removeNode(child: NavigationNode): void {}
  indexOfNode(child: NavigationNode): number {}
}

class NavigationNode extends TreeNode {
  get route(): any {}
  constructor(route: any, renderScene: Function): void {}
}
```

For instance, the navigation state of an app with only one node **account**
should look like this:

```
|-- app
   |-- main
      |-- account *
```

The character `*` indicates that the node that is currently focused.

In the app, there should always be one and only one node that is focused.

## Basic Linear Navigation

### Push

Pushes a new node **campaigns** after the node **account**.

```
|-- app
   |-- main
      |-- account
      |-- campaigns *
```

```
class NavigationNode {
  push(route: any): void {
    // The implementation of `this.requestNavigation` will be explained below.
    this.requestNavigation('push', route);
  }
}
```

### Pop

Pops out the **campaigns** node, the **account** node will be focused.

```
|-- app
   |-- main
      |-- account *
```

```
class NavigationNode {
  pop(): void {
    // The implementation of `this.requestNavigation` will be explained below.
    this.requestNavigation('pop');
  }
}
```

### Back

Move focus back to the **account** node

```
|-- app
   |-- main
      |-- account *
      |-- campaigns
```

```
class NavigationNode {
  pop(): void {
    // The implementation of `this.requestNavigation` will be explained below.
    this.requestNavigation('back');
  }
}
```

### Forward

Move focus forward to the **campaigns** node

```
|-- app
   |-- main
      |-- account
      |-- campaigns *
```

```
class NavigationNode {
  forward(): void {
    // The implementation of `this.requestNavigation` will be explained below.
    this.requestNavigation('forward');
  }
}
```

## Basic Hierarchical Navigation

### Open

Opens a new node **campaigns editor** that belongs to the **campaigns node**

```
|-- app
   |-- main
      |-- account
      |-- campaigns
         |-- campaigns editor*
```

```
class NavigationNode {
  open(route: any): void {
    // The implementation of `this.requestNavigation` will be explained below.
    this.requestNavigation('open', route);
  }
}
```

### Close

Close the node **campaigns editor** and moves focus back to its parent node
**campaigns**

```
|-- app
   |-- main
      |-- account
      |-- campaigns *
```

```
class NavigationNode {
  open(route: any): void {
    // The implementation of `this.requestNavigation` will be explained below.
    this.requestNavigation('close', route);
  }
}
```

## Advanced Hierarchical Navigation

This adds the node **images editor**. (a.k.a. child dialog).

```
|-- app
   |-- main
      |-- account
      |-- campaigns
         |-- campaigns editor
            |-- images editor *
```

This adds the node **creation wizard** (a.k.a. modal dialog).

```
|-- app
   |-- main
      |-- account
      |-- campaigns
   |-- creation wizard *
```

## Layout

Each node in the tree carries the information about its layout.

```
type Layout {
  // top position relative to the root node.
  top: number;

  // left position relative to the root node.
  left: number;

  width: number;

  height: number;

  // the stack order of an element. An element with greater stack order is
  // always in front of an element with a lower stack order. The value of the
  // zIndex is computed automatically based on the its the hierarchical and
  // linear order of the node in the tree.
  zIndex: number;
}

class NavigationNode {
  layout: Layout ;
}
```

By default, a node is created without layout info (e.g. width = 0, height = 0).

When the node is about to enter the screen, the render controller shall update
this node with proper layout information.

If a node is completely off the screen, its layout will be cleared.

## Rendering

### The renderScene function

Developer provides the function `renderScene` that renders the scene for a
node.

```
function renderScene(node: NavigationNode): ?ReactElement {
  return <MyScene route={node.route} />;
```

For each scene and its descendant children, it can access to the navigation
node via the `NavigationNode.forComponent()`.

Internally, the navigation node is passed via context.

This shows an example to build a "back button".


```
class MyScene {
  render() {
    var node = NavigationNode.forComponent(this);
    return (
      <Button onPress={this.onPress} disabled={!node.previous}>
        Back
      </Button>
    );
  }

  onPress() {
    var node = NavigationNode.forComponent(this);
    node.back();
  }
}

```

Despite that the data structure of the navigation is a tree, the views for
the node are rendered as flat array of components.

```
function renderNavigation(rootNode: NavigationNode=) {
  var nodes = NavigationNode.getVisibleNodes();
  return (
    <NavigationRootView>
      {nodes.map(node => {
        reutrn <NavigationNodeView node={node} renderScene={renderScene}/>;
      }}
    </NavigationRootView>
  );
}

class NavigationRootView extends ComponentWithNavigationNode {
  render() {
    return (
      <View style={this._renderStyle(this.props.node}>
        {this.props.renderScene((this.props.node)}
      </View>
    )
  }
}
```

The nodes are order by their layout zIndex, positioned and resized by their
layout information.

Scenes that are off the screen, has zero size or fully covered will not be
rendered.

Therefore, even the navigation tree can be big, there should only be few nodes
that need to be rendered since more nodes will be off-screen or covered.

## Events

When a navigation action is requested from a NavigationNode, it emits event.
The event will be emitted through capture phase then bubble phase.

For instance, this shows how the `pop` navigation can be processed:

```
class NavigationNode {
  push(route: any): void {
    this.requestNavigation('push', route);
  }

  requestNavigation(type: string, route: any): void {
    var event = new NavigationEvent(
      // event type
      'push',
      // event target
      this,
      // event data
      route
    );
    this.dispatchEvent(event);
  }
}

function onPop(event: NavigationEvent) {
  if (event.defaultPrevented) {
    // some nodes did prevent this event/
    return true;
  }
  var targetNode = event.target;
  var newNode = new NavigationNode(event.route);
  targetNode.parentNode.appendChild(targetNode);
  focusNode(targetNode);
}

// Listen to the `pop` event that will bubbles to the root level.
rootNode.addEventListener('pop', onPop, false);

// This manages the global focused node.
function focusNode(node: NavigationNode) {
  if (_focusedNode) {
    _focusedNode.dispatchEvent(new NavigationEvent('blur', _focusedNode))
  }

  _focusedNode = node;
  _focusedNode.dispatchEvent(new NavigationEvent('focus', _focusedNode))
}

```

Alternatively, the application can process the navigation changes at the a
node level.

```
class EditorDialogScene extends ComponentWithNavigationNode {
  componentWillMount() {
    this.navigationNode.addEventListener(
      'leave',
      this._onLeave.bind(this, true),
      true
    );
  }

  _onLeave(event: NavigationEvent) {
    if (!this.state.saved) {
      // do not let user leave the dialog until the data has been saved.
      event.preventDefault();
    }
  }
}

function renderScene(node: NavigationNode) {
  return <ModalDialogScene />;
}
```

## Gesture Interaction

The interaction is handled at the root-level view.

When a touch gesture starts, the interaction controller resolves the view that
should be touched by traversing the layouts of the tree nodes.

Once the target view is resolved, the interaction controller will route the
following touch moves to the target view until the gesture finishes.

# Summary

* Navigation state is managed and lives independently from the navigation components.
* The views can subscribe to the navigation state and render accordingly.
* The views can change the navigation state which emit events that can cause UI updates.
* 
