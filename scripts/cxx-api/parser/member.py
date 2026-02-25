# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from .template import Template, TemplateList
from .utils import (
    Argument,
    format_arguments,
    format_parsed_type,
    parse_arg_string,
    parse_function_pointer_argstring,
    parse_type_with_argstrings,
)

if TYPE_CHECKING:
    from .scope import Scope


class Member(ABC):
    def __init__(self, name: str, visibility: str) -> None:
        self.name: str = name
        self.visibility: str = visibility
        self.template_list: TemplateList | None = None

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
        self._fp_arguments: list[Argument] = (
            parse_function_pointer_argstring(argstring) if argstring else []
        )
        self._parsed_type: list[str | list[Argument]] = parse_type_with_argstrings(type)

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
            formatted_args = format_arguments(self._fp_arguments)
            qualified_type = format_parsed_type(self._parsed_type)
            # Function pointer types: argstring is ")(args...)"
            # If type already contains "(*", e.g. "void *(*" or "void(*", use directly
            # Otherwise add "(*" to form proper function pointer syntax
            if "(*" in qualified_type:
                result += f"{qualified_type}{name})({formatted_args})"
            else:
                result += f"{qualified_type} (*{name})({formatted_args})"
        else:
            result += f"{format_parsed_type(self._parsed_type)} {name}"

        if self.value is not None and (self.is_const or self.is_constexpr):
            result += f" = {self.value}"

        result += ";"

        return result


class FunctionMember(Member):
    def __init__(
        self,
        name: str,
        type: str,
        visibility: str,
        arg_string: str,
        is_virtual: bool,
        is_static: bool,
        doxygen_params: list[Argument] | None = None,
    ) -> None:
        super().__init__(name, visibility)
        self.type: str = type
        self.is_virtual: bool = is_virtual
        self.is_static: bool = is_static
        parsed_arguments, self.modifiers = parse_arg_string(arg_string)
        self.arguments = (
            doxygen_params if doxygen_params is not None else parsed_arguments
        )

        self.is_const = self.modifiers.is_const
        self.is_override = self.modifiers.is_override

    def close(self, scope: Scope):
        # TODO: handle unqualified references
        pass

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)
        result = ""

        if self.template_list is not None:
            result += " " * indent + self.template_list.to_string() + "\n"

        result += " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        if self.is_virtual:
            result += "virtual "

        if self.is_static:
            result += "static "

        if self.type:
            result += f"{self.type} "

        result += f"{name}({format_arguments(self.arguments)})"

        if self.modifiers.is_const:
            result += " const"

        if self.modifiers.is_noexcept:
            if self.modifiers.noexcept_expr:
                result += f" noexcept({self.modifiers.noexcept_expr})"
            else:
                result += " noexcept"

        if self.modifiers.is_override:
            result += " override"

        if self.modifiers.is_final:
            result += " final"

        if self.modifiers.is_pure_virtual:
            result += " = 0"
        elif self.modifiers.is_default:
            result += " = default"
        elif self.modifiers.is_delete:
            result += " = delete"

        result += ";"
        return result


class TypedefMember(Member):
    def __init__(
        self, name: str, type: str, argstring: str | None, visibility: str, keyword: str
    ) -> None:
        super().__init__(name, visibility)
        self.keyword: str = keyword
        self.argstring: str | None = argstring

        # Parse function pointer argstrings (e.g. ")(int x, float y)")
        self._fp_arguments: list[Argument] = (
            parse_function_pointer_argstring(argstring) if argstring else []
        )

        # Parse inline function signatures in the type so that argument
        # lists are stored as structured data, not raw strings.
        self._parsed_type: list[str | list[Argument]] = parse_type_with_argstrings(type)
        self.type: str = type

    def close(self, scope: Scope):
        # TODO: handle unqualified references
        pass

    def _is_function_pointer(self) -> bool:
        """Check if this typedef is a function pointer type."""
        return self.argstring is not None and self.argstring.startswith(")(")

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)
        result = " " * indent

        if self.keyword == "using" and self.template_list is not None:
            result += self.template_list.to_string() + "\n" + " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        result += self.keyword

        if self.keyword == "using":
            result += f" {name} = {format_parsed_type(self._parsed_type)};"
        elif self._is_function_pointer():
            formatted_args = format_arguments(self._fp_arguments)
            qualified_type = format_parsed_type(self._parsed_type)
            # Function pointer typedef: "typedef return_type (*name)(args);"
            # type is e.g. "void(*", argstring is ")(args...)"
            if "(*" in qualified_type:
                result += f" {qualified_type}{name})({formatted_args});"
            else:
                result += f" {qualified_type}(*{name})({formatted_args});"
        else:
            result += f" {self.type} {name};"

        return result


class ConceptMember(Member):
    def __init__(
        self,
        name: str,
        constraint: str,
    ) -> None:
        super().__init__(name, "public")
        self.constraint: str = self._normalize_constraint(constraint)

    @staticmethod
    def _normalize_constraint(constraint: str) -> str:
        """
        Normalize the whitespace in a concept constraint expression.

        Doxygen preserves original source indentation, which becomes
        inconsistent when we flatten namespaces and use qualified names.
        This method normalizes the indentation by dedenting all lines
        to the minimum non-empty indentation level.
        """
        if not constraint:
            return constraint

        lines = constraint.split("\n")
        if len(lines) <= 1:
            return constraint.strip()

        # Find minimum indentation (excluding the first line and empty lines)
        min_indent = float("inf")
        for line in lines[1:]:
            stripped = line.lstrip()
            if stripped:  # Skip empty lines
                indent = len(line) - len(stripped)
                min_indent = min(min_indent, indent)

        if min_indent == float("inf"):
            min_indent = 0

        # Dedent all lines by the minimum indentation
        result_lines = [lines[0].strip()]
        for line in lines[1:]:
            if line.strip():  # Non-empty line
                # Remove the minimum indentation to normalize
                dedented = (
                    line[int(min_indent) :]
                    if len(line) >= min_indent
                    else line.lstrip()
                )
                result_lines.append(dedented.rstrip())
            else:
                result_lines.append("")

        # Check if no line is indented
        if all(not line.startswith(" ") for line in result_lines):
            # Re-indent all lines but the first by 2 spaces
            not_indented = result_lines
            result_lines = [not_indented[0]]
            for line in not_indented[1:]:
                if line.strip():  # Non-empty line
                    result_lines.append("  " + line)
                else:
                    result_lines.append("")

        return "\n".join(result_lines)

    def close(self, scope: Scope):
        # TODO: handle unqualified references
        pass

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)
        result = ""

        if self.template_list is not None:
            result += " " * indent + self.template_list.to_string() + "\n"

        result += " " * indent + f"concept {name} = {self.constraint};"

        return result
