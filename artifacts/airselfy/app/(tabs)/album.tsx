import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  cacheDirectory,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { AlbumItem, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 48) / 2;

const ITEM_COLORS: Record<string, string> = {
  "0": "#FF6B6B",
  "1": "#A259FF",
  "2": "#4ADEAD",
  "3": "#FFB347",
  "4": "#5B8DEF",
  "5": "#F06EFF",
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isRealUri(uri: string): boolean {
  return (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("data:")
  );
}

/** Resolves a video URI for playback: writes base64 data URIs to a temp file */
async function resolveVideoUri(rawUri: string, itemId: string): Promise<string> {
  if (!rawUri.startsWith("data:")) return rawUri;
  const base64 = rawUri.split(",")[1];
  if (!base64) return rawUri;
  try {
    const path = `${cacheDirectory}video_${itemId}.mp4`;
    await writeAsStringAsync(path, base64, { encoding: EncodingType.Base64 });
    return path;
  } catch {
    return rawUri;
  }
}

/** Video player — only rendered once a local file URI is ready */
function ReadyVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.realImage}
      nativeControls
    />
  );
}

/** Handles base64→file conversion before mounting the player */
function VideoPlayback({ item }: { item: AlbumItem }) {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    if (!item.videoUri) return;
    resolveVideoUri(item.videoUri, item.id).then(setLocalUri).catch(() => {});
  }, [item.videoUri, item.id]);

  if (!item.videoUri) return null;
  if (!localUri) {
    return (
      <View style={[styles.realImage, styles.videoLoading]}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.videoLoadingText}>Preparing video…</Text>
      </View>
    );
  }
  return <ReadyVideoPlayer uri={localUri} />;
}

export default function AlbumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { albumItems, deleteAlbumItem, albumLoading } = useApp();
  const [selected, setSelected] = useState<AlbumItem | null>(null);
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all");
  const [deleting, setDeleting] = useState(false);

  // Expand animation
  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const filtered = filter === "all" ? albumItems : albumItems.filter((i) => i.type === filter);

  function itemColor(item: AlbumItem) {
    return ITEM_COLORS[String(parseInt(item.id) % 6)] ?? colors.primary;
  }

  function openItem(item: AlbumItem) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scaleAnim.setValue(0.86);
    opacityAnim.setValue(0);
    setSelected(item);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 110,
        friction: 11,
      }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }

  function closeItem() {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 140, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => setSelected(null));
  }

  async function handleDelete(item: AlbumItem) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleting(true);
    await deleteAlbumItem(item.id);
    setDeleting(false);
    closeItem();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Your Album</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {albumLoading ? "Syncing…" : `${albumItems.length} item${albumItems.length !== 1 ? "s" : ""} · captured for you`}
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(["all", "photo", "video"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f ? colors.primary : "transparent",
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
              {f === "all" ? "All" : f === "photo" ? "Photos" : "Videos"}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="image" size={40} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No captures yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Photos and videos captured for you will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const col = itemColor(item);
            const hasImage = isRealUri(item.uri);
            return (
              <Pressable
                onPress={() => openItem(item)}
                style={({ pressed }) => [
                  styles.gridItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                {hasImage ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <LinearGradient
                      colors={[col + "18", col + "06"]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={[styles.gridIcon, { backgroundColor: col + "20", borderColor: col + "40" }]}>
                      <Feather name={item.type === "photo" ? "camera" : "video"} size={24} color={col} />
                    </View>
                  </>
                )}

                {/* Play indicator for video items */}
                {item.type === "video" && (
                  <View style={styles.playBadge}>
                    <Feather name="play" size={10} color="#fff" />
                  </View>
                )}

                {/* Type badge */}
                <View style={[styles.badge, { backgroundColor: "#00000066" }]}>
                  {item.type === "video" && <View style={styles.recDot} />}
                  <Text style={styles.badgeText}>
                    {item.type === "photo" ? "Photo" : `${item.duration ?? ""}s`}
                  </Text>
                </View>

                {/* Footer */}
                <LinearGradient
                  colors={["transparent", "#00000099"]}
                  style={styles.gridFooter}
                >
                  <Text style={styles.byText}>By: {item.byName}</Text>
                  <Text style={styles.timeText}>{formatDate(item.createdAt)} · {formatTime(item.createdAt)}</Text>
                </LinearGradient>
              </Pressable>
            );
          }}
        />
      )}

      {/* Expand modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="none"
        onRequestClose={closeItem}
        statusBarTranslucent
      >
        {selected && (
          <Animated.View
            style={[styles.modalBackdrop, { opacity: opacityAnim }]}
          >
            <Animated.View
              style={[
                styles.modalInner,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              {/* Top bar */}
              <View style={[styles.modalTop, { paddingTop: topPad + 8 }]}>
                <Pressable onPress={closeItem} style={styles.circleBtn}>
                  <Feather name="x" size={20} color="#fff" />
                </Pressable>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.modalBy}>By: {selected.byName}</Text>
                  <Text style={styles.modalDate}>
                    {formatDate(selected.createdAt)} · {formatTime(selected.createdAt)}
                  </Text>
                </View>
                <View style={styles.circleBtn} />
              </View>

              {/* Preview */}
              <View style={styles.previewWrap}>
                {selected.type === "video" && selected.videoUri ? (
                  <VideoPlayback item={selected} />
                ) : isRealUri(selected.uri) ? (
                  <Image
                    source={{ uri: selected.uri }}
                    style={[
                      styles.realImage,
                      { borderColor: "rgba(255,255,255,0.08)" },
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <LinearGradient
                    colors={[itemColor(selected) + "15", itemColor(selected) + "05"]}
                    style={styles.preview}
                  >
                    <View
                      style={[
                        styles.previewIcon,
                        {
                          backgroundColor: itemColor(selected) + "20",
                          borderColor: itemColor(selected) + "40",
                        },
                      ]}
                    >
                      <Feather
                        name={selected.type === "photo" ? "camera" : "video"}
                        size={48}
                        color={itemColor(selected)}
                      />
                    </View>
                    <Text style={[styles.previewLabel, { color: itemColor(selected) + "99" }]}>
                      {selected.type === "photo" ? "Photo captured" : `Video · ${selected.duration ?? ""}s`}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {/* Actions */}
              <View style={[styles.actionRow, { paddingBottom: insets.bottom + 20 }]}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name="download" size={18} color={colors.foreground} />
                  <Text style={[styles.actionText, { color: colors.foreground }]}>Save</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name="share-2" size={18} color={colors.foreground} />
                  <Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(selected)}
                  disabled={deleting}
                  style={[
                    styles.actionBtnSquare,
                    {
                      backgroundColor: colors.destructive + "15",
                      borderColor: colors.destructive + "30",
                      opacity: deleting ? 0.5 : 1,
                    },
                  ]}
                >
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2, fontFamily: "Inter_400Regular" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20 },
  gridItem: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  playBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF6B6B" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  gridFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingTop: 20,
  },
  byText: { color: "#fff", fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  timeText: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontFamily: "Inter_400Regular" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#000000EE",
  },
  modalInner: { flex: 1 },
  modalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBy: { color: "#fff", fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  modalDate: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_400Regular" },
  previewWrap: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  preview: {
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    aspectRatio: 3 / 4,
  },
  realImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  videoLoading: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  videoLoadingText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "Inter_400Regular" },
  previewIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  previewLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnSquare: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: 14, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
});
