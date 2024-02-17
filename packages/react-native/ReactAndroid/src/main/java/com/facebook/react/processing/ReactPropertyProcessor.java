/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.processing;

import static javax.lang.model.element.Modifier.ABSTRACT;
import static javax.lang.model.element.Modifier.PRIVATE;
import static javax.lang.model.element.Modifier.PUBLIC;
import static javax.tools.Diagnostic.Kind.ERROR;
import static javax.tools.Diagnostic.Kind.WARNING;

import com.facebook.annotationprocessors.common.ProcessorBase;
import com.facebook.infer.annotation.SuppressFieldNotInitialized;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.DynamicFromObject;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.annotations.ReactPropertyHolder;
import com.facebook.yoga.YogaValue;
import com.squareup.javapoet.ClassName;
import com.squareup.javapoet.CodeBlock;
import com.squareup.javapoet.JavaFile;
import com.squareup.javapoet.MethodSpec;
import com.squareup.javapoet.ParameterizedTypeName;
import com.squareup.javapoet.TypeName;
import com.squareup.javapoet.TypeSpec;
import com.squareup.javapoet.TypeVariableName;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;
import javax.annotation.processing.Filer;
import javax.annotation.processing.Messager;
import javax.annotation.processing.ProcessingEnvironment;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.ElementKind;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.VariableElement;
import javax.lang.model.type.TypeMirror;
import javax.lang.model.util.Elements;
import javax.lang.model.util.Types;

/**
 * This annotation processor crawls subclasses of ReactShadowNode and ViewManager and finds their
 * exported properties with the @ReactProp or @ReactGroupProp annotation. It generates a class per
 * shadow node/view manager that is named {@code <classname>$$PropsSetter}. This class contains
 * methods to retrieve the name and type of all methods and a way to set these properties without
 * reflection.
 */
@SupportedAnnotationTypes("com.facebook.react.uimanager.annotations.ReactPropertyHolder")
@SupportedSourceVersion(SourceVersion.RELEASE_7)
public class ReactPropertyProcessor extends ProcessorBase {
  private static final Map<TypeName, String> DEFAULT_TYPES;
  private static final Set<TypeName> BOXED_PRIMITIVES;

  private static final TypeName OBJECT_TYPE = TypeName.get(Object.class);
  private static final TypeName STRING_TYPE = TypeName.get(String.class);
  private static final TypeName READABLE_MAP_TYPE = TypeName.get(ReadableMap.class);
  private static final TypeName READABLE_ARRAY_TYPE = TypeName.get(ReadableArray.class);
  private static final TypeName DYNAMIC_TYPE = TypeName.get(Dynamic.class);
  private static final TypeName DYNAMIC_FROM_OBJECT_TYPE = TypeName.get(DynamicFromObject.class);
  private static final TypeName YOGA_VALUE_TYPE = TypeName.get(YogaValue.class);

  private static final TypeName VIEW_MANAGER_TYPE =
      ClassName.get("com.facebook.react.uimanager", "ViewManager");
  private static final TypeName SHADOW_NODE_IMPL_TYPE =
      ClassName.get("com.facebook.react.uimanager", "ReactShadowNodeImpl");

  private static final ClassName VIEW_MANAGER_SETTER_TYPE =
      ClassName.get(
          "com.facebook.react.uimanager", "ViewManagerPropertyUpdater", "ViewManagerSetter");
  private static final ClassName SHADOW_NODE_SETTER_TYPE =
      ClassName.get(
          "com.facebook.react.uimanager", "ViewManagerPropertyUpdater", "ShadowNodeSetter");

  private static final TypeName PROPERTY_MAP_TYPE =
      ParameterizedTypeName.get(Map.class, String.class, String.class);

  private final Map<ClassName, ClassInfo> mClasses;

  @SuppressFieldNotInitialized private Filer mFiler;
  @SuppressFieldNotInitialized private Messager mMessager;
  @SuppressFieldNotInitialized private Elements mElements;
  @SuppressFieldNotInitialized private Types mTypes;

