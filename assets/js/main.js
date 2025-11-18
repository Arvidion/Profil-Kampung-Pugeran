(function() {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const themeToggle = $('.theme-toggle');
  const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || 'light';
  applyTheme(initialTheme);

  themeToggle?.addEventListener('click', () => {
    const current = document.body.dataset.theme === 'light' ? 'light' : 'dark';
    const nextTheme = current === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  });

  prefersDark?.addEventListener('change', (event) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });

  function applyTheme(mode) {
    document.body.dataset.theme = mode;
    const isLight = mode === 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', isLight ? 'Aktifkan mode malam' : 'Aktifkan mode siang');
    }
  }

  // Lazy load Drive preview when user clicks thumbnail
  const driveVideos = $$('.drive-video');
  if (driveVideos.length > 0) {
    driveVideos.forEach((wrapper) => {
      const videoSrc = wrapper.dataset.video;
      const title = wrapper.dataset.title || 'Video Kampung Pugeran';
      const iframe = wrapper.querySelector('iframe');
      const playButton = wrapper.querySelector('.drive-video-play');

      const loadDrivePreview = () => {
        if (!iframe || !videoSrc) {
          window.open(videoSrc, '_blank', 'noopener');
          return;
        }
        if (!iframe.src) {
          iframe.src = videoSrc;
          iframe.title = title;
        }
        wrapper.classList.add('is-loaded');
        iframe.focus();
      };

      playButton?.addEventListener('click', (e) => {
        e.preventDefault();
        loadDrivePreview();
      });

      wrapper.addEventListener('click', (e) => {
        if (wrapper.classList.contains('is-loaded')) return;
        if (!e.target.closest('iframe')) {
          e.preventDefault();
          loadDrivePreview();
        }
      });
    });
  }

  // Navbar: toggle mobile
  const navToggle = $('.nav-toggle');
  const siteNav = $('#site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close after click
    siteNav.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Smooth scrolling enhancement (native behavior is set in CSS, this offsets sticky header if needed)
  const headerHeight = $('.site-header')?.offsetHeight || 0;
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.length <= 1) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (headerHeight + 8);
      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', href);
    });
  });

  // Reveal on scroll using IntersectionObserver
  const revealEls = $$('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  revealEls.forEach(el => io.observe(el));

  // Lightbox for gallery
  const lightbox = $('#lightbox');
  const lightboxImg = $('.lightbox-image', lightbox);
  const lightboxClose = $('.lightbox-close', lightbox);
  const lightboxPrev = $('.lightbox-nav.prev', lightbox);
  const lightboxNext = $('.lightbox-nav.next', lightbox);
  const galleryLinks = $$('.gallery-item');
  let galleryIndex = -1;

  const openLightbox = (src, alt, index = -1) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Gambar galeri';
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    galleryIndex = index;
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.classList.remove('open');
    lightboxImg.src = '';
    document.body.style.overflow = '';
    galleryIndex = -1;
  };

  galleryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Check if link is to another page (like gallery.html) or an image
      const isImageLink = href && (
        href.endsWith('.webp') || 
        href.endsWith('.jpg') || 
        href.endsWith('.jpeg') || 
        href.endsWith('.png') || 
        href.endsWith('.JPG') || 
        href.endsWith('.JPEG') || 
        href.endsWith('.PNG') || 
        href.endsWith('.WEBP') ||
        href.startsWith('data:') ||
        href.includes('unsplash.com')
      );
      
      // Only prevent default and open lightbox for image links
      if (isImageLink) {
        e.preventDefault();
        const img = link.querySelector('img');
        const src = href || img?.src;
        const alt = img?.alt || 'Gambar galeri';
        const index = galleryLinks.indexOf ? galleryLinks.indexOf(link) : $$('.gallery-item').indexOf(link);
        if (src) openLightbox(src, alt, index);
      }
      // For non-image links (like gallery.html), let the browser navigate normally
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (lightbox?.classList.contains('open')) {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
    }
  });

  function navigate(step) {
    if (!Array.isArray(galleryLinks) || galleryLinks.length === 0) return;
    if (galleryIndex < 0) return;
    
    // Filter only image links for navigation
    const imageLinks = Array.from(galleryLinks).filter(link => {
      const href = link.getAttribute('href');
      return href && (
        href.endsWith('.webp') || 
        href.endsWith('.jpg') || 
        href.endsWith('.jpeg') || 
        href.endsWith('.png') || 
        href.endsWith('.JPG') || 
        href.endsWith('.JPEG') || 
        href.endsWith('.PNG') || 
        href.endsWith('.WEBP') ||
        href.startsWith('data:') ||
        href.includes('unsplash.com')
      );
    });
    
    if (imageLinks.length === 0) return;
    
    // Find current index in filtered image links
    const currentLink = galleryLinks[galleryIndex];
    let currentImageIndex = imageLinks.indexOf(currentLink);
    if (currentImageIndex < 0) currentImageIndex = 0;
    
    // Navigate to next/prev image
    currentImageIndex = (currentImageIndex + step + imageLinks.length) % imageLinks.length;
    const link = imageLinks[currentImageIndex];
    const img = link.querySelector('img');
    const src = link.getAttribute('href') || img?.src;
    const alt = img?.alt || 'Gambar galeri';
    
    // Update galleryIndex to match the original array
    galleryIndex = Array.from(galleryLinks).indexOf(link);
    
    if (src) {
      lightboxImg.src = src;
      lightboxImg.alt = alt;
    }
  }

  lightboxNext?.addEventListener('click', () => navigate(1));
  lightboxPrev?.addEventListener('click', () => navigate(-1));

  // Footer year
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Image carousel auto-rotate
  const carousel = $('.image-carousel');
  if (carousel) {
    const images = $$('.carousel-image', carousel);
    let currentIndex = 0;

    const rotateCarousel = () => {
      images.forEach((img, index) => {
        img.classList.remove('active');
      });
      currentIndex = (currentIndex + 1) % images.length;
      images[currentIndex].classList.add('active');
    };

    // Start rotation every 3 seconds
    if (images.length > 0) {
      setInterval(rotateCarousel, 3000);
    }
  }

  // Activities infinite carousel
  const activitiesCarousel = $('#activities-carousel');
  if (activitiesCarousel) {
    // Wait for DOM to be ready
    setTimeout(() => {
      const cards = $$('.card', activitiesCarousel);
      if (cards.length > 0) {
        // Store original cards count
        const originalCount = cards.length;
        
        // Duplicate all cards to create seamless loop
        const originalCards = Array.from(cards);
        originalCards.forEach(card => {
          const clone = card.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          activitiesCarousel.appendChild(clone);
        });
        
        // Calculate actual width after duplication
        const firstCard = originalCards[0];
        const cardWidth = firstCard.offsetWidth || 320;
        const gap = 20; // Match CSS gap
        const totalWidth = (cardWidth + gap) * originalCount;
        
        // Update animation duration dynamically
        const animationDuration = originalCount * 3; // 3 seconds per card
        const existingStyle = document.getElementById('activities-carousel-animation');
        if (existingStyle) {
          existingStyle.remove();
        }
        const style = document.createElement('style');
        style.id = 'activities-carousel-animation';
        style.textContent = `
          @keyframes slideInfinite {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-${totalWidth}px);
            }
          }
          .activities-carousel {
            animation: slideInfinite ${animationDuration}s linear infinite;
          }
        `;
        document.head.appendChild(style);
      }
    }, 100);
  }

})();


