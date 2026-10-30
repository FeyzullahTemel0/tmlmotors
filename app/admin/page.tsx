"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  ArrowLeft, ArrowRight, Bell, Bookmark, Car, Check, ExternalLink, Eye, FileText, Flag, Heart, ImagePlus, LayoutDashboard,
  Link2, LogOut, Megaphone, Menu, MessageSquareText, MousePointerClick, Pencil, Plus, Save, Search, Star, Trash2, X,
} from "lucide-react";
import { getFirebaseAuth, getFirebaseConnectionStatus } from "@/lib/firebase-client";
import { VehicleDamageMap } from "@/components/vehicle-damage-map";
import { AdManager } from "@/components/admin/ad-manager";
import { EditorSheet } from "@/components/admin/editor-sheet";
import { BlogEditor } from "@/components/admin/blog-editor";
import { adPlacements, legacyAdPlacements } from "@/lib/ad-placements";
import { emptyAdDraft, getAdStatus, type AdDraft, type AdminAd } from "@/lib/admin-types";
import type { Vehicle as VehicleRecord, VehicleDamagePart, VehicleTire } from "@/lib/vehicle-types";
import { featureCatalog, featureGroupKeys, featureGroupLabels, type FeatureGroupKey } from "@/lib/vehicle-features";
import type { VehicleCatalog as VehicleCatalogType } from "@/lib/vehicle-catalog";

type AdminTab = "overview" | "vehicles" | "blog" | "ads" | "notifications" | "complaints" | "messages" | "links";
type ContactMessage = {
  id: string; name: string; email: string; phone: string; message: string; read: boolean; createdAt: string | null;
};
type AdminComplaint = {
  id: string; vehicleId: string; vehicleTitle: string; userId: string; userName: string; userEmail: string;
  message: string; status: "open" | "answered"; adminReply: string; createdAt: string | null; repliedAt: string | null;
};
type ListingStatus = "draft" | "published" | "sold";
type Vehicle = VehicleRecord;
type VehicleDraft = Omit<Vehicle, "id"> & { id?: string };
type BlogPost = { id: string; title: string; slug: string; excerpt: string; content: string; coverImageUrl: string; published: boolean };
type PostDraft = Omit<BlogPost, "id"> & { id?: string };
type AdminNotification = {
  id: string; type: "like" | "save"; postId: string; postSlug: string; postTitle: string;
  userName: string; userEmail: string; read: boolean; createdAt: string | null;
};
type InteractionUser = { id: string; name: string; email: string; createdAt: string | null };
type PostEngagement = {
  likes: { count: number; users: InteractionUser[] };
  saves: { count: number; users: InteractionUser[] };
};
type Links = { instagram: string; facebook: string; youtube: string; arabam: string; sahibinden: string };

const emptyVehicle: VehicleDraft = {
  title: "", brand: "", series: "", model: "", trim: "", subTrim: "", year: new Date().getFullYear(), mileage: 0, price: null,
  fuel: "", transmission: "", bodyType: "", engineVolume: "", enginePower: "", drive: "", color: "",
  vehicleCondition: "İkinci El", from: "Galeriden", trade: false, sahibindenUrl: "", damageParts: [],
  features: {}, featureNotes: {}, tires: [],
  description: "", imageUrls: [], status: "draft", featured: false,
};
const emptyPost: PostDraft = { title: "", slug: "", excerpt: "", content: "", coverImageUrl: "", published: false };
const emptyLinks: Links = { instagram: "", facebook: "", youtube: "", arabam: "", sahibinden: "https://tmlmotors.sahibinden.com" };

const fuelOptions = ["Benzin + LPG", "Benzin", "Dizel", "Hybrit", "Elektrik"];
const driveOptions = ["Önden Çeker", "Arkadan İter", "4X2 Önden Çekiş", "4X2 Arkadan İtiş", "4X4", "4X4 AWD"];
const transmissionOptions = ["Otomatik", "Manuel", "Yarı Otomatik"];
const bodyTypeOptions = ["Sedan", "Hatchback", "Station Wagon", "SUV", "Coupe", "Cabrio", "MPV", "Pickup", "Minivan", "Panelvan"];
const statusLabels: Record<ListingStatus, string> = { published: "Yayında", draft: "Taslak", sold: "Satıldı" };
const statusTones: Record<ListingStatus, string> = { published: "green", draft: "amber", sold: "gray" };

const tabMeta: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: { title: "Genel bakış", subtitle: "İşletmenizin güncel durumu tek bakışta." },
  vehicles: { title: "Araç ilanları", subtitle: "Envanterinizi ekleyin, düzenleyin ve yayınlayın." },
  blog: { title: "Blog ve paylaşımlar", subtitle: "Tecrübelerinizi ve yazılarınızı yayınlayın." },
  ads: { title: "Reklam alanları", subtitle: "Sponsor reklamlarının sitede nerede görüneceğine siz karar verin." },
  notifications: { title: "Bildirimler", subtitle: "Ziyaretçilerin beğeni ve kaydetme etkileşimleri." },
  complaints: { title: "İlan şikayetleri", subtitle: "Ziyaretçilerin ilanlarınız hakkında ilettiği şikayetleri yanıtlayın." },
  messages: { title: "Ziyaretçi mesajları", subtitle: "İletişim sayfasından gelen dilek, öneri ve sorular." },
  links: { title: "Site bağlantıları", subtitle: "Sosyal medya ve ilan sitesi profilleriniz." },
};

function slugify(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function requestApi<T>(url: string, token: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "İstek tamamlanamadı.");
  return result as T;
}

async function uploadImage(file: File, category: "vehicles" | "blog" | "ads", token: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Yalnızca görsel dosyaları yüklenebilir.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Görsel en fazla 8 MB olabilir.");

  const signature = await requestApi<{ timestamp: number; signature: string; folder: string; apiKey: string; cloudName: string }>(
    "/api/cloudinary/signature", token, "POST", { category },
  );
  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", signature.apiKey);
  formData.set("timestamp", String(signature.timestamp));
  formData.set("signature", signature.signature);
  formData.set("folder", signature.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body: formData });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? "Görsel yüklenemedi.");
  if (typeof result.secure_url !== "string") throw new Error("Cloudinary görsel adresi dönmedi.");
  return result.secure_url;
}

function normalizeAd(item: Partial<AdminAd> & { id: string }): AdminAd {
  return {
    ...emptyAdDraft, ...item,
    placements: item.placements?.length ? item.placements : legacyAdPlacements,
    priority: Number(item.priority) || 0,
  };
}

