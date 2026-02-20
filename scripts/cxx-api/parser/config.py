# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Config parsing module for C++ API snapshot generation.

This module handles parsing of the config.yml file and provides
structured objects representing API views and their variants.
"""

import os
from dataclasses import dataclass, field

import yaml


@dataclass
class ApiViewVariant:
    """Represents a build variant (e.g., debug, release) for an API view."""

    name: str
    definitions: dict[str, str | int] = field(default_factory=dict)


@dataclass
class ApiViewSnapshotConfig:
    """
    A fully resolved configuration for generating a single snapshot.

    This combines the base view settings with variant-specific definitions.
    """

    snapshot_name: str
    inputs: list[str]
    exclude_patterns: list[str]
    definitions: dict[str, str | int]


def parse_config(
    raw_config: dict,
    base_dir: str,
    codegen_path: str | None = None,
) -> list[ApiViewSnapshotConfig]:
    """
    Parse a raw config dictionary and return a flattened list of snapshot configs.

    Args:
        raw_config: Dictionary containing the parsed YAML config
        base_dir: Base directory for resolving relative input paths
        codegen_path: Optional path to codegen generated code

    Returns:
        Flattened list of ApiViewSnapshotConfig objects for all views and variants
    """
    snapshot_configs = []

    for view_name, view_config in raw_config.items():
        inputs = [
            path if path.startswith("/") else os.path.join(base_dir, path)
            for path in (view_config.get("inputs") or [])
        ]

        include_codegen = view_config.get("include_codegen", False)
        if include_codegen and codegen_path:
            inputs.append(os.path.abspath(codegen_path))

        exclude_patterns = view_config.get("exclude_patterns") or []
        base_definitions = view_config.get("definitions") or {}

        raw_variants = view_config.get("variants") or {}
        variants = [
            ApiViewVariant(
                name=variant_name,
                definitions=variant_config.get("definitions") or {},
            )
            for variant_name, variant_config in raw_variants.items()
        ]

        if not variants:
            snapshot_configs.append(
                ApiViewSnapshotConfig(
                    snapshot_name=view_name,
                    inputs=inputs,
                    exclude_patterns=exclude_patterns,
                    definitions=base_definitions,
                )
            )
        else:
            for variant in variants:
                merged_definitions = {**base_definitions, **variant.definitions}
                variant_suffix = variant.name.capitalize()
                snapshot_configs.append(
                    ApiViewSnapshotConfig(
                        snapshot_name=f"{view_name}{variant_suffix}",
                        inputs=inputs,
                        exclude_patterns=exclude_patterns,
                        definitions=merged_definitions,
                    )
                )

    return snapshot_configs


def parse_config_file(
    config_path: str,
    base_dir: str,
    codegen_path: str | None = None,
) -> list[ApiViewSnapshotConfig]:
    """
    Parse the config.yml file and return a flattened list of snapshot configs.

    Args:
        config_path: Path to the config.yml file
        base_dir: Base directory for resolving relative input paths
        codegen_path: Optional path to codegen generated code

    Returns:
        Flattened list of ApiViewSnapshotConfig objects for all views and variants
    """
    with open(config_path, "r") as stream:
        raw_config = yaml.safe_load(stream)

    return parse_config(raw_config, base_dir, codegen_path)
