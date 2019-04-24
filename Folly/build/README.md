This directory contains `fbcode_builder` configuration and scripts.
Note that the `folly/build` subdirectory also contains some additional build
scripts for other platforms.

## Building using `fbcode_builder`

`fbcode_builder` is a small tool shared by several Facebook projects to help
drive continuous integration builds for our open source repositories.  Its
files are in `folly/fbcode_builder` (on Github) or in
`fbcode/opensource/fbcode_builder` (inside Facebook's repo).

Start with the READMEs in the `fbcode_builder` directory.

`./fbcode_builder_config.py` contains the project-specific configuration.
