package com.facebook.react.processing;

import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.SuppressFieldNotInitialized;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.squareup.javapoet.ClassName;
import com.squareup.javapoet.CodeBlock;
import com.squareup.javapoet.JavaFile;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.Filer;
import javax.annotation.processing.Messager;
import javax.annotation.processing.ProcessingEnvironment;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.Modifier;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.VariableElement;
import javax.lang.model.type.TypeMirror;
import javax.lang.model.util.Elements;
import javax.lang.model.util.Types;
import javax.tools.Diagnostic;

import static javax.lang.model.element.Modifier.PUBLIC;

/**
 * This annotation processor crawls subclasses of BaseJavaModule and finds their
 * exported methods with the @ReactMethod or @ReactSyncHook annotation. It generates a class implements @ModuleHelper
 * per native module and CoreModuleProvider class to provide module helper for native modules. This class contains methods to retrieve description of all
 * methods and a way to invoke methods without reflection.
 *
 * @author ransj
 */
@SupportedAnnotationTypes("com.facebook.react.bridge.ReactMethod")
@SupportedSourceVersion(SourceVersion.RELEASE_7)
public class ReactNativeModuleProcessor extends AbstractProcessor {
  private static final ClassName JAVA_MODULE_WRAPPER = ClassName.get("com.facebook.react.bridge", "JavaModuleWrapper");
  private static final ClassName METHOD_DESCRIPTION = ClassName.get("com.facebook.react.bridge", "MethodDescriptor");
  private static final ClassName NATIVE_MODULE_HELPER = ClassName.get("com.facebook.react.bridge", "AcJavaModuleWrapper", "ModuleHelper");
  private static final ClassName NATIVE_MODULE_PROVIDER = ClassName.get("com.facebook.react.bridge", "AcJavaModuleWrapper", "ModuleProvider");
  private static final ClassName JSINSTANCE = ClassName.get("com.facebook.react.bridge", "JSInstance");
  private static final ClassName READABLENATIVEARRAY = ClassName.get("com.facebook.react.bridge", "ReadableNativeArray");
  private static final ClassName BASE_JAVA_MODULE = ClassName.get("com.facebook.react.bridge", "BaseJavaModule");
  private static final ClassName NATIVE_ARGUMENTS_PARSE_EXCEPTION = ClassName.get("com.facebook.react.bridge", "NativeArgumentsParseException");
  private static final ClassName DYNAMICFROMARRAY = ClassName.get("com.facebook.react.bridge", "DynamicFromArray");
  private static final ClassName CALLBACKIMP = ClassName.get("com.facebook.react.bridge", "CallbackImpl");
  private static final ClassName PROMISEIMP = ClassName.get("com.facebook.react.bridge", "PromiseImpl");
  private static final TypeName GET_METHOD_DESCRIPTIONS_LIST_TYPE =
    ParameterizedTypeName.get(ClassName.get(List.class), METHOD_DESCRIPTION);

  private final Map<String, ClassInfo> mClasses;

  private static final String FIELD_NAME_BASE_JAVA_MODULE = "mNativeModule";
  private static final String FIELD_NAME_METHODS_DESC = "mMethodsDesc";

  @SuppressFieldNotInitialized
  private Filer mFiler;
  @SuppressFieldNotInitialized
  private Messager mMessager;
  @SuppressFieldNotInitialized
  private Elements mElements;
  @SuppressFieldNotInitialized
  private Types mTypes;

  public ReactNativeModuleProcessor() {
    mClasses = new HashMap<>();
  }

  @Override
  public synchronized void init(ProcessingEnvironment processingEnvironment) {
    super.init(processingEnvironment);
    mFiler = processingEnvironment.getFiler();
    mMessager = processingEnvironment.getMessager();
    mTypes = processingEnvironment.getTypeUtils();
    mElements = processingEnvironment.getElementUtils();
  }