  static {
    DEFAULT_TYPES = new HashMap<>();

    // Primitives
    DEFAULT_TYPES.put(TypeName.BOOLEAN, "boolean");
    DEFAULT_TYPES.put(TypeName.DOUBLE, "number");
    DEFAULT_TYPES.put(TypeName.FLOAT, "number");
    DEFAULT_TYPES.put(TypeName.INT, "number");

    // Boxed primitives
    DEFAULT_TYPES.put(TypeName.BOOLEAN.box(), "boolean");
    DEFAULT_TYPES.put(TypeName.INT.box(), "number");

    // Class types
    DEFAULT_TYPES.put(STRING_TYPE, "String");
    DEFAULT_TYPES.put(READABLE_ARRAY_TYPE, "Array");
    DEFAULT_TYPES.put(READABLE_MAP_TYPE, "Map");
    DEFAULT_TYPES.put(DYNAMIC_TYPE, "Dynamic");
    DEFAULT_TYPES.put(YOGA_VALUE_TYPE, "YogaValue");

    BOXED_PRIMITIVES = new HashSet<>();
    BOXED_PRIMITIVES.add(TypeName.BOOLEAN.box());
    BOXED_PRIMITIVES.add(TypeName.FLOAT.box());
    BOXED_PRIMITIVES.add(TypeName.INT.box());
  }

  public ReactPropertyProcessor() {
    mClasses = new HashMap<>();
  }

  @Override
  public synchronized void init(ProcessingEnvironment processingEnv) {
    super.init(processingEnv);

    mFiler = processingEnv.getFiler();
    mMessager = processingEnv.getMessager();
    mElements = processingEnv.getElementUtils();
    mTypes = processingEnv.getTypeUtils();
  }

  @Override
  public boolean processImpl(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
    // Clear properties from previous rounds
    mClasses.clear();

    Set<? extends Element> elements = roundEnv.getElementsAnnotatedWith(ReactPropertyHolder.class);
    for (Element element : elements) {
      try {
        TypeElement classType = (TypeElement) element;
        ClassName className = ClassName.get(classType);
        mClasses.put(className, parseClass(className, classType));
      } catch (Exception e) {
        error(element, e.getMessage());
      }
    }

    for (ClassInfo classInfo : mClasses.values()) {
      try {
        if (!shouldIgnoreClass(classInfo)) {
          // Sort by name
          Collections.sort(
              classInfo.mProperties,
              new Comparator<PropertyInfo>() {
                @Override
                public int compare(PropertyInfo a, PropertyInfo b) {
                  return a.mProperty.name().compareTo(b.mProperty.name());
                }
              });
          generateCode(classInfo, classInfo.mProperties);
        } else if (shouldWarnClass(classInfo)) {
          warning(classInfo.mElement, "Class was skipped. Classes need to be non-private.");
        }
      } catch (IOException e) {
        error(e.getMessage());
      } catch (ReactPropertyException e) {
        error(e.element, e.getMessage());
      } catch (Exception e) {
        error(classInfo.mElement, e.getMessage());
      }
    }

    return true;
  }

  private static boolean isShadowNodeType(TypeName typeName) {
    return typeName.equals(SHADOW_NODE_IMPL_TYPE);
  }

  private ClassInfo parseClass(ClassName className, TypeElement typeElement) {
    TypeName targetType = getTargetType(typeElement.asType());
    TypeName viewType = isShadowNodeType(targetType) ? null : targetType;

    ClassInfo classInfo = new ClassInfo(className, typeElement, viewType);
    findProperties(classInfo, typeElement);

    return classInfo;
  }

