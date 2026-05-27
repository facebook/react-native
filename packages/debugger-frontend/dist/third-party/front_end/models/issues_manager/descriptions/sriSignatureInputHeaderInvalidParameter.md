# Invalid parameter on the list of components in a `signature-input` header.

The `signature-input` header's [Inner Lists](sfInnerList) must be specified with the
[`keyid` and `type` parameters](signatureParameters). The following parameters may
also be specified:

* `created`
* `expires`
* `nonce`

No other parameter may be specified.
