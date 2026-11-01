"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";

export function VehicleGallery({ images, vehicleName }: { images: string[]; vehicleName: string }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const selectImage = useCallback((index: number) => {
    setSelectedImage((index + images.length) % images.length);
    setZoomed(false);
  }, [images.length]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setZoomed(false);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") selectImage(selectedImage - 1);
      if (event.key === "ArrowRight") selectImage(selectedImage + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeLightbox, lightboxOpen, selectImage, selectedImage]);

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStart.current === null) return;
    const difference = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(difference) > 48) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 250);
      selectImage(selectedImage + (difference < 0 ? 1 : -1));
    }
  }

  if (!images.length) {
    return <div className="vd-image vd-image-empty"><span>Araç fotoğrafı henüz eklenmedi</span></div>;
  }

  return (
    <>
      <div className="vd-gallery">
        <button
          type="button"
          className="vd-image"
          style={{ backgroundImage: `url("${images[selectedImage]}")` }}
          aria-label={`${vehicleName} fotoğrafını büyüt`}
          onClick={() => { if (!suppressClick.current) setLightboxOpen(true); }}
          onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={onTouchEnd}
        >
          <span className="vd-zoom-hint"><Maximize2 size={15} /> Büyüt</span>
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" className="vd-nav vd-nav-prev" aria-label="Önceki fotoğraf" onClick={() => selectImage(selectedImage - 1)}><ChevronLeft size={20} /></button>
            <button type="button" className="vd-nav vd-nav-next" aria-label="Sonraki fotoğraf" onClick={() => selectImage(selectedImage + 1)}><ChevronRight size={20} /></button>
            <span className="vd-counter">{selectedImage + 1} / {images.length}</span>
            <div className="vd-thumbs" aria-label="Araç fotoğrafları">
              {images.map((url, index) => (
                <button type="button" key={`${url}-${index}`} className={index === selectedImage ? "vd-thumb is-active" : "vd-thumb"} onClick={() => selectImage(index)} aria-label={`${index + 1}. fotoğrafı göster`} aria-pressed={index === selectedImage}>
                  <span style={{ backgroundImage: `url("${url}")` }} />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {lightboxOpen ? (
        <div className="vd-lightbox" role="dialog" aria-modal="true" aria-label={`${vehicleName} fotoğraf galerisi`} onClick={closeLightbox}>
          <button type="button" className="vd-lightbox-close" onClick={closeLightbox} aria-label="Galeriyi kapat"><X size={23} /></button>
          <div className="vd-lightbox-toolbar" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setZoomed(false)} aria-label="Uzaklaştır" disabled={!zoomed}><ZoomOut size={18} /></button>
            <span>{selectedImage + 1} / {images.length}</span>
            <button type="button" onClick={() => setZoomed(true)} aria-label="Yakınlaştır" disabled={zoomed}><ZoomIn size={18} /></button>
          </div>
          {images.length > 1 ? <button type="button" className="vd-lightbox-nav prev" aria-label="Önceki fotoğraf" onClick={(event) => { event.stopPropagation(); selectImage(selectedImage - 1); }}><ChevronLeft size={28} /></button> : null}
          <div className="vd-lightbox-stage" onClick={(event) => event.stopPropagation()} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={onTouchEnd}>
            <img className={zoomed ? "is-zoomed" : ""} src={images[selectedImage]} alt={`${vehicleName} araç fotoğrafı ${selectedImage + 1}`} onDoubleClick={() => setZoomed((value) => !value)} />
          </div>
          {images.length > 1 ? <button type="button" className="vd-lightbox-nav next" aria-label="Sonraki fotoğraf" onClick={(event) => { event.stopPropagation(); selectImage(selectedImage + 1); }}><ChevronRight size={28} /></button> : null}
        </div>
      ) : null}
    </>
  );
}
