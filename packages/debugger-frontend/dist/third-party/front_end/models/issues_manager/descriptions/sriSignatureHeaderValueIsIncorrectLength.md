# A `signature` header contains a signature which cannot be verified.

This browser can only verify Ed25519 signatures, which are 512 bits long. The
signature delivered with this response does not match that length.

For example, the following header contains a valid Ed25519 signature labeled
"label":

```
Signature: label=:gHim9e5Pk2H7c9BStOmxSmkyc8+ioZgoxynu3d4INAT4dwfj5LhvaV9DFnEQ9p7C0hzW4o4Qpkm5aApd6WLLCw==:
```
