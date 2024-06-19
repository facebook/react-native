// @flow
// TODO: copyright
// TODO: find right place for this file to go
// This file stubs the default "loose" mode of event-target-shim, thus allowing any string
// for event type and not limiting via generics.

declare class EventTargetStub {

  +addEventListener: (type: string, listener: EventListener) => void;

  // `string` is allowed as this file stubs the default "loose" mode of event-target-shim
  dispatchEvent: ({type: string, ...}) => boolean;
};
