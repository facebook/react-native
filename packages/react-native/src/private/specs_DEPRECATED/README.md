# specs_DEPRECATED

This directory was created to move all the existing native module and native component specs from the legacy `Libraries` directory. This was necessary because we needed to change the directory for the codegen from `Libraries` to `src/private`, and specs in `Libraries` needed to continue working.

Do **not** create new specs in this directory. Instead, create them colocated with the rest of the logic in an appropriate directory in `src/private`.

Over time, as we move code from `Libraries` to `src/private`, we should be moving the specs in this directory out until it is empty and we can remove it.
