import { readPatch } from "./read"
import { getPackageDetailsFromPatchFilename } from "../PackageDetails"

const removeAnsiCodes = (s: string) =>
  s.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  )

jest.mock("fs-extra", () => ({
  readFileSync: jest.fn(),
}))
jest.mock("./parse", () => ({
  parsePatchFile: jest.fn(() => {
    throw new Error("hunk integrity check failed etc")
  }),
}))

const error = jest.fn()
console.error = error
process.cwd = jest.fn(() => "/test/root")
process.exit = jest.fn() as any

describe(readPatch, () => {
  beforeEach(() => {
    error.mockReset()
  })
  it("throws an error for basic packages", () => {
    readPatch({
      patchFilePath: "/test/root/patches/test+1.2.3.patch",
      packageDetails: getPackageDetailsFromPatchFilename("test+1.2.3.patch")!,
      patchDir: "patches/",
    })

    expect(removeAnsiCodes(error.mock.calls[0][0])).toMatchInlineSnapshot(`
"
**ERROR** Failed to apply patch for package test
    
  This happened because the patch file patches/test+1.2.3.patch could not be parsed.
   
  If you just upgraded patch-package, you can try running:
  
    patch -p1 -i patches/test+1.2.3.patch
    npx patch-package test
    
  Otherwise, try manually creating the patch file again.
  
  If the problem persists, please submit a bug report:
  
    https://github.com/ds300/patch-package/issues/new?title=Patch+file+parse+error&body=%3CPlease+attach+the+patch+file+in+question%3E

"
`)
  })

  it("throws an error for scoped packages", () => {
    readPatch({
      patchFilePath: "/test/root/patches/@david+test+1.2.3.patch",
      packageDetails: getPackageDetailsFromPatchFilename(
        "@david+test+1.2.3.patch",
      )!,
      patchDir: "patches/",
    })

    expect(removeAnsiCodes(error.mock.calls[0][0])).toMatchInlineSnapshot(`
"
**ERROR** Failed to apply patch for package @david/test
    
  This happened because the patch file patches/@david+test+1.2.3.patch could not be parsed.
   
  If you just upgraded patch-package, you can try running:
  
    patch -p1 -i patches/@david+test+1.2.3.patch
    npx patch-package @david/test
    
  Otherwise, try manually creating the patch file again.
  
  If the problem persists, please submit a bug report:
  
    https://github.com/ds300/patch-package/issues/new?title=Patch+file+parse+error&body=%3CPlease+attach+the+patch+file+in+question%3E

"
`)
  })

  it("throws an error for nested packages", () => {
    const patchFileName = "@david+test++react-native+1.2.3.patch"
    readPatch({
      patchFilePath: `/test/root/patches/${patchFileName}`,
      packageDetails: getPackageDetailsFromPatchFilename(patchFileName)!,
      patchDir: "patches/",
    })

    expect(removeAnsiCodes(error.mock.calls[0][0])).toMatchInlineSnapshot(`
"
**ERROR** Failed to apply patch for package @david/test => react-native
    
  This happened because the patch file patches/@david+test++react-native+1.2.3.patch could not be parsed.
   
  If you just upgraded patch-package, you can try running:
  
    patch -p1 -i patches/@david+test++react-native+1.2.3.patch
    npx patch-package @david/test/react-native
    
  Otherwise, try manually creating the patch file again.
  
  If the problem persists, please submit a bug report:
  
    https://github.com/ds300/patch-package/issues/new?title=Patch+file+parse+error&body=%3CPlease+attach+the+patch+file+in+question%3E

"
`)
  })

  it("throws an error for with custom patch dir", () => {
    const patchFileName = "@david+test++react-native+1.2.3.patch"
    readPatch({
      patchFilePath: `/test/root/.cruft/patches/${patchFileName}`,
      packageDetails: getPackageDetailsFromPatchFilename(patchFileName)!,
      patchDir: ".cruft/patches",
    })

    expect(removeAnsiCodes(error.mock.calls[0][0])).toMatchInlineSnapshot(`
"
**ERROR** Failed to apply patch for package @david/test => react-native
    
  This happened because the patch file .cruft/patches/@david+test++react-native+1.2.3.patch could not be parsed.
   
  If you just upgraded patch-package, you can try running:
  
    patch -p1 -i .cruft/patches/@david+test++react-native+1.2.3.patch
    npx patch-package @david/test/react-native
    
  Otherwise, try manually creating the patch file again.
  
  If the problem persists, please submit a bug report:
  
    https://github.com/ds300/patch-package/issues/new?title=Patch+file+parse+error&body=%3CPlease+attach+the+patch+file+in+question%3E

"
`)
  })

  it("throws an error with cd instruction for unhoisted packages", () => {
    const patchFileName = "@david+test++react-native+1.2.3.patch"
    readPatch({
      patchFilePath: `/test/root/packages/banana/patches/${patchFileName}`,
      packageDetails: getPackageDetailsFromPatchFilename(patchFileName)!,
      patchDir: "patches/",
    })

    expect(process.cwd).toHaveBeenCalled()

    expect(removeAnsiCodes(error.mock.calls[0][0])).toMatchInlineSnapshot(`
"
**ERROR** Failed to apply patch for package @david/test => react-native
    
  This happened because the patch file packages/banana/patches/@david+test++react-native+1.2.3.patch could not be parsed.
   
  If you just upgraded patch-package, you can try running:
  
    cd packages/banana/
    patch -p1 -i patches/@david+test++react-native+1.2.3.patch
    npx patch-package @david/test/react-native
    cd ../..
    
  Otherwise, try manually creating the patch file again.
  
  If the problem persists, please submit a bug report:
  
    https://github.com/ds300/patch-package/issues/new?title=Patch+file+parse+error&body=%3CPlease+attach+the+patch+file+in+question%3E

"
`)
  })

  it("throws an error with cd instruction for unhoisted packages and custom patchDir", () => {
    const patchFileName = "@david+test++react-native+1.2.3.patch"
    readPatch({
      patchFilePath: `/test/root/packages/banana/.patches/${patchFileName}`,
      packageDetails: getPackageDetailsFromPatchFilename(patchFileName)!,
      patchDir: ".patches/",
    })

    expect(process.cwd).toHaveBeenCalled()

    expect(removeAnsiCodes(error.mock.calls[0][0])).toMatchInlineSnapshot(`
"
**ERROR** Failed to apply patch for package @david/test => react-native
    
  This happened because the patch file packages/banana/.patches/@david+test++react-native+1.2.3.patch could not be parsed.
   
  If you just upgraded patch-package, you can try running:
  
    cd packages/banana/
    patch -p1 -i .patches/@david+test++react-native+1.2.3.patch
    npx patch-package @david/test/react-native
    cd ../..
    
  Otherwise, try manually creating the patch file again.
  
  If the problem persists, please submit a bug report:
  
    https://github.com/ds300/patch-package/issues/new?title=Patch+file+parse+error&body=%3CPlease+attach+the+patch+file+in+question%3E

"
`)
  })
})
