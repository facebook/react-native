/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.graphics.Paint;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.text.Layout;
import android.text.Spannable;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.ClickableSpan;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityEvent;
import android.widget.EditText;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.AccessibilityActionCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.RangeInfoCompat;
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat;
import androidx.customview.widget.ExploreByTouchHelper;
import com.facebook.react.R;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Utility class that handles the addition of a "role" for accessibility to either a View or
 * AccessibilityNodeInfo.
 */
public class ReactAccessibilityDelegate extends ExploreByTouchHelper {

  private static final String TAG = "ReactAccessibilityDelegate";
  public static final String TOP_ACCESSIBILITY_ACTION_EVENT = "topAccessibilityAction";
  private static int sCounter = 0x3f000000;
  private static final int TIMEOUT_SEND_ACCESSIBILITY_EVENT = 200;
  private static final int SEND_EVENT = 1;
  private static final String delimiter = ", ";
  private static final int delimiterLength = delimiter.length();

  public static final HashMap<String, Integer> sActionIdMap = new HashMap<>();

  static {
    sActionIdMap.put("activate", AccessibilityActionCompat.ACTION_CLICK.getId());
    sActionIdMap.put("longpress", AccessibilityActionCompat.ACTION_LONG_CLICK.getId());
    sActionIdMap.put("increment", AccessibilityActionCompat.ACTION_SCROLL_FORWARD.getId());
    sActionIdMap.put("decrement", AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.getId());
    sActionIdMap.put("expand", AccessibilityActionCompat.ACTION_EXPAND.getId());
    sActionIdMap.put("collapse", AccessibilityActionCompat.ACTION_COLLAPSE.getId());
  }

  private final View mView;
  private final AccessibilityLinks mAccessibilityLinks;

  private Handler mHandler;

  /**
   * Schedule a command for sending an accessibility event. </br> Note: A command is used to ensure
   * that accessibility events are sent at most one in a given time frame to save system resources
   * while the progress changes quickly.
   */
  private void scheduleAccessibilityEventSender(View host) {
    if (mHandler.hasMessages(SEND_EVENT, host)) {
      mHandler.removeMessages(SEND_EVENT, host);
    }
    Message msg = mHandler.obtainMessage(SEND_EVENT, host);
    mHandler.sendMessageDelayed(msg, TIMEOUT_SEND_ACCESSIBILITY_EVENT);
  }

  /**
   * An ARIA Role representable by View's `role` prop. Ordinals should be kept in sync with
   * `facebook::react::Role`.
   */
  public enum Role {
    ALERT,
    ALERTDIALOG,
    APPLICATION,
    ARTICLE,
    BANNER,
    BUTTON,
    CELL,
    CHECKBOX,
    COLUMNHEADER,
    COMBOBOX,
    COMPLEMENTARY,
    CONTENTINFO,
    DEFINITION,
    DIALOG,
    DIRECTORY,
    DOCUMENT,
    FEED,
    FIGURE,
    FORM,
    GRID,
    GROUP,
    HEADING,
    IMG,
    LINK,
    LIST,
    LISTITEM,
    LOG,
    MAIN,
    MARQUEE,
    MATH,
    MENU,
    MENUBAR,
    MENUITEM,
    METER,
    NAVIGATION,
    NONE,
    NOTE,
    OPTION,
    PRESENTATION,
    PROGRESSBAR,
    RADIO,
    RADIOGROUP,
    REGION,
    ROW,
    ROWGROUP,
    ROWHEADER,
    SCROLLBAR,
    SEARCHBOX,
    SEPARATOR,
    SLIDER,
    SPINBUTTON,
    STATUS,
    SUMMARY,
    SWITCH,
    TAB,
    TABLE,
    TABLIST,
    TABPANEL,
    TERM,
    TIMER,
    TOOLBAR,
    TOOLTIP,
    TREE,
    TREEGRID,
    TREEITEM;

    public static @Nullable Role fromValue(@Nullable String value) {
      for (Role role : Role.values()) {
        if (role.name().equalsIgnoreCase(value)) {
          return role;
        }
      }
      return null;
    }
  }

  /**
   * These roles are defined by Google's TalkBack screen reader, and this list should be kept up to
   * date with their implementation. Details can be seen in their source code here:
   *
   * <p>https://github.com/google/talkback/blob/master/utils/src/main/java/Role.java
   */
  public enum AccessibilityRole {
    NONE,
    BUTTON,
    DROPDOWNLIST,
    TOGGLEBUTTON,
    LINK,
    SEARCH,
    IMAGE,
    IMAGEBUTTON,
    KEYBOARDKEY,
    TEXT,
    ADJUSTABLE,
    SUMMARY,
    HEADER,
    ALERT,
    CHECKBOX,
    COMBOBOX,
    MENU,
    MENUBAR,
    MENUITEM,
    PROGRESSBAR,
    RADIO,
    RADIOGROUP,
    SCROLLBAR,
    SPINBUTTON,
    SWITCH,
    TAB,
    TABLIST,
    TIMER,
    LIST,
    GRID,
    PAGER,
    SCROLLVIEW,
    HORIZONTALSCROLLVIEW,
    VIEWGROUP,
    WEBVIEW,
    DRAWERLAYOUT,
    SLIDINGDRAWER,
    ICONMENU,
    TOOLBAR;