export default function AdminPage() {
  const firebaseStatus = useMemo(() => getFirebaseConnectionStatus(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [vehicleCatalog, setVehicleCatalog] = useState<VehicleCatalogType>({ makes: [] });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [complaintReplies, setComplaintReplies] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [postEngagement, setPostEngagement] = useState<PostEngagement | null>(null);
  const [engagementPostTitle, setEngagementPostTitle] = useState("");
  const [loadingEngagement, setLoadingEngagement] = useState(false);
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [links, setLinks] = useState<Links>(emptyLinks);
  const [vehicle, setVehicle] = useState<VehicleDraft | null>(null);
  const [post, setPost] = useState<PostDraft | null>(null);
  const [ad, setAd] = useState<AdDraft | null>(null);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<"all" | ListingStatus>("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadAll(token: string) {
    const [vehicleResult, postResult, catalogResult, notificationResult, adResult, settingsResult, complaintResult, messageResult] = await Promise.all([
      requestApi<{ vehicles: Vehicle[] }>("/api/admin/vehicles", token),
      requestApi<{ posts: BlogPost[] }>("/api/admin/blog", token),
      requestApi<{ catalog: VehicleCatalogType }>("/api/admin/vehicle-catalog", token),
      requestApi<{ notifications: AdminNotification[]; unreadCount: number }>("/api/admin/notifications", token),
      requestApi<{ ads: (Partial<AdminAd> & { id: string })[] }>("/api/admin/ads", token),
      requestApi<{ links: Links }>("/api/site-settings", token),
      requestApi<{ complaints: AdminComplaint[] }>("/api/admin/complaints", token),
      requestApi<{ messages: ContactMessage[] }>("/api/admin/messages", token),
    ]);
    setVehicles(vehicleResult.vehicles);
    setPosts(postResult.posts);
    setVehicleCatalog(catalogResult.catalog);
    setNotifications(notificationResult.notifications);
    setUnreadCount(notificationResult.unreadCount);
    setAds(adResult.ads.map(normalizeAd).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
    setLinks({ ...emptyLinks, ...settingsResult.links });
    setComplaints(complaintResult.complaints);
    setComplaintReplies(Object.fromEntries(complaintResult.complaints.map((item) => [item.id, item.adminReply])));
    setMessages(messageResult.messages);
  }

  useEffect(() => {
    if (!firebaseStatus.ready) {
      setLoading(false);
      setErrorMessage(firebaseStatus.message);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthorized(false);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        await currentUser.reload();
        const token = await currentUser.getIdToken(true);
        await requestApi("/api/admin/session", token);
        await loadAll(token);
        setAuthorized(true);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Admin yetkisi doğrulanamadı.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseStatus.message, firebaseStatus.ready]);

  useEffect(() => {
    if (!authorized || !user) return;
    let active = true;
    const poll = async () => {
      try {
        const result = await requestApi<{ notifications: AdminNotification[]; unreadCount: number }>(
          "/api/admin/notifications",
          await user.getIdToken(),
        );
        if (active) {
          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount);
        }
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Bildirimler yenilenemedi.");
      }
    };
    const interval = window.setInterval(() => void poll(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authorized, user]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  function goTo(next: AdminTab) {
    setTab(next);
    setNavOpen(false);
    setErrorMessage("");
    window.scrollTo({ top: 0 });
  }

  async function refresh() {
    if (!user) return;
    await loadAll(await user.getIdToken());
  }

  async function perform(action: () => Promise<void>, success: string) {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await action();
      await refresh();
      setSuccessMessage(success);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  async function runUpload(file: File, category: "vehicles" | "blog" | "ads"): Promise<string | null> {
    if (!user) return null;
    setUploading(true);
    setErrorMessage("");
    try {
      return await uploadImage(file, category, await user.getIdToken());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Görsel yüklenemedi.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function saveVehicle() {
    if (!user || !vehicle) return;
    const current = vehicle;
    await perform(async () => {
      await requestApi("/api/admin/vehicles", await user.getIdToken(), current.id ? "PATCH" : "POST", {
        ...current,
        title: current.title || [current.brand, current.series, current.model, current.trim, current.subTrim].filter(Boolean).join(" "),
      });
      setVehicle(null);
    }, current.id ? "İlan güncellendi." : "Araç ilanı oluşturuldu.");
  }

  async function deleteVehicle(id: string) {
    if (!user || !window.confirm("Bu araç ilanını kalıcı olarak silmek istiyor musunuz?")) return;
    await perform(async () => {
      await requestApi("/api/admin/vehicles", await user.getIdToken(), "DELETE", { id });
      if (vehicle?.id === id) setVehicle(null);
    }, "Araç ilanı silindi.");
  }

  async function handleVehicleImages(files: FileList | null) {
    if (!files || !user || !vehicle) return;
    const availableSlots = 20 - vehicle.imageUrls.length;
    if (files.length > availableSlots) {
      setErrorMessage(`Bu ilan için en fazla 20 fotoğraf yüklenebilir. Şu anda ${availableSlots} fotoğraf alanı kaldı.`);
      return;
    }
    setUploading(true);
    setErrorMessage("");
    try {
      const token = await user.getIdToken();
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadImage(file, "vehicles", token)));
      setVehicle((current) => current ? { ...current, imageUrls: [...current.imageUrls, ...uploaded].slice(0, 20) } : current);
      setSuccessMessage(`${uploaded.length} görsel yüklendi.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  function toggleVehicleFeature(group: FeatureGroupKey, option: string, checked: boolean) {
    setVehicle((current) => {
      if (!current) return current;
      const list = new Set(current.features?.[group] ?? []);
      if (checked) list.add(option); else list.delete(option);
      return { ...current, features: { ...current.features, [group]: [...list] } };
    });
  }

  function setVehicleFeatureNote(group: FeatureGroupKey, note: string) {
    setVehicle((current) => current ? { ...current, featureNotes: { ...current.featureNotes, [group]: note } } : current);
  }

  async function handleBlogCover(file: File | undefined) {
    if (!file) return;
    const url = await runUpload(file, "blog");
    if (url) {
      setPost((current) => current ? { ...current, coverImageUrl: url } : current);
      setSuccessMessage("Blog kapak görseli yüklendi.");
    }
  }

  async function savePost() {
    if (!user || !post) return;
    const current = post;
    const payload = { ...current, slug: current.slug || slugify(current.title) };
    await perform(async () => {
      await requestApi("/api/admin/blog", await user.getIdToken(), current.id ? "PATCH" : "POST", payload);
      setPost(null);
    }, current.id ? "Blog yazısı güncellendi." : "Blog yazısı kaydedildi.");
  }

  async function loadPostEngagement(item: BlogPost) {
    if (!user) return;
    setLoadingEngagement(true);
    setPostEngagement(null);
    setErrorMessage("");
    try {
      const result = await requestApi<PostEngagement>(`/api/admin/blog/${encodeURIComponent(item.id)}/engagement`, await user.getIdToken());
      setPostEngagement(result);
      setEngagementPostTitle(item.title);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gönderi etkileşimleri alınamadı.");
    } finally {
      setLoadingEngagement(false);
    }
  }

  async function markNotificationRead(id: string) {
    if (!user) return;
    try {
      await requestApi("/api/admin/notifications", await user.getIdToken(), "PATCH", { id });
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Bildirim güncellenemedi.");
    }
  }

  async function replyComplaint(id: string) {
    if (!user) return;
    const adminReply = (complaintReplies[id] ?? "").trim();
    if (adminReply.length < 10) {
      setErrorMessage("Yanıtınız en az 10 karakter olmalıdır.");
      return;
    }
    await perform(async () => {
      await requestApi("/api/admin/complaints", await user.getIdToken(), "PATCH", { id, adminReply });
    }, "Şikayet yanıtlandı; kullanıcı profilinde görebilir.");
  }

  async function deleteComplaint(id: string) {
    if (!user || !window.confirm("Bu şikayet kaydını kalıcı olarak silmek istiyor musunuz?")) return;
    await perform(async () => {
      await requestApi("/api/admin/complaints", await user.getIdToken(), "DELETE", { id });
    }, "Şikayet kaydı silindi.");
  }

  async function markMessageRead(id: string) {
    if (!user) return;
    try {
      await requestApi("/api/admin/messages", await user.getIdToken(), "PATCH", { id });
      setMessages((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Mesaj güncellenemedi.");
    }
  }

  async function deleteMessage(id: string) {
    if (!user || !window.confirm("Bu mesajı kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.")) return;
    await perform(async () => {
      await requestApi("/api/admin/messages", await user.getIdToken(), "DELETE", { id });
    }, "Mesaj kalıcı olarak silindi.");
  }

  async function deletePost(id: string) {
    if (!user || !window.confirm("Bu blog yazısını silmek istiyor musunuz?")) return;
    await perform(async () => {
      await requestApi("/api/admin/blog", await user.getIdToken(), "DELETE", { id });
      if (post?.id === id) setPost(null);
    }, "Blog yazısı silindi.");
  }

  async function saveAd(draft: AdDraft) {
    if (!user) return;
    await perform(async () => {
      await requestApi("/api/admin/ads", await user.getIdToken(), draft.id ? "PATCH" : "POST", draft);
      setAd(null);
    }, draft.id ? "Reklam güncellendi." : "Reklam oluşturuldu.");
  }

  async function deleteAd(id: string) {
    if (!user || !window.confirm("Bu reklam kaydını silmek istiyor musunuz?")) return;
    await perform(async () => {
      await requestApi("/api/admin/ads", await user.getIdToken(), "DELETE", { id });
      if (ad?.id === id) setAd(null);
    }, "Reklam silindi.");
  }

  async function saveLinks() {
    if (!user) return;
    await perform(async () => {
      await requestApi("/api/site-settings", await user.getIdToken(), "PUT", links);
    }, "Bağlantılar güncellendi.");
  }

  const selectedMake = vehicleCatalog.makes.find((item) => item.name === vehicle?.brand);
  const publishedCount = vehicles.filter((item) => item.status === "published").length;
  const liveAds = ads.filter((item) => getAdStatus(item) === "live");
  const totalClicks = ads.reduce((sum, item) => sum + (item.clicks ?? 0), 0);
  const filteredVehicles = vehicles.filter((item) => {
    const text = `${item.title} ${item.brand} ${item.model} ${item.series ?? ""}`.toLocaleLowerCase("tr-TR");
    return (vehicleFilter === "all" || item.status === vehicleFilter) && text.includes(vehicleQuery.trim().toLocaleLowerCase("tr-TR"));
  });

  if (!firebaseStatus.ready) return <AdminMessage title="Yönetim paneli" message={firebaseStatus.message} />;
  if (loading) return <AdminMessage title="Yönetim paneli" message="Yetki ve içerikler kontrol ediliyor..." />;
  if (!user) return <AdminMessage title="Giriş gerekli" message="Yönetim paneline erişmek için işletme hesabıyla giriş yapın." link="/giris" />;
  if (!authorized) return <AdminMessage title="Erişim reddedildi" message={errorMessage || "Bu hesap admin yetkisine sahip değil."} />;

  const navigation: { group: string; items: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] }[] = [
    { group: "Genel", items: [{ id: "overview", label: "Genel bakış", icon: <LayoutDashboard size={18} /> }] },
    { group: "İçerik", items: [
      { id: "vehicles", label: "Araç ilanları", icon: <Car size={18} /> },
      { id: "blog", label: "Blog ve paylaşımlar", icon: <FileText size={18} /> },
    ] },
    { group: "Gelir", items: [{ id: "ads", label: "Reklam alanları", icon: <Megaphone size={18} /> }] },
    { group: "Topluluk ve ayarlar", items: [
      { id: "notifications", label: "Bildirimler", icon: <Bell size={18} />, badge: unreadCount },
      { id: "complaints", label: "İlan şikayetleri", icon: <Flag size={18} />, badge: complaints.filter((item) => item.status === "open").length },
      { id: "messages", label: "Ziyaretçi mesajları", icon: <MessageSquareText size={18} />, badge: messages.filter((item) => !item.read).length },
      { id: "links", label: "Site bağlantıları", icon: <Link2 size={18} /> },
    ] },
  ];

  const topAction = tab === "vehicles" && !vehicle ? { label: "Yeni ilan", run: () => setVehicle({ ...emptyVehicle }) }
    : tab === "blog" && !post ? { label: "Yeni yazı", run: () => setPost({ ...emptyPost }) }
    : tab === "ads" && !ad ? { label: "Yeni reklam", run: () => setAd({ ...emptyAdDraft }) }
    : null;

  const setupSteps = [
    { done: publishedCount > 0, label: "İlk araç ilanını yayınlayın", tab: "vehicles" as const },
    { done: posts.some((item) => item.published), label: "İlk blog yazınızı yayınlayın", tab: "blog" as const },
    { done: Boolean(links.instagram || links.facebook || links.youtube || links.arabam), label: "Sosyal medya ve arabam.com bağlantılarını ekleyin", tab: "links" as const },
    { done: liveAds.length > 0, label: "İlk sponsor reklamını yayına alın", tab: "ads" as const },
  ];

  return (
    <div className="adm">
      {navOpen ? <button className="adm-overlay" aria-label="Menüyü kapat" onClick={() => setNavOpen(false)} /> : null}
      <aside className={navOpen ? "adm-side is-open" : "adm-side"}>
        <div className="adm-brand"><span className="adm-brand-mark">TM</span><div><b>TML MOTORS</b><small>Yönetim paneli</small></div></div>
        <nav className="adm-nav" aria-label="Yönetim bölümleri">
          {navigation.map((section) => (
            <div key={section.group}>
              <span className="adm-nav-label">{section.group}</span>
              {section.items.map((item) => (
                <button key={item.id} className={tab === item.id ? "adm-nav-item is-active" : "adm-nav-item"} aria-current={tab === item.id ? "page" : undefined} onClick={() => goTo(item.id)}>
                  {item.icon}<span>{item.label}</span>
                  {item.badge ? <span className="adm-count">{item.badge > 99 ? "99+" : item.badge}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <div className="adm-user"><span className="adm-avatar">{(user.email ?? "A").slice(0, 1).toLocaleUpperCase("tr-TR")}</span><small>{user.email}</small></div>
          <Link className="adm-nav-item" href="/" target="_blank"><ExternalLink size={18} /><span>Siteyi görüntüle</span></Link>
          <button className="adm-nav-item" onClick={async () => { await signOut(getFirebaseAuth()); }}><LogOut size={18} /><span>Güvenli çıkış</span></button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <button className="adm-menu-btn" aria-label="Menüyü aç" onClick={() => setNavOpen(true)}><Menu size={20} /></button>
          <div className="adm-top-title"><h1>{tabMeta[tab].title}</h1><p>{tabMeta[tab].subtitle}</p></div>
          <div className="adm-top-actions">
            <button className="adm-bell" aria-label="Bildirimler" onClick={() => goTo("notifications")}><Bell size={18} />{unreadCount ? <span>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</button>
            {topAction ? <button className="adm-btn primary" onClick={topAction.run}><Plus size={16} /> {topAction.label}</button> : null}
          </div>
        </header>

        <div className="adm-content">
          {errorMessage ? <div className="adm-alert is-error" role="alert">{errorMessage}</div> : null}
          {successMessage ? <div className="adm-alert is-success" role="status"><Check size={16} /> {successMessage}</div> : null}

          {tab === "overview" ? (
            <div className="adm-stack">
              <section className="adm-welcome">
                <div><span className="adm-eyebrow">HOŞ GELDİNİZ</span><h2>TML MOTORS yönetim merkezi</h2><p>{new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
                <div className="adm-welcome-actions">
                  <button className="adm-btn gold" onClick={() => { goTo("vehicles"); setVehicle({ ...emptyVehicle }); }}><Plus size={16} /> Yeni ilan</button>
                  <button className="adm-btn light" onClick={() => { goTo("blog"); setPost({ ...emptyPost }); }}><FileText size={16} /> Yeni yazı</button>
                  <button className="adm-btn light" onClick={() => { goTo("ads"); setAd({ ...emptyAdDraft }); }}><Megaphone size={16} /> Yeni reklam</button>
                </div>
              </section>

              <div className="adm-stats">
                <Stat icon={<Car size={18} />} label="Yayındaki ilan" value={publishedCount} />
                <Stat icon={<Pencil size={18} />} label="Taslak ilan" value={vehicles.filter((item) => item.status === "draft").length} />
                <Stat icon={<FileText size={18} />} label="Blog yazısı" value={posts.length} />
                <Stat icon={<Megaphone size={18} />} label="Yayındaki reklam" value={liveAds.length} hint={`${adPlacements.length} konumdan ${new Set(liveAds.flatMap((item) => item.placements)).size} tanesi dolu`} />
                <Stat icon={<MousePointerClick size={18} />} label="Reklam tıklaması" value={totalClicks} />
                <Stat icon={<Bell size={18} />} label="Okunmamış bildirim" value={unreadCount} />
              </div>

              <div className="adm-two">
                <section className="adm-card">
                  <header className="adm-card-head"><div><h2>Son ilanlar</h2></div><button className="adm-btn ghost sm" onClick={() => goTo("vehicles")}>Tümü <ArrowRight size={14} /></button></header>
                  {vehicles.length ? <div className="adm-mini-list">{vehicles.slice(0, 5).map((item) => (
                    <button key={item.id} className="adm-mini" onClick={() => { goTo("vehicles"); setVehicle(item); }}>
                      <Thumb url={item.imageUrls?.[0]} />
                      <span><b>{item.title || `${item.brand} ${item.model}`}</b><small>{item.year} · {item.mileage?.toLocaleString("tr-TR")} km</small></span>
                      <span className={`adm-pill ${statusTones[item.status]}`}>{statusLabels[item.status]}</span>
                    </button>
                  ))}</div> : <p className="adm-empty-text">Henüz ilan yok. İlk aracınızı ekleyin.</p>}
                </section>
                <section className="adm-card">
                  <header className="adm-card-head"><div><h2>Yayına hazırlık</h2><p>{setupSteps.filter((step) => step.done).length} / {setupSteps.length} adım tamamlandı</p></div></header>
                  <ul className="adm-checklist">{setupSteps.map((step) => (
                    <li key={step.label} className={step.done ? "is-done" : ""}><span>{step.done ? <Check size={14} /> : null}</span><b>{step.label}</b>{step.done ? null : <button className="adm-btn ghost sm" onClick={() => goTo(step.tab)}>Başla</button>}</li>
                  ))}</ul>
                </section>
              </div>

              <section className="adm-card">
                <header className="adm-card-head"><div><h2>Son bildirimler</h2></div><button className="adm-btn ghost sm" onClick={() => goTo("notifications")}>Tümü <ArrowRight size={14} /></button></header>
                {notifications.length ? <div className="adm-mini-list">{notifications.slice(0, 4).map((item) => (
                  <div key={item.id} className="adm-mini is-static">
                    <span className={item.type === "like" ? "adm-ico like" : "adm-ico save"}>{item.type === "like" ? <Heart size={15} /> : <Bookmark size={15} />}</span>
                    <span><b>{item.userName} {item.type === "like" ? "beğendi" : "kaydetti"}</b><small>{item.postTitle}</small></span>
                    {!item.read ? <span className="adm-pill blue">Yeni</span> : null}
                  </div>
                ))}</div> : <p className="adm-empty-text">Henüz etkileşim yok.</p>}
              </section>
            </div>
          ) : null}

          {tab === "vehicles" ? (
            <section className="adm-card">
              <div className="adm-toolbar">
                <label className="adm-search"><Search size={16} /><input type="search" value={vehicleQuery} onChange={(event) => setVehicleQuery(event.target.value)} placeholder="Marka, model veya başlık ara" /></label>
                <div className="adm-chips">{([["all", "Tümü"], ["published", "Yayında"], ["draft", "Taslak"], ["sold", "Satıldı"]] as const).map(([key, label]) => (
                  <button key={key} className={vehicleFilter === key ? "adm-chip is-active" : "adm-chip"} onClick={() => setVehicleFilter(key)}>{label} <b>{key === "all" ? vehicles.length : vehicles.filter((item) => item.status === key).length}</b></button>
                ))}</div>
              </div>
              {filteredVehicles.length ? <div className="adm-rows">{filteredVehicles.map((item) => (
                <article className="adm-row" key={item.id}>
                  <Thumb url={item.imageUrls?.[0]} large />
                  <div className="adm-row-info">
                    <div className="adm-row-title"><b>{item.title || `${item.brand} ${item.model}`}</b>{item.featured ? <span className="adm-pill gold"><Star size={11} /> Öne çıkan</span> : null}</div>
                    <small>{item.year} · {item.mileage?.toLocaleString("tr-TR")} km · {item.fuel || "Yakıt belirtilmemiş"} · {item.price ? `${item.price.toLocaleString("tr-TR")} TL` : "Fiyat için arayın"}</small>
                  </div>
                  <span className={`adm-pill ${statusTones[item.status]}`}>{statusLabels[item.status]}</span>
                  <div className="adm-row-actions">
                    {item.status === "published" ? <Link className="adm-icon-btn" href={`/araclar/${item.id}`} target="_blank" aria-label="Sitede görüntüle"><Eye size={16} /></Link> : null}
                    <button className="adm-btn ghost sm" onClick={() => setVehicle(item)}><Pencil size={14} /> Düzenle</button>
                    <button className="adm-icon-btn danger" aria-label="İlanı sil" onClick={() => void deleteVehicle(item.id)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}</div> : <div className="adm-empty"><Car size={28} /><h3>{vehicles.length ? "Aramanızla eşleşen ilan yok" : "Henüz araç ilanı yok"}</h3><p>{vehicles.length ? "Arama ya da filtreyi değiştirin." : "İlk ilanınızı ekleyerek envanterinizi oluşturmaya başlayın."}</p>{vehicles.length ? null : <button className="adm-btn primary" onClick={() => setVehicle({ ...emptyVehicle })}><Plus size={16} /> İlk ilanı ekle</button>}</div>}
            </section>
          ) : null}

          {tab === "vehicles" && vehicle ? (
            <EditorSheet title={vehicle.id ? "İlanı düzenle" : "Yeni araç ilanı"} subtitle={vehicle.id ? vehicle.title || `${vehicle.brand} ${vehicle.model}` : "Bilgileri doldurun, işiniz bitince kaydedin."} onClose={() => setVehicle(null)} error={errorMessage} success={successMessage}
              primaryAction={<button className="adm-btn primary" onClick={() => void saveVehicle()} disabled={saving || uploading}><Save size={16} /> {saving ? "Kaydediliyor..." : vehicle.id ? "İlanı güncelle" : "İlanı kaydet"}</button>}>
            <div className="adm-stack adm-narrow">
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">1</span><h2>Marka ve model</h2><p>Marka listeden seçilir; model, seri ve paket bilgilerini kendiniz yazın.</p></div></header>
                <div className="adm-grid">
                  <label className="adm-field">Marka<select value={vehicle.brand} onChange={(event) => setVehicle({ ...vehicle, brand: event.target.value })}><option value="">Marka seçin</option>{vehicle.brand && !selectedMake ? <option value={vehicle.brand}>{vehicle.brand}</option> : null}{vehicleCatalog.makes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
                  <Field label="Model" placeholder="Örn. Golf" value={vehicle.model} onChange={(value) => setVehicle({ ...vehicle, model: value })} />
                  <Field label="Seri" placeholder="Örn. 1.4 TSI" value={vehicle.series ?? ""} onChange={(value) => setVehicle({ ...vehicle, series: value })} />
                  <Field label="Paket" placeholder="Örn. Highline" value={vehicle.trim ?? ""} onChange={(value) => setVehicle({ ...vehicle, trim: value })} />
                  <Field label="Alt paket" placeholder="Örn. Cam tavan" value={vehicle.subTrim ?? ""} onChange={(value) => setVehicle({ ...vehicle, subTrim: value })} />
                </div>
              </section>
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">2</span><h2>İlan bilgileri</h2></div></header>
                <div className="adm-grid">
                  <Field label="İlan başlığı (boşsa marka-model kullanılır)" value={vehicle.title} onChange={(value) => setVehicle({ ...vehicle, title: value })} />
                  <Field label="Model yılı" type="number" value={String(vehicle.year)} onChange={(value) => setVehicle({ ...vehicle, year: Number(value) })} />
                  <Field label="Kilometre" type="number" value={String(vehicle.mileage)} onChange={(value) => setVehicle({ ...vehicle, mileage: Number(value) })} />
                  <Field label="Fiyat (TL) — boşsa telefonla bilgi" type="number" value={vehicle.price === null ? "" : String(vehicle.price)} onChange={(value) => setVehicle({ ...vehicle, price: value ? Number(value) : null })} />
                  <Field label="Sahibinden.com ilan linki (isteğe bağlı)" placeholder="https://www.sahibinden.com/ilan/..." value={vehicle.sahibindenUrl ?? ""} onChange={(value) => setVehicle({ ...vehicle, sahibindenUrl: value })} />
                </div>
              </section>
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">3</span><h2>Teknik özellikler</h2></div></header>
                <div className="adm-grid">
                  <Select label="Yakıt" value={vehicle.fuel} options={fuelOptions} onChange={(value) => setVehicle({ ...vehicle, fuel: value })} />
                  <Select label="Vites" value={vehicle.transmission} options={transmissionOptions} onChange={(value) => setVehicle({ ...vehicle, transmission: value })} />
                  <Select label="Kasa tipi" value={vehicle.bodyType} options={bodyTypeOptions} onChange={(value) => setVehicle({ ...vehicle, bodyType: value })} />
                  <Select label="Çekiş" value={vehicle.drive ?? ""} options={driveOptions} onChange={(value) => setVehicle({ ...vehicle, drive: value })} />
                  <Field label="Renk" placeholder="Örn. Gri (Metalik)" value={vehicle.color} onChange={(value) => setVehicle({ ...vehicle, color: value })} />
                  <Field label="Motor hacmi (cc)" placeholder="Örn. 1598" value={vehicle.engineVolume ?? ""} onChange={(value) => setVehicle({ ...vehicle, engineVolume: value })} />
                  <Field label="Motor gücü (hp)" placeholder="Örn. 110" value={vehicle.enginePower ?? ""} onChange={(value) => setVehicle({ ...vehicle, enginePower: value })} />
                </div>
              </section>
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">4</span><h2>Donanım özellikleri</h2><p>Araçta bulunan özellikleri işaretleyin; her grup için ek not girebilirsiniz. İşaretlemedikleriniz ilanda soluk gösterilir.</p></div></header>
                <div className="adm-feature-groups">
                  {featureGroupKeys.map((group) => (
                    <fieldset className="adm-feature-group" key={group}>
                      <legend>{featureGroupLabels[group]}{vehicle.features?.[group]?.length ? <span className="adm-count">{vehicle.features[group]!.length}</span> : null}</legend>
                      <div className="adm-feature-options">
                        {featureCatalog[group].map((option) => {
                          const checked = (vehicle.features?.[group] ?? []).includes(option);
                          return (
                            <label key={option} className={checked ? "adm-feature is-selected" : "adm-feature"}>
                              <input type="checkbox" checked={checked} onChange={(event) => toggleVehicleFeature(group, option, event.target.checked)} />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                      <input
                        className="adm-feature-note"
                        type="text"
                        placeholder={`${featureGroupLabels[group]} için ek not (isteğe bağlı)`}
                        value={vehicle.featureNotes?.[group] ?? ""}
                        onChange={(event) => setVehicleFeatureNote(group, event.target.value)}
                      />
                    </fieldset>
                  ))}
                </div>
              </section>
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">5</span><h2>Satış koşulları</h2></div></header>
                <div className="adm-grid">
                  <label className="adm-field">Araç durumu<select value={vehicle.vehicleCondition ?? "İkinci El"} onChange={(event) => setVehicle({ ...vehicle, vehicleCondition: event.target.value })}><option>İkinci El</option><option>Sıfır</option></select></label>
                  <label className="adm-field">Kimden<select value={vehicle.from ?? "Galeriden"} onChange={(event) => setVehicle({ ...vehicle, from: event.target.value })}><option>Galeriden</option><option>Sahibinden</option></select></label>
                  <label className="adm-check"><input type="checkbox" checked={vehicle.trade ?? false} onChange={(event) => setVehicle({ ...vehicle, trade: event.target.checked })} /> Takas değerlendirilir</label>
                </div>
              </section>
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">6</span><h2>Açıklama</h2></div></header>
                <label className="adm-field">Araç hakkında açıklama<textarea rows={6} value={vehicle.description} onChange={(event) => setVehicle({ ...vehicle, description: event.target.value })} /></label>
              </section>
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">7</span><h2>Boya, değişen ve lastik bilgisi</h2><p>Yalnızca kontrol edilmiş ve doğru olduğundan emin olduğunuz parçaları işaretleyin. Lastiklere tıklayıp ebat ve durum bilgisi girebilirsiniz.</p></div></header>
                <VehicleDamageMap
                  value={vehicle.damageParts ?? []}
                  onChange={(damageParts: VehicleDamagePart[]) => setVehicle({ ...vehicle, damageParts })}
                  tires={vehicle.tires ?? []}
                  onTiresChange={(tires: VehicleTire[]) => setVehicle({ ...vehicle, tires })}
                />
              </section>
              <section className="adm-card">
                <header className="adm-card-head"><div><span className="adm-step">8</span><h2>Yayın ve fotoğraflar</h2></div></header>
                <div className="adm-grid">
                  <label className="adm-field">İlan durumu<select value={vehicle.status} onChange={(event) => setVehicle({ ...vehicle, status: event.target.value as ListingStatus })}><option value="draft">Taslak</option><option value="published">Yayında</option><option value="sold">Satıldı</option></select></label>
                  <label className="adm-check"><input type="checkbox" checked={vehicle.featured} onChange={(event) => setVehicle({ ...vehicle, featured: event.target.checked })} /> Ana sayfada öne çıkar</label>
                </div>
                <div className="adm-field">Araç fotoğrafları <small className="adm-hint">En fazla 20 fotoğraf, her biri en fazla 8 MB.</small>
                  <span className="adm-upload"><ImagePlus size={22} />{uploading ? "Görseller yükleniyor..." : "Fotoğrafları seçin"}<input type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => { void handleVehicleImages(event.target.files); event.target.value = ""; }} /></span>
                </div>
                {vehicle.imageUrls.length ? <div className="adm-thumbs">{vehicle.imageUrls.map((url, index) => (
                  <div key={url} className="adm-thumb-item"><img src={url} alt="Araç fotoğrafı" />{index === 0 ? <span className="adm-cover-tag">Kapak</span> : null}<button type="button" aria-label="Görseli kaldır" onClick={() => setVehicle({ ...vehicle, imageUrls: vehicle.imageUrls.filter((item) => item !== url) })}><X size={14} /></button></div>
                ))}</div> : <p className="adm-hint">Yayındaki ilanlarda araç fotoğrafı kullanmanız önerilir. İlk fotoğraf kapak olarak gösterilir.</p>}
              </section>
            </div>
            </EditorSheet>
          ) : null}

          {tab === "blog" ? (
            <section className="adm-card">
              {posts.length ? <div className="adm-rows">{posts.map((item) => (
                <article className="adm-row" key={item.id}>
                  <Thumb url={item.coverImageUrl} large />
                  <div className="adm-row-info"><div className="adm-row-title"><b>{item.title}</b></div><small>{item.excerpt || "Özet girilmemiş"}</small></div>
                  <span className={`adm-pill ${item.published ? "green" : "amber"}`}>{item.published ? "Yayında" : "Taslak"}</span>
                  <div className="adm-row-actions">
                    <button className="adm-btn ghost sm" onClick={() => void loadPostEngagement(item)}><Heart size={14} /> Etkileşim</button>
                    <button className="adm-btn ghost sm" onClick={() => setPost(item)}><Pencil size={14} /> Düzenle</button>
                    <button className="adm-icon-btn danger" aria-label="Yazıyı sil" onClick={() => void deletePost(item.id)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}</div> : <div className="adm-empty"><FileText size={28} /><h3>Henüz blog yazısı yok</h3><p>Araçlar ve tecrübelerinizle ilgili ilk yazınızı paylaşın; en güncel yazı ana sayfada görünür.</p><button className="adm-btn primary" onClick={() => setPost({ ...emptyPost })}><Plus size={16} /> İlk yazıyı ekle</button></div>}
              {loadingEngagement ? <p className="adm-hint">Etkileşimler yükleniyor...</p> : null}
              {postEngagement ? <div className="adm-engagement">
                <div className="adm-card-head"><div><h2>{engagementPostTitle}</h2><p>Gönderi etkileşimleri</p></div><button className="adm-btn ghost sm" onClick={() => setPostEngagement(null)}>Kapat</button></div>
                <div className="adm-two">
                  <InteractionList icon={<Heart size={15} />} title="Beğenenler" count={postEngagement.likes.count} users={postEngagement.likes.users} />
                  <InteractionList icon={<Bookmark size={15} />} title="Kaydedenler" count={postEngagement.saves.count} users={postEngagement.saves.users} />
                </div>
              </div> : null}
            </section>
          ) : null}

          {tab === "blog" && post ? (
            <EditorSheet title={post.id ? "Yazıyı düzenle" : "Yeni blog yazısı"} subtitle={post.id ? post.title : "Yazınızı hazırlayın, işiniz bitince kaydedin."} onClose={() => setPost(null)} error={errorMessage} success={successMessage}
              primaryAction={<button className="adm-btn primary" onClick={() => void savePost()} disabled={saving || uploading}><Save size={16} /> {saving ? "Kaydediliyor..." : "Yazıyı kaydet"}</button>}>
            <div className="adm-stack adm-narrow">
              <section className="adm-card">
                <div className="adm-grid">
                  <Field label="Başlık" value={post.title} onChange={(value) => setPost({ ...post, title: value, slug: post.id ? post.slug : post.slug || slugify(value) })} />
                  <Field label="URL bağlantısı" value={post.slug} onChange={(value) => setPost({ ...post, slug: slugify(value) })} />
                </div>
                <Field label="Kısa özet" value={post.excerpt} onChange={(value) => setPost({ ...post, excerpt: value })} />
                <div className="adm-field">Kapak fotoğrafı
                  {post.coverImageUrl ? <span className="adm-image-preview"><img src={post.coverImageUrl} alt="Kapak" /><button type="button" className="adm-icon-btn danger" aria-label="Kapağı kaldır" onClick={() => setPost({ ...post, coverImageUrl: "" })}><X size={16} /></button></span>
                    : <span className="adm-upload"><ImagePlus size={22} />{uploading ? "Görsel yükleniyor..." : "Kapak fotoğrafı seçin"}<input type="file" accept="image/*" disabled={uploading} onChange={(event) => { void handleBlogCover(event.target.files?.[0]); event.target.value = ""; }} /></span>}
                </div>
                <div className="adm-field">Yazı içeriği
                  <BlogEditor value={post.content} onChange={(content) => setPost({ ...post, content })} onUpload={(file) => runUpload(file, "blog")} uploading={uploading} />
                </div>
                <label className="adm-check"><input type="checkbox" checked={post.published} onChange={(event) => setPost({ ...post, published: event.target.checked })} /> Yazıyı yayımla</label>
              </section>
            </div>
            </EditorSheet>
          ) : null}

          {tab === "ads" ? (
            <div className="adm-ads">
              <AdManager error={errorMessage} success={successMessage} ads={ads} draft={ad} setDraft={setAd} saving={saving} uploading={uploading} onSave={(draft) => void saveAd(draft)} onDelete={(id) => void deleteAd(id)} onUpload={(file) => runUpload(file, "ads")} />
            </div>
          ) : null}

          {tab === "notifications" ? (
            <section className="adm-card">
              <header className="adm-card-head"><div><h2>Etkileşimler <small>{unreadCount} okunmamış</small></h2></div><button className="adm-btn ghost sm" onClick={() => void refresh()}>Yenile</button></header>
              {notifications.length ? <div className="adm-rows">{notifications.map((item) => (
                <article className={item.read ? "adm-row is-read" : "adm-row"} key={item.id}>
                  <span className={item.type === "like" ? "adm-ico like" : "adm-ico save"}>{item.type === "like" ? <Heart size={17} /> : <Bookmark size={17} />}</span>
                  <div className="adm-row-info">
                    <div className="adm-row-title"><b>{item.userName} {item.type === "like" ? "beğendi" : "kaydetti"}</b></div>
                    <small><Link href={`/blog/${item.postSlug}`} target="_blank">{item.postTitle}</Link> · {item.userEmail || "Üye hesabı"} · {item.createdAt ? new Date(item.createdAt).toLocaleString("tr-TR") : "Az önce"}</small>
                  </div>
                  {!item.read ? <button className="adm-btn ghost sm" onClick={() => void markNotificationRead(item.id)}>Okundu işaretle</button> : <span className="adm-pill gray">Okundu</span>}
                </article>
              ))}</div> : <div className="adm-empty"><Bell size={28} /><h3>Henüz etkileşim bildirimi yok</h3><p>Paylaşımlarınız beğenilip kaydedildikçe burada görünür.</p></div>}
            </section>
          ) : null}

          {tab === "complaints" ? (
            <section className="adm-card">
              <header className="adm-card-head">
                <div><h2>İlan şikayetleri <small>{complaints.filter((item) => item.status === "open").length} yanıt bekliyor</small></h2></div>
                <button className="adm-btn ghost sm" onClick={() => void refresh()}>Yenile</button>
              </header>
              {complaints.length ? <div className="adm-rows">{complaints.map((item) => (
                <article className={item.status === "answered" ? "adm-row is-read" : "adm-row"} key={item.id}>
                  <span className={item.status === "open" ? "adm-ico complaint" : "adm-ico save"}><Flag size={17} /></span>
                  <div className="adm-row-info">
                    <div className="adm-row-title"><b>{item.vehicleTitle}</b>{item.status === "open" ? <span className="adm-pill amber">Yanıt bekliyor</span> : <span className="adm-pill green">Yanıtlandı</span>}</div>
                    <small><Link href={`/araclar/${item.vehicleId}`} target="_blank">İlanı görüntüle</Link> · {item.userName} ({item.userEmail || "e-posta yok"}) · {item.createdAt ? new Date(item.createdAt).toLocaleString("tr-TR") : ""}</small>
                    <p className="adm-complaint-message">{item.message}</p>
                    <label className="adm-field adm-complaint-reply">
                      Yanıtınız (kullanıcı profilinde görünür)
                      <textarea
                        rows={3}
                        placeholder="Örn. Geri bildiriminiz için teşekkür ederiz. Konuyu inceledik ve ilanı güncelledik..."
                        value={complaintReplies[item.id] ?? ""}
                        onChange={(event) => setComplaintReplies((current) => ({ ...current, [item.id]: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="adm-row-actions">
                    <button className="adm-btn primary sm" disabled={saving} onClick={() => void replyComplaint(item.id)}><Check size={14} /> {item.status === "answered" ? "Yanıtı güncelle" : "Yanıtla"}</button>
                    <button className="adm-icon-btn danger" aria-label="Şikayeti sil" onClick={() => void deleteComplaint(item.id)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}</div> : <div className="adm-empty"><Flag size={28} /><h3>Henüz şikayet yok</h3><p>Ziyaretçiler ilanlarınızla ilgili şikayet ilettiğinde burada görünür.</p></div>}
            </section>
          ) : null}

          {tab === "messages" ? (
            <section className="adm-card">
              <header className="adm-card-head">
                <div><h2>Ziyaretçi mesajları <small>{messages.filter((item) => !item.read).length} okunmamış</small></h2></div>
                <button className="adm-btn ghost sm" onClick={() => void refresh()}>Yenile</button>
              </header>
              {messages.length ? <div className="adm-rows">{messages.map((item) => (
                <article className={item.read ? "adm-row is-read" : "adm-row"} key={item.id}>
                  <span className="adm-ico message"><MessageSquareText size={17} /></span>
                  <div className="adm-row-info">
                    <div className="adm-row-title"><b>{item.name}</b>{!item.read ? <span className="adm-pill blue">Yeni</span> : <span className="adm-pill gray">Okundu</span>}</div>
                    <small><a href={`mailto:${item.email}`}>{item.email}</a>{item.phone ? ` · ${item.phone}` : ""} · {item.createdAt ? new Date(item.createdAt).toLocaleString("tr-TR") : ""}</small>
                    <p className="adm-complaint-message">{item.message}</p>
                  </div>
                  <div className="adm-row-actions">
                    {!item.read ? <button className="adm-btn ghost sm" onClick={() => void markMessageRead(item.id)}>Okundu işaretle</button> : null}
                    <button className="adm-icon-btn danger" aria-label="Mesajı sil" onClick={() => void deleteMessage(item.id)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}</div> : <div className="adm-empty"><MessageSquareText size={28} /><h3>Henüz mesaj yok</h3><p>İletişim sayfasındaki formdan gönderilen dilek ve öneriler burada görünür.</p></div>}
            </section>
          ) : null}

          {tab === "links" ? (
            <div className="adm-stack adm-narrow">
              <section className="adm-card">
                <header className="adm-card-head"><div><h2>Sosyal medya ve ilan profilleri</h2><p>Bu bağlantılar sitenin alt bölümünde ikonlarla gösterilir.</p></div></header>
                <div className="adm-grid">
                  {(Object.keys(links) as (keyof Links)[]).map((key) => <Field key={key} label={{ instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", arabam: "arabam.com", sahibinden: "sahibinden.com" }[key]} placeholder="https://" value={links[key]} onChange={(value) => setLinks({ ...links, [key]: value })} />)}
                </div>
              </section>
              <div className="adm-save-bar"><button className="adm-btn primary" onClick={() => void saveLinks()} disabled={saving}><Save size={16} /> {saving ? "Kaydediliyor..." : "Bağlantıları kaydet"}</button></div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint?: string }) {
  return <div className="adm-stat"><i>{icon}</i><span>{label}</span><b>{value.toLocaleString("tr-TR")}</b>{hint ? <small>{hint}</small> : null}</div>;
}

function Thumb({ url, large = false }: { url?: string; large?: boolean }) {
  return <span className={large ? "adm-thumb large" : "adm-thumb"}>{url ? <img src={url} alt="" /> : <Car size={large ? 22 : 16} />}</span>;
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="adm-field">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="adm-field">{label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Seçin</option>
        {value && !options.includes(value) ? <option value={value}>{value}</option> : null}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function InteractionList({ icon, title, count, users }: { icon: React.ReactNode; title: string; count: number; users: InteractionUser[] }) {
  return (
    <section className="adm-interactions">
      <h4>{icon}{title}<span>{count}</span></h4>
      {users.length ? <ul>{users.map((item) => (
        <li key={item.id}>
          <span className="adm-avatar sm">{item.name.trim().slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
          <span><b>{item.name}</b><small>{item.email || "E-posta paylaşılmamış"}</small></span>
          <time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("tr-TR") : "—"}</time>
        </li>
      ))}</ul> : <p>Henüz etkileşim bulunmuyor.</p>}
    </section>
  );
}

function AdminMessage({ title, message, link }: { title: string; message: string; link?: string }) {
  return (
    <section className="adm-gate"><div className="adm-gate-card">
      <span className="adm-brand-mark">TM</span><span className="adm-eyebrow">TML MOTORS · YÖNETİM</span><h1>{title}</h1>
      <p>{message}</p>
      <Link className="adm-btn primary" href={link ?? "/"}>{link ? "Giriş sayfasına git" : "Ana sayfaya dön"} <ArrowRight size={15} /></Link>
    </div></section>
  );
}
