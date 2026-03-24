# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from ..template import Template, TemplateList
from .base_scope_kind import ScopeKind
from .extendable import Extendable

if TYPE_CHECKING:
    from .scope import Scope


class StructLikeScopeKind(ScopeKind, Extendable):
    class Type(Enum):
        CLASS = "class"
        STRUCT = "struct"
        UNION = "union"

    def __init__(
        self, type: Type, specialization_args: list[str] | None = None
    ) -> None:
        ScopeKind.__init__(self, type.value)
        Extendable.__init__(self)

        self.template_list: TemplateList | None = None
        self.specialization_args = specialization_args

    def add_template(self, template: Template | [Template]) -> None:
        if template and self.template_list is None:
            self.template_list = TemplateList()

        if isinstance(template, list):
            for t in template:
                self.template_list.add(t)
        else:
            self.template_list.add(template)

    def close(self, scope: Scope) -> None:
        self.qualify_base_classes(scope)

    def to_string(self, scope: Scope) -> str:
        result = ""

        if self.template_list is not None:
            result += "\n" + self.template_list.to_string() + "\n"

        inheritance = self.get_inheritance_string()
        result += f"{self.name} {scope.get_qualified_name()}{inheritance} "
        result += self._format_scope_body(scope)
        return result
