/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import type {Timeout} from 'timers';

// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import {setTimeout} from 'timers';

const MAX_QUEUE_TIME_SPAN_MS = 3000;

export default class CDPMessagesQueueLogging {
  #messageQueueSize = 0;
  #maxMessageQueueSize = 0;

  #messagesMemoryUsage = 0;
  #maxMessageQueueCombinedStringSize = 0;

  #loggingTimeout: Timeout | null = null;

  #debounceStartMs = 0;

  #onHighMessageQueueSize: (queueSize: number, memoryUsageMiB: number) => void;

  constructor(
    onHighMessageQueueSize: (queueSize: number, memoryUsageMiB: number) => void,
  ) {
    this.#onHighMessageQueueSize = onHighMessageQueueSize;
  }

  messageReceived(messageSize: number) {
    this.#messageQueueSize++;
    this.#messagesMemoryUsage += messageSize;

    if (this.#messageQueueSize > this.#maxMessageQueueSize) {
      this.#maxMessageQueueSize = this.#messageQueueSize;
      this.#maxMessageQueueCombinedStringSize = this.#messagesMemoryUsage;

      // we only report when there were no higher queue size reached for MAX_QUEUE_TIME_SPAN_MS
      if (this.#loggingTimeout) {
        this.#loggingTimeout.refresh();
      } else {
        this.#debounceStartMs = Date.now();

        this.#loggingTimeout = setTimeout(() => {
          this.#onHighMessageQueueSize(
            this.#maxMessageQueueSize,
            // JS uses around 2 bytes per character
            this.#maxMessageQueueCombinedStringSize * 2,
          );

          this.#loggingTimeout = null;
          this.#maxMessageQueueSize = 0;
          this.#maxMessageQueueCombinedStringSize = 0;
        }, MAX_QUEUE_TIME_SPAN_MS).unref();
      }
    }
  }

  messageProcessed(messageSize: number) {
    this.#messageQueueSize--;
    this.#messagesMemoryUsage -= messageSize;
  }
}
