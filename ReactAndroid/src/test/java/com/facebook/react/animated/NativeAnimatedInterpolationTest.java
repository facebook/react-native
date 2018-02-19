package com.facebook.react.animated;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import java.util.Map;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Tests method used by {@link InterpolationAnimatedNode} to interpolate value of the input nodes.
 */
@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class NativeAnimatedInterpolationTest {
  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private UIManagerModule mUIManagerMock;
  private UIImplementation mUIImplementationMock;
  private EventDispatcher mEventDispatcherMock;
  private NativeAnimatedNodesManager mNativeAnimatedNodesManager;

  @Before
  public void setUp() {
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.when(Arguments.createArray()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyArray();
      }
    });
    PowerMockito.when(Arguments.createMap()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyMap();
      }
    });

    mUIManagerMock = mock(UIManagerModule.class);
    mUIImplementationMock = mock(UIImplementation.class);
    mEventDispatcherMock = mock(EventDispatcher.class);
    PowerMockito.when(mUIManagerMock.getUIImplementation()).thenAnswer(new Answer<UIImplementation>() {
      @Override
      public UIImplementation answer(InvocationOnMock invocation) throws Throwable {
        return mUIImplementationMock;
      }
    });
    PowerMockito.when(mUIManagerMock.getEventDispatcher()).thenAnswer(new Answer<EventDispatcher>() {
      @Override
      public EventDispatcher answer(InvocationOnMock invocation) throws Throwable {
        return mEventDispatcherMock;
      }
    });
    PowerMockito.when(mUIManagerMock.getConstants()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return MapBuilder.of("customDirectEventTypes", MapBuilder.newHashMap());
      }
    });
    PowerMockito
            .when(mUIManagerMock.getDirectEventNamesResolver())
            .thenAnswer(new Answer<UIManagerModule.CustomEventNamesResolver>() {
              @Override
              public UIManagerModule.CustomEventNamesResolver answer(InvocationOnMock invocation) throws Throwable {
                return new UIManagerModule.CustomEventNamesResolver() {
                  @Override
                  public String resolveCustomEventName(String eventName) {
                    Map<String, Map> directEventTypes =
                            (Map<String, Map>) mUIManagerMock.getConstants().get("customDirectEventTypes");
                    if (directEventTypes != null) {
                      Map<String, String> customEventType = (Map<String, String>) directEventTypes.get(eventName);
                      if (customEventType != null) {
                        return customEventType.get("registrationName");
                      }
                    }
                    return eventName;
                  }
                };
              }
            });
    mNativeAnimatedNodesManager = new NativeAnimatedNodesManager(mUIManagerMock);
  }

  private int tag = 0;

  private int createNode(double value) {
    tag = tag + 1;
    mNativeAnimatedNodesManager.createAnimatedNode(
            tag,
            JavaOnlyMap.of("type", "value", "value", value, "offset", 0d));
    return tag;
  }

  private double simpleInterpolation(double value, double[] input, int[] output) {
    return InterpolationAnimatedNode.interpolate(
      mNativeAnimatedNodesManager,
      value,
      input,
      output,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_EXTEND,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_EXTEND
    );
  }

  @Test
  public void testSimpleOneToOneMapping() {
    double[] input = new double[] {0d, 1d};
    int[] output = new int[] {this.createNode(0d), this.createNode(1d)};
    assertThat(simpleInterpolation(0, input, output)).isEqualTo(0);
    assertThat(simpleInterpolation(0.5, input, output)).isEqualTo(0.5);
    assertThat(simpleInterpolation(0.8, input, output)).isEqualTo(0.8);
    assertThat(simpleInterpolation(1, input, output)).isEqualTo(1);
  }

  @Test
  public void testWiderOutputRange() {
    double[] input = new double[] {0d, 1d};
    int[] output = new int[] {this.createNode(100d), this.createNode(200d)};
    assertThat(simpleInterpolation(0, input, output)).isEqualTo(100);
    assertThat(simpleInterpolation(0.5, input, output)).isEqualTo(150);
    assertThat(simpleInterpolation(0.8, input, output)).isEqualTo(180);
    assertThat(simpleInterpolation(1, input, output)).isEqualTo(200);
  }

  @Test
  public void testWiderInputRange() {
    double[] input = new double[] {2000d, 3000d};
    int[] output = new int[] {this.createNode(1d), this.createNode(2d)};
    assertThat(simpleInterpolation(2000, input, output)).isEqualTo(1);
    assertThat(simpleInterpolation(2250, input, output)).isEqualTo(1.25);
    assertThat(simpleInterpolation(2800, input, output)).isEqualTo(1.8);
    assertThat(simpleInterpolation(3000, input, output)).isEqualTo(2);
  }

  @Test
  public void testManySegments() {
    double[] input = new double[] {-1d, 1d, 5d};
    int[] output = new int[] {
            this.createNode(0d),
            this.createNode(10d),
            this.createNode(20d)};
    assertThat(simpleInterpolation(-1, input, output)).isEqualTo(0);
    assertThat(simpleInterpolation(0, input, output)).isEqualTo(5);
    assertThat(simpleInterpolation(1, input, output)).isEqualTo(10);
    assertThat(simpleInterpolation(2, input, output)).isEqualTo(12.5);
    assertThat(simpleInterpolation(5, input, output)).isEqualTo(20);
  }

  @Test
  public void testExtendExtrapolate() {
    double[] input = new double[] {10d, 20d};
    int[] output = new int[] {this.createNode(0d), this.createNode(1d)};
    assertThat(simpleInterpolation(30d, input, output)).isEqualTo(2);
    assertThat(simpleInterpolation(5d, input, output)).isEqualTo(-0.5);
  }

  @Test
  public void testClampExtrapolate() {
    double[] input = new double[] {10d, 20d};
    int[] output = new int[] {this.createNode(0d), this.createNode(1d)};
    assertThat(InterpolationAnimatedNode.interpolate(
      mNativeAnimatedNodesManager,
      30d,
      input,
      output,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP
    )).isEqualTo(1);
    assertThat(InterpolationAnimatedNode.interpolate(
      mNativeAnimatedNodesManager,
      5d,
      input,
      output,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP
    )).isEqualTo(0);
  }

  @Test
  public void testIdentityExtrapolate() {
    double[] input = new double[] {10d, 20d};
    int[] output = new int[] {this.createNode(0d), this.createNode(1d)};
    assertThat(InterpolationAnimatedNode.interpolate(
      mNativeAnimatedNodesManager,
      30d,
      input,
      output,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY
    )).isEqualTo(30);
    assertThat(InterpolationAnimatedNode.interpolate(
      mNativeAnimatedNodesManager,
      5d,
      input,
      output,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
      InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY
    )).isEqualTo(5);
  }
}