    public static String getValue(AccessibilityRole role) {
      switch (role) {
        case BUTTON:
          return "android.widget.Button";
        case DROPDOWNLIST:
          return "android.widget.Spinner";
        case TOGGLEBUTTON:
          return "android.widget.ToggleButton";
        case SEARCH:
          return "android.widget.EditText";
        case IMAGE:
          return "android.widget.ImageView";
        case IMAGEBUTTON:
          return "android.widget.ImageButton";
        case KEYBOARDKEY:
          return "android.inputmethodservice.Keyboard$Key";
        case TEXT:
          return "android.widget.TextView";
        case ADJUSTABLE:
          return "android.widget.SeekBar";
        case CHECKBOX:
          return "android.widget.CheckBox";
        case RADIO:
          return "android.widget.RadioButton";
        case SPINBUTTON:
          return "android.widget.SpinButton";
        case SWITCH:
          return "android.widget.Switch";
        case LIST:
          return "android.widget.AbsListView";
        case GRID:
          return "android.widget.GridView";
        case SCROLLVIEW:
          return "android.widget.ScrollView";
        case HORIZONTALSCROLLVIEW:
          return "android.widget.HorizontalScrollView";
        case PAGER:
          return "androidx.viewpager.widget.ViewPager";
        case DRAWERLAYOUT:
          return "androidx.drawerlayout.widget.DrawerLayout";
        case SLIDINGDRAWER:
          return "android.widget.SlidingDrawer";
        case ICONMENU:
          return "com.android.internal.view.menu.IconMenuView";
        case VIEWGROUP:
          return "android.view.ViewGroup";
        case WEBVIEW:
          return "android.webkit.WebView";
        case NONE:
        case LINK:
        case SUMMARY:
        case HEADER:
        case ALERT:
        case COMBOBOX:
        case MENU:
        case MENUBAR:
        case MENUITEM:
        case PROGRESSBAR:
        case RADIOGROUP:
        case SCROLLBAR:
        case TAB:
        case TABLIST:
        case TIMER:
        case TOOLBAR:
          return "android.view.View";
        default:
          throw new IllegalArgumentException("Invalid accessibility role value: " + role);
      }
    }

    public static AccessibilityRole fromValue(@Nullable String value) {
      if (value == null) {
        return NONE;
      }

      for (AccessibilityRole role : AccessibilityRole.values()) {
        if (role.name().equalsIgnoreCase(value)) {
          return role;
        }
      }
      throw new IllegalArgumentException("Invalid accessibility role value: " + value);
    }

    public static @Nullable AccessibilityRole fromRole(Role role) {
      switch (role) {
        case ALERT:
          return AccessibilityRole.ALERT;
        case BUTTON:
          return AccessibilityRole.BUTTON;
        case CHECKBOX:
          return AccessibilityRole.CHECKBOX;
        case COMBOBOX:
          return AccessibilityRole.COMBOBOX;
        case GRID:
          return AccessibilityRole.GRID;
        case HEADING:
          return AccessibilityRole.HEADER;
        case IMG:
          return AccessibilityRole.IMAGE;
        case LINK:
          return AccessibilityRole.LINK;
        case LIST:
          return AccessibilityRole.LIST;
        case MENU:
          return AccessibilityRole.MENU;
        case MENUBAR:
          return AccessibilityRole.MENUBAR;
        case MENUITEM:
          return AccessibilityRole.MENUITEM;
        case NONE:
          return AccessibilityRole.NONE;
        case PROGRESSBAR:
          return AccessibilityRole.PROGRESSBAR;
        case RADIO:
          return AccessibilityRole.RADIO;
        case RADIOGROUP:
          return AccessibilityRole.RADIOGROUP;
        case SCROLLBAR:
          return AccessibilityRole.SCROLLBAR;
        case SEARCHBOX:
          return AccessibilityRole.SEARCH;
        case SLIDER:
          return AccessibilityRole.ADJUSTABLE;
        case SPINBUTTON:
          return AccessibilityRole.SPINBUTTON;
        case SUMMARY:
          return AccessibilityRole.SUMMARY;
        case SWITCH:
          return AccessibilityRole.SWITCH;
        case TAB:
          return AccessibilityRole.TAB;
        case TABLIST:
          return AccessibilityRole.TABLIST;
        case TIMER:
          return AccessibilityRole.TIMER;
        case TOOLBAR:
          return AccessibilityRole.TOOLBAR;
        default:
          // No mapping from ARIA role to AccessibilityRole
          return null;
      }
    }

    public static @Nullable AccessibilityRole fromViewTag(View view) {
      Role role = (Role) view.getTag(R.id.role);
      if (role != null) {
        return AccessibilityRole.fromRole(role);
      } else {
        return (AccessibilityRole) view.getTag(R.id.accessibility_role);
      }
    }
  }

  private final HashMap<Integer, String> mAccessibilityActionsMap;

  // State constants for states which have analogs in AccessibilityNodeInfo

  private static final String STATE_DISABLED = "disabled";
  private static final String STATE_SELECTED = "selected";
  private static final String STATE_CHECKED = "checked";

  public ReactAccessibilityDelegate(
      final View view, boolean originalFocus, int originalImportantForAccessibility) {
    super(view);
    mView = view;
    mAccessibilityActionsMap = new HashMap<Integer, String>();
    mHandler =
        new Handler() {
          @Override
          public void handleMessage(Message msg) {
            View host = (View) msg.obj;
            host.sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_SELECTED);
          }
        };

