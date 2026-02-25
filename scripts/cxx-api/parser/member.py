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


@dataclass
class FunctionModifiers:
    """Parsed function modifiers that appear after the parameter list."""

    is_const: bool = False
    is_override: bool = False
    is_final: bool = False
    is_noexcept: bool = False
    noexcept_expr: str | None = None
    is_pure_virtual: bool = False
    is_default: bool = False
    is_delete: bool = False


# Pattern for function pointer / pointer to member / reference to array:
# Matches: (*name), (Class::*name), (&name), (*name)[N]
# Group 1: the identifier name
_FUNC_PTR_PATTERN = re.compile(
    r"\(\s*"  # Opening paren
    r"(?:[a-zA-Z_][a-zA-Z0-9_]*\s*::\s*)?"  # Optional Class::
    r"[*&]\s*"  # * or &
    r"([a-zA-Z_][a-zA-Z0-9_]*)"  # Capture: identifier name
    r"\s*\)"  # Closing paren
)


class FunctionMember(Member):
    def __init__(
        self,
        name: str,
        type: str,
        visibility: str,
        arg_string: str,
        is_virtual: bool,
        is_static: bool,
    ) -> None:
        super().__init__(name, visibility)
        self.type: str = type
        self.is_virtual: bool = is_virtual
        self.is_static: bool = is_static
        self.arguments, self.modifiers = FunctionMember.parse_arg_string(arg_string)

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

        result += " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        if self.is_virtual:
            result += "virtual "

        if self.is_static:
            result += "static "

        if self.type:
            result += f"{self.type} "

        result += f"{name}("

        for i, (arg_type, arg_name, arg_default) in enumerate(self.arguments):
            if arg_name:
                result += f"{arg_type} {arg_name}"
            else:
                result += arg_type
            if arg_default:
                result += f" = {arg_default}"
            if i < len(self.arguments) - 1:
                result += ", "

        result += ")"

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

    @staticmethod
    def _find_matching_paren(s: str, start: int = 0) -> int:
        """Find the index of the closing parenthesis matching the opening one at start.

        Handles nested parentheses and angle brackets (for templates).
        Returns -1 if no matching parenthesis is found.
        """
        if start >= len(s) or s[start] != "(":
            return -1

        depth = 0
        angle_depth = 0
        i = start

        while i < len(s):
            c = s[i]
            if c == "<":
                angle_depth += 1
            elif c == ">":
                angle_depth -= 1
            elif c == "(":
                depth += 1
            elif c == ")":
                depth -= 1
                if depth == 0:
                    return i
            i += 1

        return -1

    @staticmethod
    def _find_matching_angle(s: str, start: int = 0) -> int:
        """Find the index of the closing angle bracket matching the opening one at start.

        Handles nested angle brackets and parentheses.
        Returns -1 if no matching bracket is found.
        """
        if start >= len(s) or s[start] != "<":
            return -1

        depth = 0
        paren_depth = 0
        i = start

        while i < len(s):
            c = s[i]
            if c == "(":
                paren_depth += 1
            elif c == ")":
                paren_depth -= 1
            elif c == "<" and paren_depth == 0:
                depth += 1
            elif c == ">" and paren_depth == 0:
                depth -= 1
                if depth == 0:
                    return i
            i += 1

        return -1

    @staticmethod
    def _split_arguments(args_str: str) -> list[str]:
        """Split arguments by comma, respecting nested structures.

        Handles:
        - Nested parentheses: std::function<int(int, int)>
        - Nested angle brackets: std::map<K, V>
        - Brace initializers: std::vector<int> v = {1, 2, 3}
        """
        result = []
        current = []
        paren_depth = 0
        angle_depth = 0
        brace_depth = 0

        for c in args_str:
            if c == "<":
                angle_depth += 1
            elif c == ">":
                angle_depth = max(0, angle_depth - 1)
            elif c == "(":
                paren_depth += 1
            elif c == ")":
                paren_depth = max(0, paren_depth - 1)
            elif c == "{":
                brace_depth += 1
            elif c == "}":
                brace_depth = max(0, brace_depth - 1)
            elif (
                c == "," and paren_depth == 0 and angle_depth == 0 and brace_depth == 0
            ):
                result.append("".join(current).strip())
                current = []
                continue
            current.append(c)

        if current:
            result.append("".join(current).strip())

        return [arg for arg in result if arg]

    # C++ reserved keywords that serve as type qualifiers/specifiers.
    # When ALL tokens in the prefix (everything before the last token) are
    # from this set, the last token must be part of the type, not a name.
    # Primitive type names (int, bool, char, etc.) are intentionally excluded
    # to avoid ambiguity with common named params like "int x" or "bool flag".
    _CPP_TYPE_QUALIFIERS = frozenset(
        {
            "const",
            "volatile",
            "mutable",
            "unsigned",
            "signed",
            "long",
            "short",
        }
    )

    @staticmethod
    def _prefix_is_all_qualifiers(prefix: str) -> bool:
        """Check if all tokens in the prefix are type qualifiers/specifiers.

        When the prefix consists entirely of reserved qualifiers (e.g., "const",
        "const unsigned"), the following token cannot be a parameter name — it
        must be completing the type.
        """
        return all(t in FunctionMember._CPP_TYPE_QUALIFIERS for t in prefix.split())

    @staticmethod
    def _looks_like_type_token(token: str) -> bool:
        """Check if a token ends with type-related punctuation.

        Returns True if the token ends with pointer, reference, template closer,
        or array bracket — indicating it's part of a type, not a name.
        """
        return (
            token.endswith("*")
            or token.endswith("&")
            or token.endswith(">")
            or token.endswith("]")
        )

    @staticmethod
    def _parse_single_argument(arg: str) -> tuple[str, str, str | None]:
        """Parse a single C++ argument into (type, name, default_value).

        Handles complex cases:
        - Regular: "int x" -> ("int", "x", None)
        - With default: "int x = 5" -> ("int", "x", "5")
        - Function pointer: "int (*callback)(int, int)" -> ("int (*)(int, int)", "callback", None)
        - Pointer to member: "void (Class::*method)()" -> ("void (Class::*)()", "method", None)
        - Reference to array: "int (&arr)[10]" -> ("int (&)[10]", "arr", None)
        - No name (void): "void" -> ("void", "", None)
        - Unnamed multi-token: "const bool" -> ("const bool", "", None)
        """
        arg = arg.strip()
        if not arg:
            return ("", "", None)

        default_value: str | None = None
        base_arg = arg

        # Handle default values: split on '=' but respect nested structures
        eq_pos = FunctionMember._find_default_value_start(arg)
        if eq_pos != -1:
            base_arg = arg[:eq_pos].strip()
            default_value = arg[eq_pos + 1 :].strip()

        # Try to match function pointer / pointer to member / reference to array pattern
        match = _FUNC_PTR_PATTERN.search(base_arg)
        if match:
            name = match.group(1)
            # Reconstruct type by removing the name from the pattern
            type_str = base_arg[: match.start(1)] + base_arg[match.end(1) :]
            return (type_str.strip(), name, default_value)

        # Regular case: last token is the name
        parts = base_arg.rsplit(None, 1)
        if len(parts) == 2:
            prefix, potential_name = parts
            if FunctionMember._looks_like_type_token(
                potential_name
            ) or FunctionMember._prefix_is_all_qualifiers(prefix):
                return (base_arg, "", default_value)
            return (prefix, potential_name, default_value)
        else:
            return (base_arg, "", default_value)

    @staticmethod
    def _find_default_value_start(arg: str) -> int:
        """Find the position of '=' that starts a default value.

        Returns -1 if no default value found.
        Ignores '=' inside nested structures like templates or lambdas.
        """
        paren_depth = 0
        angle_depth = 0
        brace_depth = 0

        i = 0
        while i < len(arg):
            c = arg[i]
            if c == "<":
                angle_depth += 1
            elif c == ">":
                angle_depth = max(0, angle_depth - 1)
            elif c == "(":
                paren_depth += 1
            elif c == ")":
                paren_depth = max(0, paren_depth - 1)
            elif c == "{":
                brace_depth += 1
            elif c == "}":
                brace_depth = max(0, brace_depth - 1)
            elif (
                c == "=" and paren_depth == 0 and angle_depth == 0 and brace_depth == 0
            ):
                return i
            i += 1

        return -1

    @staticmethod
    def _parse_modifiers(modifiers_str: str) -> FunctionModifiers:
        """Parse function modifiers after the parameter list.

        Handles: const, override, final, noexcept, noexcept(expr), = 0, = default, = delete
        """
        result = FunctionModifiers()
        s = modifiers_str.strip()

        # Handle = 0, = default, = delete
        eq_match = re.search(r"=\s*(0|default|delete)\s*$", s)
        if eq_match:
            value = eq_match.group(1)
            if value == "0":
                result.is_pure_virtual = True
            elif value == "default":
                result.is_default = True
            elif value == "delete":
                result.is_delete = True
            s = s[: eq_match.start()].strip()

        # Handle noexcept with optional expression
        noexcept_match = re.search(r"\bnoexcept\b", s)
        if noexcept_match:
            result.is_noexcept = True
            # Check for noexcept(expr)
            rest = s[noexcept_match.end() :]
            rest_stripped = rest.lstrip()
            if rest_stripped.startswith("("):
                paren_end = FunctionMember._find_matching_paren(rest_stripped, 0)
                if paren_end != -1:
                    result.noexcept_expr = rest_stripped[1:paren_end].strip()
            # Remove noexcept and its expression from the string for further parsing
            s = s[: noexcept_match.start()] + s[noexcept_match.end() :]
            if result.noexcept_expr:
                # Also remove the (expr) part
                s = re.sub(r"\([^)]*\)", "", s, count=1)

        # Parse remaining tokens
        tokens = s.split()
        for token in tokens:
            if token == "const":
                result.is_const = True
            elif token == "override":
                result.is_override = True
            elif token == "final":
                result.is_final = True

        return result

    @staticmethod
    def parse_arg_string(
        arg_string: str,
    ) -> tuple[list[tuple[str, str, str | None]], FunctionModifiers]:
        """Parse a C++ function argument string.

        Args:
            arg_string: String in format "(type1 arg1, type2 arg2 = default) [modifiers]"

        Returns:
            Tuple of (arguments, modifiers) where:
            - arguments: list of (type, name, default_value) tuples
            - modifiers: FunctionModifiers dataclass with parsed modifier flags
        """
        arg_string = arg_string.strip()

        if not arg_string.startswith("("):
            return ([], FunctionModifiers())

        close_paren = FunctionMember._find_matching_paren(arg_string, 0)
        if close_paren == -1:
            return ([], FunctionModifiers())

        args_content = arg_string[1:close_paren].strip()
        modifiers_str = arg_string[close_paren + 1 :]

        arguments: list[tuple[str, str, str | None]] = []
        if args_content:
            for arg in FunctionMember._split_arguments(args_content):
                parsed = FunctionMember._parse_single_argument(arg)
                if parsed[0] or parsed[1]:
                    arguments.append(parsed)

        modifiers = FunctionMember._parse_modifiers(modifiers_str)

        return (arguments, modifiers)


class TypedefMember(Member):
    def __init__(
        self, name: str, type: str, argstring: str | None, visibility: str, keyword: str
    ) -> None:
        super().__init__(name, visibility)
        self.type: str = type
        self.keyword: str = keyword
        self.argstring: str | None = argstring

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

        if not hide_visibility:
            result += self.visibility + " "

        result += self.keyword

        if self.keyword == "using":
            result += f" {name} = {self.type};"
        elif self._is_function_pointer():
            # Function pointer typedef: "typedef return_type (*name)(args);"
            # type is e.g. "void(*", argstring is ")(args...)"
            if "(*" in self.type:
                result += f" {self.type}{name}{self.argstring};"
            else:
                result += f" {self.type}(*{name}{self.argstring};"
        else:
            result += f" {self.type} {name};"

        return result
