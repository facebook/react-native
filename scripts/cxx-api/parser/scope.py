# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from typing import Generic, TypeVar

from natsort import natsort_keygen, natsorted

from .member import FriendMember, Member, MemberKind, TypedefMember
from .template import Template, TemplateList
from .utils import parse_qualified_path, qualify_template_args_only, qualify_type_str


# Pre-create natsort key function for efficiency
_natsort_key = natsort_keygen()


class ScopeKind(ABC):
    def __init__(self, name) -> None:
        self.name: str = name

    @abstractmethod
    def to_string(self, scope: Scope) -> str:
        pass

    def close(self, scope: Scope) -> None:
        """Called when the scope is closed. Override to perform cleanup."""
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

    def close(self, scope: Scope) -> None:
        """Qualify base class names and their template arguments."""
        for base in self.base_classes:
            base.name = qualify_type_str(base.name, scope)

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

        # Group members by kind
        groups: dict[MemberKind, list[str]] = {kind: [] for kind in MemberKind}

        for member in scope.get_members():
            kind = member.member_kind
            stringified = member.to_string(0, qualification, hide_visibility=True)
            groups[kind].append(stringified)

        # Sort within each group and combine in kind order
        result = []
        for kind in MemberKind:
            sorted_group = natsorted(groups[kind])
            result.extend(sorted_group)

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


class ProtocolScopeKind(ScopeKind):
    class Base:
        def __init__(
            self, name: str, protection: str, virtual: bool, refid: str
        ) -> None:
            self.name: str = name
            self.protection: str = protection
            self.virtual: bool = virtual
            self.refid: str = refid

    def __init__(self) -> None:
        super().__init__("protocol")
        self.base_classes: [ProtocolScopeKind.Base] = []

    def add_base(self, base: ProtocolScopeKind.Base | [ProtocolScopeKind.Base]) -> None:
        if isinstance(base, list):
            for b in base:
                self.base_classes.append(b)
        else:
            self.base_classes.append(base)

    def close(self, scope: Scope) -> None:
        """Qualify base class names and their template arguments."""
        for base in self.base_classes:
            base.name = qualify_type_str(base.name, scope)

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


class InterfaceScopeKind(ScopeKind):
    class Base:
        def __init__(
            self, name: str, protection: str, virtual: bool, refid: str
        ) -> None:
            self.name: str = name
            self.protection: str = protection
            self.virtual: bool = virtual
            self.refid: str = refid

    def __init__(self) -> None:
        super().__init__("interface")
        self.base_classes: [InterfaceScopeKind.Base] = []

    def add_base(
        self, base: InterfaceScopeKind.Base | [InterfaceScopeKind.Base]
    ) -> None:
        if isinstance(base, list):
            for b in base:
                self.base_classes.append(b)
        else:
            self.base_classes.append(base)

    def close(self, scope: Scope) -> None:
        """Qualify base class names and their template arguments."""
        for base in self.base_classes:
            base.name = qualify_type_str(base.name, scope)

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


