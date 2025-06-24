# Signature verification failed: the signature is expired.

The [`expires` parameter](signatureParameters) specified in a
[`signature-input`](signatureInputHeader) header is a UNIX timestamp
representing a time in the past. The signature has therefore expired, and
verification is not possible.
