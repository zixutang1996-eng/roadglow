package com.personal.nav.roadglow.car;

import com.personal.nav.roadglow.CarState;
import java.util.Locale;

/** Car-screen strings: follow the system language; the ink skin (分久必合) uses classical Chinese wording. */
final class CarText {
    private CarText() {}
    static boolean zh() { return CarState.zh || Locale.getDefault().getLanguage().startsWith("zh"); }
    static String t(String en, String zh, String ink) { return !zh() ? en : (CarState.ink ? ink : zh); }
    static String search() { return t("Search", "搜索", "寻地"); }
    static String searchHint() { return t("Search places", "搜索地点", "欲往何处"); }
    static String results() { return t("Results", "搜索结果", "所寻之地"); }
    static String go() { return t("Go", "出发", "启程"); }
    static String stop() { return t("End", "结束", "罢行"); }
    static String noResults() { return t("No results", "没有结果", "未寻得此地"); }
    static String searching() { return t("Searching…", "正在搜索…", "正在寻访…"); }
    static String waitingPhone() { return t("Open RoadGlow on the phone to navigate", "请在手机上打开 RoadGlow 以开始导航", "请于手机启 RoadGlow，方可启程"); }
    static String idle() { return t("RoadGlow", "RoadGlow", "分久必合"); }
    static String allow() { return t("Allow", "授权", "准许"); }
    static String needLocation() { return t("Location access needed", "需要位置权限", "需知所在"); }
    static String needLocationText() { return t("Allow location for RoadGlow on your phone", "请在手机上允许 RoadGlow 使用位置", "请于手机准许 RoadGlow 知晓所在"); }
    static String needNotif() { return t("Notifications are off: navigation keeps running, but the phone shows no status", "通知已关闭：导航仍可运行，但手机上不显示状态", "通知已闭：仍可行路，手机不示其状"); }
    static String offline() { return t("No connection — try again", "无网络连接，请稍后重试", "音信不通，稍后再试"); }
    static String sent() { return t("Sent to phone — starting route", "已发送到手机，正在规划路线", "已传书于手机，正在谋划路径"); }
}
