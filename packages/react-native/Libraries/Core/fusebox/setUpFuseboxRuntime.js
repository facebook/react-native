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

type JSONValue =
  | string
  | number
  | boolean
  | null
  | {[key: string]: JSONValue}
  | Array<JSONValue>;
type DomainName = 'react-devtools';

class EventScope<T> {
  #cache: Set<(T) => void> = new Set();

  addEventListener(listener: T => void): void {
    this.#cache.add(listener);
  }

  removeEventListener(listener: T => void): void {
    this.#cache.delete(listener);
  }

  // Should be hidden.
  emit(value: T) {
    for (const listener of this.#cache) {
      listener(value);
    }
  }
}

class Domain {
  name: DomainName;
  onMessage: EventScope<JSONValue>;

  constructor(name: DomainName) {
    if (global[FuseboxRuntime.BINDING_NAME] == null) {
      throw new Error(
        `Could not create domain ${name}: receiving end doesn't exist`,
      );
    }

    this.name = name;
    this.onMessage = new EventScope<JSONValue>();
  }

  sendMessage(message: JSONValue) {
    const messageWithDomain = {domain: this.name, message};
    const serializedMessageWithDomain = JSON.stringify(messageWithDomain);

    global[FuseboxRuntime.BINDING_NAME](serializedMessageWithDomain);
  }
}

class FuseboxRuntime {
  static #domainNameToDomainMap: Map<DomainName, Domain> = new Map();

  // Referenced and initialized from Chrome DevTools frontend.
  static BINDING_NAME: string = '__CHROME_DEVTOOLS_FRONTEND_BINDING__';
  static onDomainInitialization: EventScope<Domain> = new EventScope<Domain>();

  // Should be private, referenced from Chrome DevTools frontend.
  static initializeDomain(domainName: DomainName): Domain {
    const domain = new Domain(domainName);

    this.#domainNameToDomainMap.set(domainName, domain);
    this.onDomainInitialization.emit(domain);

    return domain;
  }

  // Should be private, referenced from Chrome DevTools frontend.
  static sendMessage(domainName: DomainName, message: string): void {
    const domain = this.#domainNameToDomainMap.get(domainName);
    if (domain == null) {
      throw new Error(
        `Could not send message to ${domainName}: domain doesn't exist`,
      );
    }

    try {
      const parsedMessage = JSON.parse(message);
      domain.onMessage.emit(parsedMessage);
    } catch (err) {
      console.error(
        `Error while trying to send a message to domain ${domainName}:`,
        err,
      );
    }
  }
}

Object.defineProperty(global, '__FUSEBOX_RUNTIME__', {
  value: FuseboxRuntime,
  configurable: false,
  enumerable: false,
  writable: false,
});
