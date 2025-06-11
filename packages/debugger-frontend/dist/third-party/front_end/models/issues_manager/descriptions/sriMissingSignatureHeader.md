# A `signature-input` header was specified without an accompanying `signature` header.

[`signature-input`](signatureInputHeader) headers specify metadata that allows
verification of signatures delivered with a response. If no
[`signature`](signatureHeader) header is present, the
[`signature-input`](signatureInputHeader) header can be omitted, as it serves no
useful purpose in the absence of signatures. Both headers must be present for
verification to proceed.
