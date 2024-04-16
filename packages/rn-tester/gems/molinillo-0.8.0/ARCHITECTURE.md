# Molinillo Architecture

At the highest level, Molinillo is a dependency resolution algorithm.
You hand the `Resolver` a list of dependencies and a 'locking' `DependencyGraph`, and you get a resulting dependency graph out of that.
In order to guarantee that the list of dependencies is properly resolved, however, an algorithm is required that is smarter than just walking the list of dependencies and activating each, and its own dependencies, in turn.

## Backtracking

At the heart of Molinillo is a [backtracking](http://en.wikipedia.org/wiki/Backtracking) algorithm with [forward checking](http://en.wikipedia.org/wiki/Look-ahead_(backtracking)).
Essentially, the resolution process keeps track of two types of states (dependency and possibility) in a stack.
If that stack is ever exhausted, resolution was impossible.
New states are pushed onto the stack for every dependency, and every time a dependency is successfully 'activated' a new state is pushed onto the stack that represents that activation.
This stack-based approach is used because backtracking (also known as *unwinding*) becomes as simple as popping a state off that stack.

### Walkthrough

1. The client initializes a `Resolver` with a `SpecificationProvider` and `UI`
2. The client calls `resolve` with an array of user-requested dependencies and an optional 'locking' `DependencyGraph`
3. The `Resolver` creates a new `Resolution` with those four user-specified parameters and calls `resolve` on it
4. The `Resolution` creates an `initial_state`, which takes the user-requested dependencies and puts them into a `DependencyState`
  - In the process of creating the state, the `SpecificationProvider` is asked to sort the dependencies and return all the `possibilities` for the `initial_requirement` (taking into account whether the dependency is `locked`). These possibilities are then grouped into `PossibilitySet`s, with each set representing a group of versions for the dependency which share the same sub-dependency requirements and are contiguous
  - A `DependencyGraph` is created that has all of these requirements point to `root_vertices`
5. The resolution process now enters its main loop, which continues as long as there is a current `state` to process, and the current state has requirements left to process
6. `UI#indicate_progress` is called to allow the client to report progress
7. If the current state is a `DependencyState`, we have it pop off a `PossibilityState` that encapsulates a `PossibilitySet` for that dependency
8. Process the topmost state on the stack
9. If there is a non-empty `PossibilitySet` for the state, `attempt_to_activate` it (jump to #11)
10. If there is no non-empty `PossibilitySet` for the state, `create_conflict` if the state is a `PossibilityState`, and then `unwind_for_conflict`
  - `create_conflict` builds a `Conflict` object, with details of all of the requirements for the given dependency, and adds it to a hash of conflicts stored on the `state`, indexed by the name of the dependency
  - `unwind_for_conflict` loops through all the conflicts on the `state`, looking for a state it can rewind to that might avoid that conflict. If no such state exists, it raises a VersionConflict error. Otherwise, it takes the most recent state with a chance to avoid the current conflicts and rewinds to it (go to #6)
11. Check if there is an existing vertex in the `activated` dependency graph for the dependency this state's `requirement` relates to
12. If there is no existing vertex in the `activated` dependency graph for the dependency this state's `requirement` relates to, `activate_new_spec`. This creates a new vertex in the `activated` dependency graph, with it's payload set to the possibility's `PossibilitySet`. It also pushes a new `DependencyState`, with the now-activated `PossibilitySet`'s own dependencies. Go to #6
13. If there is an existing, `activated` vertex for the dependency, `attempt_to_filter_existing_spec`
  - This filters the contents of the existing vertex's `PossibilitySet` by the current state's `requirement`
  - If any possibilities remain within the `PossibilitySet`, it updates the activated vertex's payload with the new, filtered state and pushes a new `DependencyState`
  - If no possibilities remain within the `PossibilitySet` after filtering, or if the current state's `PossibilitySet` had a different set of sub-dependency requirements to the existing vertex's `PossibilitySet`, `create_conflict` and `unwind_for_conflict`, back to the last `DependencyState` that has a chance to not generate a conflict. Go to #6
15. Terminate with the topmost state's dependency graph when there are no more requirements left
16. For each vertex with a payload of allowable versions for this resolution (i.e., a `PossibilitySet`), pick a single specific version.

### Optimal unwinding

For our backtracking algorithm to be efficient as well as correct, we need to
unwind efficiently after a conflict is encountered. Unwind too far and we'll
miss valid resolutions - once we unwind passed a DependencyState we can never
get there again. Unwind too little and resolution will be extremely slow - we'll
repeatedly hit the same conflict, processing many unnecessary iterations before
getting to a branch that avoids it.

To unwind the optimal amount, we consider the current conflict, along with all
the previous unwinds that have determined our current state.

1. First, consider the current conflict as follows:
  - Find the earliest (lowest index) set of requirements which combine to cause
  the conflict. Any non-binding requirements can be ignored, as removing them
  would not resolve the current conflict
  - For each binding requirement, find all the alternative possibilities that
  would relax the requirement:
    - the requirement's DependencyState might have alternative possibilities
    that would satisfy all the other requirements
    - the parent of the requirement might have alternative possibilities that
    would prevent the requirement existing
    - the parent of the parent of the requirement might have alternative
    possibilities that would prevent the parent, and thus the requirement,
    from existing
    - etc., etc.
  - Group all of the above possibilities into an array, and pick the one with
  the highest index (i.e., the smallest rewind) as our candidate rewind
2. Next, consider any previous unwinds that were not executed (because a
different, smaller unwind was chosen instead):
  - Ignore any previously unused unwinds that would now unwind further than the
  highest index found in (1), if any
  - For the remaining unused unwinds, check whether the unwind has a chance of
  preventing us encountering the current conflict. For this to be the case, the
  unwind must have been rejected in favour of an unwind to one of the states in
  the current conflict's requirement tree
  - If any such unwinds exist, use the one with the highest index (smallest
  unwind) instead of the one found in (1)
3a. If no possible unwind was found in (1) and (2), raise a VersionConflict
error as resolution is not possible.
3b. Filter the state that we're unwinding to, in order to remove any
possibilities we know will result in a conflict. Consider all possible unwinds
to the chosen state (there may be several, amassed from previous unused
unwinds for different conflicts) when doing this filtering - only
possibilities that will certainly result in *all* of those conflicts can be
filtered out as having no chance of resolution
4. Update the list of unused unwinds:
  - Add all possible unwinds for the current conflict
  - Update the `requirements_unwound_to_instead` attribute on any considered
  unwind that was only rejected because it had a lower index than the chosen one
  - Remove all unwinds to a state greater than or equal to the chosen unwind
5. Go to #6 in the main loop

## Specification Provider

The `SpecificationProvider` module forms the basis for the key integration point for a client library with Molinillo.
Its methods convert the client's domain-specific model objects into concepts the resolver understands:

- Nested dependencies
- Names
- Requirement satisfaction
- Finding specifications (known internally as `possibilities`)
- Sorting dependencies (for the sake of reasonable resolver performance)
