# Ensure that local network requests are compatible with upcoming restrictions

A site requested a resource from a network that it could only access because of
its users' privileged network position.

These requests expose devices and servers to the internet, increasing the risk
of a cross-site request forgery (CSRF) attack and/or information leakage.

To mitigate these risks, Chrome will begin requiring the user grant explicit
permission before a site can make local network requests. Local network requests
are those that go to either private IP addresses, .local domains, or loopback
addresses. Additionally, Chrome will block local network requests (both
subframes and subresources) when initiated from non-secure contexts.

If the user explicitly grants the permission, the site can make local network
requests over HTTP for hostnames that are private IP addresses, .local
hostnames, or to localhost. Sites can also set the `targetAddressSpace` fetch
option to `private` or `local` to mark requests as being local network requests,
which will allow them to be made over HTTP.
