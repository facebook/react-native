# RCTFoundation

RCTFoundation is a collection of lightweight utility libraries.

Rules for RCTFoundation libraries:
- They must only depend on other RCTFoundation libraries.
- Headers cannot contain C++.
- They have modular set to true in BUCK.
- They have complete_nullability set to true.
- They have enabled Clang compiler warnings.
- They have documentation.
- They have unit tests.
