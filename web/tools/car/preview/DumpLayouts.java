import com.personal.nav.roadglow.CarLayout;
public class Dump { public static void main(String[] a) {
  Object[][] cases = { {"full",1920,720,new int[]{0,0,1920,720},2f}, {"split",1920,720,new int[]{0,0,1280,720},2f}, {"small",800,480,new int[]{0,0,800,480},1f} };
  StringBuilder sb = new StringBuilder("{");
  for (Object[] c : cases) for (int nav = 0; nav < 2; nav++) { int[] v = (int[]) c[3]; CarLayout o = CarLayout.compute((int) c[1], (int) c[2], v, v, (float) c[4], nav == 1, true, true);
    if (sb.length() > 1) sb.append(',');
    sb.append(String.format(java.util.Locale.ROOT, "\"%s_%d\":{\"w\":%d,\"h\":%d,\"vis\":[%d,%d,%d,%d],\"density\":%s,\"kind\":%d,\"panel\":%b,\"pl\":%d,\"pt\":%d,\"pr\":%d,\"pb\":%d,\"scale\":%f,\"pad\":%f,\"arrow\":%f,\"dist\":%f,\"street\":%f,\"info\":%f,\"lane\":%f,\"gap\":%f,\"padL\":%d,\"padT\":%d,\"padR\":%d,\"padB\":%d,\"meX\":%f,\"meY\":%f,\"meUnderPanel\":%b}",
      c[0], nav, (int) c[1], (int) c[2], v[0], v[1], v[2], v[3], c[4], o.kind, o.panel, o.pl, o.pt, o.pr, o.pb, o.scale, o.pad, o.arrow, o.dist, o.street, o.info, o.lane, o.gap, o.padL, o.padT, o.padR, o.padB, o.meX, o.meY, o.overlapsPanel(o.meX, o.meY))); }
  System.out.println(sb.append("}")); } }
