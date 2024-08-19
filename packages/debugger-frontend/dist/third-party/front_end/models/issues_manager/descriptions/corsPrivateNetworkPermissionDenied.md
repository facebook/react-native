# Ensure that private network requests made from secure context to plaintext resources can gain access based on user permission

A site requested a resource from a network that it could only access because of its users' privileged network position.
These requests expose devices and servers to the internet, increasing the risk of a cross-site request forgery (CSRF) attack and/or information leakage.

To mitigate these risks, Chrome deprecates requests to non-public subresources when initiated from non-secure contexts. See the [feature status](PNASecureContextRestrictionFeatureStatus).

Setting a `targetAddressSpace` fetch option to `private` or `local` allows secure contexts to fetch private network resources over HTTP, which is normally forbidden by mixed-content checks. The target server must respond affirmatively to a preflight request, and the user must grant explicit permission.

Make sure that the response to the [preflight request](issueCorsPreflightRequest) for the private network resource has the `Private-Network-Access-Id` and `Private-Network-Access-Name` header properly set. `Private-Network-Access-Id` should be the device's MAC address and `Private-Network-Access-Name` should be a human-friendly device name.
