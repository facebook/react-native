# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from natsort import natsorted

from .base_scope_kind import ScopeKind

if TYPE_CHECKING:
    from .scope import Scope


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
