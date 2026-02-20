# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Unit tests for FunctionMember.parse_arg_string()"""

import unittest

from ..parser import FunctionMember, FunctionModifiers


class TestParseArgString(unittest.TestCase):
    """Test cases for parsing C++ function argument strings."""

    # =========================================================================
    # Basic cases
    # =========================================================================

    def test_empty_args(self):
        """Empty parentheses"""
        args, mods = FunctionMember.parse_arg_string("()")
        self.assertEqual(args, [])
        self.assertEqual(mods, FunctionModifiers())

    def test_single_simple_arg(self):
        """Single argument: int x"""
        args, mods = FunctionMember.parse_arg_string("(int x)")
        self.assertEqual(args, [("int", "x", None)])

    def test_multiple_simple_args(self):
        """Multiple arguments: int x, float y"""
        args, mods = FunctionMember.parse_arg_string("(int x, float y)")
        self.assertEqual(args, [("int", "x", None), ("float", "y", None)])

    def test_void_arg(self):
        """void with no name"""
        args, mods = FunctionMember.parse_arg_string("(void)")
        self.assertEqual(args, [("void", "", None)])

    # =========================================================================
    # Modifiers: const, override, final
    # =========================================================================

    def test_const_modifier(self):
        """() const"""
        args, mods = FunctionMember.parse_arg_string("() const")
        self.assertTrue(mods.is_const)
        self.assertFalse(mods.is_override)

    def test_override_modifier(self):
        """() override"""
        args, mods = FunctionMember.parse_arg_string("() override")
        self.assertTrue(mods.is_override)
        self.assertFalse(mods.is_const)

    def test_const_override(self):
        """() const override"""
        args, mods = FunctionMember.parse_arg_string("() const override")
        self.assertTrue(mods.is_const)
        self.assertTrue(mods.is_override)

    def test_override_const(self):
        """() override const - reversed order"""
        args, mods = FunctionMember.parse_arg_string("() override const")
        self.assertTrue(mods.is_const)
        self.assertTrue(mods.is_override)

    def test_final_modifier(self):
        """() final"""
        args, mods = FunctionMember.parse_arg_string("() final")
        self.assertTrue(mods.is_final)

    def test_override_final(self):
        """() override final"""
        args, mods = FunctionMember.parse_arg_string("() override final")
        self.assertTrue(mods.is_override)
        self.assertTrue(mods.is_final)

    def test_const_override_final(self):
        """() const override final"""
        args, mods = FunctionMember.parse_arg_string("() const override final")
        self.assertTrue(mods.is_const)
        self.assertTrue(mods.is_override)
        self.assertTrue(mods.is_final)

    # =========================================================================
    # Modifiers: noexcept
    # =========================================================================

    def test_noexcept(self):
        """() noexcept"""
        args, mods = FunctionMember.parse_arg_string("() noexcept")
        self.assertTrue(mods.is_noexcept)
        self.assertIsNone(mods.noexcept_expr)

    def test_noexcept_true(self):
        """() noexcept(true)"""
        args, mods = FunctionMember.parse_arg_string("() noexcept(true)")
        self.assertTrue(mods.is_noexcept)
        self.assertEqual(mods.noexcept_expr, "true")

    def test_noexcept_false(self):
        """() noexcept(false)"""
        args, mods = FunctionMember.parse_arg_string("() noexcept(false)")
        self.assertTrue(mods.is_noexcept)
        self.assertEqual(mods.noexcept_expr, "false")

    def test_noexcept_expr(self):
        """() noexcept(noexcept(other()))"""
        args, mods = FunctionMember.parse_arg_string("() noexcept(noexcept(other()))")
        self.assertTrue(mods.is_noexcept)
        self.assertEqual(mods.noexcept_expr, "noexcept(other())")

    def test_const_noexcept(self):
        """() const noexcept"""
        args, mods = FunctionMember.parse_arg_string("() const noexcept")
        self.assertTrue(mods.is_const)
        self.assertTrue(mods.is_noexcept)

    # =========================================================================
    # Modifiers: = 0, = default, = delete
    # =========================================================================

    def test_pure_virtual(self):
        """() = 0"""
        args, mods = FunctionMember.parse_arg_string("() = 0")
        self.assertTrue(mods.is_pure_virtual)

    def test_default(self):
        """() = default"""
        args, mods = FunctionMember.parse_arg_string("() = default")
        self.assertTrue(mods.is_default)

    def test_delete(self):
        """() = delete"""
        args, mods = FunctionMember.parse_arg_string("() = delete")
        self.assertTrue(mods.is_delete)

    def test_const_pure_virtual(self):
        """() const = 0"""
        args, mods = FunctionMember.parse_arg_string("() const = 0")
        self.assertTrue(mods.is_const)
        self.assertTrue(mods.is_pure_virtual)

    def test_noexcept_default(self):
        """() noexcept = default"""
        args, mods = FunctionMember.parse_arg_string("() noexcept = default")
        self.assertTrue(mods.is_noexcept)
        self.assertTrue(mods.is_default)

    # =========================================================================
    # Complex types: templates with commas
    # =========================================================================

    def test_std_map(self):
        """std::map<K, V> with comma inside template"""
        args, mods = FunctionMember.parse_arg_string("(std::map<std::string, int> m)")
        self.assertEqual(args, [("std::map<std::string, int>", "m", None)])

    def test_std_unordered_map_nested(self):
        """std::unordered_map<K, std::vector<V>>"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::unordered_map<K, std::vector<V>> m)"
        )
        self.assertEqual(args, [("std::unordered_map<K, std::vector<V>>", "m", None)])

    def test_std_tuple(self):
        """std::tuple<int, float, std::string>"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::tuple<int, float, std::string> t)"
        )
        self.assertEqual(args, [("std::tuple<int, float, std::string>", "t", None)])

    def test_deeply_nested_templates(self):
        """std::vector<std::vector<std::pair<int, int>>>"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::vector<std::vector<std::pair<int, int>>> v)"
        )
        self.assertEqual(
            args,
            [("std::vector<std::vector<std::pair<int, int>>>", "v", None)],
        )

    # =========================================================================
    # Complex types: std::function with nested parens
    # =========================================================================

    def test_std_function_simple(self):
        """std::function<void()>"""
        args, mods = FunctionMember.parse_arg_string("(std::function<void()> f)")
        self.assertEqual(args, [("std::function<void()>", "f", None)])

    def test_std_function_with_args(self):
        """std::function<int(int, int)>"""
        args, mods = FunctionMember.parse_arg_string("(std::function<int(int, int)> f)")
        self.assertEqual(args, [("std::function<int(int, int)>", "f", None)])

    def test_std_function_complex(self):
        """std::function<void(const std::string&, size_t)>"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::function<void(const std::string&, size_t)> callback)"
        )
        self.assertEqual(
            args,
            [
                (
                    "std::function<void(const std::string&, size_t)>",
                    "callback",
                    None,
                )
            ],
        )

    def test_multiple_std_function_args(self):
        """Multiple std::function args"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::function<int(int)> f, std::function<void(A, B)> g)"
        )
        self.assertEqual(
            args,
            [
                ("std::function<int(int)>", "f", None),
                ("std::function<void(A, B)>", "g", None),
            ],
        )

    def test_map_with_function_value(self):
        """std::map<K, std::function<void(A, B)>>"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::map<K, std::function<void(A, B)>> m)"
        )
        self.assertEqual(args, [("std::map<K, std::function<void(A, B)>>", "m", None)])

    # =========================================================================
    # Function pointers
    # =========================================================================

    def test_function_pointer_simple(self):
        """int (*callback)(int, int)"""
        args, mods = FunctionMember.parse_arg_string("(int (*callback)(int, int))")
        self.assertEqual(args, [("int (*)(int, int)", "callback", None)])

    def test_function_pointer_void(self):
        """void (*handler)(const char*, size_t)"""
        args, mods = FunctionMember.parse_arg_string(
            "(void (*handler)(const char*, size_t))"
        )
        self.assertEqual(args, [("void (*)(const char*, size_t)", "handler", None)])

    def test_function_pointer_no_args(self):
        """void (*fn)()"""
        args, mods = FunctionMember.parse_arg_string("(void (*fn)())")
        self.assertEqual(args, [("void (*)()", "fn", None)])

    # =========================================================================
    # Pointer to member function
    # =========================================================================

    def test_pointer_to_member(self):
        """void (Class::*method)(int, int)"""
        args, mods = FunctionMember.parse_arg_string(
            "(void (Class::*method)(int, int))"
        )
        self.assertEqual(args, [("void (Class::*)(int, int)", "method", None)])

    def test_pointer_to_member_const(self):
        """int (Foo::*getter)() const - note: const after () is part of member fn signature"""
        args, mods = FunctionMember.parse_arg_string("(int (Foo::*getter)() const)")
        # The "const" here is part of the argument type, not a method modifier
        self.assertEqual(args, [("int (Foo::*)() const", "getter", None)])

    # =========================================================================
    # Reference to array / pointer to array
    # =========================================================================

    def test_reference_to_array(self):
        """int (&arr)[10]"""
        args, mods = FunctionMember.parse_arg_string("(int (&arr)[10])")
        self.assertEqual(args, [("int (&)[10]", "arr", None)])

    def test_pointer_to_array(self):
        """int (*arr)[10]"""
        args, mods = FunctionMember.parse_arg_string("(int (*arr)[10])")
        self.assertEqual(args, [("int (*)[10]", "arr", None)])

    # =========================================================================
    # Default arguments
    # =========================================================================

    def test_default_int(self):
        """int x = 5"""
        args, mods = FunctionMember.parse_arg_string("(int x = 5)")
        self.assertEqual(args, [("int", "x", "5")])

    def test_default_string(self):
        """std::string s = "default\" """
        args, mods = FunctionMember.parse_arg_string('(std::string s = "default")')
        self.assertEqual(args, [("std::string", "s", '"default"')])

    def test_default_nullptr(self):
        """std::function<void()> f = nullptr"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::function<void()> f = nullptr)"
        )
        self.assertEqual(args, [("std::function<void()>", "f", "nullptr")])

    def test_default_brace_initializer(self):
        """std::vector<int> v = {1, 2, 3}"""
        args, mods = FunctionMember.parse_arg_string("(std::vector<int> v = {1, 2, 3})")
        self.assertEqual(args, [("std::vector<int>", "v", "{1, 2, 3}")])

    def test_multiple_defaults(self):
        """int x = 5, std::string s = "test\" """
        args, mods = FunctionMember.parse_arg_string(
            '(int x = 5, std::string s = "test")'
        )
        self.assertEqual(
            args,
            [("int", "x", "5"), ("std::string", "s", '"test"')],
        )

    def test_default_template_with_comma(self):
        """std::map<int, int> m = {}"""
        args, mods = FunctionMember.parse_arg_string("(std::map<int, int> m = {})")
        self.assertEqual(args, [("std::map<int, int>", "m", "{}")])

    # =========================================================================
    # Complex CV-qualifiers
    # =========================================================================

    def test_const_ref(self):
        """const std::string& s"""
        args, mods = FunctionMember.parse_arg_string("(const std::string& s)")
        self.assertEqual(args, [("const std::string&", "s", None)])

    def test_const_ptr_const_ref(self):
        """const int* const& ptr"""
        args, mods = FunctionMember.parse_arg_string("(const int* const& ptr)")
        self.assertEqual(args, [("const int* const&", "ptr", None)])

    def test_shared_ptr_const(self):
        """const std::shared_ptr<const Foo>& p"""
        args, mods = FunctionMember.parse_arg_string(
            "(const std::shared_ptr<const Foo>& p)"
        )
        self.assertEqual(args, [("const std::shared_ptr<const Foo>&", "p", None)])

    # =========================================================================
    # Mixed complex cases
    # =========================================================================

    def test_mixed_args_with_modifiers(self):
        """Multiple complex args with const override"""
        args, mods = FunctionMember.parse_arg_string(
            "(std::map<K, V> m, std::function<void(A, B)> f) const override"
        )
        self.assertEqual(
            args,
            [
                ("std::map<K, V>", "m", None),
                ("std::function<void(A, B)>", "f", None),
            ],
        )
        self.assertTrue(mods.is_const)
        self.assertTrue(mods.is_override)

    def test_full_complex_signature(self):
        """Complex signature with everything"""
        args, mods = FunctionMember.parse_arg_string(
            "(const std::vector<int>& v, "
            "std::function<int(int, int)> f = nullptr) const noexcept override"
        )
        self.assertEqual(
            args,
            [
                ("const std::vector<int>&", "v", None),
                ("std::function<int(int, int)>", "f", "nullptr"),
            ],
        )
        self.assertTrue(mods.is_const)
        self.assertTrue(mods.is_noexcept)
        self.assertTrue(mods.is_override)


if __name__ == "__main__":
    unittest.main()