class CategoryScopeKind(ScopeKind):
    def __init__(self, class_name: str, category_name: str) -> None:
        super().__init__("category")
        self.class_name: str = class_name
        self.category_name: str = category_name

    def to_string(self, scope: Scope) -> str:
        result = f"{self.name} {self.class_name}({self.category_name}) {{"

        stringified_members = []
        for member in scope.get_members():
            stringified_members.append(member.to_string(2))
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
        self.location: str | None = None
        self._members: list[Member] = []
        self._private_typedefs: dict[str, TypedefMember] = {}

    def get_qualified_name(self) -> str:
        """
        Get the qualified name of the scope, with template arguments qualified.
        """
        path = []
        current_scope = self
        while current_scope is not None:
            if current_scope.name is not None:
                # Qualify template arguments in the scope name if it has any
                name = current_scope.name
                if "<" in name and current_scope.parent_scope is not None:
                    name = qualify_template_args_only(name, current_scope.parent_scope)
                path.append(name)
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
        # Check both inner_scopes AND members (for type aliases, etc.)
        base_first = self._get_base_name(path[0])
        while current_scope is not None:
            # Check if it's an inner scope
            if base_first in current_scope.inner_scopes:
                break

            # Skip self-qualification if name matches current scope's name
            if (
                current_scope.name
                and self._get_base_name(current_scope.name) == base_first
            ):
                current_scope = current_scope.parent_scope
                continue

            # Check if it's a member (type alias, variable, etc.)
            for m in current_scope._members:
                if m.name == base_first and not isinstance(m, FriendMember):
                    prefix = current_scope.get_qualified_name()
                    return f"{prefix}::{name}" if prefix else name

            # Check private typedefs: substitute with the expanded definition
            if len(path) == 1 and base_first in current_scope._private_typedefs:
                return current_scope._private_typedefs[base_first].get_value()

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
            elif any(
                m.name == base_name and not isinstance(m, FriendMember)
                for m in current_scope._members
            ) or any(
                any(m.name == base_name for m in inner._members)
                for inner in current_scope.inner_scopes.values()
                if isinstance(inner.kind, EnumScopeKind)
            ):
                # Found as a member (or as an unscoped enum value accessible
                # from the parent scope), assume following segments exist
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
                # Segment not found as an inner scope or a real member of
                # the current scope.  When inside a struct-like scope this
                # typically means Doxygen's refid-based qualification
                # incorrectly placed a type under a compound that does not
                # actually contain it — for example a friend declaration or
                # an inherited constructor reported as a member ref. Try
                # to re-qualify from the remaining unmatched segments so the
                # type resolves against the broader scope hierarchy.
                if isinstance(current_scope.kind, StructLikeScopeKind):
                    remaining = "::".join(path[i:])
                    return self.qualify_name(remaining)
                return None

        # Return qualified name with preserved template arguments
        prefix = anchor_scope.get_qualified_name()
        if prefix:
            return f"{prefix}::{'::'.join(matched_segments)}"
        else:
            return "::".join(matched_segments)

    def add_private_typedef(self, member: TypedefMember) -> None:
        """
        Store a private typedef for use during type resolution.

        Private typedefs are not included in the snapshot output, but their
        definitions are substituted for references to them in public members.
        """
        self._private_typedefs[member.name] = member

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
        for typedef in self._private_typedefs.values():
            typedef.close(self)

        for member in self.get_members():
            member.close(self)

        self.kind.close(self)

        for _, inner_scope in self.inner_scopes.items():
            inner_scope.close()

    def to_string(self) -> str:
        """
        Get the string representation of the scope.
        """
        # Get this scope's content (e.g., class members, free functions, ...)
        this_content = self.kind.to_string(self)

        # Separate inner scopes into namespaces and non-namespaces
        # Keep (scope, string) tuples to sort by scope properties
        namespace_scope_items: list[tuple[Scope, str]] = []
        non_namespace_scope_items: list[tuple[Scope, str]] = []

        for _, inner_scope in self.inner_scopes.items():
            if inner_scope.name is None:
                continue
            inner_str = inner_scope.to_string()
            if not inner_str.strip():
                continue

            if isinstance(inner_scope.kind, NamespaceScopeKind):
                namespace_scope_items.append((inner_scope, inner_str))
            else:
                non_namespace_scope_items.append((inner_scope, inner_str))

        # Sort non-namespace scopes by depth (fewer :: first) then by string
        def scope_sort_key(item: tuple[Scope, str]) -> tuple:
            scope, string = item
            depth = scope.get_qualified_name().count("::")
            return (depth, _natsort_key(string))

        non_namespace_scope_items.sort(key=scope_sort_key)
        non_namespace_scope_strings = [s for _, s in non_namespace_scope_items]
        namespace_scope_strings = [s for _, s in namespace_scope_items]

        # Build result:
        # 1. Free members / this scope's content first
        # 2. Non-namespace inner scopes (classes, structs, enums), sorted by depth
        # 3. Namespace inner scopes, each separated by "\n\n\n" (two blank lines)

        local_parts = []
        if this_content.strip():
            local_parts.append(this_content)
        local_parts.extend(non_namespace_scope_strings)

        # NOTE: Don't sort local_parts together - free members should come first
        local_block = "\n\n".join(local_parts)

        # Combine with namespace scopes using one more blank line for clearer separation
        all_blocks = []
        if local_block.strip():
            all_blocks.append(local_block)
        all_blocks.extend(natsorted(namespace_scope_strings))

        return "\n\n\n".join(all_blocks).strip()

    def print(self):
        """
        Print a scope and its contents.
        """
        print(self.to_string())
