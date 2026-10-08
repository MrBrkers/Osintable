import JSZip from 'jszip';

export async function downloadAndroidZip(): Promise<void> {
  const zip = new JSZip();

  // Root files
  zip.file('build.gradle', `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:7.4.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`);

  zip.file('settings.gradle', `include ':app'
rootProject.name = "OsintDesk"
`);

  zip.file('README.md', `# OsintDesk - Android OSINT Network Mapper (Java)

Bu proje AIDE (Android IDE) ve Android Studio üzerinde doğrudan derlenebilir (build & run) olarak tasarlanmış yerel Java Android uygulamasıdır.

## A-IDE Üzerinde Nasıl Derlenir?
1. İndirdiğiniz 'OsintDesk-Android-AIDE.zip' dosyasını telefonunuzun hafızasındaki /sdcard/AppProjects/OsintDesk/ klasörüne çıkartın.
2. A-IDE uygulamasını açın ve 'Open Project...' seçeneğiyle bu klasörü seçin.
3. Sağ üstteki 'Çalıştır' (Play) simgesine basarak APK'yı derleyin.
`);

  // app/build.gradle
  zip.file('app/build.gradle', `apply plugin: 'com.android.application'

android {
    compileSdkVersion 33

    defaultConfig {
        applicationId "com.osintdesk.networkmapper"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    // Pure standard Android SDK APIs used so AIDE can build immediately offline without Gradle downloads!
}
`);

  // AndroidManifest.xml
  zip.file('app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.osintdesk.networkmapper"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@android:drawable/sym_def_app_icon"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustPan">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`);

  // Java Models
  const javaPkg = 'app/src/main/java/com/osintdesk/networkmapper/';

  zip.file(javaPkg + 'model/NodeType.java', `package com.osintdesk.networkmapper.model;

public enum NodeType {
    PERSON("Kişi / Hedef", "👤", "#1e3a8a"),
    COMPANY("Şirket / Kurum", "🏢", "#065f46"),
    DOMAIN("Domain / Web", "🌐", "#7c2d12"),
    IP_ADDRESS("IP / Sunucu", "🖥️", "#374151"),
    SOCIAL_MEDIA("Sosyal Medya", "💬", "#0284c7"),
    EMAIL("E-Posta", "✉️", "#6b21a8"),
    PHONE("Telefon", "📱", "#0f766e"),
    LOCATION("Konum / Adres", "📍", "#b45309"),
    VEHICLE("Araç / Plaka", "🚗", "#475569"),
    BANK_ACCOUNT("Banka / Finans", "💳", "#15803d"),
    DOCUMENT("Belge / Dosya", "📄", "#4f46e5");

    private final String label;
    private final String icon;
    private final String defaultColor;

    NodeType(String label, String icon, String defaultColor) {
        this.label = label;
        this.icon = icon;
        this.defaultColor = defaultColor;
    }

    public String getLabel() { return label; }
    public String getIcon() { return icon; }
    public String getDefaultColor() { return defaultColor; }

    public static NodeType fromString(String text) {
        for (NodeType b : NodeType.values()) {
            if (b.name().equalsIgnoreCase(text) || b.label.equalsIgnoreCase(text)) {
                return b;
            }
        }
        return PERSON;
    }
}
`);

  zip.file(javaPkg + 'model/EdgeStyle.java', `package com.osintdesk.networkmapper.model;

public enum EdgeStyle {
    SOLID, DASHED, DOTTED;

    public static EdgeStyle fromString(String val) {
        if (val == null) return SOLID;
        try { return EdgeStyle.valueOf(val.toUpperCase()); } catch (Exception e) { return SOLID; }
    }
}
`);

  zip.file(javaPkg + 'model/EdgeDirection.java', `package com.osintdesk.networkmapper.model;

public enum EdgeDirection {
    DIRECTED("İleri (—►)"),
    BIDIRECTIONAL("Çift Yön (◄—►)"),
    REVERSE("Geri (◄—)"),
    UNDIRECTED("Yönsüz (——)");

    private final String label;
    EdgeDirection(String label) { this.label = label; }
    public String getLabel() { return label; }

    public static EdgeDirection fromString(String val) {
        if (val == null) return DIRECTED;
        try { return EdgeDirection.valueOf(val.toUpperCase()); } catch (Exception e) { return DIRECTED; }
    }
}
`);

  zip.file(javaPkg + 'model/NodeEntity.java', `package com.osintdesk.networkmapper.model;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class NodeEntity {
    private String id;
    private NodeType type;
    private String label;
    private String notes;
    private String color;
    private String imageUrl;
    private List<String> tags;
    private float x;
    private float y;

    public NodeEntity(String id, NodeType type, String label, float x, float y) {
        this.id = id;
        this.type = type;
        this.label = label;
        this.x = x;
        this.y = y;
        this.notes = "";
        this.color = type.getDefaultColor();
        this.tags = new ArrayList<>();
    }

    public NodeEntity(NodeEntity other, String newId, float offsetX, float offsetY) {
        this.id = newId;
        this.type = other.type;
        this.label = other.label + " (Kopya)";
        this.notes = other.notes;
        this.color = other.color;
        this.imageUrl = other.imageUrl;
        this.tags = new ArrayList<>(other.tags);
        this.x = other.x + offsetX;
        this.y = other.y + offsetY;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public NodeType getType() { return type; }
    public void setType(NodeType type) { this.type = type; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getColor() { return color != null ? color : type.getDefaultColor(); }
    public void setColor(String color) { this.color = color; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public float getX() { return x; }
    public void setX(float x) { this.x = x; }
    public float getY() { return y; }
    public void setY(float y) { this.y = y; }

    public JSONObject toJSON() {
        JSONObject obj = new JSONObject();
        try {
            obj.put("id", id);
            obj.put("type", type.name().toLowerCase());
            obj.put("label", label);
            obj.put("notes", notes != null ? notes : "");
            obj.put("color", color);
            obj.put("imageUrl", imageUrl != null ? imageUrl : "");
            obj.put("x", x);
            obj.put("y", y);
            JSONArray tagArr = new JSONArray();
            if (tags != null) { for (String t : tags) tagArr.put(t); }
            obj.put("tags", tagArr);
        } catch (Exception ignored) {}
        return obj;
    }

    public static NodeEntity fromJSON(JSONObject obj) {
        try {
            String id = obj.getString("id");
            NodeType type = NodeType.fromString(obj.optString("type", "person"));
            String label = obj.optString("label", "İsimsiz");
            float x = (float) obj.optDouble("x", 0);
            float y = (float) obj.optDouble("y", 0);

            NodeEntity node = new NodeEntity(id, type, label, x, y);
            node.setNotes(obj.optString("notes", ""));
            node.setColor(obj.optString("color", type.getDefaultColor()));
            node.setImageUrl(obj.optString("imageUrl", ""));
            return node;
        } catch (Exception e) { return null; }
    }
}
`);

  zip.file(javaPkg + 'model/EdgeEntity.java', `package com.osintdesk.networkmapper.model;

import org.json.JSONObject;

public class EdgeEntity {
    private String id;
    private String source;
    private String target;
    private String relation;
    private String color;
    private float width;
    private EdgeStyle style;
    private EdgeDirection direction;

    public EdgeEntity(String id, String source, String target, String relation) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.relation = relation;
        this.color = "#1d5fa6";
        this.width = 3.0f;
        this.style = EdgeStyle.SOLID;
        this.direction = EdgeDirection.DIRECTED;
    }

    public String getId() { return id; }
    public String getSource() { return source; }
    public String getTarget() { return target; }
    public String getRelation() { return relation; }
    public void setRelation(String relation) { this.relation = relation; }
    public String getColor() { return color != null ? color : "#1d5fa6"; }
    public void setColor(String color) { this.color = color; }
    public float getWidth() { return width > 0 ? width : 3.0f; }
    public void setWidth(float width) { this.width = width; }
    public EdgeStyle getStyle() { return style != null ? style : EdgeStyle.SOLID; }
    public void setStyle(EdgeStyle style) { this.style = style; }
    public EdgeDirection getDirection() { return direction != null ? direction : EdgeDirection.DIRECTED; }
    public void setDirection(EdgeDirection direction) { this.direction = direction; }
}
`);

  zip.file(javaPkg + 'model/ProjectEntity.java', `package com.osintdesk.networkmapper.model;

import java.util.ArrayList;
import java.util.List;

public class ProjectEntity {
    private String id;
    private String name;
    private String description;
    private List<NodeEntity> nodes = new ArrayList<>();
    private List<EdgeEntity> edges = new ArrayList<>();

    public ProjectEntity(String id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public List<NodeEntity> getNodes() { return nodes; }
    public void setNodes(List<NodeEntity> nodes) { this.nodes = nodes; }
    public List<EdgeEntity> getEdges() { return edges; }
    public void setEdges(List<EdgeEntity> edges) { this.edges = edges; }
}
`);

  // Canvas View
  zip.file(javaPkg + 'view/NetworkCanvasView.java', `package com.osintdesk.networkmapper.view;

import android.content.Context;
import android.graphics.*;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;

import com.osintdesk.networkmapper.model.EdgeDirection;
import com.osintdesk.networkmapper.model.EdgeEntity;
import com.osintdesk.networkmapper.model.EdgeStyle;
import com.osintdesk.networkmapper.model.NodeEntity;

import java.util.*;

public class NetworkCanvasView extends View {

    public interface CanvasListener {
        void onNodeClick(NodeEntity node);
        void onNodeLongPress(NodeEntity node, List<NodeEntity> selectedNodes, float screenX, float screenY);
        void onSelectionChanged(List<String> selectedNodeIds);
    }

    private List<NodeEntity> nodes = new ArrayList<>();
    private List<EdgeEntity> edges = new ArrayList<>();
    private final Set<String> selectedNodeIds = new HashSet<>();
    private CanvasListener listener;

    private float scale = 1.0f;
    private float panX = 0f;
    private float panY = 0f;

    private ScaleGestureDetector scaleDetector;

    private Paint gridPaint;
    private Paint nodeCardPaint;
    private Paint nodeHeaderPaint;
    private Paint nodeStrokePaint;
    private Paint textTitlePaint;
    private Paint textSubtitlePaint;
    private Paint textIconPaint;
    private Paint edgePaint;
    private Paint edgeTextPaint;
    private Paint edgeBadgePaint;
    private Paint marqueeFillPaint;
    private Paint marqueeStrokePaint;

    private NodeEntity draggedNode = null;
    private boolean hasDragged = false;
    private float lastTouchX, lastTouchY;
    private float downTouchX, downTouchY;
    private long downTime = 0;

    // 1-second long-press timer ("Sadece 1 sn basılı tutunca gelen menü")
    private final Handler longPressHandler = new Handler(Looper.getMainLooper());
    private Runnable longPressRunnable = null;
    private NodeEntity longPressedNode = null;

    private boolean isMarqueeSelecting = false;
    private float marqueeStartX, marqueeStartY;
    private float marqueeCurrentX, marqueeCurrentY;

    private boolean isSelectMode = false;

    private static final float NODE_WIDTH = 120f;
    private static final float NODE_HEIGHT = 70f;

    public NetworkCanvasView(Context context) { super(context); init(context); }
    public NetworkCanvasView(Context context, AttributeSet attrs) { super(context, attrs); init(context); }

    private void init(Context context) {
        gridPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        gridPaint.setColor(Color.parseColor("#d8dde6"));
        gridPaint.setStrokeWidth(1.2f);

        nodeCardPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        nodeCardPaint.setColor(Color.WHITE);
        nodeCardPaint.setStyle(Paint.Style.FILL);

        nodeHeaderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        nodeHeaderPaint.setStyle(Paint.Style.FILL);

        nodeStrokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        nodeStrokePaint.setStyle(Paint.Style.STROKE);
        nodeStrokePaint.setStrokeWidth(2.5f);

        textTitlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textTitlePaint.setColor(Color.parseColor("#0f172a"));
        textTitlePaint.setTextSize(13f);
        textTitlePaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));

        textSubtitlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textSubtitlePaint.setColor(Color.parseColor("#64748b"));
        textSubtitlePaint.setTextSize(10f);

        textIconPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textIconPaint.setTextSize(14f);

        edgePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        edgePaint.setStyle(Paint.Style.STROKE);
        edgePaint.setStrokeCap(Paint.Cap.ROUND);

        edgeTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        edgeTextPaint.setColor(Color.parseColor("#1e293b"));
        edgeTextPaint.setTextSize(10f);
        edgeTextPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));

        edgeBadgePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        edgeBadgePaint.setColor(Color.WHITE);
        edgeBadgePaint.setStyle(Paint.Style.FILL);

        marqueeFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        marqueeFillPaint.setColor(Color.parseColor("#222563eb"));
        marqueeFillPaint.setStyle(Paint.Style.FILL);

        marqueeStrokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        marqueeStrokePaint.setColor(Color.parseColor("#2563eb"));
        marqueeStrokePaint.setStyle(Paint.Style.STROKE);
        marqueeStrokePaint.setStrokeWidth(2f);
        marqueeStrokePaint.setPathEffect(new DashPathEffect(new float[]{8, 5}, 0));

        scaleDetector = new ScaleGestureDetector(context, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override
            public boolean onScale(ScaleGestureDetector detector) {
                float factor = detector.getScaleFactor();
                float newScale = Math.max(0.2f, Math.min(scale * factor, 3.5f));
                float focusX = detector.getFocusX();
                float focusY = detector.getFocusY();
                panX = focusX - (focusX - panX) * (newScale / scale);
                panY = focusY - (focusY - panY) * (newScale / scale);
                scale = newScale;
                invalidate();
                return true;
            }
        });
    }

    public void setData(List<NodeEntity> nodes, List<EdgeEntity> edges) {
        this.nodes = nodes != null ? nodes : new ArrayList<NodeEntity>();
        this.edges = edges != null ? edges : new ArrayList<EdgeEntity>();
        invalidate();
    }

    public void setCanvasListener(CanvasListener listener) { this.listener = listener; }
    public Set<String> getSelectedNodeIds() { return selectedNodeIds; }
    public void setSelectMode(boolean selectMode) { this.isSelectMode = selectMode; invalidate(); }
    public boolean isSelectMode() { return isSelectMode; }

    public void resetZoom() {
        scale = 1.0f;
        panX = getWidth() / 2f;
        panY = getHeight() / 2f;
        invalidate();
    }

    public void fitView() {
        if (nodes.isEmpty()) return;
        float minX = Float.MAX_VALUE, maxX = -Float.MAX_VALUE;
        float minY = Float.MAX_VALUE, maxY = -Float.MAX_VALUE;
        for (NodeEntity n : nodes) {
            if (n.getX() < minX) minX = n.getX();
            if (n.getX() > maxX) maxX = n.getX();
            if (n.getY() < minY) minY = n.getY();
            if (n.getY() > maxY) maxY = n.getY();
        }
        float pad = 150f;
        minX -= pad; maxX += pad; minY -= pad; maxY += pad;
        float graphW = Math.max(100f, maxX - minX);
        float graphH = Math.max(100f, maxY - minY);

        float sX = getWidth() / graphW;
        float sY = getHeight() / graphH;
        scale = Math.max(0.25f, Math.min(Math.min(sX, sY), 1.5f));

        float midX = (minX + maxX) / 2f;
        float midY = (minY + maxY) / 2f;
        panX = getWidth() / 2f - midX * scale;
        panY = getHeight() / 2f - midY * scale;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int w = getWidth();
        int h = getHeight();

        canvas.drawColor(Color.parseColor("#f3f5f8"));
        float gridSize = 40f * scale;
        float startX = panX % gridSize;
        float startY = panY % gridSize;
        for (float x = startX; x < w; x += gridSize) canvas.drawLine(x, 0, x, h, gridPaint);
        for (float y = startY; y < h; y += gridSize) canvas.drawLine(0, y, w, y, gridPaint);

        canvas.save();
        canvas.translate(panX, panY);
        canvas.scale(scale, scale);

        Map<String, NodeEntity> nodeMap = new HashMap<>();
        for (NodeEntity n : nodes) nodeMap.put(n.getId(), n);

        for (EdgeEntity edge : edges) {
            NodeEntity s = nodeMap.get(edge.getSource());
            NodeEntity t = nodeMap.get(edge.getTarget());
            if (s != null && t != null) drawEdge(canvas, edge, s, t);
        }

        for (NodeEntity node : nodes) {
            drawNode(canvas, node, selectedNodeIds.contains(node.getId()));
        }

        canvas.restore();

        if (isMarqueeSelecting) {
            float left = Math.min(marqueeStartX, marqueeCurrentX);
            float right = Math.max(marqueeStartX, marqueeCurrentX);
            float top = Math.min(marqueeStartY, marqueeCurrentY);
            float bottom = Math.max(marqueeStartY, marqueeCurrentY);
            canvas.drawRect(left, top, right, bottom, marqueeFillPaint);
            canvas.drawRect(left, top, right, bottom, marqueeStrokePaint);
        }
    }

    private void drawEdge(Canvas canvas, EdgeEntity edge, NodeEntity s, NodeEntity t) {
        try { edgePaint.setColor(Color.parseColor(edge.getColor())); } catch (Exception e) { edgePaint.setColor(Color.parseColor("#1d5fa6")); }
        edgePaint.setStrokeWidth(edge.getWidth());

        if (edge.getStyle() == EdgeStyle.DASHED) {
            edgePaint.setPathEffect(new DashPathEffect(new float[]{10, 6}, 0));
        } else if (edge.getStyle() == EdgeStyle.DOTTED) {
            edgePaint.setPathEffect(new DashPathEffect(new float[]{3, 4}, 0));
        } else {
            edgePaint.setPathEffect(null);
        }

        float dx = t.getX() - s.getX();
        float dy = t.getY() - s.getY();
        float dist = (float) Math.hypot(dx, dy);
        if (dist < 40f) return;

        float uX = dx / dist;
        float uY = dy / dist;

        float boundPad = 40f;
        float startX = s.getX() + uX * boundPad;
        float startY = s.getY() + uY * boundPad;
        float endX = t.getX() - uX * boundPad;
        float endY = t.getY() - uY * boundPad;

        canvas.drawLine(startX, startY, endX, endY, edgePaint);

        double angle = Math.atan2(endY - startY, endX - startX);
        if (edge.getDirection() == EdgeDirection.DIRECTED || edge.getDirection() == EdgeDirection.BIDIRECTIONAL) {
            drawArrowHead(canvas, endX, endY, angle, edgePaint.getColor());
        }
        if (edge.getDirection() == EdgeDirection.REVERSE || edge.getDirection() == EdgeDirection.BIDIRECTIONAL) {
            drawArrowHead(canvas, startX, startY, angle + Math.PI, edgePaint.getColor());
        }

        if (edge.getRelation() != null && !edge.getRelation().isEmpty() && scale > 0.4f) {
            float midX = (startX + endX) / 2f;
            float midY = (startY + endY) / 2f;
            String rel = edge.getRelation();
            float textW = edgeTextPaint.measureText(rel);

            RectF badgeRect = new RectF(midX - textW / 2f - 8f, midY - 9f, midX + textW / 2f + 8f, midY + 9f);
            canvas.drawRoundRect(badgeRect, 6f, 6f, edgeBadgePaint);
            Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            borderPaint.setStyle(Paint.Style.STROKE);
            borderPaint.setStrokeWidth(1.2f);
            borderPaint.setColor(Color.parseColor("#cbd5e1"));
            canvas.drawRoundRect(badgeRect, 6f, 6f, borderPaint);
            canvas.drawText(rel, midX - textW / 2f, midY + 3.5f, edgeTextPaint);
        }
    }

    private void drawArrowHead(Canvas canvas, float toX, float toY, double angle, int color) {
        float arrowLen = 14f;
        Paint arrowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        arrowPaint.setColor(color);
        arrowPaint.setStyle(Paint.Style.FILL);

        Path path = new Path();
        path.moveTo(toX, toY);
        path.lineTo(toX - arrowLen * (float) Math.cos(angle - Math.PI / 6), toY - arrowLen * (float) Math.sin(angle - Math.PI / 6));
        path.lineTo(toX - arrowLen * (float) Math.cos(angle + Math.PI / 6), toY - arrowLen * (float) Math.sin(angle + Math.PI / 6));
        path.close();
        canvas.drawPath(path, arrowPaint);
    }

    private void drawNode(Canvas canvas, NodeEntity node, boolean isSelected) {
        float halfW = NODE_WIDTH / 2f;
        float halfH = NODE_HEIGHT / 2f;
        RectF cardRect = new RectF(node.getX() - halfW, node.getY() - halfH, node.getX() + halfW, node.getY() + halfH);

        canvas.drawRoundRect(cardRect, 10f, 10f, nodeCardPaint);

        try { nodeHeaderPaint.setColor(Color.parseColor(node.getColor())); } catch (Exception e) { nodeHeaderPaint.setColor(Color.parseColor(node.getType().getDefaultColor())); }
        RectF headerRect = new RectF(node.getX() - halfW, node.getY() - halfH, node.getX() + halfW, node.getY() - halfH + 22f);
        canvas.drawRoundRect(headerRect, 10f, 10f, nodeHeaderPaint);
        canvas.drawRect(node.getX() - halfW, node.getY() - halfH + 12f, node.getX() + halfW, node.getY() - halfH + 22f, nodeHeaderPaint);

        canvas.drawText(node.getType().getIcon(), node.getX() - halfW + 6f, node.getY() - halfH + 16f, textIconPaint);
        Paint headerTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        headerTextPaint.setColor(Color.WHITE);
        headerTextPaint.setTextSize(10f);
        headerTextPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        canvas.drawText(node.getType().getLabel(), node.getX() - halfW + 28f, node.getY() - halfH + 15f, headerTextPaint);

        String label = node.getLabel();
        if (label.length() > 14) label = label.substring(0, 13) + "…";
        canvas.drawText(label, node.getX() - halfW + 10f, node.getY() + 8f, textTitlePaint);

        String sub = node.getTags() != null && !node.getTags().isEmpty() ? "#" + node.getTags().get(0) : "Varlık";
        canvas.drawText(sub, node.getX() - halfW + 10f, node.getY() + 24f, textSubtitlePaint);

        if (isSelected) {
            nodeStrokePaint.setColor(Color.parseColor("#2563eb"));
            nodeStrokePaint.setStrokeWidth(3.5f);
        } else {
            nodeStrokePaint.setColor(Color.parseColor("#94a3b8"));
            nodeStrokePaint.setStrokeWidth(1.5f);
        }
        canvas.drawRoundRect(cardRect, 10f, 10f, nodeStrokePaint);
    }

    private NodeEntity hitTestNode(float worldX, float worldY) {
        float halfW = NODE_WIDTH / 2f;
        float halfH = NODE_HEIGHT / 2f;
        for (int i = nodes.size() - 1; i >= 0; i--) {
            NodeEntity n = nodes.get(i);
            if (worldX >= n.getX() - halfW && worldX <= n.getX() + halfW &&
                worldY >= n.getY() - halfH && worldY <= n.getY() + halfH) {
                return n;
            }
        }
        return null;
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        scaleDetector.onTouchEvent(event);

        if (scaleDetector.isInProgress()) {
            cancelLongPress();
            draggedNode = null;
            isMarqueeSelecting = false;
            return true;
        }

        float x = event.getX();
        float y = event.getY();

        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                lastTouchX = x;
                lastTouchY = y;
                downTouchX = x;
                downTouchY = y;
                downTime = System.currentTimeMillis();
                hasDragged = false;

                float worldX = (x - panX) / scale;
                float worldY = (y - panY) / scale;
                NodeEntity hit = hitTestNode(worldX, worldY);

                if (hit != null) {
                    draggedNode = hit;
                    if (!selectedNodeIds.contains(hit.getId())) {
                        selectedNodeIds.clear();
                        selectedNodeIds.add(hit.getId());
                        notifySelection();
                    }

                    // Sadece 1 saniye basılı tutulunca açılan menü zamanlayıcısı!
                    longPressedNode = hit;
                    longPressRunnable = new Runnable() {
                        @Override
                        public void run() {
                            if (!hasDragged && draggedNode == longPressedNode && listener != null) {
                                vibrateDevice();
                                List<NodeEntity> selList = new ArrayList<>();
                                for (NodeEntity n : nodes) {
                                    if (selectedNodeIds.contains(n.getId())) selList.add(n);
                                }
                                listener.onNodeLongPress(longPressedNode, selList, downTouchX, downTouchY);
                            }
                        }
                    };
                    longPressHandler.postDelayed(longPressRunnable, 1000); // 1000ms

                } else {
                    cancelLongPress();
                    draggedNode = null;
                    if (isSelectMode) {
                        isMarqueeSelecting = true;
                        marqueeStartX = x;
                        marqueeStartY = y;
                        marqueeCurrentX = x;
                        marqueeCurrentY = y;
                    } else {
                        selectedNodeIds.clear();
                        notifySelection();
                    }
                }
                invalidate();
                return true;

            case MotionEvent.ACTION_MOVE:
                float dx = x - lastTouchX;
                float dy = y - lastTouchY;
                float dist = (float) Math.hypot(x - downTouchX, y - downTouchY);

                if (dist > 8f) cancelLongPress();

                if (draggedNode != null) {
                    if (dist > 6f) {
                        hasDragged = true;
                        draggedNode.setX(draggedNode.getX() + dx / scale);
                        draggedNode.setY(draggedNode.getY() + dy / scale);
                        invalidate();
                    }
                } else if (isMarqueeSelecting) {
                    marqueeCurrentX = x;
                    marqueeCurrentY = y;
                    invalidate();
                } else {
                    panX += dx;
                    panY += dy;
                    invalidate();
                }
                lastTouchX = x;
                lastTouchY = y;
                return true;

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                cancelLongPress();
                if (isMarqueeSelecting) {
                    isMarqueeSelecting = false;
                    finalizeMarqueeSelection();
                    invalidate();
                } else if (draggedNode != null) {
                    long elapsed = System.currentTimeMillis() - downTime;
                    if (!hasDragged && elapsed < 450 && listener != null) {
                        listener.onNodeClick(draggedNode);
                    }
                    draggedNode = null;
                    hasDragged = false;
                    invalidate();
                }
                return true;
        }
        return super.onTouchEvent(event);
    }

    private void finalizeMarqueeSelection() {
        float minScreenX = Math.min(marqueeStartX, marqueeCurrentX);
        float maxScreenX = Math.max(marqueeStartX, marqueeCurrentX);
        float minScreenY = Math.min(marqueeStartY, marqueeCurrentY);
        float maxScreenY = Math.max(marqueeStartY, marqueeCurrentY);

        if (Math.hypot(maxScreenX - minScreenX, maxScreenY - minScreenY) > 10f) {
            float minWldX = (minScreenX - panX) / scale;
            float maxWldX = (maxScreenX - panX) / scale;
            float minWldY = (minScreenY - panY) / scale;
            float maxWldY = (maxScreenY - panY) / scale;

            float halfW = NODE_WIDTH / 2f;
            float halfH = NODE_HEIGHT / 2f;

            selectedNodeIds.clear();
            for (NodeEntity n : nodes) {
                if (!(n.getX() + halfW < minWldX || n.getX() - halfW > maxWldX ||
                      n.getY() + halfH < minWldY || n.getY() - halfH > maxWldY)) {
                    selectedNodeIds.add(n.getId());
                }
            }
            notifySelection();
        }
    }

    private void cancelLongPress() {
        if (longPressRunnable != null) {
            longPressHandler.removeCallbacks(longPressRunnable);
            longPressRunnable = null;
        }
        longPressedNode = null;
    }

    private void vibrateDevice() {
        try {
            Vibrator v = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) v.vibrate(50);
        } catch (Exception ignored) {}
    }

    private void notifySelection() {
        if (listener != null) listener.onSelectionChanged(new ArrayList<>(selectedNodeIds));
        invalidate();
    }
}
`);

  // Dialogs
  zip.file(javaPkg + 'dialog/ConnectNodesDialog.java', `package com.osintdesk.networkmapper.dialog;

import android.app.AlertDialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.*;

import com.osintdesk.networkmapper.R;
import com.osintdesk.networkmapper.model.EdgeDirection;
import com.osintdesk.networkmapper.model.EdgeStyle;
import com.osintdesk.networkmapper.model.NodeEntity;

import java.util.ArrayList;
import java.util.List;

public class ConnectNodesDialog {

    public interface OnConnectListener {
        void onConnect(String sourceId, String targetId, String relation, String color, float width, EdgeStyle style, EdgeDirection direction);
    }

    public static void show(Context context, List<NodeEntity> allNodes, String initialSourceId, String initialTargetId, final OnConnectListener listener) {
        if (allNodes.size() < 2) {
            new AlertDialog.Builder(context)
                    .setTitle("Yetersiz Düğüm")
                    .setMessage("İki düğüm arasında bağlantı kurabilmek için ağınızda en az 2 düğüm bulunmalıdır. Lütfen önce yeni bir düğüm ekleyin.")
                    .setPositiveButton("Tamam", null)
                    .show();
            return;
        }

        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_connect_nodes, null);
        builder.setView(dialogView);

        final Spinner spSource = dialogView.findViewById(R.id.sp_source);
        final Spinner spTarget = dialogView.findViewById(R.id.sp_target);
        final ImageButton btnSwap = dialogView.findViewById(R.id.btn_swap);
        final Spinner spRelation = dialogView.findViewById(R.id.sp_relation);
        final EditText etCustomRelation = dialogView.findViewById(R.id.et_custom_relation);
        final RadioGroup rgDirection = dialogView.findViewById(R.id.rg_direction);
        final Button btnSubmit = dialogView.findViewById(R.id.btn_submit_connect);
        final Button btnCancel = dialogView.findViewById(R.id.btn_cancel_connect);

        List<String> nodeLabels = new ArrayList<>();
        final List<String> nodeIds = new ArrayList<>();
        int defaultSourceIndex = 0;
        int defaultTargetIndex = 1;

        for (int i = 0; i < allNodes.size(); i++) {
            NodeEntity n = allNodes.get(i);
            nodeLabels.add(n.getType().getIcon() + " " + n.getLabel() + " (" + n.getType().getLabel() + ")");
            nodeIds.add(n.getId());

            if (initialSourceId != null && initialSourceId.equals(n.getId())) defaultSourceIndex = i;
            if (initialTargetId != null && initialTargetId.equals(n.getId())) defaultTargetIndex = i;
        }

        if (defaultSourceIndex == defaultTargetIndex) {
            defaultTargetIndex = (defaultSourceIndex + 1) % allNodes.size();
        }

        ArrayAdapter<String> nodeAdapter = new ArrayAdapter<>(context, android.R.layout.simple_spinner_dropdown_item, nodeLabels);
        spSource.setAdapter(nodeAdapter);
        spTarget.setAdapter(nodeAdapter);
        spSource.setSelection(defaultSourceIndex);
        spTarget.setSelection(defaultTargetIndex);

        btnSwap.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int s = spSource.getSelectedItemPosition();
                int t = spTarget.getSelectedItemPosition();
                spSource.setSelection(t);
                spTarget.setSelection(s);
            }
        });

        final String[] relations = new String[]{
                "İlişkili", "Sahibi", "Yönetici", "Çalışan", "Ortak",
                "Hissedar", "İletişim", "Akraba", "Bağlı Şirket", "Banka Hesabı", "Kayıtlı Adres", "Diğer"
        };
        ArrayAdapter<String> relAdapter = new ArrayAdapter<>(context, android.R.layout.simple_spinner_dropdown_item, relations);
        spRelation.setAdapter(relAdapter);

        spRelation.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                etCustomRelation.setVisibility(position == relations.length - 1 ? View.VISIBLE : View.GONE);
            }
            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        final AlertDialog dialog = builder.create();
        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { dialog.dismiss(); }
        });

        btnSubmit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int srcIdx = spSource.getSelectedItemPosition();
                int tgtIdx = spTarget.getSelectedItemPosition();

                if (srcIdx == tgtIdx) {
                    Toast.makeText(context, "Lütfen iki farklı düğüm seçin!", Toast.LENGTH_SHORT).show();
                    return;
                }

                String sId = nodeIds.get(srcIdx);
                String tId = nodeIds.get(tgtIdx);
                String rel = relations[spRelation.getSelectedItemPosition()];
                if ("Diğer".equals(rel)) {
                    String custom = etCustomRelation.getText().toString().trim();
                    if (!custom.isEmpty()) rel = custom;
                }

                EdgeDirection direction = EdgeDirection.DIRECTED;
                int checkedDir = rgDirection.getCheckedRadioButtonId();
                if (checkedDir == R.id.rb_dir_bidirectional) direction = EdgeDirection.BIDIRECTIONAL;
                else if (checkedDir == R.id.rb_dir_reverse) direction = EdgeDirection.REVERSE;
                else if (checkedDir == R.id.rb_dir_undirected) direction = EdgeDirection.UNDIRECTED;

                if (listener != null) {
                    listener.onConnect(sId, tId, rel, "#1d5fa6", 3.0f, EdgeStyle.SOLID, direction);
                }
                dialog.dismiss();
                Toast.makeText(context, "Bağlantı kuruldu!", Toast.LENGTH_SHORT).show();
            }
        });

        dialog.show();
    }
}
`);

  zip.file(javaPkg + 'dialog/AddNodeDialog.java', `package com.osintdesk.networkmapper.dialog;

import android.app.AlertDialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.*;

import com.osintdesk.networkmapper.R;
import com.osintdesk.networkmapper.model.NodeType;

import java.util.ArrayList;
import java.util.List;

public class AddNodeDialog {

    public interface OnAddNodeListener {
        void onAddSingle(NodeType type, String label, String relation, String notes);
        void onAddBatch(NodeType type, List<String> labels, String relation);
    }

    public static void show(Context context, final String parentNodeLabel, boolean startInBatchMode, final OnAddNodeListener listener) {
        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_add_node, null);
        builder.setView(dialogView);

        final Spinner spType = dialogView.findViewById(R.id.sp_node_type);
        final EditText etLabel = dialogView.findViewById(R.id.et_node_label);
        final EditText etRelation = dialogView.findViewById(R.id.et_relation);
        final EditText etNotes = dialogView.findViewById(R.id.et_notes);
        final CheckBox cbBatchMode = dialogView.findViewById(R.id.cb_batch_mode);
        final TextView tvLabelHelp = dialogView.findViewById(R.id.tv_label_help);
        final TextView tvParentInfo = dialogView.findViewById(R.id.tv_parent_info);
        final Button btnSubmit = dialogView.findViewById(R.id.btn_submit_add);
        final Button btnCancel = dialogView.findViewById(R.id.btn_cancel_add);

        if (parentNodeLabel != null && !parentNodeLabel.isEmpty()) {
            tvParentInfo.setVisibility(View.VISIBLE);
            tvParentInfo.setText("🔗 Bağlı Eklenecek: " + parentNodeLabel);
            etRelation.setVisibility(View.VISIBLE);
        } else {
            tvParentInfo.setVisibility(View.GONE);
            etRelation.setVisibility(View.GONE);
        }

        List<String> typeNames = new ArrayList<>();
        for (NodeType t : NodeType.values()) typeNames.add(t.getIcon() + " " + t.getLabel());
        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(context, android.R.layout.simple_spinner_dropdown_item, typeNames);
        spType.setAdapter(typeAdapter);

        cbBatchMode.setChecked(startInBatchMode);
        cbBatchMode.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                tvLabelHelp.setText(isChecked ? "Birden fazla isim yazın (örn: Ahmet, Mehmet, Ayşe)" : "Varlık adı / unvanı / değeri");
                etNotes.setVisibility(isChecked ? View.GONE : View.VISIBLE);
            }
        });

        final AlertDialog dialog = builder.create();
        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { dialog.dismiss(); }
        });

        btnSubmit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String input = etLabel.getText().toString().trim();
                if (input.isEmpty()) { etLabel.setError("Lütfen isim girin!"); return; }

                NodeType selectedType = NodeType.values()[spType.getSelectedItemPosition()];
                String relation = etRelation.getText().toString().trim();
                if (relation.isEmpty()) relation = "İlişkili";
                String notes = etNotes.getText().toString().trim();

                if (cbBatchMode.isChecked()) {
                    String[] parts = input.split("[,\\n]+");
                    List<String> labels = new ArrayList<>();
                    for (String p : parts) {
                        String clean = p.trim();
                        if (!clean.isEmpty()) labels.add(clean);
                    }
                    if (labels.isEmpty()) { etLabel.setError("Geçerli isim bulunamadı!"); return; }
                    if (listener != null) listener.onAddBatch(selectedType, labels, relation);
                } else {
                    if (listener != null) listener.onAddSingle(selectedType, input, relation, notes);
                }
                dialog.dismiss();
            }
        });

        dialog.show();
    }
}
`);

  zip.file(javaPkg + 'dialog/NodeDetailDialog.java', `package com.osintdesk.networkmapper.dialog;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.*;

import com.osintdesk.networkmapper.R;
import com.osintdesk.networkmapper.model.NodeEntity;
import com.osintdesk.networkmapper.model.NodeType;

import java.util.ArrayList;
import java.util.List;

public class NodeDetailDialog {

    public interface NodeActionCallback {
        void onUpdate(NodeEntity node);
        void onDelete(NodeEntity node);
        void onConnectToOther(NodeEntity node);
        void onAddChildNode(NodeEntity node);
    }

    public static void show(final Context context, final NodeEntity node, final NodeActionCallback callback) {
        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_node_detail, null);
        builder.setView(dialogView);

        final TextView tvHeaderTitle = dialogView.findViewById(R.id.tv_detail_header_title);
        final Spinner spType = dialogView.findViewById(R.id.sp_detail_type);
        final EditText etLabel = dialogView.findViewById(R.id.et_detail_label);
        final EditText etNotes = dialogView.findViewById(R.id.et_detail_notes);

        final Button btnSave = dialogView.findViewById(R.id.btn_detail_save);
        final Button btnConnect = dialogView.findViewById(R.id.btn_detail_connect);
        final Button btnAddChild = dialogView.findViewById(R.id.btn_detail_add_child);
        final Button btnDelete = dialogView.findViewById(R.id.btn_detail_delete);
        final Button btnClose = dialogView.findViewById(R.id.btn_detail_close);

        tvHeaderTitle.setText(node.getType().getIcon() + " " + node.getLabel());
        etLabel.setText(node.getLabel());
        etNotes.setText(node.getNotes() != null ? node.getNotes() : "");

        List<String> typeNames = new ArrayList<>();
        int selectedTypeIndex = 0;
        for (int i = 0; i < NodeType.values().length; i++) {
            NodeType t = NodeType.values()[i];
            typeNames.add(t.getIcon() + " " + t.getLabel());
            if (t == node.getType()) selectedTypeIndex = i;
        }
        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(context, android.R.layout.simple_spinner_dropdown_item, typeNames);
        spType.setAdapter(typeAdapter);
        spType.setSelection(selectedTypeIndex);

        final AlertDialog dialog = builder.create();

        btnSave.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String label = etLabel.getText().toString().trim();
                if (label.isEmpty()) { etLabel.setError("İsim boş bırakılamaz!"); return; }
                NodeType newType = NodeType.values()[spType.getSelectedItemPosition()];
                node.setLabel(label);
                node.setType(newType);
                node.setColor(newType.getDefaultColor());
                node.setNotes(etNotes.getText().toString().trim());

                if (callback != null) callback.onUpdate(node);
                dialog.dismiss();
            }
        });

        btnConnect.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { dialog.dismiss(); if (callback != null) callback.onConnectToOther(node); }
        });

        btnAddChild.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { dialog.dismiss(); if (callback != null) callback.onAddChildNode(node); }
        });

        btnDelete.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                new AlertDialog.Builder(context)
                        .setTitle("Düğümü Sil")
                        .setMessage("'" + node.getLabel() + "' varlığını ve bağlı ilişkilerini silmek istediğinize emin misiniz?")
                        .setPositiveButton("Evet, Sil", new DialogInterface.OnClickListener() {
                            @Override public void onClick(DialogInterface d, int which) {
                                dialog.dismiss();
                                if (callback != null) callback.onDelete(node);
                            }
                        })
                        .setNegativeButton("İptal", null)
                        .show();
            }
        });

        btnClose.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { dialog.dismiss(); }
        });

        dialog.show();
    }
}
`);

  zip.file(javaPkg + 'util/SampleData.java', `package com.osintdesk.networkmapper.util;

import com.osintdesk.networkmapper.model.*;
import java.util.ArrayList;
import java.util.List;

public class SampleData {
    public static ProjectEntity createSampleProject() {
        ProjectEntity project = new ProjectEntity("proj_sample", "Kemal Erdem Araştırması", "Holding ve bağlantılı varlıklar analizi");
        List<NodeEntity> nodes = new ArrayList<>();
        nodes.add(new NodeEntity("node_1", NodeType.COMPANY, "Erdem Holding A.Ş.", 0f, 0f));
        nodes.add(new NodeEntity("node_2", NodeType.PERSON, "Kemal Erdem", 0f, 180f));
        nodes.add(new NodeEntity("node_3", NodeType.DOMAIN, "erdemholding.com", 220f, -60f));
        nodes.add(new NodeEntity("node_4", NodeType.IP_ADDRESS, "185.199.108.153", 380f, -60f));
        nodes.add(new NodeEntity("node_5", NodeType.COMPANY, "Apex Lojistik Ltd.", -220f, 120f));

        List<EdgeEntity> edges = new ArrayList<>();
        edges.add(new EdgeEntity("e1", "node_2", "node_1", "Yönetim Kurulu Başkanı"));
        edges.add(new EdgeEntity("e2", "node_1", "node_3", "Resmi Web Sitesi"));
        edges.add(new EdgeEntity("e3", "node_3", "node_4", "A Kaydı / IP"));
        edges.add(new EdgeEntity("e4", "node_2", "node_5", "Ortak / Hissedar"));

        project.setNodes(nodes);
        project.setEdges(edges);
        return project;
    }
}
`);

  zip.file(javaPkg + 'util/LayoutHelper.java', `package com.osintdesk.networkmapper.util;

import com.osintdesk.networkmapper.model.EdgeEntity;
import com.osintdesk.networkmapper.model.NodeEntity;
import java.util.List;

public class LayoutHelper {
    public static void applyForceLayout(List<NodeEntity> nodes, List<EdgeEntity> edges) {
        if (nodes.isEmpty()) return;
        int n = nodes.size();
        float[] vx = new float[n];
        float[] vy = new float[n];

        for (int iter = 0; iter < 60; iter++) {
            for (int i = 0; i < n; i++) {
                NodeEntity n1 = nodes.get(i);
                for (int j = i + 1; j < n; j++) {
                    NodeEntity n2 = nodes.get(j);
                    float dx = n1.getX() - n2.getX();
                    float dy = n1.getY() - n2.getY();
                    float dist = (float) Math.hypot(dx, dy);
                    if (dist < 1f) dist = 1f;
                    float force = 8000f / (dist * dist);
                    vx[i] += (dx / dist) * force;
                    vy[i] += (dy / dist) * force;
                    vx[j] -= (dx / dist) * force;
                    vy[j] -= (dy / dist) * force;
                }
            }

            for (EdgeEntity e : edges) {
                int i1 = -1, i2 = -1;
                for (int k = 0; k < n; k++) {
                    if (nodes.get(k).getId().equals(e.getSource())) i1 = k;
                    if (nodes.get(k).getId().equals(e.getTarget())) i2 = k;
                }
                if (i1 != -1 && i2 != -1) {
                    float dx = nodes.get(i2).getX() - nodes.get(i1).getX();
                    float dy = nodes.get(i2).getY() - nodes.get(i1).getY();
                    float dist = (float) Math.hypot(dx, dy);
                    float force = (dist - 180f) * 0.05f;
                    float fx = (dx / (dist > 0 ? dist : 1)) * force;
                    float fy = (dy / (dist > 0 ? dist : 1)) * force;
                    vx[i1] += fx; vy[i1] += fy;
                    vx[i2] -= fx; vy[i2] -= fy;
                }
            }

            for (int i = 0; i < n; i++) {
                nodes.get(i).setX(nodes.get(i).getX() + vx[i] * 0.15f);
                nodes.get(i).setY(nodes.get(i).getY() + vy[i] * 0.15f);
                vx[i] *= 0.5f; vy[i] *= 0.5f;
            }
        }
    }
}
`);

  zip.file(javaPkg + 'MainActivity.java', `package com.osintdesk.networkmapper;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.View;
import android.widget.*;

import com.osintdesk.networkmapper.dialog.AddNodeDialog;
import com.osintdesk.networkmapper.dialog.ConnectNodesDialog;
import com.osintdesk.networkmapper.dialog.NodeDetailDialog;
import com.osintdesk.networkmapper.model.*;
import com.osintdesk.networkmapper.util.LayoutHelper;
import com.osintdesk.networkmapper.util.SampleData;
import com.osintdesk.networkmapper.view.NetworkCanvasView;

import java.util.*;

public class MainActivity extends Activity {

    private NetworkCanvasView canvasView;
    private ProjectEntity currentProject;
    private TextView tvStatusInfo;
    private TextView tvAppTitle;

    private View layoutHoldBar;
    private TextView tvHoldCount;
    private Button btnHoldDuplicate;
    private Button btnHoldDelete;
    private Button btnHoldConnect;
    private ImageButton btnHoldClose;

    private ImageButton btnNavAdd;
    private ImageButton btnNavBatch;
    private ImageButton btnNavConnect;
    private ImageButton btnNavMode;
    private ImageButton btnNavLayout;
    private ImageButton btnNavSample;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        loadSampleProject();
        setupListeners();
    }

    private void initViews() {
        canvasView = findViewById(R.id.network_canvas);
        tvStatusInfo = findViewById(R.id.tv_status_info);
        tvAppTitle = findViewById(R.id.tv_app_title);

        layoutHoldBar = findViewById(R.id.layout_hold_bar);
        tvHoldCount = findViewById(R.id.tv_hold_count);
        btnHoldDuplicate = findViewById(R.id.btn_hold_duplicate);
        btnHoldDelete = findViewById(R.id.btn_hold_delete);
        btnHoldConnect = findViewById(R.id.btn_hold_connect);
        btnHoldClose = findViewById(R.id.btn_hold_close);

        btnNavAdd = findViewById(R.id.btn_nav_add);
        btnNavBatch = findViewById(R.id.btn_nav_batch);
        btnNavConnect = findViewById(R.id.btn_nav_connect);
        btnNavMode = findViewById(R.id.btn_nav_mode);
        btnNavLayout = findViewById(R.id.btn_nav_layout);
        btnNavSample = findViewById(R.id.btn_nav_sample);

        findViewById(R.id.btn_zoom_in).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { canvasView.resetZoom(); }
        });
        findViewById(R.id.btn_zoom_out).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { canvasView.fitView(); }
        });
        findViewById(R.id.btn_fit_view).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { canvasView.fitView(); }
        });
    }

    private void loadSampleProject() {
        currentProject = SampleData.createSampleProject();
        updateUI();
    }

    private void updateUI() {
        tvAppTitle.setText("OsintDesk - [" + currentProject.getName() + "]");
        canvasView.setData(currentProject.getNodes(), currentProject.getEdges());
        updateStatusBar();
    }

    private void updateStatusBar() {
        int nodeCount = currentProject.getNodes().size();
        int edgeCount = currentProject.getEdges().size();
        int selCount = canvasView.getSelectedNodeIds().size();
        String selText = selCount > 0 ? " | " + selCount + " Seçili" : "";
        tvStatusInfo.setText("Düğümler: " + nodeCount + " | Bağlantılar: " + edgeCount + selText);
    }

    private void setupListeners() {
        canvasView.setCanvasListener(new NetworkCanvasView.CanvasListener() {
            @Override
            public void onNodeClick(NodeEntity node) {
                hideHoldBar();
                openNodeDetailDialog(node);
            }

            @Override
            public void onNodeLongPress(NodeEntity node, List<NodeEntity> selectedNodes, float screenX, float screenY) {
                showHoldBar(node, selectedNodes);
            }

            @Override
            public void onSelectionChanged(List<String> selectedNodeIds) {
                updateStatusBar();
                if (selectedNodeIds.isEmpty()) hideHoldBar();
            }
        });

        btnNavAdd.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                hideHoldBar();
                AddNodeDialog.show(MainActivity.this, null, false, new AddNodeDialog.OnAddNodeListener() {
                    @Override public void onAddSingle(NodeType type, String label, String relation, String notes) { addNewNode(type, label, notes, 0f, 0f); }
                    @Override public void onAddBatch(NodeType type, List<String> labels, String relation) { addBatchNodes(type, labels); }
                });
            }
        });

        btnNavBatch.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                hideHoldBar();
                AddNodeDialog.show(MainActivity.this, null, true, new AddNodeDialog.OnAddNodeListener() {
                    @Override public void onAddSingle(NodeType type, String label, String relation, String notes) { addNewNode(type, label, notes, 0f, 0f); }
                    @Override public void onAddBatch(NodeType type, List<String> labels, String relation) { addBatchNodes(type, labels); }
                });
            }
        });

        btnNavConnect.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { hideHoldBar(); openConnectDialog(null, null); }
        });

        btnNavMode.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                boolean newMode = !canvasView.isSelectMode();
                canvasView.setSelectMode(newMode);
                Toast.makeText(MainActivity.this, newMode ? "Kutu Seçim Modu" : "Gezinme Modu", Toast.LENGTH_SHORT).show();
            }
        });

        btnNavLayout.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                LayoutHelper.applyForceLayout(currentProject.getNodes(), currentProject.getEdges());
                canvasView.invalidate();
                Toast.makeText(MainActivity.this, "Ağ düzeni uygulandı", Toast.LENGTH_SHORT).show();
            }
        });

        btnNavSample.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { loadSampleProject(); }
        });

        btnHoldClose.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { hideHoldBar(); }
        });

        btnHoldDuplicate.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { duplicateSelectedNodes(); hideHoldBar(); }
        });

        btnHoldDelete.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { confirmDeleteSelected(); }
        });

        btnHoldConnect.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                Set<String> sel = canvasView.getSelectedNodeIds();
                List<String> list = new ArrayList<>(sel);
                String src = list.size() > 0 ? list.get(0) : null;
                String tgt = list.size() > 1 ? list.get(1) : null;
                hideHoldBar();
                openConnectDialog(src, tgt);
            }
        });
    }

    private void showHoldBar(NodeEntity node, List<NodeEntity> selectedNodes) {
        int count = selectedNodes.size();
        if (count == 0 && node != null) count = 1;
        tvHoldCount.setText(count + " Seçili");
        layoutHoldBar.setVisibility(View.VISIBLE);
    }

    private void hideHoldBar() { layoutHoldBar.setVisibility(View.GONE); }

    private void openConnectDialog(String initialSrcId, String initialTgtId) {
        if (initialSrcId == null) {
            List<String> list = new ArrayList<>(canvasView.getSelectedNodeIds());
            if (list.size() >= 2) { initialSrcId = list.get(0); initialTgtId = list.get(1); }
            else if (list.size() == 1) { initialSrcId = list.get(0); }
        }

        ConnectNodesDialog.show(this, currentProject.getNodes(), initialSrcId, initialTgtId, new ConnectNodesDialog.OnConnectListener() {
            @Override public void onConnect(String sourceId, String targetId, String relation, String color, float width, EdgeStyle style, EdgeDirection direction) {
                EdgeEntity edge = new EdgeEntity("edge_" + System.currentTimeMillis(), sourceId, targetId, relation);
                edge.setColor(color);
                edge.setWidth(width);
                edge.setStyle(style);
                edge.setDirection(direction);
                currentProject.getEdges().add(edge);
                canvasView.getSelectedNodeIds().clear();
                canvasView.getSelectedNodeIds().add(sourceId);
                canvasView.getSelectedNodeIds().add(targetId);
                updateUI();
            }
        });
    }

    private void openNodeDetailDialog(final NodeEntity node) {
        NodeDetailDialog.show(this, node, new NodeDetailDialog.NodeActionCallback() {
            @Override public void onUpdate(NodeEntity updatedNode) { updateUI(); }
            @Override public void onDelete(NodeEntity n) { deleteNodes(Collections.singleton(n.getId())); }
            @Override public void onConnectToOther(NodeEntity n) { openConnectDialog(n.getId(), null); }
            @Override public void onAddChildNode(final NodeEntity parent) {
                AddNodeDialog.show(MainActivity.this, parent.getLabel(), false, new AddNodeDialog.OnAddNodeListener() {
                    @Override public void onAddSingle(NodeType type, String label, String relation, String notes) {
                        float angle = (float) (Math.random() * Math.PI * 2);
                        float posX = parent.getX() + (float) Math.cos(angle) * 160f;
                        float posY = parent.getY() + (float) Math.sin(angle) * 160f;
                        String newId = "node_" + System.currentTimeMillis();
                        NodeEntity child = new NodeEntity(newId, type, label, posX, posY);
                        child.setNotes(notes);
                        currentProject.getNodes().add(child);
                        currentProject.getEdges().add(new EdgeEntity("e_" + System.currentTimeMillis(), parent.getId(), newId, relation));
                        updateUI();
                    }
                    @Override public void onAddBatch(NodeType type, List<String> labels, String relation) {
                        for (int i = 0; i < labels.size(); i++) {
                            String newId = "node_" + System.currentTimeMillis() + "_" + i;
                            currentProject.getNodes().add(new NodeEntity(newId, type, labels.get(i), parent.getX() + (i * 40f), parent.getY() + 140f));
                            currentProject.getEdges().add(new EdgeEntity("e_" + System.currentTimeMillis() + "_" + i, parent.getId(), newId, relation));
                        }
                        updateUI();
                    }
                });
            }
        });
    }

    private void addNewNode(NodeType type, String label, String notes, float x, float y) {
        String id = "node_" + System.currentTimeMillis();
        NodeEntity node = new NodeEntity(id, type, label, x, y);
        node.setNotes(notes);
        currentProject.getNodes().add(node);
        updateUI();
        Toast.makeText(this, "Düğüm eklendi", Toast.LENGTH_SHORT).show();
    }

    private void addBatchNodes(NodeType type, List<String> labels) {
        int count = labels.size();
        for (int i = 0; i < count; i++) {
            String id = "node_" + System.currentTimeMillis() + "_" + i;
            currentProject.getNodes().add(new NodeEntity(id, type, labels.get(i), (i - count / 2f) * 140f, 0f));
        }
        updateUI();
        Toast.makeText(this, count + " düğüm eklendi", Toast.LENGTH_SHORT).show();
    }

    private void duplicateSelectedNodes() {
        Set<String> sel = canvasView.getSelectedNodeIds();
        if (sel.isEmpty()) return;
        for (NodeEntity n : new ArrayList<>(currentProject.getNodes())) {
            if (sel.contains(n.getId())) {
                currentProject.getNodes().add(new NodeEntity(n, "node_" + System.currentTimeMillis() + "_" + Math.random(), 60f, 60f));
            }
        }
        updateUI();
    }

    private void confirmDeleteSelected() {
        final Set<String> sel = canvasView.getSelectedNodeIds();
        if (sel.isEmpty()) return;
        new AlertDialog.Builder(this)
                .setTitle("Toplu Sil")
                .setMessage("Seçili " + sel.size() + " düğümü silmek istediğinize emin misiniz?")
                .setPositiveButton("Evet, Sil", new DialogInterface.OnClickListener() {
                    @Override public void onClick(DialogInterface dialog, int which) {
                        deleteNodes(sel);
                        hideHoldBar();
                    }
                })
                .setNegativeButton("İptal", null)
                .show();
    }

    private void deleteNodes(Set<String> idsToDelete) {
        Iterator<NodeEntity> nIt = currentProject.getNodes().iterator();
        while (nIt.hasNext()) { if (idsToDelete.contains(nIt.next().getId())) nIt.remove(); }
        Iterator<EdgeEntity> eIt = currentProject.getEdges().iterator();
        while (eIt.hasNext()) {
            EdgeEntity e = eIt.next();
            if (idsToDelete.contains(e.getSource()) || idsToDelete.contains(e.getTarget())) eIt.remove();
        }
        canvasView.getSelectedNodeIds().clear();
        updateUI();
    }
}
`);

  // Layouts
  const resLayout = 'app/src/main/res/layout/';
  zip.file(resLayout + 'activity_main.xml', `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#f3f5f8">

    <LinearLayout
        android:id="@+id/top_bar"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:background="#20406b"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:paddingLeft="12dp"
        android:paddingRight="8dp">

        <TextView
            android:id="@+id/tv_app_title"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="OsintDesk"
            android:textColor="#ffffff"
            android:textStyle="bold"
            android:textSize="14sp"
            android:singleLine="true" />

        <ImageButton
            android:id="@+id/btn_fit_view"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:background="?android:attr/selectableItemBackground"
            android:src="@android:drawable/ic_menu_crop" />

        <ImageButton
            android:id="@+id/btn_zoom_in"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:background="?android:attr/selectableItemBackground"
            android:src="@android:drawable/ic_menu_add" />

        <ImageButton
            android:id="@+id/btn_zoom_out"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:background="?android:attr/selectableItemBackground"
            android:src="@android:drawable/ic_menu_revert" />
    </LinearLayout>

    <com.osintdesk.networkmapper.view.NetworkCanvasView
        android:id="@+id/network_canvas"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_below="@id/top_bar"
        android:layout_above="@id/bottom_bar" />

    <LinearLayout
        android:id="@+id/layout_hold_bar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_centerHorizontal="true"
        android:layout_below="@id/top_bar"
        android:layout_marginTop="12dp"
        android:background="#1e293b"
        android:padding="6dp"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:elevation="8dp"
        android:visibility="gone">

        <TextView
            android:id="@+id/tv_hold_count"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:background="#2563eb"
            android:textColor="#ffffff"
            android:text="1 Seçili"
            android:textSize="11sp"
            android:textStyle="bold"
            android:padding="4dp"
            android:layout_marginRight="6dp" />

        <Button
            android:id="@+id/btn_hold_duplicate"
            android:layout_width="wrap_content"
            android:layout_height="32dp"
            android:background="#334155"
            android:textColor="#ffffff"
            android:text="📋 Çoğalt"
            android:textSize="11sp"
            android:layout_marginRight="4dp" />

        <Button
            android:id="@+id/btn_hold_delete"
            android:layout_width="wrap_content"
            android:layout_height="32dp"
            android:background="#dc2626"
            android:textColor="#ffffff"
            android:text="🗑️ Sil"
            android:textSize="11sp"
            android:textStyle="bold"
            android:layout_marginRight="4dp" />

        <Button
            android:id="@+id/btn_hold_connect"
            android:layout_width="wrap_content"
            android:layout_height="32dp"
            android:background="#2563eb"
            android:textColor="#ffffff"
            android:text="🔗 Bağla"
            android:textSize="11sp"
            android:textStyle="bold"
            android:layout_marginRight="4dp" />

        <ImageButton
            android:id="@+id/btn_hold_close"
            android:layout_width="28dp"
            android:layout_height="28dp"
            android:background="?android:attr/selectableItemBackground"
            android:src="@android:drawable/ic_menu_close_clear_cancel" />
    </LinearLayout>

    <TextView
        android:id="@+id/tv_status_info"
        android:layout_width="match_parent"
        android:layout_height="22dp"
        android:layout_above="@id/bottom_bar"
        android:background="#dbe1e8"
        android:textColor="#475569"
        android:textSize="10sp"
        android:gravity="center_vertical"
        android:paddingLeft="10dp"
        android:text="Düğümler: 0 | Bağlantılar: 0" />

    <LinearLayout
        android:id="@+id/bottom_bar"
        android:layout_width="match_parent"
        android:layout_height="56dp"
        android:layout_alignParentBottom="true"
        android:background="#e2e8f0"
        android:orientation="horizontal">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:orientation="vertical"
            android:gravity="center">
            <ImageButton
                android:id="@+id/btn_nav_add"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:background="#1d4ed8"
                android:src="@android:drawable/ic_input_add" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Düğüm"
                android:textColor="#1e293b"
                android:textSize="9sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:orientation="vertical"
            android:gravity="center">
            <ImageButton
                android:id="@+id/btn_nav_batch"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:background="#b45309"
                android:src="@android:drawable/ic_menu_agenda" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Çoklu"
                android:textColor="#78350f"
                android:textSize="9sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:orientation="vertical"
            android:gravity="center">
            <ImageButton
                android:id="@+id/btn_nav_connect"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:background="#2563eb"
                android:src="@android:drawable/ic_menu_share" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Bağla"
                android:textColor="#1e293b"
                android:textSize="9sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:orientation="vertical"
            android:gravity="center">
            <ImageButton
                android:id="@+id/btn_nav_mode"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:background="#cbd5e1"
                android:src="@android:drawable/ic_menu_crop" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Kutu Seç"
                android:textColor="#1e293b"
                android:textSize="9sp" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:orientation="vertical"
            android:gravity="center">
            <ImageButton
                android:id="@+id/btn_nav_layout"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:background="#cbd5e1"
                android:src="@android:drawable/ic_menu_sort_alphabetically" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Düzen"
                android:textColor="#059669"
                android:textSize="9sp"
                android:textStyle="bold" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:orientation="vertical"
            android:gravity="center">
            <ImageButton
                android:id="@+id/btn_nav_sample"
                android:layout_width="32dp"
                android:layout_height="32dp"
                android:background="#cbd5e1"
                android:src="@android:drawable/ic_menu_rotate" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Örnek"
                android:textColor="#475569"
                android:textSize="9sp" />
        </LinearLayout>
    </LinearLayout>
</RelativeLayout>
`);

  zip.file(resLayout + 'dialog_connect_nodes.xml', `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="#eceff4">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="42dp"
        android:background="#20406b"
        android:gravity="center_vertical"
        android:paddingLeft="14dp">
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="🔗 Bağlantı Oluştur (İki Düğümü Bağla)"
            android:textColor="#ffffff"
            android:textSize="14sp"
            android:textStyle="bold" />
    </LinearLayout>

    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:padding="14dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="1. Başlangıç Varlığı (Kaynak):"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <Spinner
                android:id="@+id/sp_source"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:background="#ffffff"
                android:layout_marginBottom="8dp" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:gravity="center"
                android:layout_marginBottom="8dp">
                <ImageButton
                    android:id="@+id/btn_swap"
                    android:layout_width="40dp"
                    android:layout_height="32dp"
                    android:background="#cbd5e1"
                    android:src="@android:drawable/ic_menu_rotate" />
            </LinearLayout>

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="2. Hedef Varlık:"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <Spinner
                android:id="@+id/sp_target"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:background="#ffffff"
                android:layout_marginBottom="12dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="İlişki Türü (Etiket):"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <Spinner
                android:id="@+id/sp_relation"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:background="#ffffff"
                android:layout_marginBottom="6dp" />

            <EditText
                android:id="@+id/et_custom_relation"
                android:layout_width="match_parent"
                android:layout_height="40dp"
                android:background="#ffffff"
                android:hint="Özel ilişki açıklaması girin"
                android:visibility="gone"
                android:layout_marginBottom="12dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Ok Yönü:"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <RadioGroup
                android:id="@+id/rg_direction"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:layout_marginBottom="16dp">
                <RadioButton android:id="@+id/rb_dir_directed" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:checked="true" android:text="İleri (—►)" android:textSize="11sp" />
                <RadioButton android:id="@+id/rb_dir_bidirectional" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Çift" android:textSize="11sp" />
                <RadioButton android:id="@+id/rb_dir_reverse" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Geri" android:textSize="11sp" />
                <RadioButton android:id="@+id/rb_dir_undirected" android:layout_width="0dp" android:layout_height="wrap_content" android:layout_weight="1" android:text="Yönsüz" android:textSize="11sp" />
            </RadioGroup>

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:gravity="right">
                <Button android:id="@+id/btn_cancel_connect" android:layout_width="wrap_content" android:layout_height="40dp" android:background="#94a3b8" android:textColor="#ffffff" android:text="İptal" android:layout_marginRight="8dp" />
                <Button android:id="@+id/btn_submit_connect" android:layout_width="wrap_content" android:layout_height="40dp" android:background="#2563eb" android:textColor="#ffffff" android:textStyle="bold" android:text="Bağlantıyı Kur" />
            </LinearLayout>
        </LinearLayout>
    </ScrollView>
</LinearLayout>
`);

  zip.file(resLayout + 'dialog_add_node.xml', `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="#eceff4">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="42dp"
        android:background="#20406b"
        android:gravity="center_vertical"
        android:paddingLeft="14dp">
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="➕ Düğüm Ekle"
            android:textColor="#ffffff"
            android:textSize="14sp"
            android:textStyle="bold" />
    </LinearLayout>

    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:padding="14dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical">

            <TextView
                android:id="@+id/tv_parent_info"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:textColor="#1d4ed8"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="8dp"
                android:visibility="gone" />

            <CheckBox
                android:id="@+id/cb_batch_mode"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="✨ Çoklu Ekleme Modu (Virgülle ayrılmış)"
                android:textColor="#b45309"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="8dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Varlık / Düğüm Türü:"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <Spinner
                android:id="@+id/sp_node_type"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:background="#ffffff"
                android:layout_marginBottom="10dp" />

            <TextView
                android:id="@+id/tv_label_help"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Varlık adı / unvanı / değeri:"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/et_node_label"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:background="#ffffff"
                android:hint="Örn: Ahmet Yılmaz"
                android:layout_marginBottom="10dp" />

            <EditText
                android:id="@+id/et_relation"
                android:layout_width="match_parent"
                android:layout_height="40dp"
                android:background="#ffffff"
                android:hint="İlişki türü"
                android:visibility="gone"
                android:layout_marginBottom="10dp" />

            <EditText
                android:id="@+id/et_notes"
                android:layout_width="match_parent"
                android:layout_height="60dp"
                android:background="#ffffff"
                android:hint="Araştırma notları"
                android:layout_marginBottom="16dp" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:gravity="right">
                <Button android:id="@+id/btn_cancel_add" android:layout_width="wrap_content" android:layout_height="40dp" android:background="#94a3b8" android:textColor="#ffffff" android:text="İptal" android:layout_marginRight="8dp" />
                <Button android:id="@+id/btn_submit_add" android:layout_width="wrap_content" android:layout_height="40dp" android:background="#2563eb" android:textColor="#ffffff" android:textStyle="bold" android:text="Ekle" />
            </LinearLayout>
        </LinearLayout>
    </ScrollView>
</LinearLayout>
`);

  zip.file(resLayout + 'dialog_node_detail.xml', `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:background="#eceff4">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="42dp"
        android:background="#20406b"
        android:gravity="center_vertical"
        android:paddingLeft="14dp">
        <TextView
            android:id="@+id/tv_detail_header_title"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Düğüm Özellikleri"
            android:textColor="#ffffff"
            android:textSize="14sp"
            android:textStyle="bold" />
    </LinearLayout>

    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:padding="14dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Varlık Adı / Etiket:"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/et_detail_label"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:background="#ffffff"
                android:layout_marginBottom="10dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Varlık Türü:"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <Spinner
                android:id="@+id/sp_detail_type"
                android:layout_width="match_parent"
                android:layout_height="44dp"
                android:background="#ffffff"
                android:layout_marginBottom="10dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="İstihbarat / Vaka Notları:"
                android:textColor="#334155"
                android:textStyle="bold"
                android:textSize="12sp"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/et_detail_notes"
                android:layout_width="match_parent"
                android:layout_height="70dp"
                android:background="#ffffff"
                android:layout_marginBottom="12dp" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:layout_marginBottom="14dp">
                <Button android:id="@+id/btn_detail_connect" android:layout_width="0dp" android:layout_height="38dp" android:layout_weight="1" android:background="#2563eb" android:textColor="#ffffff" android:text="🔗 Bağla" android:textStyle="bold" android:layout_marginRight="6dp" />
                <Button android:id="@+id/btn_detail_add_child" android:layout_width="0dp" android:layout_height="38dp" android:layout_weight="1" android:background="#059669" android:textColor="#ffffff" android:text="➕ Bağlı Ekle" android:textStyle="bold" />
            </LinearLayout>

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical">
                <Button android:id="@+id/btn_detail_delete" android:layout_width="wrap_content" android:layout_height="40dp" android:background="#dc2626" android:textColor="#ffffff" android:text="🗑️ Sil" android:textStyle="bold" />
                <View android:layout_width="0dp" android:layout_height="1dp" android:layout_weight="1" />
                <Button android:id="@+id/btn_detail_close" android:layout_width="wrap_content" android:layout_height="40dp" android:background="#94a3b8" android:textColor="#ffffff" android:text="Kapat" android:layout_marginRight="6dp" />
                <Button android:id="@+id/btn_detail_save" android:layout_width="wrap_content" android:layout_height="40dp" android:background="#1e3a8a" android:textColor="#ffffff" android:textStyle="bold" android:text="Kaydet" />
            </LinearLayout>
        </LinearLayout>
    </ScrollView>
</LinearLayout>
`);

  // Values
  const resValues = 'app/src/main/res/values/';
  zip.file(resValues + 'strings.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">OsintDesk</string>
</resources>
`);

  zip.file(resValues + 'colors.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#20406b</color>
    <color name="colorPrimaryDark">#142844</color>
    <color name="colorAccent">#2563eb</color>
    <color name="windowBackground">#f3f5f8</color>
</resources>
`);

  zip.file(resValues + 'styles.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Holo.Light.NoActionBar">
        <item name="android:windowBackground">@color/windowBackground</item>
    </style>
</resources>
`);

  // Generate and download zip
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'OsintDesk-Android-AIDE.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
