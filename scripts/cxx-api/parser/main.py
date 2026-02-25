# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import os
from pprint import pprint

from doxmlparser import compound, index

from .member import (
    ConceptMember,
    EnumMember,
    FunctionMember,
    TypedefMember,
    VariableMember,
)
from .scope import StructLikeScopeKind
from .snapshot import Snapshot
from .template import Template
from .utils import Argument, extract_qualifiers, parse_qualified_path


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


def resolve_linked_text_full(type_def: compound.linkedTextType) -> str:
    """
    Resolve the full text content of a linkedTextType, including all text
    fragments and ref elements.

    Unlike resolve_linked_text_name which only gets the first ref or value,
    this function concatenates all content_ items to reconstruct the full text.
    """
    if not type_def.content_:
        # Fall back to valueOf_ if no content_ list
        return type_def.get_valueOf_() or ""

    result = []
    for item in type_def.content_:
        if item.category == 1:  # MixedContainer.CategoryText
            result.append(item.value)
        elif item.category == 3:  # MixedContainer.CategoryComplex (ref element)
            # For ref elements, get the text content
            if hasattr(item.value, "get_valueOf_"):
                result.append(item.value.get_valueOf_())
            elif hasattr(item.value, "valueOf_"):
                result.append(item.value.valueOf_)
            else:
                result.append(str(item.value))

    return "".join(result)


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


def get_template_params(
    compound_object: compound.CompounddefType,
) -> [Template]:
    """
    Get the template parameters of a compound object.
    """
    template_params = []
    if compound_object.templateparamlist is not None:
        for param in compound_object.templateparamlist.param:
            template_value = (
                resolve_ref_text_name(param.defval) if param.defval else None
            )
            template_name = param.defname
            template_type = resolve_ref_text_name(param.get_type())

            if template_name is None:
                # Split type string and extract name from the end
                # Handles: "typename T", "class T", "int N", etc.
                parts = template_type.strip().split()
                if len(parts) >= 2:
                    template_type = " ".join(parts[:-1])
                    template_name = parts[-1]
                elif len(parts) == 1:
                    # Just a name like "T" with no type keyword
                    template_name = parts[0]

            template_params.append(
                Template(template_type, template_name, template_value)
            )
    return template_params


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


def get_doxygen_params(
    function_def: compound.MemberdefType,
) -> list[tuple[str | None, str, str | None, str | None]] | None:
    """
    Extract structured parameter information from doxygen <param> elements.

    Returns a list of Argument tuples (qualifiers, type, name, default_value),
    or None if no <param> elements are available.
    """
    params = function_def.param
    if not params:
        return None

    arguments: list[Argument] = []
    for param in params:
        param_type = (
            resolve_ref_text_name(param.get_type()).strip() if param.get_type() else ""
        )
        param_name = param.declname or param.defname or None
        param_default = (
            resolve_ref_text_name(param.defval).strip() if param.defval else None
        )

        qualifiers, core_type = extract_qualifiers(param_type)
        arguments.append((qualifiers, core_type, param_name, param_default))

    return arguments


def get_function_member(
    function_def: compound.MemberdefType,
    visibility: str,
    is_static: bool = False,
) -> FunctionMember:
    """
    Get the function member from a member definition.
    """
    function_name = function_def.get_name()
    function_type = resolve_ref_text_name(function_def.get_type())
    function_arg_string = function_def.get_argsstring()
    function_virtual = (
        function_def.get_virt() == "virtual"
        or function_def.get_virt() == "pure-virtual"
    )

    doxygen_params = get_doxygen_params(function_def)

    function = FunctionMember(
        function_name,
        function_type,
        visibility,
        function_arg_string,
        function_virtual,
        is_static,
        doxygen_params,
    )

    function.add_template(get_template_params(function_def))

    return function


def get_typedef_member(
    typedef_def: compound.memberdefType, visibility: str
) -> TypedefMember:
    typedef_name = typedef_def.get_name()
    typedef_type = resolve_ref_text_name(typedef_def.get_type())
    typedef_argstring = typedef_def.get_argsstring()
    typedef_definition = typedef_def.definition

    typedef_keyword = "using"
    if typedef_definition.startswith("typedef"):
        typedef_keyword = "typedef"

    typedef = TypedefMember(
        typedef_name,
        typedef_type,
        typedef_argstring,
        visibility,
        typedef_keyword,
    )

    typedef.add_template(get_template_params(typedef_def))

    return typedef


def get_concept_member(
    concept_def: compound.CompounddefType,
) -> ConceptMember:
    """
    Get the concept member from a compound definition.
    """
    concept_name = concept_def.compoundname
    concept_path = parse_qualified_path(concept_name)
    unqualified_name = concept_path[-1]

    initializer = concept_def.initializer
    constraint = ""

    if initializer:
        # The initializer contains the entire constraind definition.
        # We want to extract the constraint part after "="
        initializer_text = resolve_linked_text_full(initializer)
        eq_pos = initializer_text.find("=")
        if eq_pos != -1:
            constraint = initializer_text[eq_pos + 1 :].strip()

    concept = ConceptMember(unqualified_name, constraint)
    concept.add_template(get_template_params(concept_def))

    return concept


def create_enum_scope(snapshot: Snapshot, enum_def: compound.EnumdefType):
    """
    Create an enum scope in the snapshot.
    """
    scope = snapshot.create_enum(enum_def.qualifiedname)
    scope.kind.type = resolve_ref_text_name(enum_def.get_type())
    scope.location = enum_def.location.file

    for enum_value_def in enum_def.enumvalue:
        value_name = enum_value_def.get_name()
        value_value = None

        if enum_value_def.initializer is not None:
            value_value = resolve_linked_text_name(enum_value_def.initializer)

        scope.add_member(
            EnumMember(
                value_name,
                value_value,
            ),
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
                class_scope.kind.add_template(get_template_params(compound_object))
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
                        elif member_type == "func":
                            for function_def in section_def.memberdef:
                                class_scope.add_member(
                                    get_function_member(
                                        function_def, visibility, is_static
                                    )
                                )
                        elif member_type == "type":
                            for member_def in section_def.memberdef:
                                if member_def.kind == "enum":
                                    create_enum_scope(snapshot, member_def)
                                elif member_def.kind == "typedef":
                                    class_scope.add_member(
                                        get_typedef_member(member_def, visibility)
                                    )
                                else:
                                    print(
                                        f"Unknown section member kind: {member_def.kind} in {compound_object.location.file}"
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
