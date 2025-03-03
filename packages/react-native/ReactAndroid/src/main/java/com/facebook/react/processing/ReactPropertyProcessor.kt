/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.processing

import com.facebook.annotationprocessors.common.ProcessorBase
import com.facebook.infer.annotation.SuppressFieldNotInitialized
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.DimensionPropConverter
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.annotations.ReactPropertyHolder
import com.facebook.yoga.YogaValue
import com.squareup.javapoet.ClassName
import com.squareup.javapoet.CodeBlock
import com.squareup.javapoet.JavaFile
import com.squareup.javapoet.MethodSpec
import com.squareup.javapoet.ParameterizedTypeName
import com.squareup.javapoet.TypeName
import com.squareup.javapoet.TypeSpec
import com.squareup.javapoet.TypeVariableName
import java.io.IOException
import java.util.Collections
import javax.annotation.processing.Filer
import javax.annotation.processing.Messager
import javax.annotation.processing.ProcessingEnvironment
import javax.annotation.processing.RoundEnvironment
import javax.annotation.processing.SupportedAnnotationTypes
import javax.annotation.processing.SupportedSourceVersion
import javax.lang.model.SourceVersion
import javax.lang.model.element.Element
import javax.lang.model.element.ElementKind
import javax.lang.model.element.ExecutableElement
import javax.lang.model.element.Modifier
import javax.lang.model.element.TypeElement
import javax.lang.model.type.TypeMirror
import javax.lang.model.util.Elements
import javax.lang.model.util.Types
import javax.tools.Diagnostic

/**
 * This annotation processor crawls subclasses of ReactShadowNode and ViewManager and finds their
 * exported properties with the @ReactProp or @ReactGroupProp annotation. It generates a class per
 * shadow node/view manager that is named `<classname>$$PropsSetter`. This class contains methods to
 * retrieve the name and type of all methods and a way to set these properties without reflection.
 */
@SupportedAnnotationTypes("com.facebook.react.uimanager.annotations.ReactPropertyHolder")
@SupportedSourceVersion(SourceVersion.RELEASE_11)
class ReactPropertyProcessor : ProcessorBase() {
  private val classes: MutableMap<ClassName, ClassInfo>

  @SuppressFieldNotInitialized private var filer: Filer? = null
  @SuppressFieldNotInitialized private var messager: Messager? = null
  @SuppressFieldNotInitialized private var elementUtils: Elements? = null
  @SuppressFieldNotInitialized private var typeUtils: Types? = null
  @SuppressFieldNotInitialized private var viewManagerWithGeneratedInterfaceMemo: TypeMirror? = null

  init {
    classes = HashMap()
  }

  @Synchronized
  override fun init(processingEnv: ProcessingEnvironment) {
    super.init(processingEnv)

    filer = processingEnv.filer
    messager = processingEnv.messager
    elementUtils = processingEnv.elementUtils
    typeUtils = processingEnv.typeUtils
  }

  private val viewManagerWithGeneratedInterface: TypeMirror?
    get() {
      if (viewManagerWithGeneratedInterfaceMemo == null) {
        val typeElement = elementUtils!!.getTypeElement(VIEW_MANAGER_INTERFACE)
        check(typeElement?.asType() != null) { "Could not find $VIEW_MANAGER_INTERFACE" }
        viewManagerWithGeneratedInterfaceMemo = typeElement.asType()
      }
      return viewManagerWithGeneratedInterfaceMemo
    }

  public override fun processImpl(
      annotations: Set<TypeElement>,
      roundEnv: RoundEnvironment
  ): Boolean {
    // Clear properties from previous rounds
    classes.clear()

    val elements = roundEnv.getElementsAnnotatedWith(ReactPropertyHolder::class.java)
    for (element in elements) {
      try {
        val classType = element as TypeElement
        val className = ClassName.get(classType)
        val classInfo = parseClass(className, classType)
        if (classInfo != null) {
          classes[className] = classInfo
        }
      } catch (e: Exception) {
        error(element, e.message)
      }
    }

    for (classInfo in classes.values) {
      try {
        if (!shouldIgnoreClass(classInfo)) {
          // Sort by name
          Collections.sort(classInfo.properties) { a, b ->
            a.property.name().compareTo(b.property.name())
          }
          generateCode(classInfo, classInfo.properties)
        } else if (shouldWarnClass(classInfo)) {
          warning(classInfo.element, "Class was skipped. Classes need to be non-private.")
        }
      } catch (e: IOException) {
        error(e.message)
      } catch (e: ReactPropertyException) {
        error(e.element, e.message)
      } catch (e: Exception) {
        error(classInfo.element, e.message)
      }
    }

    return true
  }

