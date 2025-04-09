# React Native Technical Documentation Guidelines

_This is a document about documentation (hence the file name)._

## Motivation

The goals of this documentation are:

1. To make it easier for people to understand and contribute to the React Native
   architecture.
2. To ensure the architecture is easy to maintain, with clearly scoped
   subsystems that are easy to reason about and change.

## Strategy

Our documentation supports the following use cases:

1. (Exploration based) I want to understand how React Native works and learn
   about its different parts. I want to explore.
2. (Goal based) I want to solve a problem and change something specific, so I
   want to understand what I should change and how the system I need to change
   works. I need to understand how other systems depend on this.

To support the first case, we provide a single entrypoint for the whole
documentation, which will be the first step in a tree of docs with links to
parents and children:

- `<root>/__docs__/README.md` (with links to subsystems 1, 2, etc.)
  - `Subsystem 1/__docs__/README.md` (with links to root and subsystems 1.1,
    1.2, etc.)
    - `Subsystem 1.1/__docs__/README.md` (with links to subsystem 1 and
      subsystems 1.1.1, 1.1.2, etc.)
    - `Subsystem 1.2/__docs__/README.md`
  - `Subsystem 2/__docs__/README.md`

This structure will make it possible for the user to navigate across the
documentation organically, just following links within the documents themselves.

To support the second use case, focusing on a specific subsystem, we will
describe what are the relationships between that subsystem and others, to make
sure that changes to its API are understood, and that usages of other subsystems
are considered.

The use of the `__docs__` directory (inspired by Python) has 2 goals:

1. Make the documentation easy to find in the directory, by generally appearing
   at the top of the directory (similar to `__tests__`).
2. Grouping the documentation itself and its assets (images, diagrams, etc.).

## Guidelines

### Content

Use [this template](./README-template.md) to write the documentation for a
subsystem, adding the appropriate subsections depending on what that
documentation requires. Only diverge from this structure if it is strictly
necessary (removing unnecessary or empty sections is fine).

Include supporting images and diagrams in the documentation. Those assets should
be placed in the same `__docs__` directory as the `README.md` file. Use relative
paths to link to the assets in those directories.

If you include Excalidraw diagrams, make sure to export an SVG image from the
website using the "Embedded scene" option, so the original diagram is included
in the file and can be re-uploaded to Excalidraw for future modifications. Use
the extension `.excalidraw.svg` to signal this.

### Granularity

The level of granularity in the definition of the subsystems should be enough to
correctly describe how React Native works, but not so detailed that any changes
in the code require changes in the documentation.

Examples:

- Requires updating the docs:
  - Adding a new major feature or API.
  - Adding a new relevant dependency. Adding a dependency to helper functions
    does not count as relevant.
- Does NOT require updating the docs:
  - Internal implementation details that do not change how the system works or
    interacts with others.
  - Making a minor API or feature change.
  - Internal refactors, even if they create new modules or introduce
    dependencies to external helpers.

### Location

When a specific subsystem exists in multiple directories (e.g.:
platform-specific ones, C++, JavaScript, etc.):

1. Choose one of them to place the canonical documentation (in order of
   preference, JavaScript -> C++ -> platform).
2. Create specific files in the rest linking to the canonical one.
