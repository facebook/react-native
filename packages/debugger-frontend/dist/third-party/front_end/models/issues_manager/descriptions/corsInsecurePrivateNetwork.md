# Ensure private network requests are made from secure contexts

A site requested a resource from a network that it could only access because of its users' privileged network position.
These requests expose devices and servers to the internet, increasing the risk of a cross-site request forgery (CSRF) attack, and/or information leakage.

To mitigate these risks, Chrome deprecates requests to non-public subresources when initiated from non-secure contexts. See the [feature status](PNASecureContextRestrictionFeatureStatus).

To fix this issue, migrate the website that needs to access local resources to HTTPS. If the target resource is not served on localhost, it must also be served on HTTPS to avoid mixed-content issues.

Administrators can make use of the `InsecurePrivateNetworkRequestsAllowed` and `InsecurePrivateNetworkRequestsAllowedForUrls` enterprise policies to temporarily disable this restriction on all or certain websites.
