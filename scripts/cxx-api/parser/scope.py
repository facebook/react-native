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
from .template import Template, TemplateList
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
        self.template_list: TemplateList | None = None

    def add_base(
        self, base: StructLikeScopeKind.Base | [StructLikeScopeKind.Base]
    ) -> None:
        if isinstance(base, list):
            for b in base:
                self.base_classes.append(b)
        else:
            self.base_classes.append(base)

    def add_template(self, template: Template | [Template]) -> None:
        if template and self.template_list is None:
            self.template_list = TemplateList()

        if isinstance(template, list):
            for t in template:
                self.template_list.add(t)
        else:
            self.template_list.add(template)

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

        if self.template_list is not None:
            result += "\n" + self.template_list.to_string() + "\n"
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

    def qualify_name(self, name: str | None) -> str | None:
        """
        Qualify a name with the relevant scope if possible.
        Handles template arguments by stripping them for lookup but preserving
        them in the output.
        """
        if not name:
            return None

        path = parse_qualified_path(name)
        if not path:
            return None

        current_scope = self
        # Walk up to find a scope that contains the first path segment
        base_first = self._get_base_name(path[0])
        while (
            current_scope is not None and base_first not in current_scope.inner_scopes
        ):
            current_scope = current_scope.parent_scope

        if current_scope is None:
            return None

        # Remember the scope where we found the first segment — its qualified
        # name is the prefix that must precede the matched path segments.
        anchor_scope = current_scope

        # Walk down through the path, tracking matched segments with original template args
        matched_segments: list[str] = []
        for i, path_segment in enumerate(path):
            base_name = self._get_base_name(path_segment)
            if base_name in current_scope.inner_scopes:
                matched_segments.append(path_segment)
                current_scope = current_scope.inner_scopes[base_name]
            elif any(m.name == base_name for m in current_scope._members):
                # Found as a member, assume following segments exist in the scope
                prefix = "::".join(matched_segments)
                suffix = "::".join(path[i:])
                anchor_prefix = anchor_scope.get_qualified_name()
                if prefix:
                    if anchor_prefix:
                        return f"{anchor_prefix}::{prefix}::{suffix}"
                    return f"{prefix}::{suffix}"
                else:
                    if anchor_prefix:
                        return f"{anchor_prefix}::{suffix}"
                    return suffix
            else:
                return None

        # Return qualified name with preserved template arguments
        prefix = anchor_scope.get_qualified_name()
        if prefix:
            return f"{prefix}::{'::'.join(matched_segments)}"
        else:
            return "::".join(matched_segments)

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
