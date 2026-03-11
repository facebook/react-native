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
from .utils import parse_qualified_path


def build_snapshot(xml_dir: str) -> Snapshot:
    """
    Reads the Doxygen XML output and builds a snapshot of the C++ API.
    """
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

            # Check if this is an Objective-C interface by looking at the compound id
            # Doxygen reports ObjC interfaces as kind="class" but with id starting with "interface"
            is_objc_interface = (
                compound_object.kind == "class"
                and compound_object.id.startswith("interface")
            )

            # classes and structs are represented by the same scope with a different kind
            if (
                compound_object.kind == "class"
                or compound_object.kind == "struct"
                or compound_object.kind == "union"
            ):
                # Handle Objective-C interfaces separately
                if is_objc_interface:
                    create_interface_scope(snapshot, compound_object)
                    continue
                create_class_scope(snapshot, compound_object)
            elif compound_object.kind == "namespace":
                # Skip anonymous namespaces (internal linkage, not public API).
                # Doxygen encodes them with a '@' prefix in the compound name.
                if "@" in compound_object.compoundname:
                    continue

                namespace_scope = snapshot.create_or_get_namespace(
                    compound_object.compoundname
                )

                namespace_scope.location = compound_object.location.file

                for section_def in compound_object.sectiondef:
                    if section_def.kind == "var":
                        for variable_def in section_def.memberdef:
                            is_static = variable_def.static == "yes"
                            namespace_scope.add_member(
                                get_variable_member(variable_def, "public", is_static)
                            )
                    elif section_def.kind == "func":
                        for function_def in section_def.memberdef:
                            function_static = function_def.static == "yes"

                            if not function_static:
                                namespace_scope.add_member(
                                    get_function_member(function_def, "public")
                                )
                    elif section_def.kind == "typedef":
                        for typedef_def in section_def.memberdef:
                            namespace_scope.add_member(
                                get_typedef_member(typedef_def, "public")
                            )
                    elif section_def.kind == "enum":
                        for enum_def in section_def.memberdef:
                            create_enum_scope(snapshot, enum_def)
                    else:
                        print(
                            f"Unknown section kind: {section_def.kind} in {compound_object.location.file}"
                        )
            elif compound_object.kind == "concept":
                # Concepts belong to a namespace, so we need to find or create the parent namespace
                concept_name = compound_object.compoundname
                concept_path = parse_qualified_path(concept_name)
                namespace_path = "::".join(concept_path[:-1]) if concept_path else ""

                if namespace_path:
                    namespace_scope = snapshot.create_or_get_namespace(namespace_path)
                else:
                    namespace_scope = snapshot.root_scope

                namespace_scope.add_member(get_concept_member(compound_object))
            elif compound_object.kind == "file":
                pass
            elif compound_object.kind == "dir":
                pass
            elif compound_object.kind == "category":
                create_category_scope(snapshot, compound_object)
            elif compound_object.kind == "page":
                # Contains deprecation info
                pass
            elif compound_object.kind == "protocol":
                create_protocol_scope(snapshot, compound_object)
            elif compound_object.kind == "interface":
                create_interface_scope(snapshot, compound_object)
            else:
                print(f"Unknown compound kind: {compound_object.kind}")

    snapshot.finish()
    return snapshot
