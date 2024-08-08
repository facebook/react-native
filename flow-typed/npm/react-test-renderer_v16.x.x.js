// Type definitions for react-test-renderer 16.x.x
// Ported from: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react-test-renderer

type ReactComponentInstance = React$Component<any>;

type ReactTestRendererJSON = {
  type: string,
  props: { [propName: string]: any, ... },
  children: null | ReactTestRendererJSON[],
  ...
};

type ReactTestRendererTree = ReactTestRendererJSON & {
  nodeType: "component" | "host",
  instance: ?ReactComponentInstance,
  rendered: null | ReactTestRendererTree,
  ...
};

type ReactTestInstance = {
  instance: ?ReactComponentInstance,
  type: string,
  props: { [propName: string]: any, ... },
  parent: null | ReactTestInstance,
  children: Array<ReactTestInstance | string>,
  find(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance,
  findByType(type: React$ElementType): ReactTestInstance,
  findByProps(props: { [propName: string]: any, ... }): ReactTestInstance,
  findAll(
    predicate: (node: ReactTestInstance) => boolean,
    options?: { deep: boolean, ... }
  ): ReactTestInstance[],
  findAllByType(
    type: React$ElementType,
    options?: { deep: boolean, ... }
  ): ReactTestInstance[],
  findAllByProps(
    props: { [propName: string]: any, ... },
    options?: { deep: boolean, ... }
  ): ReactTestInstance[],
  ...
};

type TestRendererOptions = { createNodeMock(element: React.MixedElement): any, ... };

declare module "react-test-renderer" {
  declare export type ReactTestRenderer = {
    toJSON(): null | ReactTestRendererJSON,
    toTree(): null | ReactTestRendererTree,
    unmount(nextElement?: React.MixedElement): void,
    update(nextElement: React.MixedElement): void,
    getInstance(): ?ReactComponentInstance,
    root: ReactTestInstance,
    ...
  };

  declare type Thenable = { then(resolve: () => mixed, reject?: () => mixed): mixed, ... };

  declare function create(
    nextElement: React.MixedElement,
    options?: TestRendererOptions
  ): ReactTestRenderer;

  declare function act(callback: () => void | Promise<void>): Thenable;
}

declare module "react-test-renderer/shallow" {
  declare export default class ShallowRenderer {
    static createRenderer(): ShallowRenderer;
    getMountedInstance(): ReactTestInstance;
    getRenderOutput<E: React.MixedElement>(): E;
    getRenderOutput(): React.MixedElement;
    render(element: React.MixedElement, context?: any): void;
    unmount(): void;
  }
}
