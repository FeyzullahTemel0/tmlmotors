"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, BadgeCheck, CarFront, CircleCheck, ExternalLink, Flag, Fuel, Gauge, MapPin, Palette, Phone, Settings2, ShieldAlert, X } from "lucide-react";
import { CompareButton, FavoriteButton } from "@/components/vehicle-actions";
import { formatMileage, type Vehicle } from "@/lib/vehicle-types";
import { VehicleDamageMap } from "@/components/vehicle-damage-map";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { VehicleFeatureList } from "@/components/vehicle-feature-list";
import { Loading } from "@/components/loading";
import { ShareMenu } from "@/components/share-menu";
import { AdSlot } from "@/components/ad-slot";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { usePreferences } from "@/lib/i18n/preferences-context";

type DetailTab = "description" | "specs" | "damage";
const phone = "+905535781136";

export default function VehicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>("description");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintSending, setComplaintSending] = useState(false);
  const [complaintError, setComplaintError] = useState("");
  const [complaintDone, setComplaintDone] = useState(false);
  const { formatPrice, t } = usePreferences();
  const router = useRouter();

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), (nextUser) => { setAuthUser(nextUser); setAuthReady(true); }), []);

  const viewedId = vehicle?.id;
  useEffect(() => {
    if (!viewedId || !authReady) return;
    const sessionKey = `tml-viewed-${viewedId}`;
    if (window.sessionStorage.getItem(sessionKey)) return;
    window.sessionStorage.setItem(sessionKey, "1");
    let visitorId = window.localStorage.getItem("tml-visitor");
    if (!visitorId) {
      visitorId = (window.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g, "");
      window.localStorage.setItem("tml-visitor", visitorId);
    }
    void (async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (authUser) headers.Authorization = `Bearer ${await authUser.getIdToken()}`;
        await fetch(`/api/vehicles/${encodeURIComponent(viewedId)}/view`, { method: "POST", headers, body: JSON.stringify({ visitorId }), keepalive: true });
      } catch {
        // Görüntülenme sayımı kullanıcı deneyimini etkilememelidir.
      }
    })();
  }, [viewedId, authReady, authUser]);

  useEffect(() => {
    let mounted = true;
    void params.then(async ({ slug }) => {
      try {
        const response = await fetch(`/api/vehicles/${encodeURIComponent(slug)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Araç ilanı alınamadı.");
        if (mounted) setVehicle(data.vehicle as Vehicle);
      } catch (error) {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : "İlan yüklenemedi.");
      } finally {
        if (mounted) setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [params]);

  const images = useMemo(() => vehicle?.imageUrls ?? [], [vehicle]);

  function openComplaint() {
    if (!authUser) {
      router.push("/giris");
      return;
    }
    setComplaintError("");
    setComplaintOpen(true);
  }

  async function submitComplaint() {
    if (!authUser || !vehicle) return;
    setComplaintSending(true);
    setComplaintError("");
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${await authUser.getIdToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: vehicle.id, message: complaintMessage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Şikayetiniz iletilemedi.");
      setComplaintDone(true);
      setComplaintOpen(false);
      setComplaintMessage("");
      window.setTimeout(() => setComplaintDone(false), 6000);
    } catch (error) {
      setComplaintError(error instanceof Error ? error.message : "Şikayetiniz iletilemedi.");
    } finally {
      setComplaintSending(false);
    }
  }

  if (loading) return <section className="listing-section"><div className="container"><Loading label={t("loadingListing")} /></div></section>;
  if (!vehicle) return <section className="listing-section"><div className="container catalog-state catalog-error">{errorMessage || t("listingNotFound")}<p><Link href="/araclar">{t("backToListings")}</Link></p></div></section>;

  const vehicleName = vehicle.title || [vehicle.brand, vehicle.series, vehicle.model, vehicle.trim, vehicle.subTrim].filter(Boolean).join(" ");
  const keySpecs = [
    { icon: CarFront, label: t("keyBrandModel"), value: [vehicle.brand, vehicle.series, vehicle.model].filter(Boolean).join(" ") },
    { icon: Gauge, label: t("specKm"), value: formatMileage(vehicle.mileage) },
    { icon: Settings2, label: t("specTransmission"), value: vehicle.transmission || "—" },
    { icon: Fuel, label: t("specFuel"), value: vehicle.fuel || "—" },
    { icon: Palette, label: t("specColor"), value: vehicle.color || "—" },
  ];
  const specifications = [
    [t("specBrand"), vehicle.brand], [t("specSeries"), vehicle.series], [t("specModel"), vehicle.model], [t("specTrim"), vehicle.trim],
    [t("specSubTrim"), vehicle.subTrim], [t("specYear"), String(vehicle.year)], [t("specKm"), formatMileage(vehicle.mileage)],
    [t("specFuel"), vehicle.fuel], [t("specTransmission"), vehicle.transmission], [t("specBody"), vehicle.bodyType],
    [t("specEngineVol"), vehicle.engineVolume], [t("specEnginePower"), vehicle.enginePower], [t("specDrive"), vehicle.drive],
    [t("specColor"), vehicle.color], [t("specCondition"), vehicle.vehicleCondition], [t("specFrom"), vehicle.from],
    [t("specTrade"), vehicle.trade ? t("yes") : t("no")],
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0);
  const hasDamageInfo = (vehicle.damageParts ?? []).some((part) => part.status !== "original");

  return (
    <section className="vd-page">
      <div className="container">
        <div className="vd-topline">
          <Link href={vehicle.heavyDamage ? "/hasarli-araclar" : "/araclar"} className="text-link"><ArrowLeft size={14} /> {vehicle.heavyDamage ? "Hasarlı araçlar" : t("allVehicles")}</Link>
          <div className="vd-topline-actions">
            <ShareMenu title={vehicleName} className="inline-control" label={t("shareListing")} />
            <button type="button" className="inline-control vd-report" aria-label={t("complaintLink")} title={t("complaintLink")} onClick={openComplaint}>
              <Flag size={14} /> <span className="vd-report-label">{t("complaintLink")}</span>
            </button>
          </div>
        </div>

        <header className="vd-header">
          <div className="vd-title-row">
            <span className="vd-chip">{vehicle.heavyDamage ? "AĞIR HASARLI" : vehicle.featured ? "TML MOTORS SEÇKİSİ" : "TML MOTORS İLANI"}</span>
            <h1>{vehicleName}</h1>
          </div>
          <div className="vd-meta">
            <span><MapPin size={14} /> Gaziantep · Günsev Oto AVM</span>
            <span><CircleCheck size={14} /> {t("licenseLabel")}: 2701072</span>
          </div>
          <div className="vd-collection-actions"><FavoriteButton vehicleId={vehicle.id} variant="full" /><CompareButton vehicleId={vehicle.id} variant="full" /></div>
          {vehicle.heavyDamage ? <div className="damaged-info"><ShieldAlert size={20} aria-hidden="true" /><p><b>Ağır hasar kayıtlı araç.</b> Hasar bilgileri bu ilanda açıkça gösterilmiştir. Satın almadan önce aracı ekspertizde görmenizi ve hasar detaylarını bizimle birlikte incelemenizi öneririz.</p></div> : null}
        </header>

        <div className="vd-layout">
          <div className="vd-main">
            <VehicleGallery images={images} vehicleName={vehicleName} />

            <div className="vd-tabs" role="tablist" aria-label="İlan detayları">
              <button type="button" role="tab" aria-selected={tab === "description"} className={tab === "description" ? "vd-tab is-active" : "vd-tab"} onClick={() => setTab("description")}>{t("tabDescription")}</button>
              <button type="button" role="tab" aria-selected={tab === "specs"} className={tab === "specs" ? "vd-tab is-active" : "vd-tab"} onClick={() => setTab("specs")}>{t("tabSpecs")}</button>
              <button type="button" role="tab" aria-selected={tab === "damage"} className={tab === "damage" ? "vd-tab is-active" : "vd-tab"} onClick={() => setTab("damage")}>{t("tabDamage")}</button>
            </div>

            <div className="vd-panel">
              {tab === "description" ? (
                <p className="vd-description">{vehicle.description || t("descFallback")}</p>
              ) : null}
              {tab === "specs" ? (
                <>
                  <dl className="vd-spec-table">
                    {specifications.map(([label, value]) => (
                      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                    ))}
                  </dl>
                  <VehicleFeatureList features={vehicle.features} notes={vehicle.featureNotes} />
                </>
              ) : null}
              {tab === "damage" ? (
                <div className="vd-damage">
                  {!hasDamageInfo ? <p className="vd-damage-note">{t("damageNote")}</p> : null}
                  <VehicleDamageMap value={vehicle.damageParts ?? []} tires={vehicle.tires ?? []} />
                </div>
              ) : null}
            </div>
          </div>

          <aside className="vd-side">
            <div className="vd-price-box">
              <span className="vd-price-label">{t("priceLabel")}</span>
              <strong className="vd-price">{formatPrice(vehicle.price)}</strong>
              {vehicle.trade ? <span className="vd-trade">{t("tradeNote")}</span> : null}
              <div className="vd-quick-specs">
                {keySpecs.map((spec) => (
                  <div className="vd-quick-spec" key={spec.label}>
                    <spec.icon size={16} strokeWidth={1.7} />
                    <span>{spec.label}</span>
                    <b>{spec.value}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="vd-seller">
              <div className="vd-seller-head">
                <span className="vd-seller-badge"><BadgeCheck size={20} /></span>
                <div><b>TML MOTORS</b><small>{t("ownerLabel")}: Muhammed Emin TEMEL</small></div>
              </div>
              <div className="vd-seller-row"><MapPin size={15} /> Günsev Oto AVM, Gaziantep</div>
              <a className="button button-primary" href={`tel:${phone}`}><Phone size={16} /> +90 553 578 11 36</a>
              {vehicle.sahibindenUrl ? (
                <a className="vd-sahibinden-link" href={vehicle.sahibindenUrl} target="_blank" rel="noopener noreferrer">
                  <span className="vd-sahibinden-dot">sahibinden.com</span>
                  {t("sahibindenCta")} <ExternalLink size={15} />
                </a>
              ) : null}
              <small>{t("sellerCallHint")}</small>
              <small className="no-payment-note"><ShieldAlert size={13} /> TML MOTORS hiçbir hizmet için ön ödeme, kapora veya havale istemez.</small>
            </div>

            <p className="vd-note">{t("listingDisclaimer")}</p>
            <AdSlot placement="vehicle-side" />
          </aside>
        </div>

        <div className="ad-inline"><AdSlot placement="vehicle-bottom" /></div>
        {complaintDone ? (
          <p className="vd-complaint-done" role="status">{t("complaintDone")}</p>
        ) : null}
      </div>

      {complaintOpen ? (
        <div className="vd-modal-backdrop" role="presentation" onClick={() => !complaintSending && setComplaintOpen(false)}>
          <div className="vd-modal" role="dialog" aria-modal="true" aria-label={t("complaintTitle")} onClick={(event) => event.stopPropagation()}>
            <div className="vd-modal-head">
              <b><Flag size={15} /> {t("complaintTitle")}</b>
              <button type="button" className="vd-modal-close" aria-label={t("close")} onClick={() => setComplaintOpen(false)} disabled={complaintSending}><X size={16} /></button>
            </div>
            <p className="vd-modal-text">{t("complaintText").replace("{title}", vehicleName)}</p>
            <textarea
              rows={5}
              maxLength={1000}
              placeholder={t("complaintPlaceholder")}
              value={complaintMessage}
              onChange={(event) => setComplaintMessage(event.target.value)}
              disabled={complaintSending}
            />
            {complaintError ? <div className="auth-notice auth-notice-error">{complaintError}</div> : null}
            <button type="button" className="button button-primary" onClick={() => void submitComplaint()} disabled={complaintSending || complaintMessage.trim().length < 10}>
              {complaintSending ? t("complaintSending") : t("complaintSend")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="vd-sticky-call">
        <div className="vd-sticky-info"><b>{formatPrice(vehicle.price)}</b><span>{vehicleName}</span></div>
        <a className="button button-primary" href={`tel:${phone}`}><Phone size={16} /> {t("callNow")}</a>
      </div>
    </section>
  );
}
