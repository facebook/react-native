# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from typing import Generic, TypeVar

from natsort import natsorted

from .member import Member
from .utils import parse_qualified_path


class ScopeKind(ABC):
    def __init__(self, name) -> None:
        self.name: str = name

    @abstractmethod
    def to_string(self, scope: Scope) -> str:
        pass

    def print_scope(self, scope: Scope) -> None:
        print(self.to_string(scope))


class StructLikeScopeKind(ScopeKind):
    class Base:
        def __init__(
            self, name: str, protection: str, virtual: bool, refid: str
        ) -> None:
            self.name: str = name
            self.protection: str = protection
            self.virtual: bool = virtual
            self.refid: str = refid

    class Type(Enum):
        CLASS = "class"
        STRUCT = "struct"
        UNION = "union"

    def __init__(self, type: Type) -> None:
        super().__init__(type.value)

        self.base_classes: [StructLikeScopeKind.Base] = []

    def add_base(
        self, base: StructLikeScopeKind.Base | [StructLikeScopeKind.Base]
    ) -> None:
        if isinstance(base, list):
            for b in base:
                self.base_classes.append(b)
        else:
            self.base_classes.append(base)

    def to_string(self, scope: Scope) -> str:
        result = ""

        bases = []
        for base in self.base_classes:
            base_text = [base.protection]
            if base.virtual:
                base_text.append("virtual")
            base_text.append(base.name)
            bases.append(" ".join(base_text))

        inheritance_string = " : " + ", ".join(bases) if bases else ""

        result += f"{self.name} {scope.get_qualified_name()}{inheritance_string} {{"

        stringified_members = []
        for member in scope.get_members():
            stringified_members.append(member.to_string(2))
        stringified_members = natsorted(stringified_members)
        result += ("\n" if len(stringified_members) > 0 else "") + "\n".join(
            stringified_members
        )

        result += "\n}"

        return result


class NamespaceScopeKind(ScopeKind):
    def __init__(self) -> None:
        super().__init__("namespace")

    def to_string(self, scope: Scope) -> str:
        qualification = scope.get_qualified_name()

        result = []
        for member in scope.get_members():
            result.append(member.to_string(0, qualification, hide_visibility=True))

        result = natsorted(result)
        return "\n".join(result)


class EnumScopeKind(ScopeKind):
    def __init__(self) -> None:
        super().__init__("enum")
        self.type: str | None = None

    def to_string(self, scope: Scope) -> str:
        result = ""
        inheritance_string = f" : {self.type}" if self.type else ""

        result += (
            "\n" + f"{self.name} {scope.get_qualified_name()}{inheritance_string} {{"
        )

        stringified_members = []
        for member in scope.get_members():
            stringified_members.append(member.to_string(2) + ",")

        stringified_members = natsorted(stringified_members)
        result += ("\n" if len(stringified_members) > 0 else "") + "\n".join(
            stringified_members
        )

        result += "\n}"

        return result


class TemporaryScopeKind(ScopeKind):
    def __init__(self) -> None:
        super().__init__("temporary")

    def to_string(self, scope: Scope) -> str:
        raise RuntimeError("Temporary scope should not be printed")


ScopeKindT = TypeVar("ScopeKindT", bound=ScopeKind)


class Scope(Generic[ScopeKindT]):
    def __init__(self, kind: ScopeKindT, name: str | None = None) -> None:
        self.name: str | None = name
        self.kind: ScopeKindT = kind
        self.parent_scope: Scope | None = None
        self.inner_scopes: dict[str, Scope] = {}
        self._members: list[Member] = []
        self.location: str | None = None

    def get_qualified_name(self) -> str:
        """
        Get the qualified name of the scope.
        """
        path = []
        current_scope = self
        while current_scope is not None:
            if current_scope.name is not None:
                path.append(current_scope.name)
            current_scope = current_scope.parent_scope
        path.reverse()
        return "::".join(path)

    def _get_base_name(self, name: str) -> str:
        """Strip template arguments from a name for scope lookup."""
        angle_idx = name.find("<")
        return name[:angle_idx] if angle_idx != -1 else name

    def add_member(self, member: Member | None) -> None:
        """
        Add a member to the scope.
        """
        if member is None:
            return
        self._members.append(member)

    def get_members(self) -> list[Member]:
        """
        Get all members of the scope.
        """
        return self._members

    def close(self) -> None:
        """
        Close the scope by setting the kind of all temporary scopes.
        """
        for member in self.get_members():
            member.close(self)

        for _, inner_scope in self.inner_scopes.items():
            inner_scope.close()

    def to_string(self) -> str:
        """
        Get the string representation of the scope.
        """
        result = [self.kind.to_string(self)]

        for _, inner_scope in sorted(
            filter(lambda x: x[0] is not None, self.inner_scopes.items()),
            key=lambda x: x[0],
        ):
            result.append(inner_scope.to_string())

        result = natsorted(result)
        return "\n\n".join(result).strip()

    def print(self):
        """
        Print a scope and its contents.
        """
        print(self.to_string())
