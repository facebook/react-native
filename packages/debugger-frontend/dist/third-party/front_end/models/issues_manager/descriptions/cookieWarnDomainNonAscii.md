# Ensure cookie `Domain` attribute values only contain ASCII characters

`Domain` attributes in cookies are restricted to the ASCII character set. Any
cookies that contain characters outside of the ASCII range in their `Domain`
attribute will be ignored in the future.

To resolve this issue, you need to remove all non-ASCII characters from the
`Domain` attribute of the affected cookies.

If your site has an internationalized domain name (IDN), you should use
[punycode](punycodeReference) representation for the `Domain` attribute instead.