    // We need to reset these two properties, as ExploreByTouchHelper sets focusable to "true" and
    // importantForAccessibility to "Yes" (if it is Auto). If we don't reset these it would force
    // every element that has this delegate attached to be focusable, and not allow for
    // announcement coalescing.
    mView.setFocusable(originalFocus);
    ViewCompat.setImportantForAccessibility(mView, originalImportantForAccessibility);
    mAccessibilityLinks = (AccessibilityLinks) mView.getTag(R.id.accessibility_links);
  }

  @Nullable View mAccessibilityLabelledBy;

  @Override
  public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfoCompat info) {
    super.onInitializeAccessibilityNodeInfo(host, info);
    if (host.getTag(R.id.accessibility_state_expanded) != null) {
      final boolean accessibilityStateExpanded =
          (boolean) host.getTag(R.id.accessibility_state_expanded);
      info.addAction(
          accessibilityStateExpanded
              ? AccessibilityNodeInfoCompat.ACTION_COLLAPSE
              : AccessibilityNodeInfoCompat.ACTION_EXPAND);
    }
    final AccessibilityRole accessibilityRole = AccessibilityRole.fromViewTag(host);
    final String accessibilityHint = (String) host.getTag(R.id.accessibility_hint);
    if (accessibilityRole != null) {
      setRole(info, accessibilityRole, host.getContext());
    }

    if (accessibilityHint != null) {
      info.setTooltipText(accessibilityHint);
    }

    final Object accessibilityLabelledBy = host.getTag(R.id.labelled_by);
    if (accessibilityLabelledBy != null) {
      mAccessibilityLabelledBy =
          ReactFindViewUtil.findView(host.getRootView(), (String) accessibilityLabelledBy);
      if (mAccessibilityLabelledBy != null) {
        info.setLabeledBy(mAccessibilityLabelledBy);
      }
    }

    // state is changeable.
    final ReadableMap accessibilityState = (ReadableMap) host.getTag(R.id.accessibility_state);
    if (accessibilityState != null) {
      setState(info, accessibilityState, host.getContext());
    }
    final ReadableArray accessibilityActions =
        (ReadableArray) host.getTag(R.id.accessibility_actions);

    final ReadableMap accessibilityCollectionItem =
        (ReadableMap) host.getTag(R.id.accessibility_collection_item);
    if (accessibilityCollectionItem != null) {
      int rowIndex = accessibilityCollectionItem.getInt("rowIndex");
      int columnIndex = accessibilityCollectionItem.getInt("columnIndex");
      int rowSpan = accessibilityCollectionItem.getInt("rowSpan");
      int columnSpan = accessibilityCollectionItem.getInt("columnSpan");
      boolean heading = accessibilityCollectionItem.getBoolean("heading");

      AccessibilityNodeInfoCompat.CollectionItemInfoCompat collectionItemCompat =
          AccessibilityNodeInfoCompat.CollectionItemInfoCompat.obtain(
              rowIndex, rowSpan, columnIndex, columnSpan, heading);
      info.setCollectionItemInfo(collectionItemCompat);
    }

    if (accessibilityActions != null) {
      for (int i = 0; i < accessibilityActions.size(); i++) {
        final ReadableMap action = accessibilityActions.getMap(i);
        if (!action.hasKey("name")) {
          throw new IllegalArgumentException("Unknown accessibility action.");
        }
        int actionId = sCounter;
        String actionLabel = action.hasKey("label") ? action.getString("label") : null;
        if (sActionIdMap.containsKey(action.getString("name"))) {
          actionId = sActionIdMap.get(action.getString("name"));
        } else {
          sCounter++;
        }
        mAccessibilityActionsMap.put(actionId, action.getString("name"));
        final AccessibilityActionCompat accessibilityAction =
            new AccessibilityActionCompat(actionId, actionLabel);
        info.addAction(accessibilityAction);
      }
    }

    // Process accessibilityValue

    final ReadableMap accessibilityValue = (ReadableMap) host.getTag(R.id.accessibility_value);
    if (accessibilityValue != null
        && accessibilityValue.hasKey("min")
        && accessibilityValue.hasKey("now")
        && accessibilityValue.hasKey("max")) {
      final Dynamic minDynamic = accessibilityValue.getDynamic("min");
      final Dynamic nowDynamic = accessibilityValue.getDynamic("now");
      final Dynamic maxDynamic = accessibilityValue.getDynamic("max");
      if (minDynamic != null
          && minDynamic.getType() == ReadableType.Number
          && nowDynamic != null
          && nowDynamic.getType() == ReadableType.Number
          && maxDynamic != null
          && maxDynamic.getType() == ReadableType.Number) {
        final int min = minDynamic.asInt();
        final int now = nowDynamic.asInt();
        final int max = maxDynamic.asInt();
        if (max > min && now >= min && max >= now) {
          info.setRangeInfo(RangeInfoCompat.obtain(RangeInfoCompat.RANGE_TYPE_INT, min, max, now));
        }
      }
    }

    // Expose the testID prop as the resource-id name of the view. Black-box E2E/UI testing
    // frameworks, which interact with the UI through the accessibility framework, do not have
    // access to view tags. This allows developers/testers to avoid polluting the
    // content-description with test identifiers.
    final String testId = (String) host.getTag(R.id.react_test_id);
    if (testId != null) {
      info.setViewIdResourceName(testId);
    }
    boolean missingContentDescription = TextUtils.isEmpty(info.getContentDescription());
    boolean missingText = TextUtils.isEmpty(info.getText());
    boolean missingTextAndDescription = missingContentDescription && missingText;
    boolean hasContentToAnnounce =
        accessibilityActions != null
            || accessibilityState != null
            || accessibilityLabelledBy != null
            || accessibilityRole != null;
    if (missingTextAndDescription && hasContentToAnnounce) {
      info.setContentDescription(getTalkbackDescription(host, info));
    }
  }

  @Override
  public void onInitializeAccessibilityEvent(View host, AccessibilityEvent event) {
    super.onInitializeAccessibilityEvent(host, event);
    // Set item count and current item index on accessibility events for adjustable
    // in order to make Talkback announce the value of the adjustable
    final ReadableMap accessibilityValue = (ReadableMap) host.getTag(R.id.accessibility_value);
    if (accessibilityValue != null
        && accessibilityValue.hasKey("min")
        && accessibilityValue.hasKey("now")
        && accessibilityValue.hasKey("max")) {
      final Dynamic minDynamic = accessibilityValue.getDynamic("min");
      final Dynamic nowDynamic = accessibilityValue.getDynamic("now");
      final Dynamic maxDynamic = accessibilityValue.getDynamic("max");
      if (minDynamic != null
          && minDynamic.getType() == ReadableType.Number
          && nowDynamic != null
          && nowDynamic.getType() == ReadableType.Number
          && maxDynamic != null
          && maxDynamic.getType() == ReadableType.Number) {
        final int min = minDynamic.asInt();
        final int now = nowDynamic.asInt();
        final int max = maxDynamic.asInt();
        if (max > min && now >= min && max >= now) {
          event.setItemCount(max - min);
          event.setCurrentItemIndex(now);
        }
      }
    }
  }

  @Override
  public boolean performAccessibilityAction(View host, int action, Bundle args) {
    if (action == AccessibilityNodeInfoCompat.ACTION_COLLAPSE) {
      host.setTag(R.id.accessibility_state_expanded, false);
    }
    if (action == AccessibilityNodeInfoCompat.ACTION_EXPAND) {
      host.setTag(R.id.accessibility_state_expanded, true);
    }
    if (mAccessibilityActionsMap.containsKey(action)) {
      final WritableMap event = Arguments.createMap();
      event.putString("actionName", mAccessibilityActionsMap.get(action));
      ReactContext reactContext = (ReactContext) host.getContext();
      if (reactContext.hasActiveReactInstance()) {
        final int reactTag = host.getId();
        final int surfaceId = UIManagerHelper.getSurfaceId(reactContext);
        UIManager uiManager =
            UIManagerHelper.getUIManager(reactContext, ViewUtil.getUIManagerType(reactTag));
        if (uiManager != null) {
          EventDispatcher eventDispatcher = (EventDispatcher) uiManager.getEventDispatcher();
          eventDispatcher.dispatchEvent(
              new Event(surfaceId, reactTag) {
                @Override
                public String getEventName() {
                  return TOP_ACCESSIBILITY_ACTION_EVENT;
                }

                @Override
                protected WritableMap getEventData() {
                  return event;
                }
              });
        }
      } else {
        ReactSoftExceptionLogger.logSoftException(
            TAG, new ReactNoCrashSoftException("Cannot get RCTEventEmitter, no CatalystInstance"));
      }

      // In order to make Talkback announce the change of the adjustable's value,
      // schedule to send a TYPE_VIEW_SELECTED event after performing the scroll actions.
      final AccessibilityRole accessibilityRole =
          (AccessibilityRole) host.getTag(R.id.accessibility_role);
      final ReadableMap accessibilityValue = (ReadableMap) host.getTag(R.id.accessibility_value);
      if (accessibilityRole == AccessibilityRole.ADJUSTABLE
          && (action == AccessibilityActionCompat.ACTION_SCROLL_FORWARD.getId()
              || action == AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.getId())) {
        if (accessibilityValue != null && !accessibilityValue.hasKey("text")) {
          scheduleAccessibilityEventSender(host);
        }
        return super.performAccessibilityAction(host, action, args);
      }
      return true;
    }
    return super.performAccessibilityAction(host, action, args);
  }

  private static void setState(
      AccessibilityNodeInfoCompat info, ReadableMap accessibilityState, Context context) {
    final ReadableMapKeySetIterator i = accessibilityState.keySetIterator();
    while (i.hasNextKey()) {
      final String state = i.nextKey();
      final Dynamic value = accessibilityState.getDynamic(state);
      if (state.equals(STATE_SELECTED) && value.getType() == ReadableType.Boolean) {
        info.setSelected(value.asBoolean());
      } else if (state.equals(STATE_DISABLED) && value.getType() == ReadableType.Boolean) {
        info.setEnabled(!value.asBoolean());
      } else if (state.equals(STATE_CHECKED) && value.getType() == ReadableType.Boolean) {
        final boolean boolValue = value.asBoolean();
        info.setCheckable(true);
        info.setChecked(boolValue);
      }
    }
  }

  /** Strings for setting the Role Description in english */

  // TODO: Eventually support for other languages on talkback

  public static void setRole(
      AccessibilityNodeInfoCompat nodeInfo, AccessibilityRole role, final Context context) {
    if (role == null) {
      role = AccessibilityRole.NONE;
    }
    nodeInfo.setClassName(AccessibilityRole.getValue(role));
    if (role.equals(AccessibilityRole.LINK)) {
      nodeInfo.setRoleDescription(context.getString(R.string.link_description));
    } else if (role.equals(AccessibilityRole.IMAGE)) {
      nodeInfo.setRoleDescription(context.getString(R.string.image_description));
    } else if (role.equals(AccessibilityRole.IMAGEBUTTON)) {
      nodeInfo.setRoleDescription(context.getString(R.string.imagebutton_description));
      nodeInfo.setClickable(true);
    } else if (role.equals(AccessibilityRole.BUTTON)) {
      nodeInfo.setClickable(true);
    } else if (role.equals(AccessibilityRole.TOGGLEBUTTON)) {
      nodeInfo.setClickable(true);
      nodeInfo.setCheckable(true);
    } else if (role.equals(AccessibilityRole.SUMMARY)) {
      nodeInfo.setRoleDescription(context.getString(R.string.summary_description));
    } else if (role.equals(AccessibilityRole.HEADER)) {
      nodeInfo.setHeading(true);
    } else if (role.equals(AccessibilityRole.ALERT)) {
      nodeInfo.setRoleDescription(context.getString(R.string.alert_description));
    } else if (role.equals(AccessibilityRole.COMBOBOX)) {
      nodeInfo.setRoleDescription(context.getString(R.string.combobox_description));
    } else if (role.equals(AccessibilityRole.MENU)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menu_description));
    } else if (role.equals(AccessibilityRole.MENUBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menubar_description));
    } else if (role.equals(AccessibilityRole.MENUITEM)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menuitem_description));
    } else if (role.equals(AccessibilityRole.PROGRESSBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.progressbar_description));
    } else if (role.equals(AccessibilityRole.RADIOGROUP)) {
      nodeInfo.setRoleDescription(context.getString(R.string.radiogroup_description));
    } else if (role.equals(AccessibilityRole.SCROLLBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.scrollbar_description));
    } else if (role.equals(AccessibilityRole.SPINBUTTON)) {
      nodeInfo.setRoleDescription(context.getString(R.string.spinbutton_description));
    } else if (role.equals(AccessibilityRole.TAB)) {
      nodeInfo.setRoleDescription(context.getString(R.string.rn_tab_description));
    } else if (role.equals(AccessibilityRole.TABLIST)) {
      nodeInfo.setRoleDescription(context.getString(R.string.tablist_description));
    } else if (role.equals(AccessibilityRole.TIMER)) {
      nodeInfo.setRoleDescription(context.getString(R.string.timer_description));
    } else if (role.equals(AccessibilityRole.TOOLBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.toolbar_description));
    }
  }

  public static void setDelegate(
      final View view, boolean originalFocus, int originalImportantForAccessibility) {
    // if a view already has an accessibility delegate, replacing it could cause
    // problems,
    // so leave it alone.
    if (!ViewCompat.hasAccessibilityDelegate(view)
        && (view.getTag(R.id.accessibility_role) != null
            || view.getTag(R.id.accessibility_state) != null
            || view.getTag(R.id.accessibility_actions) != null
            || view.getTag(R.id.react_test_id) != null
            || view.getTag(R.id.accessibility_collection_item) != null
            || view.getTag(R.id.accessibility_links) != null
            || view.getTag(R.id.role) != null)) {
      ViewCompat.setAccessibilityDelegate(
          view,
          new ReactAccessibilityDelegate(view, originalFocus, originalImportantForAccessibility));
    }
  }

  // Explicitly re-set the delegate, even if one has already been set.
  public static void resetDelegate(
      final View view, boolean originalFocus, int originalImportantForAccessibility) {
    ViewCompat.setAccessibilityDelegate(
        view,
        new ReactAccessibilityDelegate(view, originalFocus, originalImportantForAccessibility));
  }

  @Override
  protected int getVirtualViewAt(float x, float y) {
    if (mAccessibilityLinks == null
        || mAccessibilityLinks.size() == 0
        || !(mView instanceof TextView)) {
      return INVALID_ID;
    }

    TextView textView = (TextView) mView;
    if (!(textView.getText() instanceof Spanned)) {
      return INVALID_ID;
    }

    Layout layout = textView.getLayout();
    if (layout == null) {
      return INVALID_ID;
    }

    x -= textView.getTotalPaddingLeft();
    y -= textView.getTotalPaddingTop();
    x += textView.getScrollX();
    y += textView.getScrollY();

    int line = layout.getLineForVertical((int) y);
    int charOffset = layout.getOffsetForHorizontal(line, x);

    ClickableSpan clickableSpan = getFirstSpan(charOffset, charOffset, ClickableSpan.class);
    if (clickableSpan == null) {
      return INVALID_ID;
    }

    Spanned spanned = (Spanned) textView.getText();
    int start = spanned.getSpanStart(clickableSpan);
    int end = spanned.getSpanEnd(clickableSpan);

    final AccessibilityLinks.AccessibleLink link = mAccessibilityLinks.getLinkBySpanPos(start, end);
    return link != null ? link.id : INVALID_ID;
  }

  @Override
  protected void getVisibleVirtualViews(List<Integer> virtualViewIds) {
    if (mAccessibilityLinks == null) {
      return;
    }

    for (int i = 0; i < mAccessibilityLinks.size(); i++) {
      virtualViewIds.add(i);
    }
  }

  @Override
  protected void onPopulateNodeForVirtualView(
      int virtualViewId, @NonNull AccessibilityNodeInfoCompat node) {
    // If we get an invalid virtualViewId for some reason (which is known to happen in API 19 and
    // below), return an "empty" node to prevent from crashing. This will never be presented to
    // the user, as Talkback filters out nodes with no content to announce.
    if (mAccessibilityLinks == null) {
      node.setContentDescription("");
      node.setBoundsInParent(new Rect(0, 0, 1, 1));
      return;
    }

    final AccessibilityLinks.AccessibleLink accessibleTextSpan =
        mAccessibilityLinks.getLinkById(virtualViewId);
    if (accessibleTextSpan == null) {
      node.setContentDescription("");
      node.setBoundsInParent(new Rect(0, 0, 1, 1));
      return;
    }

    // NOTE: The span may not actually have visible bounds within its parent,
    // due to line limits, etc.
    final Rect bounds = getBoundsInParent(accessibleTextSpan);
    if (bounds == null) {
      node.setContentDescription("");
      node.setBoundsInParent(new Rect(0, 0, 1, 1));
      return;
    }

    node.setContentDescription(accessibleTextSpan.description);
    node.addAction(AccessibilityNodeInfoCompat.ACTION_CLICK);
    node.setBoundsInParent(bounds);
    node.setRoleDescription(mView.getResources().getString(R.string.link_description));
    node.setClassName(AccessibilityRole.getValue(AccessibilityRole.BUTTON));
  }

  private Rect getBoundsInParent(AccessibilityLinks.AccessibleLink accessibleLink) {
    // This view is not a text view, so return the entire views bounds.
    if (!(mView instanceof TextView)) {
      return new Rect(0, 0, mView.getWidth(), mView.getHeight());
    }

    TextView textView = (TextView) mView;
    Layout textViewLayout = textView.getLayout();
    if (textViewLayout == null) {
      return new Rect(0, 0, textView.getWidth(), textView.getHeight());
    }

    double startOffset = accessibleLink.start;
    double endOffset = accessibleLink.end;

    // Ensure the link hasn't been ellipsized away; in such cases,
    // getPrimaryHorizontal will crash (and the link isn't rendered anyway).
    int startOffsetLineNumber = textViewLayout.getLineForOffset((int) startOffset);
    int lineEndOffset = textViewLayout.getLineEnd(startOffsetLineNumber);
    if (startOffset > lineEndOffset) {
      return null;
    }

    Rect rootRect = new Rect();

    double startXCoordinates = textViewLayout.getPrimaryHorizontal((int) startOffset);

    final Paint paint = new Paint();
    AbsoluteSizeSpan sizeSpan =
        getFirstSpan(accessibleLink.start, accessibleLink.end, AbsoluteSizeSpan.class);
    float textSize = sizeSpan != null ? sizeSpan.getSize() : textView.getTextSize();
    paint.setTextSize(textSize);
    int textWidth = (int) Math.ceil(paint.measureText(accessibleLink.description));

    int endOffsetLineNumber = textViewLayout.getLineForOffset((int) endOffset);
    boolean isMultiline = startOffsetLineNumber != endOffsetLineNumber;
    textViewLayout.getLineBounds(startOffsetLineNumber, rootRect);

    int verticalOffset = textView.getScrollY() + textView.getTotalPaddingTop();
    rootRect.top += verticalOffset;
    rootRect.bottom += verticalOffset;
    rootRect.left += startXCoordinates + textView.getTotalPaddingLeft() - textView.getScrollX();

    // The bounds for multi-line strings should *only* include the first line. This is because for
    // API 25 and below, Talkback's click is triggered at the center point of these bounds, and if
    // that center point is outside the spannable, it will click on something else. There is no
    // harm in not outlining the wrapped part of the string, as the text for the whole string will
    // be read regardless of the bounding box.
    if (isMultiline) {
      return new Rect(rootRect.left, rootRect.top, rootRect.right, rootRect.bottom);
    }

    return new Rect(rootRect.left, rootRect.top, rootRect.left + textWidth, rootRect.bottom);
  }

  @Override
  protected boolean onPerformActionForVirtualView(
      int virtualViewId, int action, @Nullable Bundle arguments) {
    return false;
  }

  protected @Nullable <T> T getFirstSpan(int start, int end, Class<T> classType) {
    if (!(mView instanceof TextView) || !(((TextView) mView).getText() instanceof Spanned)) {
      return null;
    }

    Spanned spanned = (Spanned) ((TextView) mView).getText();
    T[] spans = spanned.getSpans(start, end, classType);
    return spans.length > 0 ? spans[0] : null;
  }

  public static class AccessibilityLinks {
    private final List<AccessibleLink> mLinks;

    public AccessibilityLinks(ClickableSpan[] spans, Spannable text) {
      ArrayList<AccessibleLink> links = new ArrayList<>();
      for (int i = 0; i < spans.length; i++) {
        ClickableSpan span = spans[i];
        int start = text.getSpanStart(span);
        int end = text.getSpanEnd(span);
        // zero length spans, and out of range spans should not be included.
        if (start == end || start < 0 || end < 0 || start > text.length() || end > text.length()) {
          continue;
        }

        final AccessibleLink link = new AccessibleLink();
        link.description = text.subSequence(start, end).toString();
        link.start = start;
        link.end = end;

        // ID is the reverse of what is expected, since the ClickableSpans are returned in reverse
        // order due to being added in reverse order. If we don't do this, focus will move to the
        // last link first and move backwards.
        //
        // If this approach becomes unreliable, we should instead look at their start position and
        // order them manually.
        link.id = spans.length - 1 - i;
        links.add(link);
      }
      mLinks = links;
    }

    @Nullable
    public AccessibleLink getLinkById(int id) {
      for (AccessibleLink link : mLinks) {
        if (link.id == id) {
          return link;
        }
      }

      return null;
    }

    @Nullable
    public AccessibleLink getLinkBySpanPos(int start, int end) {
      for (AccessibleLink link : mLinks) {
        if (link.start == start && link.end == end) {
          return link;
        }
      }

      return null;
    }

    public int size() {
      return mLinks.size();
    }

    private static class AccessibleLink {
      public String description;
      public int start;
      public int end;
      public int id;
    }
  }

  @Override
  public @Nullable AccessibilityNodeProviderCompat getAccessibilityNodeProvider(View host) {
    // Only set a NodeProvider if we have virtual views, otherwise just return null here so that
    // we fall back to the View class's default behavior. If we don't do this, then Views with
    // no virtual children will fall back to using ExploreByTouchHelper's onPopulateNodeForHost
    // method to populate their AccessibilityNodeInfo, which defaults to doing nothing, so no
    // AccessibilityNodeInfo will be created. Alternatively, we could override
    // onPopulateNodeForHost instead, and have it create an AccessibilityNodeInfo for the host
    // but this is what the default View class does by itself, so we may as well defer to it.
    if (mAccessibilityLinks != null) {
      return super.getAccessibilityNodeProvider(host);
    }

    return null;
  }

  /**
   * Determines if the supplied {@link View} and {@link AccessibilityNodeInfoCompat} has any
   * children which are not independently accessibility focusable and also have a spoken
   * description.
   *
   * <p>NOTE: Accessibility services will include these children's descriptions in the closest
   * focusable ancestor.
   *
   * @param view The {@link View} to evaluate
   * @param node The {@link AccessibilityNodeInfoCompat} to evaluate
   * @return {@code true} if it has any non-actionable speaking descendants within its subtree
   */
  public static boolean hasNonActionableSpeakingDescendants(
      @Nullable AccessibilityNodeInfoCompat node, @Nullable View view) {

    if (node == null || view == null || !(view instanceof ViewGroup)) {
      return false;
    }

    final ViewGroup viewGroup = (ViewGroup) view;
    for (int i = 0, count = viewGroup.getChildCount(); i < count; i++) {
      final View childView = viewGroup.getChildAt(i);

      if (childView == null) {
        continue;
      }

      final AccessibilityNodeInfoCompat childNode = AccessibilityNodeInfoCompat.obtain();
      try {
        ViewCompat.onInitializeAccessibilityNodeInfo(childView, childNode);

        if (!childNode.isVisibleToUser()) {
          continue;
        }

        if (isAccessibilityFocusable(childNode, childView)) {
          continue;
        }

        if (isSpeakingNode(childNode, childView)) {
          return true;
        }
      } finally {
        if (childNode != null) {
          childNode.recycle();
        }
      }
    }

    return false;
  }

  /**
   * Returns whether the node has valid RangeInfo.
   *
   * @param node The node to check.
   * @return Whether the node has valid RangeInfo.
   */
  public static boolean hasValidRangeInfo(@Nullable AccessibilityNodeInfoCompat node) {
    if (node == null) {
      return false;
    }

    @Nullable final RangeInfoCompat rangeInfo = node.getRangeInfo();
    if (rangeInfo == null) {
      return false;
    }

    final float maxProgress = rangeInfo.getMax();
    final float minProgress = rangeInfo.getMin();
    final float currentProgress = rangeInfo.getCurrent();
    final float diffProgress = maxProgress - minProgress;
    return (diffProgress > 0.0f)
        && (currentProgress >= minProgress)
        && (currentProgress <= maxProgress);
  }

  /**
   * Returns whether the specified node has state description.
   *
   * @param node The node to check.
   * @return {@code true} if the node has state description.
   */
  private static boolean hasStateDescription(@Nullable AccessibilityNodeInfoCompat node) {
    return node != null
        && (!TextUtils.isEmpty(node.getStateDescription())
            || node.isCheckable()
            || hasValidRangeInfo(node));
  }

  /**
   * Returns whether the supplied {@link View} and {@link AccessibilityNodeInfoCompat} would produce
   * spoken feedback if it were accessibility focused. NOTE: not all speaking nodes are focusable.
   *
   * @param view The {@link View} to evaluate
   * @param node The {@link AccessibilityNodeInfoCompat} to evaluate
   * @return {@code true} if it meets the criterion for producing spoken feedback
   */
  public static boolean isSpeakingNode(
      @Nullable AccessibilityNodeInfoCompat node, @Nullable View view) {
    if (node == null || view == null) {
      return false;
    }

    final int important = ViewCompat.getImportantForAccessibility(view);
    if (important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
        || (important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO && node.getChildCount() <= 0)) {
      return false;
    }

    return hasText(node)
        || hasStateDescription(node)
        || node.isCheckable()
        || hasNonActionableSpeakingDescendants(node, view);
  }

  public static boolean hasText(@Nullable AccessibilityNodeInfoCompat node) {
    return node != null
        && node.getCollectionInfo() == null
        && (!TextUtils.isEmpty(node.getText())
            || !TextUtils.isEmpty(node.getContentDescription())
            || !TextUtils.isEmpty(node.getHintText()));
  }

  /**
   * Determines if the provided {@link View} and {@link AccessibilityNodeInfoCompat} meet the
   * criteria for gaining accessibility focus.
   *
   * <p>Note: this is evaluating general focusability by accessibility services, and does not mean
   * this view will be guaranteed to be focused by specific services such as Talkback. For Talkback
   * focusability, see {@link #isTalkbackFocusable(View)}
   *
   * @param view The {@link View} to evaluate
   * @param node The {@link AccessibilityNodeInfoCompat} to evaluate
   * @return {@code true} if it is possible to gain accessibility focus
   */
  public static boolean isAccessibilityFocusable(
      @Nullable AccessibilityNodeInfoCompat node, @Nullable View view) {
    if (node == null || view == null) {
      return false;
    }

    // Never focus invisible nodes.
    if (!node.isVisibleToUser()) {
      return false;
    }

    // Always focus "actionable" nodes.
    return node.isScreenReaderFocusable() || isActionableForAccessibility(node);
  }

  /**
   * Returns whether a node is actionable. That is, the node supports one of {@link
   * AccessibilityNodeInfoCompat#isClickable()}, {@link AccessibilityNodeInfoCompat#isFocusable()},
   * or {@link AccessibilityNodeInfoCompat#isLongClickable()}.
   *
   * @param node The {@link AccessibilityNodeInfoCompat} to evaluate
   * @return {@code true} if node is actionable.
   */
  public static boolean isActionableForAccessibility(@Nullable AccessibilityNodeInfoCompat node) {
    if (node == null) {
      return false;
    }

    if (node.isClickable() || node.isLongClickable() || node.isFocusable()) {
      return true;
    }

    final List actionList = node.getActionList();
    return actionList.contains(AccessibilityNodeInfoCompat.ACTION_CLICK)
        || actionList.contains(AccessibilityNodeInfoCompat.ACTION_LONG_CLICK)
        || actionList.contains(AccessibilityNodeInfoCompat.ACTION_FOCUS);
  }

  /**
   * Returns a cached instance if such is available otherwise a new one.
   *
   * @param view The {@link View} to derive the AccessibilityNodeInfo properties from.
   * @return {@link FlipperObject} containing the properties.
   */
  @Nullable
  public static AccessibilityNodeInfoCompat createNodeInfoFromView(View view) {
    if (view == null) {
      return null;
    }

    final AccessibilityNodeInfoCompat nodeInfo = AccessibilityNodeInfoCompat.obtain();

    // For some unknown reason, Android seems to occasionally throw a NPE from
    // onInitializeAccessibilityNodeInfo.
    try {
      ViewCompat.onInitializeAccessibilityNodeInfo(view, nodeInfo);
    } catch (NullPointerException e) {
      if (nodeInfo != null) {
        nodeInfo.recycle();
      }
      return null;
    }

    return nodeInfo;
  }

  /**
   * Creates the text that Google's TalkBack screen reader will read aloud for a given {@link View}.
   * This may be any combination of the {@link View}'s {@code text}, {@code contentDescription}, and
   * the {@code text} and {@code contentDescription} of any ancestor {@link View}.
   *
   * <p>This description is generally ported over from Google's TalkBack screen reader, and this
   * should be kept up to date with their implementation (as much as necessary). Details can be seen
   * in their source code here:
   *
   * <p>https://github.com/google/talkback/compositor/src/main/res/raw/compositor.json - search for
   * "get_description_for_tree", "append_description_for_tree", "description_for_tree_nodes"
   *
   * @param view The {@link View} to evaluate.
   * @param info The default {@link AccessibilityNodeInfoCompat}.
   * @return {@code String} representing what talkback will say when a {@link View} is focused.
   */
  @Nullable
  public static CharSequence getTalkbackDescription(
      View view, @Nullable AccessibilityNodeInfoCompat info) {
    final AccessibilityNodeInfoCompat node =
        info == null ? createNodeInfoFromView(view) : AccessibilityNodeInfoCompat.obtain(info);

    if (node == null) {
      return null;
    }
    try {
      final CharSequence contentDescription = node.getContentDescription();
      final CharSequence nodeText = node.getText();

      final boolean hasNodeText = !TextUtils.isEmpty(nodeText);
      final boolean isEditText = view instanceof EditText;

      StringBuilder talkbackSegments = new StringBuilder();

      // EditText's prioritize their own text content over a contentDescription so skip this
      if (!TextUtils.isEmpty(contentDescription) && (!isEditText || !hasNodeText)) {
        // next add content description
        talkbackSegments.append(contentDescription);
        return talkbackSegments;
      }

      // EditText
      if (hasNodeText) {
        // skipped status checks above for EditText

        // description
        talkbackSegments.append(nodeText);
        return talkbackSegments;
      }

      // If there are child views and no contentDescription the text of all non-focusable children,
      // comma separated, becomes the description.
      if (view instanceof ViewGroup) {
        final StringBuilder concatChildDescription = new StringBuilder();
        final ViewGroup viewGroup = (ViewGroup) view;

        for (int i = 0, count = viewGroup.getChildCount(); i < count; i++) {
          final View child = viewGroup.getChildAt(i);

          final AccessibilityNodeInfoCompat childNodeInfo = AccessibilityNodeInfoCompat.obtain();
          ViewCompat.onInitializeAccessibilityNodeInfo(child, childNodeInfo);

          if (isSpeakingNode(childNodeInfo, child)
              && !isAccessibilityFocusable(childNodeInfo, child)) {
            CharSequence childNodeDescription = getTalkbackDescription(child, null);
            if (!TextUtils.isEmpty(childNodeDescription)) {
              concatChildDescription.append(childNodeDescription + delimiter);
            }
          }
          childNodeInfo.recycle();
        }

        return removeFinalDelimiter(concatChildDescription);
      }

      return null;
    } finally {
      node.recycle();
    }
  }

  private static String removeFinalDelimiter(StringBuilder builder) {
    int end = builder.length();
    if (end > 0) {
      builder.delete(end - delimiterLength, end);
    }
    return builder.toString();
  }
}
