"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BadgeCheck, Clock, Facebook, Instagram, MapPin, MessageSquareText, Phone, Send, User, Youtube } from "lucide-react";
import { usePreferences } from "@/lib/i18n/preferences-context";

type PublicLinks = { instagram?: string; facebook?: string; youtube?: string; arabam?: string; sahibinden?: string };

const mapSrc = "https://www.google.com/maps?q=G%C3%BCnsev%20Oto%20AVM%2C%20Gaziantep&output=embed";

export default function ContactPage() {
  const { t } = usePreferences();
  const [links, setLinks] = useState<PublicLinks>({ sahibinden: "https://tmlmotors.sahibinden.com" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneField, setPhoneField] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/site-settings", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && mounted) setLinks({ sahibinden: "https://tmlmotors.sahibinden.com", ...result.links });
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phoneField, message, website: honeypot }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Mesajınız iletilemedi.");
      setSent(true);
      setName(""); setEmail(""); setPhoneField(""); setMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Mesajınız iletilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="subpage-hero">
        <div className="container">
          <span className="eyebrow eyebrow-light">TML MOTORS · GAZİANTEP</span>
          <h1>{t("contactTitle")}</h1>
          <p>{t("contactSubtitle")}</p>
        </div>
      </section>

      <section className="listing-section contact-page">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <a className="contact-card" href="tel:+905535781136">
                <span className="contact-card-icon"><Phone size={20} /></span>
                <div><b>{t("contactPhone")}</b><span>+90 553 578 11 36</span><small>{t("contactPhoneHint")}</small></div>
                <ArrowUpRight size={16} />
              </a>
              <div className="contact-card">
                <span className="contact-card-icon"><MapPin size={20} /></span>
                <div><b>{t("contactAddress")}</b><span>Günsev Oto AVM, Gaziantep</span><small>Şahinbey / Gaziantep</small></div>
              </div>
              <div className="contact-card">
                <span className="contact-card-icon"><User size={20} /></span>
                <div><b>{t("contactOwner")}</b><span>Muhammed Emin TEMEL</span><small>Yetki Belge No: 2701072</small></div>
              </div>
              <div className="contact-card">
                <span className="contact-card-icon"><Clock size={20} /></span>
                <div><b>{t("contactHours")}</b><span>{t("contactHoursValue")}</span><small>{t("contactHoursHint")}</small></div>
              </div>
              <div className="contact-card">
                <span className="contact-card-icon"><BadgeCheck size={20} /></span>
                <div>
                  <b>{t("contactSocial")}</b>
                  <span className="contact-social">
                    {links.instagram ? <a href={links.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={16} /></a> : null}
                    {links.facebook ? <a href={links.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={16} /></a> : null}
                    {links.youtube ? <a href={links.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={16} /></a> : null}
                    {links.sahibinden ? <a href={links.sahibinden} target="_blank" rel="noreferrer">sahibinden.com</a> : null}
                    {links.arabam ? <a href={links.arabam} target="_blank" rel="noreferrer">arabam.com</a> : null}
                  </span>
                </div>
              </div>
            </div>

            <div className="contact-form-wrap">
              <form className="contact-form" onSubmit={submitMessage}>
                <span className="eyebrow"><MessageSquareText size={14} /> {t("contactFormEyebrow")}</span>
                <h2>{t("contactFormTitle")}</h2>
                <p>{t("contactFormText")}</p>
                <div className="contact-form-grid">
                  <label>{t("fullName")}<input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></label>
                  <label>{t("email")}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} /></label>
                  <label>{t("contactPhoneOptional")}<input type="tel" value={phoneField} onChange={(e) => setPhoneField(e.target.value)} maxLength={24} /></label>
                  <label className="contact-hp" aria-hidden="true">Web sitesi<input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
                </div>
                <label>{t("contactMessage")}<textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={1500} placeholder={t("contactMessagePlaceholder")} /></label>
                {errorMessage ? <div className="auth-notice auth-notice-error">{errorMessage}</div> : null}
                {sent ? <div className="auth-notice auth-notice-success">{t("contactSent")}</div> : null}
                <button className="button button-primary" type="submit" disabled={sending}><Send size={15} /> {sending ? t("processing") : t("contactSend")}</button>
              </form>
            </div>
          </div>

          <div className="contact-map">
            <iframe title="TML MOTORS konumu — Günsev Oto AVM, Gaziantep" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
        </div>
      </section>
    </>
  );
}
