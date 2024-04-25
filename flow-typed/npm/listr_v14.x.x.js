/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 * @generated
 */

declare module 'listr' {
    import { Observable } from "rxjs";
    import * as stream from "stream";

    declare var npm$namespace$Listr: {|
      ListrEvent: Class<Listr$ListrEvent>,
      ListrRenderer: Class<Listr$ListrRenderer>,
    |};
    declare type Listr$ListrContext = {...};

    declare type Listr$ListrRendererValue<Ctx> =
      | "silent"
      | "default"
      | "verbose"
      | Listr$ListrRendererClass<Ctx>;

    declare type Listr$ListrTaskResult<Ctx, R> =
      | string
      | Promise<R>
      | Listr<Ctx>
      | stream.Readable
      | Observable<R>;

    declare interface Listr$ListrOptions<Ctx = Listr$ListrContext> {
      concurrent?: boolean | number | void;
      exitOnError?: boolean | void;
      renderer?: Listr$ListrRendererValue<Ctx> | void;
      nonTTYRenderer?: Listr$ListrRendererValue<Ctx> | void;
    }

    declare interface Listr$ListrEvent {
      type: string;
      data?: string | boolean | void;
    }

    declare interface Listr$ListrTask<Ctx = Listr$ListrContext, R = mixed> {
      title: string;
      task: (
        ctx: Ctx,
        task: Listr$ListrTaskWrapper<Ctx>
      ) => void | Listr$ListrTaskResult<Ctx, R>;
      skip?:
        | ((ctx: Ctx) => void | boolean | string | Promise<void | boolean | string>)
        | void;
      enabled?:
        | ((ctx: Ctx) => boolean | Promise<boolean> | Observable<boolean>)
        | void;
    }

    declare type Listr$ListrTaskObject<Ctx, R> = {
      title: string,
      output?: string | void,
      task: (
        ctx: Ctx,
        task: Listr$ListrTaskWrapper<Ctx>
      ) => void | Listr$ListrTaskResult<Ctx, R>,
      skip: (
        ctx: Ctx
      ) => void | boolean | string | Promise<void | boolean | string>,
      subtasks: $ReadOnlyArray<Listr$ListrTaskWrapper<Ctx>>,
      state: string,
      check: (ctx: Ctx) => void,
      hasSubtasks(): boolean,
      isPending(): boolean,
      isSkipped(): boolean,
      isCompleted(): boolean,
      isEnabled(): boolean,
      hasFailed(): boolean,
      run: (ctx: Ctx, wrapper: Listr$ListrTaskWrapper<Ctx>) => Promise<void>,
      ...
    } & Observable<Listr$ListrEvent>;

    declare interface Listr$ListrTaskWrapper<Ctx = Listr$ListrContext> {
      title: string;
      output: string;
      report(error: Error): void;
      skip(message: string): void;
      run(ctx?: Ctx): Promise<void>;
    }

    declare type Listr$ListrError<Ctx> = {
      context: Ctx,
      ...
    } & Error;

    declare interface Listr$ListrRenderer {
      render(): void;
      end(err: Error): void;
    }

    declare interface Listr$ListrRendererClass<Ctx> {
      nonTTY: boolean;
      new(
        tasks: $ReadOnlyArray<Listr$ListrTaskObject<Ctx>>,
        options: Listr$ListrOptions<Ctx>
      ): Listr$ListrRenderer;
    }
    declare class Listr<Ctx = Listr$ListrContext> {
      constructor(
        tasks?: $ReadOnlyArray<Listr$ListrTask<Ctx>>,
        options?: Listr$ListrOptions<Ctx>
      ): this;
      constructor(options?: Listr$ListrOptions<Ctx>): this;
      tasks: $ReadOnlyArray<Listr$ListrTaskWrapper<Ctx>>;
      setRenderer(value: Listr$ListrRendererValue<Ctx>): void;
      add(tasks: Listr$ListrTask<Ctx> | $ReadOnlyArray<Listr$ListrTask<Ctx>>): void;
      render(): void;
      run(ctx?: Ctx): Promise<Ctx>;
    }

    declare module.exports: typeof Listr;
  }
