# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Main entry point for building API snapshots from Doxygen XML output.
"""

from __future__ import annotations

import os

from doxmlparser import compound, index

from .builders import (
    create_category_scope,
    create_class_scope,
    create_enum_scope,
    create_interface_scope,
    create_protocol_scope,
    get_concept_member,
    get_function_member,
    get_typedef_member,
    get_variable_member,
)
from .snapshot import Snapshot
from .utils import has_scope_resolution_outside_angles, parse_qualified_path


def _should_exclude_symbol(name: str, exclude_symbols: list[str]) -> bool:
    """
    Check if a compound name should be excluded based on symbol patterns.

    Each pattern in exclude_symbols is treated as a substring match against
    the compound's qualified name.
    """
    return any(pattern in name for pattern in exclude_symbols)


def _process_namespace_sections(
    snapshot, namespace_scope, compound_object, exclude_symbols: list[str]
):
    """
    Process all section definitions inside a namespace compound.
    """
    compound_name = compound_object.compoundname
    for section_def in compound_object.sectiondef:
        if section_def.kind == "var":
            for variable_def in section_def.memberdef:
                # Skip out-of-class definitions (e.g. "Strct<T>::VALUE")
                if has_scope_resolution_outside_angles(variable_def.get_name()):
                    continue
                qualified_name = f"{compound_name}::{variable_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                is_static = variable_def.static == "yes"
                namespace_scope.add_member(
                    get_variable_member(variable_def, "public", is_static)
                )
        elif section_def.kind == "func":
            for function_def in section_def.memberdef:
                # Skip out-of-class definitions (e.g. "Strct<T>::convert")
                if has_scope_resolution_outside_angles(function_def.get_name()):
                    continue
                qualified_name = f"{compound_name}::{function_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                function_static = function_def.static == "yes"

                if not function_static:
                    namespace_scope.add_member(
                        get_function_member(function_def, "public")
                    )
        elif section_def.kind == "typedef":
            for typedef_def in section_def.memberdef:
                qualified_name = f"{compound_name}::{typedef_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                namespace_scope.add_member(get_typedef_member(typedef_def, "public"))
        elif section_def.kind == "enum":
            for enum_def in section_def.memberdef:
                qualified_name = f"{compound_name}::{enum_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                create_enum_scope(snapshot, enum_def)
        else:
            print(
                f"Unknown section kind: {section_def.kind} in {compound_object.location.file}"
            )


def _handle_namespace_compound(snapshot, compound_object, exclude_symbols=None):
    """
    Handle a namespace compound definition.
    """
    if exclude_symbols is None:
        exclude_symbols = []

    # Skip anonymous namespaces (internal linkage, not public API).
    # Doxygen encodes them with a '@' prefix in the compound name.
    if "@" in compound_object.compoundname:
        return

    namespace_scope = snapshot.create_or_get_namespace(compound_object.compoundname)

    namespace_scope.location = compound_object.location.file

    _process_namespace_sections(
        snapshot, namespace_scope, compound_object, exclude_symbols
    )


def _handle_concept_compound(snapshot, compound_object):
    """
    Handle a concept compound definition.
    """
    # Concepts belong to a namespace, so we need to find or create the parent namespace
    concept_name = compound_object.compoundname
    concept_path = parse_qualified_path(concept_name)
    namespace_path = "::".join(concept_path[:-1]) if concept_path else ""

    if namespace_path:
        namespace_scope = snapshot.create_or_get_namespace(namespace_path)
    else:
        namespace_scope = snapshot.root_scope

    namespace_scope.add_member(get_concept_member(compound_object))


def _handle_class_compound(snapshot, compound_object):
    """
    Handle class, struct, and union compound definitions.
    """
    # Check if this is an Objective-C interface by looking at the compound id
    # Doxygen reports ObjC interfaces as kind="class" but with id starting with "interface"
    is_objc_interface = (
        compound_object.kind == "class" and compound_object.id.startswith("interface")
    )

    # Handle Objective-C interfaces separately
    if is_objc_interface:
        create_interface_scope(snapshot, compound_object)
        return

    # classes and structs are represented by the same scope with a different kind
    create_class_scope(snapshot, compound_object)


# Dispatch table for compound kinds that map directly to a single builder call.
_COMPOUND_HANDLERS = {
    "class": _handle_class_compound,
    "struct": _handle_class_compound,
    "union": _handle_class_compound,
    "namespace": _handle_namespace_compound,
    "concept": _handle_concept_compound,
    "category": create_category_scope,
    "protocol": create_protocol_scope,
    "interface": create_interface_scope,
}

# Compound kinds that are intentionally ignored.
_IGNORED_COMPOUNDS = frozenset(
    {
        "file",
        "dir",
        # Contains deprecation info
        "page",
    }
)


def build_snapshot(xml_dir: str, exclude_symbols: list[str] | None = None) -> Snapshot:
    """
    Reads the Doxygen XML output and builds a snapshot of the C++ API.

    Args:
        xml_dir: Path to the Doxygen XML output directory.
        exclude_symbols: Optional list of substring patterns. Compounds whose
            qualified name contains any of these patterns will be excluded.
    """
    if exclude_symbols is None:
        exclude_symbols = []

    index_path = os.path.join(xml_dir, "index.xml")
    if not os.path.exists(index_path):
        raise RuntimeError(f"Doxygen entry point not found at {index_path}")

    root = index.parse(index_path, silence=True)
    snapshot = Snapshot()

    for entry in root.compound:
        detail_file = os.path.join(xml_dir, f"{entry.refid}.xml")
        if not os.path.exists(detail_file):
            print(f"Detail file not found at {detail_file}")
            continue

        doxygen_object = compound.parse(detail_file, silence=True)

        for compound_object in doxygen_object.compounddef:
            if compound_object.prot == "private":
                continue

            if _should_exclude_symbol(compound_object.compoundname, exclude_symbols):
                continue

            kind = compound_object.kind

            if kind in _IGNORED_COMPOUNDS:
                pass
            elif kind in _COMPOUND_HANDLERS:
                handler = _COMPOUND_HANDLERS[kind]
                if handler == _handle_namespace_compound:
                    handler(snapshot, compound_object, exclude_symbols)
                else:
                    handler(snapshot, compound_object)
            else:
                print(f"Unknown compound kind: {kind}")

    snapshot.finish()
    return snapshot