  private void findProperties(ClassInfo classInfo, TypeElement typeElement) {
    PropertyInfo.Builder propertyBuilder = new PropertyInfo.Builder(mTypes, mElements, classInfo);

    // Recursively search class hierarchy
    while (typeElement != null) {
      for (Element element : typeElement.getEnclosedElements()) {
        ReactProp prop = element.getAnnotation(ReactProp.class);
        ReactPropGroup propGroup = element.getAnnotation(ReactPropGroup.class);

        try {
          if (prop != null || propGroup != null) {
            checkElement(element);
          }

          if (prop != null) {
            classInfo.addProperty(propertyBuilder.build(element, new RegularProperty(prop)));
          } else if (propGroup != null) {
            for (int i = 0, size = propGroup.names().length; i < size; i++) {
              classInfo.addProperty(
                  propertyBuilder.build(element, new GroupProperty(propGroup, i)));
            }
          }
        } catch (ReactPropertyException e) {
          error(e.element, e.getMessage());
        }
      }

      typeElement = (TypeElement) mTypes.asElement(typeElement.getSuperclass());
    }
  }

  private TypeName getTargetType(TypeMirror mirror) {
    TypeName typeName = TypeName.get(mirror);
    if (typeName instanceof ParameterizedTypeName) {
      ParameterizedTypeName parameterizedTypeName = (ParameterizedTypeName) typeName;
      if (parameterizedTypeName.rawType.equals(VIEW_MANAGER_TYPE)) {
        return parameterizedTypeName.typeArguments.get(0);
      }
    } else if (isShadowNodeType(typeName)) {
      return SHADOW_NODE_IMPL_TYPE;
    } else if (typeName.equals(TypeName.OBJECT)) {
      throw new IllegalArgumentException("Could not find target type " + typeName);
    }

    List<? extends TypeMirror> types = mTypes.directSupertypes(mirror);
    return getTargetType(types.get(0));
  }

  private void generateCode(ClassInfo classInfo, List<PropertyInfo> properties)
      throws IOException, ReactPropertyException {
    MethodSpec getMethods =
        MethodSpec.methodBuilder("getProperties")
            .addModifiers(PUBLIC)
            .addAnnotation(Override.class)
            .addParameter(PROPERTY_MAP_TYPE, "props")
            .returns(TypeName.VOID)
            .addCode(generateGetProperties(properties))
            .build();

    TypeName superType = getSuperType(classInfo);
    ClassName className = classInfo.mClassName;

    String holderClassName =
        getClassName((TypeElement) classInfo.mElement, className.packageName()) + "$$PropsSetter";
    TypeSpec holderClass =
        TypeSpec.classBuilder(holderClassName)
            .addSuperinterface(superType)
            .addModifiers(PUBLIC)
            .addMethod(generateSetPropertySpec(classInfo, properties))
            .addMethod(getMethods)
            .build();

    JavaFile javaFile =
        JavaFile.builder(className.packageName(), holderClass)
            .addFileComment("Generated by " + getClass().getName())
            .build();

    javaFile.writeTo(mFiler);
  }

  private static String getClassName(TypeElement type, String packageName) {
    int packageLen = packageName.length() + 1;
    return type.getQualifiedName().toString().substring(packageLen).replace('.', '$');
  }

  private static TypeName getSuperType(ClassInfo classInfo) {
    switch (classInfo.getType()) {
      case VIEW_MANAGER:
        return ParameterizedTypeName.get(
            VIEW_MANAGER_SETTER_TYPE, classInfo.mClassName, classInfo.mViewType);
      case SHADOW_NODE:
        return ParameterizedTypeName.get(SHADOW_NODE_SETTER_TYPE, classInfo.mClassName);
      default:
        throw new IllegalArgumentException();
    }
  }

  private static MethodSpec generateSetPropertySpec(
      ClassInfo classInfo, List<PropertyInfo> properties) {
    MethodSpec.Builder builder =
        MethodSpec.methodBuilder("setProperty")
            .addModifiers(PUBLIC)
            .addAnnotation(Override.class)
            .returns(TypeName.VOID);

    switch (classInfo.getType()) {
      case VIEW_MANAGER:
        builder
            .addParameter(classInfo.mClassName, "manager")
            .addParameter(classInfo.mViewType, "view");
        break;
      case SHADOW_NODE:
        builder.addParameter(classInfo.mClassName, "node");
        break;
    }

    return builder
        .addParameter(STRING_TYPE, "name")
        .addParameter(OBJECT_TYPE, "value")
        .addCode(generateSetProperty(classInfo, properties))
        .build();
  }

