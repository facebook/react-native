//
//  NativeLocalStorage.swift
//  HelloWorld
//
//  Created by Riccardo Cipolleschi on 20/07/2025.
//

import Foundation
import ReactAppDependencyProvider

class NativeLocalStorage: NSObject, NativeLocalStorageSpec {
  private let storage: UserDefaults = UserDefaults(suiteName: "local-storage") ?? .standard
  func setItem(_ value: String, key: String) {
    storage.setValue(value, forKey: key)
  }
  
  func getItem(_ key: String) -> String? {
    storage.string(forKey: key)
  }
  
  func removeItem(_ key: String) {
    storage.removeObject(forKey: key)
  }
  
  func clear() {
    storage.dictionaryRepresentation().keys.forEach { storage.removeObject(forKey: $0) }
  }
  
  static func moduleName() -> String! {
    return "NativeLocalStorage"
  }
  
  
}
