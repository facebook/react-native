# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import IntEnum
from typing import TYPE_CHECKING

from ..template import Template, TemplateList

if TYPE_CHECKING:
    from ..scope import Scope

STORE_INITIALIZERS_IN_SNAPSHOT = False


class MemberKind(IntEnum):
    """
    Classification of member kinds for grouping in output.
    The order here determines the output order within namespace scopes.
    """

    CONSTANT = 0
    TYPE_ALIAS = 1
    CONCEPT = 2
    FUNCTION = 3
    OPERATOR = 4
    VARIABLE = 5
    FRIEND = 6


class Member(ABC):
    def __init__(self, name: str, visibility: str) -> None:
        self.name: str = name
        self.visibility: str = visibility
        self.template_list: TemplateList | None = None

    @property
    @abstractmethod
    def member_kind(self) -> MemberKind:
        pass

    @abstractmethod
    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        pass

    def close(self, scope: Scope):
        pass

    def _get_qualified_name(self, qualification: str | None):
        return f"{qualification}::{self.name}" if qualification else self.name

    def add_template(self, template: Template | [Template]) -> None:
        if template and self.template_list is None:
            self.template_list = TemplateList()

        if isinstance(template, list):
            for t in template:
                self.template_list.add(t)
        else:
            self.template_list.add(template)
