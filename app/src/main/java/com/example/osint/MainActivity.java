package com.example.osint;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.*;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.util.AttributeSet;
import android.view.*;
import android.widget.*;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.*;

public class MainActivity extends Activity {

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

        public final String label;
        public final String icon;
        public final String defaultColor;

        NodeType(String label, String icon, String defaultColor) {
            this.label = label;
            this.icon = icon;
            this.defaultColor = defaultColor;
        }

        public static NodeType fromString(String val) {
            for (NodeType t : values()) {
                if (t.name().equalsIgnoreCase(val) || t.label.equalsIgnoreCase(val)) return t;
            }
            return PERSON;
        }
    }

    public enum EdgeDirection {
        DIRECTED("İleri (—►)"),
        BIDIRECTIONAL("Çift (◄—►)"),
        REVERSE("Geri (◄—)"),
        UNDIRECTED("Yönsüz (——)");

        public final String label;
        EdgeDirection(String label) { this.label = label; }
    }

    public static class NodeEntity {
        public String id;
        public NodeType type;
        public String label;
        public String notes = "";
        public String color;
        public float x;
        public float y;

        public NodeEntity(String id, NodeType type, String label, float x, float y) {
            this.id = id;
            this.type = type;
            this.label = label;
            this.color = type.defaultColor;
            this.x = x;
            this.y = y;
        }

        public NodeEntity(NodeEntity other, String newId, float offsetX, float offsetY) {
            this.id = newId;
            this.type = other.type;
            this.label = other.label + " (Kopya)";
            this.notes = other.notes;
            this.color = other.color;
            this.x = other.x + offsetX;
            this.y = other.y + offsetY;
        }
    }

    public static class EdgeEntity {
        public String id;
        public String source;
        public String target;
        public String relation;
        public String color = "#1d5fa6";
        public float width = 3.0f;
        public EdgeDirection direction = EdgeDirection.DIRECTED;

        public EdgeEntity(String id, String source, String target, String relation) {
            this.id = id;
            this.source = source;
            this.target = target;
            this.relation = relation;
        }
    }

    public static class NetworkCanvasView extends View {
        public interface CanvasListener {
            void onNodeClick(NodeEntity node);
            void onNodeLongPress(NodeEntity node, List<NodeEntity> selectedNodes);
            void onSelectionChanged(Set<String> selectedIds);
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

        private final Handler longPressHandler = new Handler(Looper.getMainLooper());
        private Runnable longPressRunnable = null;
        private NodeEntity longPressedNode = null;

        private boolean isMarqueeSelecting = false;
        private float marqueeStartX, marqueeStartY, marqueeCurrentX, marqueeCurrentY;
        private boolean isSelectMode = false;

        private static final float NODE_WIDTH = 120f;
        private static final float NODE_HEIGHT = 70f;

        public NetworkCanvasView(Context context) {
            super(context);
            init(context);
        }

        public NetworkCanvasView(Context context, AttributeSet attrs) {
            super(context, attrs);
            init(context);
        }

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
                if (n.x < minX) minX = n.x;
                if (n.x > maxX) maxX = n.x;
                if (n.y < minY) minY = n.y;
                if (n.y > maxY) maxY = n.y;
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
            for (NodeEntity n : nodes) nodeMap.put(n.id, n);

            for (EdgeEntity edge : edges) {
                NodeEntity s = nodeMap.get(edge.source);
                NodeEntity t = nodeMap.get(edge.target);
                if (s != null && t != null) drawEdge(canvas, edge, s, t);
            }

            for (NodeEntity node : nodes) {
                drawNode(canvas, node, selectedNodeIds.contains(node.id));
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
            try { edgePaint.setColor(Color.parseColor(edge.color)); } catch (Exception e) { edgePaint.setColor(Color.parseColor("#1d5fa6")); }
            edgePaint.setStrokeWidth(edge.width);

            float dx = t.x - s.x;
            float dy = t.y - s.y;
            float dist = (float) Math.hypot(dx, dy);
            if (dist < 40f) return;

            float uX = dx / dist;
            float uY = dy / dist;

            float boundPad = 40f;
            float startX = s.x + uX * boundPad;
            float startY = s.y + uY * boundPad;
            float endX = t.x - uX * boundPad;
            float endY = t.y - uY * boundPad;

            canvas.drawLine(startX, startY, endX, endY, edgePaint);

            double angle = Math.atan2(endY - startY, endX - startX);
            if (edge.direction == EdgeDirection.DIRECTED || edge.direction == EdgeDirection.BIDIRECTIONAL) {
                drawArrowHead(canvas, endX, endY, angle, edgePaint.getColor());
            }
            if (edge.direction == EdgeDirection.REVERSE || edge.direction == EdgeDirection.BIDIRECTIONAL) {
                drawArrowHead(canvas, startX, startY, angle + Math.PI, edgePaint.getColor());
            }

            if (edge.relation != null && !edge.relation.isEmpty() && scale > 0.4f) {
                float midX = (startX + endX) / 2f;
                float midY = (startY + endY) / 2f;
                float textW = edgeTextPaint.measureText(edge.relation);

                RectF badgeRect = new RectF(midX - textW / 2f - 8f, midY - 9f, midX + textW / 2f + 8f, midY + 9f);
                canvas.drawRoundRect(badgeRect, 6f, 6f, edgeBadgePaint);

                Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                borderPaint.setStyle(Paint.Style.STROKE);
                borderPaint.setStrokeWidth(1.2f);
                borderPaint.setColor(Color.parseColor("#cbd5e1"));
                canvas.drawRoundRect(badgeRect, 6f, 6f, borderPaint);

                canvas.drawText(edge.relation, midX - textW / 2f, midY + 3.5f, edgeTextPaint);
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
            RectF cardRect = new RectF(node.x - halfW, node.y - halfH, node.x + halfW, node.y + halfH);

            canvas.drawRoundRect(cardRect, 10f, 10f, nodeCardPaint);

            try { nodeHeaderPaint.setColor(Color.parseColor(node.color)); } catch (Exception e) { nodeHeaderPaint.setColor(Color.parseColor(node.type.defaultColor)); }
            RectF headerRect = new RectF(node.x - halfW, node.y - halfH, node.x + halfW, node.y - halfH + 22f);
            canvas.drawRoundRect(headerRect, 10f, 10f, nodeHeaderPaint);
            canvas.drawRect(node.x - halfW, node.y - halfH + 12f, node.x + halfW, node.y - halfH + 22f, nodeHeaderPaint);

            canvas.drawText(node.type.icon, node.x - halfW + 6f, node.y - halfH + 16f, textIconPaint);
            Paint headerTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            headerTextPaint.setColor(Color.WHITE);
            headerTextPaint.setTextSize(10f);
            headerTextPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
            canvas.drawText(node.type.label, node.x - halfW + 28f, node.y - halfH + 15f, headerTextPaint);

            String label = node.label;
            if (label.length() > 14) label = label.substring(0, 13) + "…";
            canvas.drawText(label, node.x - halfW + 10f, node.y + 8f, textTitlePaint);
            canvas.drawText("Varlık", node.x - halfW + 10f, node.y + 24f, textSubtitlePaint);

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
                if (worldX >= n.x - halfW && worldX <= n.x + halfW &&
                    worldY >= n.y - halfH && worldY <= n.y + halfH) {
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
                        if (!selectedNodeIds.contains(hit.id)) {
                            selectedNodeIds.clear();
                            selectedNodeIds.add(hit.id);
                            notifySelection();
                        }

                        // SADECE 1 Saniye basılı tutulunca menü açılması
                        longPressedNode = hit;
                        longPressRunnable = new Runnable() {
                            @Override
                            public void run() {
                                if (!hasDragged && draggedNode == longPressedNode && listener != null) {
                                    vibrateDevice();
                                    List<NodeEntity> selList = new ArrayList<>();
                                    for (NodeEntity n : nodes) {
                                        if (selectedNodeIds.contains(n.id)) selList.add(n);
                                    }
                                    listener.onNodeLongPress(longPressedNode, selList);
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
                            draggedNode.x += dx / scale;
                            draggedNode.y += dy / scale;
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
                    if (!(n.x + halfW < minWldX || n.x - halfW > maxWldX ||
                          n.y + halfH < minWldY || n.y - halfH > maxWldY)) {
                        selectedNodeIds.add(n.id);
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
            if (listener != null) listener.onSelectionChanged(selectedNodeIds);
            invalidate();
        }
    }

    private NetworkCanvasView canvasView;
    private final List<NodeEntity> nodes = new ArrayList<>();
    private final List<EdgeEntity> edges = new ArrayList<>();
    private TextView tvStatusInfo;
    private TextView tvAppTitle;

    private View layoutHoldBar;
    private TextView tvHoldCount;
    private Button btnHoldDuplicate;
    private Button btnHoldDelete;
    private Button btnHoldConnect;
    private ImageButton btnHoldClose;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        FrameLayout container = findViewById(R.id.canvas_container);
        canvasView = new NetworkCanvasView(this);
        container.addView(canvasView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        initViews();
        loadSampleData();
        setupEvents();
    }

    private void initViews() {
        tvStatusInfo = findViewById(R.id.tv_status_info);
        tvAppTitle = findViewById(R.id.tv_app_title);

        layoutHoldBar = findViewById(R.id.layout_hold_bar);
        tvHoldCount = findViewById(R.id.tv_hold_count);
        btnHoldDuplicate = findViewById(R.id.btn_hold_duplicate);
        btnHoldDelete = findViewById(R.id.btn_hold_delete);
        btnHoldConnect = findViewById(R.id.btn_hold_connect);
        btnHoldClose = findViewById(R.id.btn_hold_close);

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

    private void loadSampleData() {
        nodes.clear();
        edges.clear();

        nodes.add(new NodeEntity("node_1", NodeType.COMPANY, "Erdem Holding A.Ş.", 0f, 0f));
        nodes.add(new NodeEntity("node_2", NodeType.PERSON, "Kemal Erdem", 0f, 180f));
        nodes.add(new NodeEntity("node_3", NodeType.DOMAIN, "erdemholding.com", 220f, -60f));
        nodes.add(new NodeEntity("node_4", NodeType.IP_ADDRESS, "185.199.108.153", 380f, -60f));
        nodes.add(new NodeEntity("node_5", NodeType.COMPANY, "Apex Lojistik Ltd.", -220f, 120f));

        edges.add(new EdgeEntity("e1", "node_2", "node_1", "Yönetim Kurulu Başkanı"));
        edges.add(new EdgeEntity("e2", "node_1", "node_3", "Resmi Web Sitesi"));
        edges.add(new EdgeEntity("e3", "node_3", "node_4", "A Kaydı / IP"));
        edges.add(new EdgeEntity("e4", "node_2", "node_5", "Ortak / Hissedar"));

        updateGraph();
    }

    private void updateGraph() {
        canvasView.setData(nodes, edges);
        int selCount = canvasView.getSelectedNodeIds().size();
        String selStr = selCount > 0 ? " | " + selCount + " Seçili" : "";
        tvStatusInfo.setText("Düğümler: " + nodes.size() + " | Bağlantılar: " + edges.size() + selStr);
    }

    private void setupEvents() {
        canvasView.setCanvasListener(new NetworkCanvasView.CanvasListener() {
            @Override
            public void onNodeClick(NodeEntity node) {
                hideHoldBar();
                openNodeDetailDialog(node);
            }

            @Override
            public void onNodeLongPress(NodeEntity node, List<NodeEntity> selectedNodes) {
                showHoldBar(node, selectedNodes);
            }

            @Override
            public void onSelectionChanged(Set<String> selectedIds) {
                updateGraph();
                if (selectedIds.isEmpty()) hideHoldBar();
            }
        });

        findViewById(R.id.btn_nav_add).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { hideHoldBar(); openAddNodeDialog(null, false); }
        });

        findViewById(R.id.btn_nav_batch).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { hideHoldBar(); openAddNodeDialog(null, true); }
        });

        findViewById(R.id.btn_nav_connect).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { hideHoldBar(); openConnectDialog(null, null); }
        });

        findViewById(R.id.btn_nav_mode).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                boolean m = !canvasView.isSelectMode();
                canvasView.setSelectMode(m);
                Toast.makeText(MainActivity.this, m ? "Kutu Seçim Modu" : "Gezinme Modu", Toast.LENGTH_SHORT).show();
            }
        });

        findViewById(R.id.btn_nav_layout).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { applyForceLayout(); }
        });

        findViewById(R.id.btn_nav_sample).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { loadSampleData(); }
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
                List<String> list = new ArrayList<>(canvasView.getSelectedNodeIds());
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
        if (nodes.size() < 2) {
            new AlertDialog.Builder(this)
                    .setTitle("Yetersiz Düğüm")
                    .setMessage("İki düğüm arasında bağlantı kurabilmek için ağınızda en az 2 düğüm bulunmalıdır.")
                    .setPositiveButton("Tamam", null)
                    .show();
            return;
        }

        if (initialSrcId == null) {
            List<String> list = new ArrayList<>(canvasView.getSelectedNodeIds());
            if (list.size() >= 2) {
                initialSrcId = list.get(0);
                initialTgtId = list.get(1);
            } else if (list.size() == 1) {
                initialSrcId = list.get(0);
            }
        }

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_connect_nodes, null);
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
        int defaultSrc = 0;
        int defaultTgt = 1;

        for (int i = 0; i < nodes.size(); i++) {
            NodeEntity n = nodes.get(i);
            nodeLabels.add(n.type.icon + " " + n.label + " (" + n.type.label + ")");
            nodeIds.add(n.id);
            if (initialSrcId != null && initialSrcId.equals(n.id)) defaultSrc = i;
            if (initialTgtId != null && initialTgtId.equals(n.id)) defaultTgt = i;
        }

        if (defaultSrc == defaultTgt) {
            defaultTgt = (defaultSrc + 1) % nodes.size();
        }

        ArrayAdapter<String> nodeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, nodeLabels);
        spSource.setAdapter(nodeAdapter);
        spTarget.setAdapter(nodeAdapter);
        spSource.setSelection(defaultSrc);
        spTarget.setSelection(defaultTgt);

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
        ArrayAdapter<String> relAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, relations);
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
                int sIdx = spSource.getSelectedItemPosition();
                int tIdx = spTarget.getSelectedItemPosition();

                if (sIdx == tIdx) {
                    Toast.makeText(MainActivity.this, "Lütfen iki farklı düğüm seçin!", Toast.LENGTH_SHORT).show();
                    return;
                }

                String sId = nodeIds.get(sIdx);
                String tId = nodeIds.get(tIdx);
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

                EdgeEntity edge = new EdgeEntity("edge_" + System.currentTimeMillis(), sId, tId, rel);
                edge.direction = direction;
                edges.add(edge);

                canvasView.getSelectedNodeIds().clear();
                canvasView.getSelectedNodeIds().add(sId);
                canvasView.getSelectedNodeIds().add(tId);

                updateGraph();
                dialog.dismiss();
                Toast.makeText(MainActivity.this, "Bağlantı başarıyla kuruldu!", Toast.LENGTH_SHORT).show();
            }
        });

        dialog.show();
    }

    private void openAddNodeDialog(final String parentNodeLabel, boolean startInBatch) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_node, null);
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

        if (parentNodeLabel != null) {
            tvParentInfo.setVisibility(View.VISIBLE);
            tvParentInfo.setText("🔗 Bağlı Eklenecek: " + parentNodeLabel);
            etRelation.setVisibility(View.VISIBLE);
        } else {
            tvParentInfo.setVisibility(View.GONE);
            etRelation.setVisibility(View.GONE);
        }

        List<String> typeNames = new ArrayList<>();
        for (NodeType t : NodeType.values()) typeNames.add(t.icon + " " + t.label);
        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, typeNames);
        spType.setAdapter(typeAdapter);

        cbBatchMode.setChecked(startInBatch);
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
                if (input.isEmpty()) { etLabel.setError("İsim girin!"); return; }

                NodeType selectedType = NodeType.values()[spType.getSelectedItemPosition()];
                String relation = etRelation.getText().toString().trim();
                if (relation.isEmpty()) relation = "İlişkili";
                String notesStr = etNotes.getText().toString().trim();

                if (cbBatchMode.isChecked()) {
                    String[] parts = input.split("[,\\n]+");
                    int added = 0;
                    for (int i = 0; i < parts.length; i++) {
                        String clean = parts[i].trim();
                        if (!clean.isEmpty()) {
                            String newId = "node_" + System.currentTimeMillis() + "_" + i;
                            nodes.add(new NodeEntity(newId, selectedType, clean, (i - parts.length / 2f) * 140f, 0f));
                            added++;
                        }
                    }
                    Toast.makeText(MainActivity.this, added + " düğüm eklendi", Toast.LENGTH_SHORT).show();
                } else {
                    String newId = "node_" + System.currentTimeMillis();
                    NodeEntity node = new NodeEntity(newId, selectedType, input, 0f, 0f);
                    node.notes = notesStr;
                    nodes.add(node);
                    canvasView.getSelectedNodeIds().clear();
                    canvasView.getSelectedNodeIds().add(newId);
                    Toast.makeText(MainActivity.this, "Düğüm eklendi", Toast.LENGTH_SHORT).show();
                }
                updateGraph();
                dialog.dismiss();
            }
        });

        dialog.show();
    }

    private void openNodeDetailDialog(final NodeEntity node) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_node_detail, null);
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

        tvHeaderTitle.setText(node.type.icon + " " + node.label);
        etLabel.setText(node.label);
        etNotes.setText(node.notes);

        List<String> typeNames = new ArrayList<>();
        int selectedTypeIndex = 0;
        for (int i = 0; i < NodeType.values().length; i++) {
            NodeType t = NodeType.values()[i];
            typeNames.add(t.icon + " " + t.label);
            if (t == node.type) selectedTypeIndex = i;
        }
        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, typeNames);
        spType.setAdapter(typeAdapter);
        spType.setSelection(selectedTypeIndex);

        final AlertDialog dialog = builder.create();

        btnSave.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String label = etLabel.getText().toString().trim();
                if (label.isEmpty()) { etLabel.setError("İsim boş olamaz!"); return; }
                node.label = label;
                node.type = NodeType.values()[spType.getSelectedItemPosition()];
                node.color = node.type.defaultColor;
                node.notes = etNotes.getText().toString().trim();
                updateGraph();
                dialog.dismiss();
            }
        });

        btnConnect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.dismiss();
                openConnectDialog(node.id, null);
            }
        });

        btnAddChild.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.dismiss();
                openAddNodeDialog(node.label, false);
            }
        });

        btnDelete.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Düğümü Sil")
                        .setMessage("'" + node.label + "' varlığını silmek istediğinize emin misiniz?")
                        .setPositiveButton("Evet, Sil", new DialogInterface.OnClickListener() {
                            @Override public void onClick(DialogInterface d, int which) {
                                deleteNodes(Collections.singleton(node.id));
                                dialog.dismiss();
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

    private void duplicateSelectedNodes() {
        Set<String> sel = canvasView.getSelectedNodeIds();
        if (sel.isEmpty()) return;
        List<String> newIds = new ArrayList<>();
        for (NodeEntity n : new ArrayList<>(nodes)) {
            if (sel.contains(n.id)) {
                String newId = "node_" + System.currentTimeMillis() + "_" + Math.random();
                nodes.add(new NodeEntity(n, newId, 60f, 60f));
                newIds.add(newId);
            }
        }
        canvasView.getSelectedNodeIds().clear();
        canvasView.getSelectedNodeIds().addAll(newIds);
        updateGraph();
        Toast.makeText(this, newIds.size() + " düğüm çoğaltıldı", Toast.LENGTH_SHORT).show();
    }

    private void confirmDeleteSelected() {
        final Set<String> sel = canvasView.getSelectedNodeIds();
        if (sel.isEmpty()) return;
        new AlertDialog.Builder(this)
                .setTitle("Toplu Sil")
                .setMessage("Seçili " + sel.size() + " düğümü silmek istiyor musunuz?")
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
        Iterator<NodeEntity> nIt = nodes.iterator();
        while (nIt.hasNext()) { if (idsToDelete.contains(nIt.next().id)) nIt.remove(); }
        Iterator<EdgeEntity> eIt = edges.iterator();
        while (eIt.hasNext()) {
            EdgeEntity e = eIt.next();
            if (idsToDelete.contains(e.source) || idsToDelete.contains(e.target)) eIt.remove();
        }
        canvasView.getSelectedNodeIds().clear();
        updateGraph();
        Toast.makeText(this, "Silindi", Toast.LENGTH_SHORT).show();
    }

    private void applyForceLayout() {
        if (nodes.isEmpty()) return;
        int n = nodes.size();
        float[] vx = new float[n];
        float[] vy = new float[n];

        for (int iter = 0; iter < 60; iter++) {
            for (int i = 0; i < n; i++) {
                NodeEntity n1 = nodes.get(i);
                for (int j = i + 1; j < n; j++) {
                    NodeEntity n2 = nodes.get(j);
                    float dx = n1.x - n2.x;
                    float dy = n1.y - n2.y;
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
                    if (nodes.get(k).id.equals(e.source)) i1 = k;
                    if (nodes.get(k).id.equals(e.target)) i2 = k;
                }
                if (i1 != -1 && i2 != -1) {
                    float dx = nodes.get(i2).x - nodes.get(i1).x;
                    float dy = nodes.get(i2).y - nodes.get(i1).y;
                    float dist = (float) Math.hypot(dx, dy);
                    float force = (dist - 180f) * 0.05f;
                    float fx = (dx / (dist > 0 ? dist : 1)) * force;
                    float fy = (dy / (dist > 0 ? dist : 1)) * force;
                    vx[i1] += fx; vy[i1] += fy;
                    vx[i2] -= fx; vy[i2] -= fy;
                }
            }

            for (int i = 0; i < n; i++) {
                nodes.get(i).x += vx[i] * 0.15f;
                nodes.get(i).y += vy[i] * 0.15f;
                vx[i] *= 0.5f; vy[i] *= 0.5f;
            }
        }
        updateGraph();
        Toast.makeText(this, "Düzen uygulandı", Toast.LENGTH_SHORT).show();
    }
}
