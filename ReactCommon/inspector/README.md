# Inspector

This directory implements an the Chrome debugging protocol [1]. The version used is roughly 1.1 of
the protocol. The code here doesn't specify a transport and doesn't implement an actual server. This
is left up to higher parts of the stack.

The implementation uses multiple "dispatchers" to route messages for a specific domain. It reuses
existing code in JavaScriptCore to handle the domains for Debugger and Runtime. For Console, Page
and Inspector there are new implementations.

## Open source

The inspector currently doesn't compile in open source. This is due to how the build on Android
where we download the JSC sources and build an artifact separately, later download the headers we
need. The number of headers download would have to be expanded and verify that it builds correctly.

[1]: https://developer.chrome.com/devtools/docs/debugger-protocol
