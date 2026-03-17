// swift-tools-version: 6.0
import PackageDescription
import Foundation

let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path

// Ensure stub sub-packages exist so SPM can resolve on fresh clones.
// Overwritten by the auto-sync build phase on first build.
do {
    let fm = FileManager.default
    let stubs: [(String, String)] = [
        ("build/xcframeworks", """
        // swift-tools-version: 5.9
        import PackageDescription
        let package = Package(name: "ReactNative", products: [
            .library(name: "ReactNative", targets: ["ReactNativeStub"]),
            .library(name: "ReactNativeDependencies", targets: ["ReactNativeStub"]),
            .library(name: "hermes-engine", targets: ["ReactNativeStub"]),
        ], targets: [.target(name: "ReactNativeStub", path: "_stub", sources: ["Stub.swift"])])
        """),
        ("autolinked", """
        // swift-tools-version: 5.9
        import PackageDescription
        let package = Package(name: "Autolinked", products: [
            .library(name: "Autolinked", targets: ["AutolinkedStub"]),
        ], targets: [.target(name: "AutolinkedStub", path: "_stub", sources: ["Stub.swift"])])
        """),
        ("build/generated/ios", """
        // swift-tools-version: 5.9
        import PackageDescription
        let package = Package(name: "React-GeneratedCode", products: [
            .library(name: "ReactCodegen", targets: ["ReactGeneratedCodeStub"]),
            .library(name: "ReactAppDependencyProvider", targets: ["ReactGeneratedCodeStub"]),
        ], targets: [.target(name: "ReactGeneratedCodeStub", path: "_stub", sources: ["Stub.swift"])])
        """),
    ]
    for (dir, content) in stubs {
        let pkgSwift = packageDir + "/" + dir + "/Package.swift"
        if !fm.fileExists(atPath: pkgSwift) {
            try? fm.createDirectory(atPath: packageDir + "/" + dir + "/_stub", withIntermediateDirectories: true)
            try? content.write(toFile: pkgSwift, atomically: true, encoding: .utf8)
            try? "// Placeholder".write(toFile: packageDir + "/" + dir + "/_stub/Stub.swift", atomically: true, encoding: .utf8)
        }
    }
}

let xcfwHeaders = URL(fileURLWithPath: packageDir + "/build/xcframeworks/React.xcframework")
    .resolvingSymlinksInPath().path + "/Headers"
let depsHeaders = URL(fileURLWithPath: packageDir + "/build/xcframeworks/ReactNativeDependencies.xcframework")
    .resolvingSymlinksInPath().path + "/Headers"
let vfsOverlay = packageDir + "/build/xcframeworks/React-VFS.yaml"

let cFlags: [String] = ["-ivfsoverlay", vfsOverlay, "-I", xcfwHeaders,
    "-I", packageDir + "/autolinked/sources"]
let cxxFlags: [String] = cFlags + ["-I", depsHeaders]
let swiftFlags: [String] = ["-Xcc", "-ivfsoverlay", "-Xcc", vfsOverlay, "-Xcc", "-I", "-Xcc", xcfwHeaders]

let package = Package(
    name: "Helloworld",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "HelloworldApp", targets: ["HelloworldApp"]),
    ],
    dependencies: [
        .package(name: "Autolinked", path: "autolinked"),
        .package(name: "React-GeneratedCode", path: "build/generated/ios"),
        .package(name: "ReactNative", path: "build/xcframeworks"),
    ],
    targets: [
        .target(
            name: "HelloworldApp",
            dependencies: [
                .product(name: "ReactNative", package: "ReactNative"),
                .product(name: "ReactNativeDependencies", package: "ReactNative"),
                .product(name: "hermes-engine", package: "ReactNative"),
                .product(name: "Autolinked", package: "Autolinked"),
                .product(name: "ReactCodegen", package: "React-GeneratedCode"),
                .product(name: "ReactAppDependencyProvider", package: "React-GeneratedCode"),
            ],
            path: "Helloworld",
            exclude: ["Info.plist", "Images.xcassets", "LaunchScreen.storyboard"],
            cSettings: [.unsafeFlags(cFlags)],
            cxxSettings: [.unsafeFlags(cxxFlags)],
            swiftSettings: [.unsafeFlags(swiftFlags)]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
