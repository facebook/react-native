# A `signature` header was specified without an accompanying `signature-input` header.

[`signature`](signatureHeader) headers specify signatures which can be verified
against a given response. Verification cannot proceed, however, in the absence of a
[`signature-input`](signatureInputHeader) header which defines relevant metadata
which allows servers and clients to agree on the exact message which is being
signed. Both headers must be present for verification to proceed.
