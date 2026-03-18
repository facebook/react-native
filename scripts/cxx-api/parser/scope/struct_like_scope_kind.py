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
from .extendable import Extendable

if TYPE_CHECKING:
    from .scope import Scope


class StructLikeScopeKind(ScopeKind, Extendable):
    class Type(Enum):
        CLASS = "class"
        STRUCT = "struct"
        UNION = "union"

    def __init__(self, type: Type) -> None:
        ScopeKind.__init__(self, type.value)
        Extendable.__init__(self)

        self.template_list: TemplateList | None = None

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

        if self.template_list is not None:
            result += "\n" + self.template_list.to_string() + "\n"

        inheritance_string = self.get_inheritance_string()
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
