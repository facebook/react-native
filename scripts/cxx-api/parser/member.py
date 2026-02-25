# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .scope import Scope


class Member(ABC):
    def __init__(self, name: str, visibility: str) -> None:
        self.name: str = name
        self.visibility: str = visibility

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


class EnumMember(Member):
    def __init__(self, name: str, value: str | None) -> None:
        super().__init__(name, "public")
        self.value: str | None = value

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)

        if self.value is None:
            return " " * indent + f"{name}"

        return " " * indent + f"{name} = {self.value}"


class VariableMember(Member):
    def __init__(
        self,
        name: str,
        type: str,
        visibility: str,
        is_const: bool,
        is_static: bool,
        is_constexpr: bool,
        is_mutable: bool,
        value: str | None,
        definition: str,
        argstring: str | None = None,
    ) -> None:
        super().__init__(name, visibility)
        self.type: str = type
        self.value: str | None = value
        self.is_const: bool = is_const
        self.is_static: bool = is_static
        self.is_constexpr: bool = is_constexpr
        self.is_mutable: bool = is_mutable
        self.definition: str = definition
        self.argstring: str | None = argstring

    def close(self, scope: Scope):
        # TODO: handle unqualified references
        pass

    def _is_function_pointer(self) -> bool:
        """Check if this variable is a function pointer type."""
        return self.argstring is not None and self.argstring.startswith(")(")

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)

        result = " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        if self.is_static:
            result += "static "

        if self.is_constexpr:
            result += "constexpr "

        if self.is_const and not self.is_constexpr:
            result += "const "

        if self.is_mutable:
            result += "mutable "

        if self._is_function_pointer():
            # Function pointer types: argstring is ")(args...)"
            # If type already contains "(*", e.g. "void *(*" or "void(*", use directly
            # Otherwise add "(*" to form proper function pointer syntax
            if "(*" in self.type:
                result += f"{self.type}{name}{self.argstring}"
            else:
                result += f"{self.type} (*{name}{self.argstring}"
        else:
            result += f"{self.type} {name}"

        if self.value is not None and (self.is_const or self.is_constexpr):
            result += f" = {self.value}"

        result += ";"

        return result
