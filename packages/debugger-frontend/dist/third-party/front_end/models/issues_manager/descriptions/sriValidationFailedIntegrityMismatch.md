# Integrity verification failed.

The signature associated with a response could be successfully verified, but the
public keys asserted in the [`signature-input`](signatureInputHeader)
header's [`keyid` parameter](signatureParameters) do not match the integrity
assertions made by the request's initiator. Verificiation failed.

The following are the keys specified by the request's initiator:

<ul>
  {PLACEHOLDER_integrityAssertions}
</ul>