  private static CodeBlock generateSetProperty(ClassInfo info, List<PropertyInfo> properties) {
    if (properties.isEmpty()) {
      return CodeBlock.builder().build();
    }

    CodeBlock.Builder builder = CodeBlock.builder();

    builder.add("switch (name) {\n").indent();
    for (int i = 0, size = properties.size(); i < size; i++) {
      PropertyInfo propertyInfo = properties.get(i);
      builder.add("case \"$L\":\n", propertyInfo.mProperty.name()).indent();

      switch (info.getType()) {
        case VIEW_MANAGER:
          builder.add("manager.$L(view, ", propertyInfo.methodName);
          break;
        case SHADOW_NODE:
          builder.add("node.$L(", propertyInfo.methodName);
          break;
      }
      if (propertyInfo.mProperty instanceof GroupProperty) {
        builder.add("$L, ", ((GroupProperty) propertyInfo.mProperty).mGroupIndex);
      }
      if (BOXED_PRIMITIVES.contains(propertyInfo.propertyType)) {
        builder.add("value == null ? null : ");
      }
      getPropertyExtractor(info, propertyInfo, builder);
      builder.addStatement(")");

      builder.addStatement("break").unindent();
    }
    builder.unindent().add("}\n");

    return builder.build();
  }

  private static void getPropertyExtractor(
      ClassInfo classInfo, PropertyInfo info, CodeBlock.Builder builder) {
    TypeName propertyType = info.propertyType;
    if (propertyType.equals(STRING_TYPE)) {
      builder.add("value instanceof $L ? ($L)value : null", STRING_TYPE, STRING_TYPE);
      return;
    } else if (propertyType.equals(READABLE_ARRAY_TYPE)) {
      builder.add(
          "value instanceof $L ? ($L)value : null", READABLE_ARRAY_TYPE, READABLE_ARRAY_TYPE);
      return; // TODO: use real type but needs import
    } else if (propertyType.equals(READABLE_MAP_TYPE)) {
      builder.add("value instanceof $L ? ($L)value : null", READABLE_MAP_TYPE, READABLE_MAP_TYPE);
      return;
    } else if (propertyType.equals(DYNAMIC_TYPE)) {
      builder.add("new $L(value)", DYNAMIC_FROM_OBJECT_TYPE);
      return;
    } else if (propertyType.equals(YOGA_VALUE_TYPE)) {
      builder.add("$T.getDimension(value)", com.facebook.react.bridge.DimensionPropConverter.class);
      return;
    }

    if (BOXED_PRIMITIVES.contains(propertyType)) {
      propertyType = propertyType.unbox();
    }

    if (propertyType.equals(TypeName.BOOLEAN)) {
      builder.add(
          "!(value instanceof Boolean) ? $L : (boolean)value", info.mProperty.defaultBoolean());
      return;
    }
    if (propertyType.equals(TypeName.DOUBLE)) {
      double defaultDouble = info.mProperty.defaultDouble();
      if (Double.isNaN(defaultDouble)) {
        builder.add("!(value instanceof Double) ? $T.NaN : (double)value", Double.class);
        return;
      } else {
        builder.add("!(value instanceof Double) ? $Lf : (double)value", defaultDouble);
        return;
      }
    }
    if (propertyType.equals(TypeName.FLOAT)) {
      float defaultFloat = info.mProperty.defaultFloat();
      if (Float.isNaN(defaultFloat)) {
        builder.add(
            "!(value instanceof Double) ? $T.NaN : ((Double)value).floatValue()", Float.class);
        return;
      } else {
        builder.add(
            "!(value instanceof Double) ? $Lf : ((Double)value).floatValue()", defaultFloat);
        return;
      }
    }
    if ("Color".equals(info.mProperty.customType())) {
      switch (classInfo.getType()) {
        case VIEW_MANAGER:
          builder.add(
              "value == null ? $L : $T.getColor(value, view.getContext(), $L)",
              info.mProperty.defaultInt(),
              com.facebook.react.bridge.ColorPropConverter.class,
              info.mProperty.defaultInt());
          return;
        case SHADOW_NODE:
          builder.add(
              "value == null ? $L : $T.getColor(value, node.getThemedContext(), $L)",
              info.mProperty.defaultInt(),
              com.facebook.react.bridge.ColorPropConverter.class,
              info.mProperty.defaultInt());
          return;
      }
    } else if (propertyType.equals(TypeName.INT)) {
      builder.add(
          "!(value instanceof Double) ? $L : ((Double)value).intValue()",
          info.mProperty.defaultInt());
      return;
    }

    throw new IllegalArgumentException();
  }

