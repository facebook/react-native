# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import os
from pprint import pprint

from doxmlparser import compound, index

from .member import VariableMember
from .scope import StructLikeScopeKind
from .snapshot import Snapshot


def resolve_ref_text_name(type_def: compound.refTextType) -> str:
    if hasattr(type_def, "content_") and type_def.content_:
        name = ""
        for part in type_def.content_:
            if part.category == 1:  # MixedContainer.CategoryText
                name += part.value
            elif part.category == 3:  # MixedContainer.CategoryComplex (ref element)
                if hasattr(part.value, "get_valueOf_"):
                    name += part.value.get_valueOf_()
                elif hasattr(part.value, "valueOf_"):
                    name += part.value.valueOf_
                else:
                    name += str(part.value)
        return name

    if type_def.ref:
        return type_def.ref[0].get_valueOf_()

    return type_def.get_valueOf_()


def resolve_linked_text_name(type_def: compound.linkedTextType) -> str:
    name = ""

    for part in type_def.content_:
        if part.category == 1:  # MixedContainer.CategoryText
            name += part.value
        elif part.category == 3:  # MixedContainer.CategoryComplex (ref element)
            # For ref elements, get the text content
            if hasattr(part.value, "get_valueOf_"):
                name += part.value.get_valueOf_()
            elif hasattr(part.value, "valueOf_"):
                name += part.value.valueOf_
            else:
                name += str(part.value)

    # literal initializers keep "=" sign
    if name.startswith("="):
        name = name[1:]

    return name.strip()


def get_base_classes(
    compound_object: compound.CompounddefType,
) -> [StructLikeScopeKind.Base]:
    """
    Get the base classes of a compound object.
    """
    base_classes = []
    if compound_object.basecompoundref:
        for base in compound_object.basecompoundref:
            # base is a compoundRefType with:
            # - refid: reference ID to the base class definition
            # - prot: protection level (public, protected, private)
            # - virt: virtual inheritance (non-virtual, virtual, pure-virtual)
            # - valueOf_: the name of the base class
            base_name = base.valueOf_
            base_prot = base.prot
            base_virt = base.virt
            base_refid = base.refid

            if base_prot == "private":
                # Ignore private base classes
                continue

            base_classes.append(
                StructLikeScopeKind.Base(
                    base_name,
                    base_prot,
                    base_virt == "virtual",
                    base_refid,
                )
            )
    return base_classes


def get_variable_member(
    member_def: compound.MemberdefType,
    visibility: str,
    is_static: bool = False,
) -> VariableMember:
    """
    Get the variable member from a member definition.
    """
    variable_name = member_def.get_name()

    if len(variable_name) == 0:
        # Ignore anonymous variables
        return None

    variable_type = resolve_ref_text_name(member_def.get_type()).strip()
    variable_value = None
    variable_definition = member_def.definition
    variable_argstring = member_def.get_argsstring()

    is_constexpr = member_def.constexpr == "yes"
    is_mutable = member_def.mutable == "yes"

    if is_constexpr and variable_type.find("constexpr") != -1:
        variable_type = variable_type.replace("constexpr", "").strip()

    is_const = variable_type.startswith("const")
    if is_const:
        variable_type = variable_type[5:].strip()

    if member_def.initializer is not None:
        variable_value = resolve_linked_text_name(member_def.initializer)

    return VariableMember(
        variable_name,
        variable_type,
        visibility,
        is_const,
        is_static,
        is_constexpr,
        is_mutable,
        variable_value,
        variable_definition,
        variable_argstring,
    )


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
            # classes and structs are represented by the same scope with a different kind
            if (
                compound_object.kind == "class"
                or compound_object.kind == "struct"
                or compound_object.kind == "union"
            ):
                class_scope = (
                    snapshot.create_struct_like(
                        compound_object.compoundname, StructLikeScopeKind.Type.CLASS
                    )
                    if compound_object.kind == "class"
                    else snapshot.create_struct_like(
                        compound_object.compoundname, StructLikeScopeKind.Type.STRUCT
                    )
                    if compound_object.kind == "struct"
                    else snapshot.create_struct_like(
                        compound_object.compoundname, StructLikeScopeKind.Type.UNION
                    )
                )

                class_scope.kind.add_base(get_base_classes(compound_object))
                class_scope.location = compound_object.location.file

                for section_def in compound_object.sectiondef:
                    kind = section_def.kind
                    parts = kind.split("-")
                    visibility = parts[0]
                    is_static = "static" in parts
                    member_type = parts[-1]

                    if visibility == "private":
                        pass
                    elif visibility in ("public", "protected"):
                        if member_type == "attrib":
                            for member_def in section_def.memberdef:
                                if member_def.kind == "variable":
                                    class_scope.add_member(
                                        get_variable_member(
                                            member_def, visibility, is_static
                                        )
                                    )
                        else:
                            print(
                                f"Unknown class section kind: {kind} in {compound_object.location.file}"
                            )
                    elif visibility == "friend":
                        # Ignore friend declarations, they are not meaningful for the public API surface
                        pass
                    elif visibility == "property":
                        print(
                            f"Property not supported: {compound_object.compoundname} in {compound_object.location.file}"
                        )
                    else:
                        print(
                            f"Unknown class visibility: {visibility} in {compound_object.location.file}"
                        )
            elif compound_object.kind == "namespace":
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
                    else:
                        print(
                            f"Unknown section kind: {section_def.kind} in {compound_object.location.file}"
                        )
            elif compound_object.kind == "file":
                pass
            elif compound_object.kind == "dir":
                pass
            elif compound_object.kind == "category":
                print(f"Category not supported: {compound_object.compoundname}")
            elif compound_object.kind == "page":
                # Contains deprecation info
                pass
            elif compound_object.kind == "protocol":
                print(f"Protocol not supported: {compound_object.compoundname}")
            else:
                print(f"Unknown compound kind: {compound_object.kind}")

    snapshot.finish()
    return snapshot
