# A `signature-input` header member's value contains an unknown component.

The metadata delivered via [`signature-input`](signatureInputHeader) can only
contain a limited set of components in the list it specifies. The known
components are:

* "`unencoded-digest`"
* "`@path`"