  private static CodeBlock generateGetProperties(List<PropertyInfo> properties)
      throws ReactPropertyException {
    CodeBlock.Builder builder = CodeBlock.builder();
    for (PropertyInfo propertyInfo : properties) {
      try {
        String typeName = getPropertyTypeName(propertyInfo.mProperty, propertyInfo.propertyType);
        builder.addStatement("props.put($S, $S)", propertyInfo.mProperty.name(), typeName);
      } catch (IllegalArgumentException e) {
        throw new ReactPropertyException(e.getMessage(), propertyInfo);
      }
    }

    return builder.build();
  }

  private static String getPropertyTypeName(Property property, TypeName propertyType) {
    String defaultType = DEFAULT_TYPES.get(propertyType);
    String useDefaultType =
        property instanceof RegularProperty
            ? ReactProp.USE_DEFAULT_TYPE
            : ReactPropGroup.USE_DEFAULT_TYPE;
    return useDefaultType.equals(property.customType()) ? defaultType : property.customType();
  }

  private static void checkElement(Element element) throws ReactPropertyException {
    if (element.getKind() == ElementKind.METHOD && element.getModifiers().contains(PUBLIC)) {
      return;
    }

    throw new ReactPropertyException(
        "@ReactProp and @ReachPropGroup annotation must be on a public method", element);
  }

  private static boolean shouldIgnoreClass(ClassInfo classInfo) {
    return classInfo.mElement.getModifiers().contains(PRIVATE)
        || classInfo.mElement.getModifiers().contains(ABSTRACT)
        || classInfo.mViewType instanceof TypeVariableName;
  }

  private static boolean shouldWarnClass(ClassInfo classInfo) {
    return classInfo.mElement.getModifiers().contains(PRIVATE);
  }

  private void error(Element element, String message) {
    mMessager.printMessage(ERROR, message, element);
  }

  private void error(String message) {
    mMessager.printMessage(ERROR, message);
  }

  private void warning(Element element, String message) {
    mMessager.printMessage(WARNING, message, element);
  }

  private interface Property {
    String name();

    String customType();

    double defaultDouble();

    float defaultFloat();

    int defaultInt();

    boolean defaultBoolean();
  }

  private static class RegularProperty implements Property {
    private final ReactProp mProp;

    public RegularProperty(ReactProp prop) {
      mProp = prop;
    }

    @Override
    public String name() {
      return mProp.name();
    }

    @Override
    public String customType() {
      return mProp.customType();
    }

    @Override
    public double defaultDouble() {
      return mProp.defaultDouble();
    }

    @Override
    public float defaultFloat() {
      return mProp.defaultFloat();
    }

    @Override
    public int defaultInt() {
      return mProp.defaultInt();
    }

    @Override
    public boolean defaultBoolean() {
      return mProp.defaultBoolean();
    }
  }

  private static class GroupProperty implements Property {
    private final ReactPropGroup mProp;
    private final int mGroupIndex;

    public GroupProperty(ReactPropGroup prop, int groupIndex) {
      mProp = prop;
      mGroupIndex = groupIndex;
    }

    @Override
    public String name() {
      return mProp.names()[mGroupIndex];
    }

    @Override
    public String customType() {
      return mProp.customType();
    }

    @Override
    public double defaultDouble() {
      return mProp.defaultDouble();
    }

    @Override
    public float defaultFloat() {
      return mProp.defaultFloat();
    }