  @Override
  public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
    mClasses.clear();
    for (TypeElement te : annotations) {
      for (Element mele : roundEnv.getElementsAnnotatedWith(te)) {
        ClassName clsName = ClassName.get((TypeElement) mele.getEnclosingElement());
        String key = clsName.reflectionName();
        ReactMethod method = mele.getAnnotation(ReactMethod.class);
        boolean isSyncHook = method.isBlockingSynchronousMethod();
        mMessager.printMessage(Diagnostic.Kind.NOTE, "process " + key + " , " + mele);
        mMessager.printMessage(Diagnostic.Kind.NOTE, method + " , " + isSyncHook);
        ClassInfo clsInfo = mClasses.get(key);
        if (clsInfo == null) {
          clsInfo = new ClassInfo(clsName);
          mClasses.put(key, clsInfo);
        }
        clsInfo.addMethod(new MethodInfo((ExecutableElement) mele, isSyncHook, mTypes, mElements));
      }
    }
    int count = 0;
    List<ClassInfo> classInfos = new ArrayList<>();
    for (ClassInfo info : mClasses.values()) {
      writeToFile(info, count++);
      classInfos.add(info);
    }
    if (!classInfos.isEmpty()) {
      writeModuleProvider(classInfos);
    }
    return true;
  }

  @Override
  public Set<String> getSupportedAnnotationTypes() {
    Set<String> set = new HashSet<>();
    set.add("com.facebook.react.bridge.ReactMethod");
    return set;
  }

  @Override
  public SourceVersion getSupportedSourceVersion() {
    return SourceVersion.RELEASE_7;
  }

  private void writeToFile(ClassInfo classInfo, int index) {
    String targetCls = JAVA_MODULE_WRAPPER.simpleName()+"$"+index;
    ClassName className = classInfo.mClsName;
    TypeSpec holderClass = TypeSpec.classBuilder(targetCls)
      .addSuperinterface(NATIVE_MODULE_HELPER)
      .addModifiers(PUBLIC)
      .addField(className, FIELD_NAME_BASE_JAVA_MODULE, Modifier.PRIVATE)
      .addField(GET_METHOD_DESCRIPTIONS_LIST_TYPE, FIELD_NAME_METHODS_DESC, Modifier.PRIVATE)
      .addMethod(generateHelperConstructor(className))
      .addMethod(generateMethodGetMethodDescriptors(classInfo.mMethods))
      .addMethod(generateMethodInvoke(classInfo.mMethods))
      .build();
    JavaFile javaFile = JavaFile.builder(JAVA_MODULE_WRAPPER.packageName(), holderClass)
      .addFileComment("Generated by " + getClass().getName())
      .build();

    try {
      javaFile.writeTo(mFiler);
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private MethodSpec generateHelperConstructor(ClassName className) {
    MethodSpec method = MethodSpec.constructorBuilder()
      .addModifiers(PUBLIC)
      .addParameter(className, "module")
      .addStatement("mNativeModule = $L", "module")
      .build();
    return method;
  }

  private MethodSpec generateMethodGetMethodDescriptors(List<MethodInfo> methodInfos) {
    CodeBlock.Builder builder = CodeBlock.builder();
    builder.beginControlFlow("if ($L == null)", FIELD_NAME_METHODS_DESC);
    builder.addStatement("$L = new $T<>()", FIELD_NAME_METHODS_DESC, ArrayList.class);
    for (int i = 0, len = methodInfos.size(); i < len; i++) {
      MethodInfo methodInfo = methodInfos.get(i);
      builder.add("\n");
      builder.add("// method $L \n", methodInfo.mName);
      builder.addStatement("$T $L = new $T()", METHOD_DESCRIPTION, methodInfo.mName, METHOD_DESCRIPTION);
      builder.addStatement("$L.name = $S", methodInfo.mName, methodInfo.mName);
      builder.addStatement("$L.type = $T.$L", methodInfo.mName, BASE_JAVA_MODULE, methodInfo.mMethodType);
      if (methodInfo.isSyncMethod()) {
        builder.addStatement("$L.signature = $S", methodInfo.mName, methodInfo.mSignature);
      }
      builder.addStatement("$L.add($L)", FIELD_NAME_METHODS_DESC, methodInfo.mName);
    }
    builder.endControlFlow();
    builder.addStatement("return $L", FIELD_NAME_METHODS_DESC);
    MethodSpec method = MethodSpec.methodBuilder("getMethodDescriptors")
      .addAnnotation(Override.class)
      .addModifiers(PUBLIC)
      .returns(GET_METHOD_DESCRIPTIONS_LIST_TYPE)
      .addCode(builder.build())
      .build();
    return method;
  }

  private MethodSpec generateMethodInvoke(List<MethodInfo> methodInfos) {
    CodeBlock.Builder builder = CodeBlock.builder();
    builder.add("switch( $L ) {\n", "methodId");
    int size = methodInfos.size();
    for (int i = 0; i < size; i++) {
      MethodInfo methodInfo = methodInfos.get(i);
      builder.indent().add("case $L:\n", i);
      builder.add(methodInfo.createInvokeMethod());
      builder.unindent().add("break;\n").unindent();
    }
    builder.add("}\n");
    MethodSpec method = MethodSpec.methodBuilder("invoke")
      .addAnnotation(Override.class)
      .addModifiers(PUBLIC)
      .addParameter(JSINSTANCE, "jsInstance")
      .addParameter(int.class, "methodId")
      .addParameter(READABLENATIVEARRAY, "parameters")
      .addCode(builder.build())
      .build();
    return method;
  }

  private void writeModuleProvider(List<ClassInfo> classInfos) {
    CodeBlock.Builder builder = CodeBlock.builder();
    for (int i = 0, len = classInfos.size(); i < len; i++) {
      ClassInfo info = classInfos.get(i);
      builder.add("if ($L instanceof $T) {\n", "module", info.mClsName);
      builder.indent().addStatement("return new $T(($T)$L)",
        ClassName.get(JAVA_MODULE_WRAPPER.packageName(), JAVA_MODULE_WRAPPER.simpleName() + "$" + i),
        info.mClsName,
        "module");
      builder.unindent();
      if (i < len - 1) {
        builder.add("} else ");
      }
    }
    builder.add("}\n");
    builder.addStatement("return null");
    MethodSpec methodSpec = MethodSpec.methodBuilder("getModuleHelper")
      .addModifiers(PUBLIC)
      .addAnnotation(Override.class)
      .addParameter(BASE_JAVA_MODULE, "module")
      .returns(NATIVE_MODULE_HELPER)
      .addCode(builder.build())
      .build();
    String clsName = JAVA_MODULE_WRAPPER.simpleName() + "$CoreModuleProvider";
    TypeSpec holderClass = TypeSpec.classBuilder(clsName)
      .addSuperinterface(NATIVE_MODULE_PROVIDER)
      .addMethod(methodSpec)
      .build();
    JavaFile javaFile = JavaFile.builder(JAVA_MODULE_WRAPPER.packageName(), holderClass)
      .addFileComment("Generated by " + getClass().getName())
      .build();

    try {
      javaFile.writeTo(mFiler);
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private class ClassInfo {
    private List<MethodInfo> mMethods = new ArrayList<>();
    private ClassName mClsName;

    public ClassInfo(ClassName className) {
      mClsName = className;
    }

    public void addMethod(MethodInfo method) {
      Assertions.assertCondition(
        !mMethods.contains(method), "Java Module " + mClsName.simpleName() + " method name already registered: " + method.mName);
      mMethods.add(method);
    }
  }

  private static class MethodInfo {
    static final String TYPE_RESULT_ASYNC = "METHOD_TYPE_ASYNC";
    static final String TYPE_RESULT_PROMISE = "METHOD_TYPE_PROMISE";
    static final String TYPE_RESULT_SYNC = "METHOD_TYPE_SYNC";
    String mSignature;
    String mName;
    private List<? extends VariableElement> mParameters;
    private int mParametersNum;
    private boolean mIsSyncHook;
    private String mMethodType = TYPE_RESULT_ASYNC;

    public MethodInfo(ExecutableElement executableElement, boolean isSyncHook, Types types, Elements elements) {
      mIsSyncHook = isSyncHook;
      mParameters = executableElement.getParameters();
      mParametersNum = mParameters.size();
      mSignature = buildSignature(isSyncHook, executableElement.getReturnType(), mParameters, types, elements);
      mName = executableElement.getSimpleName().toString();
    }

    public boolean isSyncMethod(){
      return mIsSyncHook;
    }

    private String buildSignature(boolean isSync, TypeMirror returnType, List<? extends VariableElement> paramTypes, Types types, Elements elements) {
      int size = paramTypes.size();
      StringBuilder builder = new StringBuilder(size);
      if (isSync) {
        builder.append(returnTypeToChar(returnType));
        builder.append(".");
      } else {
        builder.append("v.");
      }
      for (int i = 0; i < size; i++) {
        VariableElement parameter = paramTypes.get(i);
        TypeMirror mirror = parameter.asType();
        if (types.isSameType(mirror, elements.getTypeElement(Promise.class.getName()).asType())) {
          Assertions.assertCondition(
            i == size - 1, "Promise must be used as last parameter only");
          mMethodType = TYPE_RESULT_PROMISE;
          mParametersNum++;
        }
        builder.append(paramTypeToChar(parameter));
      }

      return builder.toString();
    }

    private char returnTypeToChar(TypeMirror type) {
      // Keep this in sync with MethodInvoker
      TypeName indexType = TypeName.get(type);
      char tryCommon = commonTypeToChar(indexType);
      if (tryCommon != '\0') {
        return tryCommon;
      }
      if (TypeName.get(void.class).equals(indexType)) {
        return 'v';
      } else if (TypeName.get(WritableMap.class).equals(indexType)) {
        return 'M';
      } else if (TypeName.get(WritableArray.class).equals(indexType)) {
        return 'A';
      } else {
        throw new RuntimeException(
          "Got unknown return class: " + indexType);
      }
    }

    private char paramTypeToChar(VariableElement parameter) {
      TypeName indexType = TypeName.get(parameter.asType());
      char tryCommon = commonTypeToChar(indexType);
      if (tryCommon != '\0') {
        return tryCommon;
      }
      if (indexType.equals(TypeName.get(Callback.class))) {
        return 'X';
      } else if (indexType.equals(TypeName.get(Promise.class))) {
        return 'P';
      } else if (indexType.equals(TypeName.get(ReadableMap.class))) {
        return 'M';
      } else if (indexType.equals(TypeName.get(ReadableArray.class))) {
        return 'A';
      } else if (indexType.equals(TypeName.get(Dynamic.class))) {
        return 'Y';
      } else {
        throw new RuntimeException(
          "Got unknown param class: " + indexType.toString());
      }
    }

    private char commonTypeToChar(TypeName indexType) {
      if (indexType.equals(TypeName.get(boolean.class))) {
        return 'z';
      } else if (indexType.equals(TypeName.get(Boolean.class))) {
        return 'Z';
      } else if (indexType.equals(TypeName.get(int.class))) {
        return 'i';
      } else if (indexType.equals(TypeName.get(Integer.class))) {
        return 'I';
      } else if (indexType.equals(TypeName.get(double.class))) {
        return 'd';
      } else if (indexType.equals(TypeName.get(Double.class))) {
        return 'D';
      } else if (indexType.equals(TypeName.get(float.class))) {
        return 'f';
      } else if (indexType.equals(TypeName.get(Float.class))) {
        return 'F';
      } else if (indexType.equals(TypeName.get(String.class))) {
        return 'S';
      } else {
        return '\0';
      }
    }

    public CodeBlock createInvokeMethod() {
      CodeBlock.Builder builder = CodeBlock.builder();
      builder.indent().add("if($L != $L.size()) {\n", mParametersNum, "parameters");
      builder.indent().add("throw new $T($L.getClass().getName()+\".\"+$S+\" got \"+$L.toString()+\"arguments, except \"+$L);\n", NATIVE_ARGUMENTS_PARSE_EXCEPTION, FIELD_NAME_BASE_JAVA_MODULE, mName, "parameters", mParametersNum);
      builder.unindent().add("}\n");
      builder.add("$L.$L(", FIELD_NAME_BASE_JAVA_MODULE, mName);
      int offset = 0;
      for (int i = 0, len = mParameters.size(); i < len; i++) {
        TypeName indexType = TypeName.get(mParameters.get(i).asType());
        if (indexType.equals(TypeName.get(boolean.class)) || indexType.equals(TypeName.get(Boolean.class))) {
          builder.add("$L.getBoolean($L)", "parameters", offset);
        } else if (indexType.equals(TypeName.get(double.class)) || indexType.equals(TypeName.get(Double.class))) {
          builder.add("$L.getDouble($L)", "parameters", offset);
        } else if (indexType.equals(TypeName.get(float.class)) || indexType.equals(TypeName.get(Float.class))) {
          builder.add("(float)$L.getDouble($L)", "parameters", offset);
        } else if (indexType.equals(TypeName.get(int.class)) || indexType.equals(TypeName.get(Integer.class))) {
          builder.add("(int)$L.getDouble($L)", "parameters", offset);
        } else if (indexType.equals(TypeName.get(String.class))) {
          builder.add("$L.getString($L)", "parameters", offset);
        } else if (indexType.equals(TypeName.get(ReadableArray.class))) {
          builder.add("$L.getArray($L)", "parameters", offset);
        } else if (indexType.equals(TypeName.get(Dynamic.class))) {
          builder.add("$T.create($L, $L)", DYNAMICFROMARRAY, "parameters", offset);
        } else if (indexType.equals(TypeName.get(ReadableMap.class))) {
          builder.add("$L.getMap($L)", "parameters", offset);
        } else if (indexType.equals(TypeName.get(Callback.class))) {
          builder.add("new $T($L, (int)$L.getDouble($L))", CALLBACKIMP, "jsInstance", "parameters", offset);
        } else if (indexType.equals(TypeName.get(Promise.class))) {
          builder.add("new $T(new $T($L, (int)$L.getDouble($L)), new $T($L, (int)$L.getDouble($L)))", PROMISEIMP
            , CALLBACKIMP, "jsInstance", "parameters", offset,
            CALLBACKIMP, "jsInstance", "parameters", offset + 1);
        } else {
          throw new RuntimeException("can not parse parameters in " + mName + ", index " + i + ", type " + indexType.toString() + ", " + ClassName.get(mParameters.get(i).asType()).toString());
        }
        if (i < len - 1) {
          builder.add(", ");
        }
        offset++;
      }
      builder.add(");\n");
      return builder.build();
    }

    @Override
    public boolean equals(Object o) {
      return o instanceof MethodInfo && ((MethodInfo) o).mName.equals(mName);
    }
  }
}
