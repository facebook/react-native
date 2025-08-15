This tool is essentially a type checker, and as such it can be difficult to
understand the data flow. Luckily, there are fairly extensive tests which can
aid in ramping up.

This tool is made up of 3 primary stages: TypeDiffing, VersionDiffing, and
ErrorFormatting.

At a high level, the schemas are passed to TypeDiffing which is the pure
typechecker. It returns all differences between the types. VersionDiffing then
interprets these results and decides if some of those changes are actually safe
in the context of React Native’s JS/Native boundary.

For example, if you have a NativeModule method that returns a string union
`small | medium | large`. Any changes to that union would be flagged by
TypeDiffing as incompatible. However, adding a value to that union is safe
because it ensures your JS code handles more cases than native returns. Removing
a value from that union isn’t safe though because it means your JS no longer
handles something native might return which could cause an exception.

VersionDiffing encodes the logic of what is safe and what isn’t;
property/union/enum additions and removals, changing something from optional to
required and vice versa, etc. VersionDiffing has knowledge of components and
modules.

VersionDiffing returns a set of incompatible changes, which then gets passed to
ErrorFormatting. ErrorFormatting does as you’d expect, converting these deep
objects into nicely formatted strings.

When contributing, some principles:

- Keep TypeDiffing and ErrorFormatting pure. They should only know about
  JavaScript types, not React Native specific concepts
- Add tests for every case you can think of. This codebase can be complex and
  hard to reason about when making changes. The only way to stay sane is to be
  able to rely on the tests to catch anything bad you’ve done. Do yourself and
  future contributors a favor.
