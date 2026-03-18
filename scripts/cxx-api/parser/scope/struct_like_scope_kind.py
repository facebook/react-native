# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from natsort import natsorted

from ..template import Template, TemplateList
from ..utils import qualify_type_str
from .base_scope_kind import ScopeKind

if TYPE_CHECKING:
    from .scope import Scope


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