  private fun parseClass(className: ClassName, typeElement: TypeElement): ClassInfo? {
    val targetType = getTargetType(typeElement.asType())
    val viewType = if (isShadowNodeType(targetType)) null else targetType
    val implementsViewManagerWithGeneratedInterface =
        typeUtils!!.isAssignable(typeElement.asType(), viewManagerWithGeneratedInterface)

    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE &&
        (implementsViewManagerWithGeneratedInterface || viewType == null)) {
      // When "MINIFY_LEGACY_ARCHITECTURE" is enabled, we don't want to generate the props setter
      // for classes that implement ViewManagerWithGeneratedInterface or that are not a ViewManager.
      // This is because we will be using the new architecture for these classes.
      return null
    }
    val classInfo = ClassInfo(className, typeElement, viewType)
    findProperties(classInfo, typeElement)
    return classInfo
  }

  private fun findProperties(classInfo: ClassInfo, typeElement: TypeElement) {
    var typeElement: TypeElement? = typeElement
    val propertyBuilder = PropertyInfo.Builder(typeUtils, elementUtils, classInfo)

    // Recursively search class hierarchy
    while (typeElement != null) {
      for (element in typeElement.enclosedElements) {
        val prop = element.getAnnotation(ReactProp::class.java)
        val propGroup = element.getAnnotation(ReactPropGroup::class.java)

        try {
          if (prop != null || propGroup != null) {
            checkElement(element)
          }

          if (prop != null) {
            classInfo.addProperty(propertyBuilder.build(element, RegularProperty(prop)))
          } else if (propGroup != null) {
            var i = 0
            val size = propGroup.names.size
            while (i < size) {
              classInfo.addProperty(propertyBuilder.build(element, GroupProperty(propGroup, i)))
              i++
            }
          }
        } catch (e: ReactPropertyException) {
          error(e.element, e.message)
        }
      }

      val superType = typeElement.superclass
      if (superType == null) {
        typeElement = null
      } else {
        val asElement = typeUtils!!.asElement(superType)
        if (asElement != null && asElement is TypeElement) {
          typeElement = asElement as TypeElement
        } else {
          typeElement = null
        }
      }
    }
  }

  private fun getTargetType(mirror: TypeMirror): TypeName {
    val typeName = TypeName.get(mirror)
    if (typeName is ParameterizedTypeName) {
      val parameterizedTypeName = typeName
      if (parameterizedTypeName.rawType == VIEW_MANAGER_TYPE) {
        return parameterizedTypeName.typeArguments[0]
      }
    } else if (isShadowNodeType(typeName)) {
      return SHADOW_NODE_IMPL_TYPE
    } else require(typeName != TypeName.OBJECT) { "Could not find target type $typeName" }

    val types = typeUtils!!.directSupertypes(mirror)
    return getTargetType(types[0])
  }

  @Throws(IOException::class, ReactPropertyException::class)
  private fun generateCode(classInfo: ClassInfo, properties: List<PropertyInfo>) {
    val getMethods =
        MethodSpec.methodBuilder("getProperties")
            .addModifiers(Modifier.PUBLIC)
            .addAnnotation(Override::class.java)
            .addParameter(PROPERTY_MAP_TYPE, "props")
            .returns(TypeName.VOID)
            .addCode(generateGetProperties(properties))
            .build()

    val superType = getSuperType(classInfo)
    val className = classInfo.mClassName

    val holderClassName =
        getClassName(classInfo.element as TypeElement, className.packageName()) + "$\$PropsSetter"
    val holderClass =
        TypeSpec.classBuilder(holderClassName)
            .addSuperinterface(superType)
            .addAnnotation(VisibleForTesting::class.java)
            .addModifiers(Modifier.PUBLIC)
            .addMethod(generateSetPropertySpec(classInfo, properties))
            .addMethod(getMethods)
            .build()

    val javaFile =
        JavaFile.builder(className.packageName(), holderClass)
            .addFileComment("Generated by " + javaClass.name)
            .build()

    javaFile.writeTo(filer)
  }

  private fun error(element: Element, message: String?) {
    messager!!.printMessage(Diagnostic.Kind.ERROR, message, element)
  }

  private fun error(message: String?) {
    messager!!.printMessage(Diagnostic.Kind.ERROR, message)
  }

  private fun warning(element: Element, message: String) {
    messager!!.printMessage(Diagnostic.Kind.WARNING, message, element)
  }

  private interface Property {
    fun name(): String

    fun customType(): String

    fun defaultDouble(): Double

    fun defaultFloat(): Float

    fun defaultInt(): Int

    fun defaultLong(): Long

    fun defaultBoolean(): Boolean
  }

  private class RegularProperty(private val prop: ReactProp) : Property {
    override fun name(): String {
      return prop.name
    }

    override fun customType(): String {
      return prop.customType
    }

    override fun defaultDouble(): Double {
      return prop.defaultDouble
    }

    override fun defaultFloat(): Float {
      return prop.defaultFloat
    }

    override fun defaultInt(): Int {
      return prop.defaultInt
    }

    override fun defaultLong(): Long {
      return prop.defaultLong
    }

    override fun defaultBoolean(): Boolean {
      return prop.defaultBoolean
    }
  }

  private class GroupProperty(private val prop: ReactPropGroup, val mGroupIndex: Int) : Property {
    override fun name(): String {
      return prop.names[mGroupIndex]
    }

    override fun customType(): String {
      return prop.customType
    }

    override fun defaultDouble(): Double {
      return prop.defaultDouble
    }

    override fun defaultFloat(): Float {
      return prop.defaultFloat
    }

    override fun defaultInt(): Int {
      return prop.defaultInt
    }

    override fun defaultLong(): Long {
      return prop.defaultLong
    }

    override fun defaultBoolean(): Boolean {
      throw UnsupportedOperationException()
    }
  }

  private enum class SettableType {
    VIEW_MANAGER,
    SHADOW_NODE
  }

  private class ClassInfo(val mClassName: ClassName, element: TypeElement, viewType: TypeName?) {
    val element: Element = element
    val viewType: TypeName? = viewType
    val properties: MutableList<PropertyInfo> = ArrayList()

    val type: SettableType
      get() = if (viewType == null) SettableType.SHADOW_NODE else SettableType.VIEW_MANAGER

    @Throws(ReactPropertyException::class)
    fun addProperty(propertyInfo: PropertyInfo) {
      val name = propertyInfo.property.name()
      if (checkPropertyExists(name)) {
        throw ReactPropertyException(
            "Module " +
                mClassName +
                " has already registered a property named \"" +
                name +
                "\". If you want to override a property, don't add" +
                " the @ReactProp annotation to the property in the subclass",
            propertyInfo)
      }

      properties.add(propertyInfo)
    }

    private fun checkPropertyExists(name: String): Boolean {
      for (propertyInfo in properties) {
        if (propertyInfo.property.name() == name) {
          return true
        }
      }

      return false
    }
  }

  private class PropertyInfo
  private constructor(
      val methodName: String,
      val propertyType: TypeName,
      val element: Element,
      val property: Property
  ) {
    class Builder(
        private val types: Types?,
        private val elements: Elements?,
        private val classInfo: ClassInfo
    ) {
      @Throws(ReactPropertyException::class)
      fun build(element: Element, property: Property): PropertyInfo {
        val methodName = element.simpleName.toString()

        val method = element as ExecutableElement
        val parameters = method.parameters

        if (parameters.size != getArgCount(classInfo.type, property)) {
          throw ReactPropertyException("Wrong number of args", element)
        }

        var index = 0
        if (classInfo.type == SettableType.VIEW_MANAGER) {
          val mirror = parameters[index++]!!.asType()
          if (!types!!.isSubtype(mirror, elements!!.getTypeElement("android.view.View").asType())) {
            throw ReactPropertyException("First argument must be a subclass of View", element)
          }
        }

        if (property is GroupProperty) {
          val indexType = TypeName.get(parameters[index++]!!.asType())
          if (indexType != TypeName.INT) {
            throw ReactPropertyException(
                "Argument $index must be an int for @ReactPropGroup", element)
          }
        }

        val propertyType = TypeName.get(parameters[index++]!!.asType())
        if (!DEFAULT_TYPES.containsKey(propertyType)) {
          throw ReactPropertyException("Argument $index must be of a supported type", element)
        }

        return PropertyInfo(methodName, propertyType, element, property)
      }

      public companion object {
        private fun getArgCount(type: SettableType, property: Property): Int {
          val baseCount = if (type == SettableType.SHADOW_NODE) 1 else 2
          return if (property is GroupProperty) baseCount + 1 else baseCount
        }
      }
    }
  }

  private class ReactPropertyException : Exception {
    val element: Element

    constructor(message: String?, propertyInfo: PropertyInfo) : super(message) {
      element = propertyInfo.element
    }

    constructor(message: String?, element: Element) : super(message) {
      this.element = element
    }
  }

  public companion object {
    private val DEFAULT_TYPES: MutableMap<TypeName, String> = HashMap()
    private val BOXED_PRIMITIVES: MutableSet<TypeName>

    private val OBJECT_TYPE: TypeName = TypeName.get(Any::class.java)
    private val STRING_TYPE: TypeName = TypeName.get(String::class.java)
    private val READABLE_MAP_TYPE: TypeName = TypeName.get(ReadableMap::class.java)
    private val READABLE_ARRAY_TYPE: TypeName = TypeName.get(ReadableArray::class.java)
    private val DYNAMIC_TYPE: TypeName = TypeName.get(Dynamic::class.java)
    private val DYNAMIC_FROM_OBJECT_TYPE: TypeName = TypeName.get(DynamicFromObject::class.java)
    private val YOGA_VALUE_TYPE: TypeName = TypeName.get(YogaValue::class.java)

    private val VIEW_MANAGER_TYPE: TypeName =
        ClassName.get("com.facebook.react.uimanager", "ViewManager")
    private val SHADOW_NODE_IMPL_TYPE: TypeName =
        ClassName.get("com.facebook.react.uimanager", "ReactShadowNodeImpl")

    private val VIEW_MANAGER_SETTER_TYPE: ClassName =
        ClassName.get(
            "com.facebook.react.uimanager", "ViewManagerPropertyUpdater", "ViewManagerSetter")
    private val SHADOW_NODE_SETTER_TYPE: ClassName =
        ClassName.get(
            "com.facebook.react.uimanager", "ViewManagerPropertyUpdater", "ShadowNodeSetter")

    private val PROPERTY_MAP_TYPE: TypeName =
        ParameterizedTypeName.get(MutableMap::class.java, String::class.java, String::class.java)
    const val VIEW_MANAGER_INTERFACE: String =
        "com.facebook.react.uimanager.ViewManagerWithGeneratedInterface"

    init {
      // Primitives
      DEFAULT_TYPES[TypeName.BOOLEAN] = "boolean"
      DEFAULT_TYPES[TypeName.DOUBLE] = "number"
      DEFAULT_TYPES[TypeName.FLOAT] = "number"
      DEFAULT_TYPES[TypeName.INT] = "number"
      DEFAULT_TYPES[TypeName.LONG] = "number"

      // Boxed primitives
      DEFAULT_TYPES[TypeName.BOOLEAN.box()] = "boolean"
      DEFAULT_TYPES[TypeName.INT.box()] = "number"
      DEFAULT_TYPES[TypeName.LONG.box()] = "number"

      // Class types
      DEFAULT_TYPES[STRING_TYPE] = "String"
      DEFAULT_TYPES[READABLE_ARRAY_TYPE] = "Array"
      DEFAULT_TYPES[READABLE_MAP_TYPE] = "Map"
      DEFAULT_TYPES[DYNAMIC_TYPE] = "Dynamic"
      DEFAULT_TYPES[YOGA_VALUE_TYPE] = "YogaValue"

      BOXED_PRIMITIVES = HashSet()
      BOXED_PRIMITIVES.add(TypeName.BOOLEAN.box())
      BOXED_PRIMITIVES.add(TypeName.FLOAT.box())
      BOXED_PRIMITIVES.add(TypeName.INT.box())
      BOXED_PRIMITIVES.add(TypeName.LONG.box())
    }

    private fun isShadowNodeType(typeName: TypeName): Boolean {
      return typeName == SHADOW_NODE_IMPL_TYPE
    }

    private fun getClassName(type: TypeElement, packageName: String): String {
      val packageLen = packageName.length + 1
      return type.qualifiedName.toString().substring(packageLen).replace('.', '$')
    }

    private fun getSuperType(classInfo: ClassInfo): TypeName {
      return when (classInfo.type) {
        SettableType.VIEW_MANAGER ->
            ParameterizedTypeName.get(
                VIEW_MANAGER_SETTER_TYPE, classInfo.mClassName, classInfo.viewType)

        SettableType.SHADOW_NODE ->
            ParameterizedTypeName.get(SHADOW_NODE_SETTER_TYPE, classInfo.mClassName)
        else -> throw IllegalArgumentException()
      }
    }

    private fun generateSetPropertySpec(
        classInfo: ClassInfo,
        properties: List<PropertyInfo>
    ): MethodSpec {
      val builder =
          MethodSpec.methodBuilder("setProperty")
              .addModifiers(Modifier.PUBLIC)
              .addAnnotation(Override::class.java)
              .returns(TypeName.VOID)

      when (classInfo.type) {
        SettableType.VIEW_MANAGER ->
            builder
                .addParameter(classInfo.mClassName, "manager")
                .addParameter(classInfo.viewType, "view")
        SettableType.SHADOW_NODE -> builder.addParameter(classInfo.mClassName, "node")
      }
      return builder
          .addParameter(STRING_TYPE, "name")
          .addParameter(OBJECT_TYPE, "value")
          .addCode(generateSetProperty(classInfo, properties))
          .build()
    }

    private fun generateSetProperty(info: ClassInfo, properties: List<PropertyInfo>): CodeBlock {
      if (properties.isEmpty()) {
        return CodeBlock.builder().build()
      }

      val builder = CodeBlock.builder()

      builder.add("switch (name) {\n").indent()
      var i = 0
      val size = properties.size
      while (i < size) {
        val propertyInfo = properties[i]
        builder.add("case \"\$L\":\n", propertyInfo.property.name()).indent()

        when (info.type) {
          SettableType.VIEW_MANAGER -> builder.add("manager.\$L(view, ", propertyInfo.methodName)
          SettableType.SHADOW_NODE -> builder.add("node.\$L(", propertyInfo.methodName)
        }
        if (propertyInfo.property is GroupProperty) {
          builder.add("\$L, ", propertyInfo.property.mGroupIndex)
        }
        if (BOXED_PRIMITIVES.contains(propertyInfo.propertyType)) {
          builder.add("value == null ? null : ")
        }
        getPropertyExtractor(info, propertyInfo, builder)
        builder.addStatement(")")

        builder.addStatement("break").unindent()
        i++
      }
      builder.unindent().add("}\n")

      return builder.build()
    }

    private fun getPropertyExtractor(
        classInfo: ClassInfo,
        info: PropertyInfo,
        builder: CodeBlock.Builder
    ) {
      var propertyType = info.propertyType
      if (propertyType == STRING_TYPE) {
        builder.add("value instanceof \$L ? (\$L)value : null", STRING_TYPE, STRING_TYPE)
        return
      } else if (propertyType == READABLE_ARRAY_TYPE) {
        builder.add(
            "value instanceof \$L ? (\$L)value : null", READABLE_ARRAY_TYPE, READABLE_ARRAY_TYPE)
        return // TODO: use real type but needs import
      } else if (propertyType == READABLE_MAP_TYPE) {
        builder.add(
            "value instanceof \$L ? (\$L)value : null", READABLE_MAP_TYPE, READABLE_MAP_TYPE)
        return
      } else if (propertyType == DYNAMIC_TYPE) {
        builder.add("new \$L(value)", DYNAMIC_FROM_OBJECT_TYPE)
        return
      } else if (propertyType == YOGA_VALUE_TYPE) {
        builder.add("\$T.getDimension(value)", DimensionPropConverter::class.java)
        return
      }

      if (BOXED_PRIMITIVES.contains(propertyType)) {
        propertyType = propertyType.unbox()
      }

      if (propertyType == TypeName.BOOLEAN) {
        builder.add(
            "!(value instanceof Boolean) ? \$L : (boolean)value", info.property.defaultBoolean())
        return
      }
      if (propertyType == TypeName.DOUBLE) {
        val defaultDouble = info.property.defaultDouble()
        if (java.lang.Double.isNaN(defaultDouble)) {
          builder.add("!(value instanceof Double) ? Double.NaN : (double)value")
          return
        } else {
          builder.add("!(value instanceof Double) ? \$Lf : (double)value", defaultDouble)
          return
        }
      }
      if (propertyType == TypeName.FLOAT) {
        val defaultFloat = info.property.defaultFloat()
        if (java.lang.Float.isNaN(defaultFloat)) {
          builder.add("!(value instanceof Double) ? Float.NaN : ((Double)value).floatValue()")
          return
        } else {
          builder.add(
              "!(value instanceof Double) ? \$Lf : ((Double)value).floatValue()", defaultFloat)
          return
        }
      }
      if (propertyType == TypeName.LONG) {
        val defaultLong = info.property.defaultLong()
        builder.add("!(value instanceof Long) ? \$L : (long)value", defaultLong)
        return
      }
      if ("Color" == info.property.customType()) {
        when (classInfo.type) {
          SettableType.VIEW_MANAGER -> {
            builder.add(
                "value == null ? \$L : \$T.getColor(value, view.getContext(), \$L)",
                info.property.defaultInt(),
                ColorPropConverter::class.java,
                info.property.defaultInt())
            return
          }
          SettableType.SHADOW_NODE -> {
            builder.add(
                "value == null ? \$L : \$T.getColor(value, node.getThemedContext(), \$L)",
                info.property.defaultInt(),
                ColorPropConverter::class.java,
                info.property.defaultInt())
            return
          }
        }
      } else if (propertyType == TypeName.INT) {
        builder.add(
            "!(value instanceof Double) ? \$L : ((Double)value).intValue()",
            info.property.defaultInt())
        return
      }

      throw IllegalArgumentException()
    }

    @Throws(ReactPropertyException::class)
    private fun generateGetProperties(properties: List<PropertyInfo>): CodeBlock {
      val builder = CodeBlock.builder()
      for (propertyInfo in properties) {
        try {
          val typeName = getPropertyTypeName(propertyInfo.property, propertyInfo.propertyType)
          builder.addStatement("props.put(\$S, \$S)", propertyInfo.property.name(), typeName)
        } catch (e: IllegalArgumentException) {
          throw ReactPropertyException(e.message, propertyInfo)
        }
      }

      return builder.build()
    }

    private fun getPropertyTypeName(property: Property, propertyType: TypeName): String? {
      val defaultType = DEFAULT_TYPES[propertyType]
      val useDefaultType =
          if (property is RegularProperty) ReactProp.USE_DEFAULT_TYPE
          else ReactPropGroup.USE_DEFAULT_TYPE
      return if (useDefaultType == property.customType()) defaultType else property.customType()
    }

    @Throws(ReactPropertyException::class)
    private fun checkElement(element: Element) {
      if (element.kind == ElementKind.METHOD && element.modifiers.contains(Modifier.PUBLIC)) {
        return
      }

      throw ReactPropertyException(
          "@ReactProp and @ReachPropGroup annotation must be on a public method", element)
    }

    private fun shouldIgnoreClass(classInfo: ClassInfo): Boolean {
      return (classInfo.element.modifiers.contains(Modifier.PRIVATE) ||
          classInfo.element.modifiers.contains(Modifier.ABSTRACT) ||
          classInfo.viewType is TypeVariableName)
    }

    private fun shouldWarnClass(classInfo: ClassInfo): Boolean {
      return classInfo.element.modifiers.contains(Modifier.PRIVATE)
    }
  }
}
