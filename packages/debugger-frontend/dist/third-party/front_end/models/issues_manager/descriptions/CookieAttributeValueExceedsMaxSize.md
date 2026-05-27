# Ensure cookie attribute values don’t exceed 1024 characters

Cookie attribute values exceeding 1024 characters in size will result in the attribute being ignored. This could lead to unexpected behavior since the cookie will be processed as if the offending attribute / attribute value pair were not present.

Resolve this issue by ensuring that cookie attribute values don’t exceed 1024 characters.