    @Override
    public int defaultInt() {
      return mProp.defaultInt();
    }

    @Override
    public boolean defaultBoolean() {
      throw new UnsupportedOperationException();
    }
  }

  private enum SettableType {
    VIEW_MANAGER,
    SHADOW_NODE
  }

  private static class ClassInfo {
    public final ClassName mClassName;
    public final Element mElement;
    public final @Nullable TypeName mViewType;
    public final List<PropertyInfo> mProperties;

    public ClassInfo(ClassName className, TypeElement element, @Nullable TypeName viewType) {
      mClassName = className;
      mElement = element;
      mViewType = viewType;
      mProperties = new ArrayList<>();
    }

    public SettableType getType() {
      return mViewType == null ? SettableType.SHADOW_NODE : SettableType.VIEW_MANAGER;
    }

    public void addProperty(PropertyInfo propertyInfo) throws ReactPropertyException {
      String name = propertyInfo.mProperty.name();
      if (checkPropertyExists(name)) {
        throw new ReactPropertyException(
            "Module "
                + mClassName
                + " has already registered a property named \""
                + name
                + "\". If you want to override a property, don't add"
                + " the @ReactProp annotation to the property in the subclass",
            propertyInfo);
      }

      mProperties.add(propertyInfo);
    }

    private boolean checkPropertyExists(String name) {
      for (PropertyInfo propertyInfo : mProperties) {
        if (propertyInfo.mProperty.name().equals(name)) {
          return true;
        }
      }

      return false;
    }
  }

  private static class PropertyInfo {
    public final String methodName;
    public final TypeName propertyType;
    public final Element element;
    public final Property mProperty;

    private PropertyInfo(
        String methodName, TypeName propertyType, Element element, Property property) {
      this.methodName = methodName;
      this.propertyType = propertyType;
      this.element = element;
      mProperty = property;
    }

    public static class Builder {
      private final Types mTypes;
      private final Elements mElements;
      private final ClassInfo mClassInfo;

      public Builder(Types types, Elements elements, ClassInfo classInfo) {
        mTypes = types;
        mElements = elements;
        mClassInfo = classInfo;
      }

      public PropertyInfo build(Element element, Property property) throws ReactPropertyException {
        String methodName = element.getSimpleName().toString();

        ExecutableElement method = (ExecutableElement) element;
        List<? extends VariableElement> parameters = method.getParameters();

        if (parameters.size() != getArgCount(mClassInfo.getType(), property)) {
          throw new ReactPropertyException("Wrong number of args", element);
        }

        int index = 0;
        if (mClassInfo.getType() == SettableType.VIEW_MANAGER) {
          TypeMirror mirror = parameters.get(index++).asType();
          if (!mTypes.isSubtype(mirror, mElements.getTypeElement("android.view.View").asType())) {
            throw new ReactPropertyException("First argument must be a subclass of View", element);
          }
        }

        if (property instanceof GroupProperty) {
          TypeName indexType = TypeName.get(parameters.get(index++).asType());
          if (!indexType.equals(TypeName.INT)) {
            throw new ReactPropertyException(
                "Argument " + index + " must be an int for @ReactPropGroup", element);
          }
        }

        TypeName propertyType = TypeName.get(parameters.get(index++).asType());
        if (!DEFAULT_TYPES.containsKey(propertyType)) {
          throw new ReactPropertyException(
              "Argument " + index + " must be of a supported type", element);
        }

        return new PropertyInfo(methodName, propertyType, element, property);
      }

      private static int getArgCount(SettableType type, Property property) {
        int baseCount = type == SettableType.SHADOW_NODE ? 1 : 2;
        return property instanceof GroupProperty ? baseCount + 1 : baseCount;
      }
    }
  }

  private static class ReactPropertyException extends Exception {
    public final Element element;

    public ReactPropertyException(String message, PropertyInfo propertyInfo) {
      super(message);
      element = propertyInfo.element;
    }

    public ReactPropertyException(String message, Element element) {
      super(message);
      this.element = element;
    }
  }
}
