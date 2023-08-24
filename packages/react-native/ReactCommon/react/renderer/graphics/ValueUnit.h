#pragma once

namespace facebook::react {

enum class UnitType {
  UNDEFINED,
  POINT,
  PERCENT
};

struct ValueUnit {
  float value;
  UnitType unit;
  
  ValueUnit() : value(0.0f), unit(UnitType::UNDEFINED) {}
  
  ValueUnit(float v, UnitType u) : value(v), unit(u) {}
  
  bool operator==(const ValueUnit& other) const {
    return value == other.value && unit == other.unit;
  }
  bool operator!=(const ValueUnit& other) const {
    return !(*this == other);
  }
};
}
