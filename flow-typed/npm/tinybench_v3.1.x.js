/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

declare module 'tinybench' {
  declare export class Task extends EventTarget {
    name: string;
    result: void | $ReadOnly<TaskResult>;
    runs: number;

    reset(): void;
    run(): Promise<Task>;
    runSync(): Task;
    warmup(): Promise<void>;
  }

  export type Hook = (
    task: Task,
    mode: 'run' | 'warmup',
  ) => Promise<void> | void;

  export type BenchOptions = {
    iterations?: number,
    name?: string,
    now?: () => number,
    setup?: Hook,
    signal?: AbortSignal,
    teardown?: Hook,
    throws?: boolean,
    time?: number,
    warmup?: boolean,
    warmupIterations?: number,
    warmupTime?: number,
  };

  export interface Statistics {
    aad: void | number;
    critical: number;
    df: number;
    mad: void | number;
    max: number;
    mean: number;
    min: number;
    moe: number;
    p50: void | number;
    p75: void | number;
    p99: void | number;
    p995: void | number;
    p999: void | number;
    rme: number;
    samples: number[];
    sd: number;
    sem: number;
    variance: number;
  }

  export interface TaskResult {
    critical: number;
    df: number;
    error?: Error;
    hz: number;
    latency: Statistics;
    max: number;
    mean: number;
    min: number;
    moe: number;
    p75: number;
    p99: number;
    p995: number;
    p999: number;
    period: number;
    rme: number;
    samples: number[];
    sd: number;
    sem: number;
    throughput: Statistics;
    totalTime: number;
    variance: number;
  }

  export type FnOptions = {
    afterAll?: (this: Task) => void | Promise<void>,
    afterEach?: (this: Task) => void | Promise<void>,
    beforeAll?: (this: Task) => void | Promise<void>,
    beforeEach?: (this: Task) => void | Promise<void>,
  };

  export type Fn = () => Promise<mixed> | mixed;

  declare export class Bench extends EventTarget {
    concurrency: null | 'task' | 'bench';
    name?: string;
    opts: $ReadOnly<BenchOptions>;
    threshold: number;

    constructor(options?: BenchOptions): this;

    // $FlowExpectedError[unsafe-getters-setters]
    get results(): Array<$ReadOnly<TaskResult>>;

    // $FlowExpectedError[unsafe-getters-setters]
    get tasks(): Array<Task>;

    add(name: string, fn: Fn, fnOpts?: FnOptions): this;
    getTask(name: string): void | Task;
    remove(name: string): this;
    reset(): void;
    run(): Promise<Array<Task>>;
    runSync(): Array<Task>;
    table(
      convert?: (task: Task) => Record<string, void | string | number>,
    ): void | Array<Record<string, void | string | number>>;
  }
}
