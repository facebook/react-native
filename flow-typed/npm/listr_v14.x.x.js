/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow
 * @format
 */

declare module 'listr' {
  import { Observable } from "rxjs";
  import * as stream from "stream";

  declare type Context = {__proto__: null};

  declare type RendererValue<Ctx> =
    | "silent"
    | "default"
    | "verbose"
    | RendererClass<Ctx>;

  declare export type TaskResult<Ctx, R> =
    | string
    | Promise<R>
    | Listr<Ctx>
    | stream.Readable
    | Observable<R>;

  declare export interface Options<Ctx = Context> {
    concurrent?: boolean | number | void;
    exitOnError?: boolean | void;
    renderer?: RendererValue<Ctx> | void;
    nonTTYRenderer?: RendererValue<Ctx> | void;
  }

  declare interface Event {
    type: string;
    data?: string | boolean | void;
  }

  declare export interface Task<Ctx = Context, R = mixed> {
    title: string;
    task: (
      ctx: Ctx,
      task: TaskWrapper<Ctx>
    ) => void | TaskResult<Ctx, R>;
    skip?:
      | ((ctx: Ctx) => void | boolean | string | Promise<void | boolean | string>)
      | void;
    enabled?:
      | ((ctx: Ctx) => boolean | Promise<boolean> | Observable<boolean>)
      | void;
  }

  // Backwards compatibility with an earlier Flow type defintion
  declare export type TaskSpec<Ctx = Context, R = mixed> = Task<Ctx, R>;

  declare type TaskObject<Ctx, R> = {
    title: string,
    output?: string | void,
    task: (
      ctx: Ctx,
      task: TaskWrapper<Ctx>
    ) => void | TaskResult<Ctx, R>,
    skip: (
      ctx: Ctx
    ) => void | boolean | string | Promise<void | boolean | string>,
    subtasks: $ReadOnlyArray<TaskWrapper<Ctx>>,
    state: string,
    check: (ctx: Ctx) => void,
    hasSubtasks(): boolean,
    isPending(): boolean,
    isSkipped(): boolean,
    isCompleted(): boolean,
    isEnabled(): boolean,
    hasFailed(): boolean,
    run: (ctx: Ctx, wrapper: TaskWrapper<Ctx>) => Promise<void>,
    ...
  } & Observable<Event>;

  declare interface TaskWrapper<Ctx = Context> {
    title: string;
    output: string;
    report(error: ListrError<Ctx>): void;
    skip(message: string): void;
    run(ctx?: Ctx): Promise<void>;
  }

  declare type ListrError<Ctx> = {
    context: Ctx,
    ...
  } & Error;

  declare interface Renderer {
    render(): void;
    end(err: Error): void;
  }

  declare interface RendererClass<Ctx> {
    nonTTY: boolean;
    new(
      tasks: $ReadOnlyArray<TaskObject<Ctx>>,
      options: Options<Ctx>
    ): Renderer;
  }
  declare export default class Listr<Ctx = Context> {
    constructor(
      tasks?: $ReadOnlyArray<Task<Ctx>>,
      options?: Options<Ctx>
    ): this;
    constructor(options?: Options<Ctx>): this;
    tasks: $ReadOnlyArray<TaskWrapper<Ctx>>;
    setRenderer(value: RendererValue<Ctx>): void;
    add(tasks: Task<Ctx> | $ReadOnlyArray<Task<Ctx>>): void;
    render(): void;
    run(ctx?: Ctx): Promise<Ctx>;
  }
}
