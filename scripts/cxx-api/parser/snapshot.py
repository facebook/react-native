# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from .scope import NamespaceScopeKind, Scope, StructLikeScopeKind, TemporaryScopeKind
from .utils import parse_qualified_path


class Snapshot:
    def __init__(self) -> None:
        self.root_scope: Scope = Scope(NamespaceScopeKind())

    def ensure_scope(self, scope_path: list[str]) -> Scope:
        """
        Ensure that a scope exists in the snapshot, creating it if necessary.
        """
        current_scope = self.root_scope
        for name in scope_path:
            if name not in current_scope.inner_scopes:
                new_scope = Scope(TemporaryScopeKind(), name)
                new_scope.parent_scope = current_scope
                current_scope.inner_scopes[name] = new_scope
            current_scope = current_scope.inner_scopes[name]
        return current_scope

    def create_struct_like(
        self, qualified_name: str, type: StructLikeScopeKind.Type
    ) -> Scope[StructLikeScopeKind]:
        """
        Create a class in the snapshot.
        """
        path = parse_qualified_path(qualified_name)
        scope_path = path[0:-1]
        scope_name = path[-1]
        current_scope = self.ensure_scope(scope_path)

        if scope_name in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[scope_name]
            if scope.kind.name == "temporary":
                scope.kind = StructLikeScopeKind(type)
            else:
                raise RuntimeError(
                    f"Identifier {scope_name} already exists in scope {current_scope.name}"
                )
            return scope
        else:
            new_scope = Scope(StructLikeScopeKind(type), scope_name)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[scope_name] = new_scope
            return new_scope

    def create_or_get_namespace(self, qualified_name: str) -> Scope[NamespaceScopeKind]:
        """
        Create a namespace in the snapshot.
        """
        path = parse_qualified_path(qualified_name)
        scope_path = path[0:-1]
        namespace_name = path[-1] if len(path) > 0 else None
        current_scope = self.ensure_scope(scope_path)

        if namespace_name in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[namespace_name]
            if scope.kind.name == "temporary":
                scope.kind = NamespaceScopeKind()
            elif scope.kind.name == "namespace":
                return scope
            else:
                raise RuntimeError(
                    f"Identifier {namespace_name} already exists in scope {current_scope.name} with kind {scope.kind.name}"
                )
            return scope
        else:
            new_scope = Scope(NamespaceScopeKind(), namespace_name)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[namespace_name] = new_scope
            return new_scope

    def _ensure_scope_is_defined(self, scope: Scope) -> None:
        """
        Ensure that a scope is defined in the snapshot.
        """
        if scope.kind.name == "temporary":
            raise RuntimeError(f"Scope {scope.name} is not defined in the snapshot")

        for inner_scope in scope.inner_scopes.values():
            self._ensure_scope_is_defined(inner_scope)

    def finish(self) -> None:
        """
        Finish the snapshot by setting the kind of all temporary scopes.
        """
        self._ensure_scope_is_defined(self.root_scope)
        self.root_scope.close()

    def to_string(self) -> str:
        """
        Get the string representation of the snapshot.
        """
        return self.root_scope.to_string()

    def print(self) -> None:
        """
        Print the snapshot.
        """
        self.root_scope.print()
