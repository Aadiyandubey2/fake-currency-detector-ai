/* ==========================================================
   FAKE CURRENCY DETECTION — SCRIPT
   Author: Raushan Kumar · NIT Nagaland
   Features: File upload + Live camera detection
   ========================================================== */
(function () {
  'use strict';

  /* ─── NAV ─── */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));

  const burger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
    const nr = document.querySelector('.nav-right');
    if (nr) nr.classList.toggle('open');
  });
  navLinks.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
      const nr = document.querySelector('.nav-right');
      if (nr) nr.classList.remove('open');
    });
  });

  // Active link
  const secs = document.querySelectorAll('section[id], .hero[id]');
  const nLinks = document.querySelectorAll('.nav-link');
  const sObs = new IntersectionObserver(en => {
    en.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        nLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  secs.forEach(s => sObs.observe(s));

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ─── SCROLL REVEAL ─── */
  const revEls = document.querySelectorAll(
    '.info-card, .feat-card, .tech-item, .step, .author-card, .sec-head, .demo-wrap'
  );
  revEls.forEach(el => el.classList.add('reveal'));
  const rObs = new IntersectionObserver(en => {
    en.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('vis'); rObs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  revEls.forEach(el => rObs.observe(el));

  /* ═══════════════════════════════════
     LIVE DEMO ENGINE
     ═══════════════════════════════════ */

  // DOM
  const uploadZone    = document.getElementById('uploadZone');
  const fileInput     = document.getElementById('fileInput');
  const cameraZone    = document.getElementById('cameraZone');
  const cameraVideo   = document.getElementById('cameraVideo');
  const captureBtn    = document.getElementById('captureBtn');
  const previewZone   = document.getElementById('previewZone');
  const previewImg    = document.getElementById('previewImg');
  const previewScan   = document.getElementById('previewScanline');
  const inputControls = document.getElementById('inputControls');
  const analyzeBtn    = document.getElementById('analyzeBtn');
  const resetBtn      = document.getElementById('resetBtn');
  const outputEmpty   = document.getElementById('outputEmpty');
  const outputResults = document.getElementById('outputResults');
  const verdict       = document.getElementById('verdict');
  const verdictDot    = document.getElementById('verdictDot');
  const verdictLabel  = document.getElementById('verdictLabel');
  const verdictDesc   = document.getElementById('verdictDesc');
  const ringArc       = document.getElementById('ringArc');
  const ringVal       = document.getElementById('ringVal');
  const resultBars    = document.getElementById('resultBars');
  const canvas        = document.getElementById('analysisCanvas');
  const ctx           = canvas.getContext('2d', { willReadFrequently: true });

  let cameraStream = null;
  let currentMode = 'upload';
  /* ─── MODE TABS ─── */
  document.querySelectorAll('.demo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.demo-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      currentMode = mode;
      resetState();
      if (mode === 'upload') {
        uploadZone.style.display = '';
        cameraZone.style.display = 'none';
        stopCamera();
      } else {
        uploadZone.style.display = 'none';
        cameraZone.style.display = '';
        startCamera();
      }
    });
  });

  /* ─── UPLOAD ─── */
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      uploadZone.style.display = 'none';
      previewZone.style.display = '';
      inputControls.style.display = '';
      outputEmpty.style.display = '';
      outputResults.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  /* ─── CAMERA ─── */
  async function startCamera() {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      cameraVideo.srcObject = cameraStream;
    } catch (err) {
      alert('Camera access denied or not available. Please use Upload mode.');
      document.querySelector('[data-mode="upload"]').click();
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
      cameraVideo.srcObject = null;
    }
  }

  captureBtn.addEventListener('click', () => {
    if (!cameraStream) return;
    
    if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) {
      alert("Camera video not fully ready yet. Please try again.");
      return;
    }

    try {
      // Capture frame from video
      canvas.width = cameraVideo.videoWidth;
      canvas.height = cameraVideo.videoHeight;
      ctx.drawImage(cameraVideo, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      previewImg.src = dataUrl;
      
      cameraZone.style.display = 'none';
      previewZone.style.display = '';
      inputControls.style.display = '';
      outputEmpty.style.display = '';
      outputResults.style.display = 'none';

      // Auto-run analysis to save the user a click
      if (opencvReady) {
        runAnalysis();
      } else {
        // Wait for OpenCV to load, then auto-run
        const autoRunWait = setInterval(() => {
          if (opencvReady && previewImg.src) {
            clearInterval(autoRunWait);
            runAnalysis();
          }
        }, 500);
      }
    } catch (e) {
      console.error(e);
      alert('Capture failed: ' + e.message);
    }
  });

  /* ─── RESET ─── */
  resetBtn.addEventListener('click', () => {
    resetState();
    if (currentMode === 'camera') {
      cameraZone.style.display = '';
      startCamera();
    } else {
      uploadZone.style.display = '';
    }
  });

  function resetState() {
    fileInput.value = '';
    previewZone.style.display = 'none';
    inputControls.style.display = 'none';
    outputResults.style.display = 'none';
    outputEmpty.style.display = '';
    previewScan.classList.remove('active');
    resultBars.innerHTML = '';
    ringArc.style.strokeDashoffset = '326.7';
    ringVal.textContent = '0%';
  }

  /* ─── AI ENGINE SYSTEM ─── */
  const SYSTEM_KEY = "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";

  /* ─── ANALYZE ─── */
  analyzeBtn.addEventListener('click', () => {
    if (!previewImg.src) return;
    runAnalysis();
  });

  async function runAnalysis() {
    // Show analyzing
    outputEmpty.style.display = 'none';
    outputResults.style.display = '';
    verdict.className = 'verdict analyzing';
    verdictLabel.textContent = 'Contacting AI...';
    verdictDesc.textContent = 'Uploading to Gemini Multi-modal LLM';
    previewScan.classList.add('active');
    resultBars.innerHTML = '';
    ringArc.style.transition = 'none';
    ringArc.style.strokeDashoffset = '326.7';
    ringVal.textContent = '...';

    try {
      const base64Data = previewImg.src; // Keep prefix for openrouter
      if (!base64Data) throw new Error("Invalid image capture.");

      const promptText = `You are a currency authentication AI expert. You are analyzing this image of an Indian currency note to determine if it looks authentic or counterfeit. Pay attention to the Mahatma Gandhi portrait, security thread, micro-lettering, typography, and watermark features.

Output ONLY a raw, valid JSON object matching exactly this schema, without markdown formatting or code blocks:
{
  "overall_score": <number 0-100 indicating your confidence in authenticity>,
  "is_authentic": <boolean true or false>,
  "features": [
     { "name": "Portrait Detail", "score": <number 0-100> },
     { "name": "Security Elements", "score": <number 0-100> },
     { "name": "Typography & Print", "score": <number 0-100> },
     { "name": "Color Profile", "score": <number 0-100> }
  ],
  "reason": "<A brief one-sentence explanation of your verdict>"
}
If the image doesn't look like money at all, make the boolean false and the overall score extremely low. Limit output to RAW JSON only.`;

      const payload = {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: base64Data } }
            ]
          }
        ]
      };

      verdictDesc.textContent = 'Awaiting AI reasoning...';

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SYSTEM_KEY}`,
          'HTTP-Referer': "https://raushanme.com",
          'X-Title': "CurrencyGuard"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(()=>({}));
        throw new Error(errData.error?.message || 'API request failed');
      }

      const data = await response.json();
      let textContent = data.choices?.[0]?.message?.content;
      
      if (!textContent) throw new Error("Invalid format from AI");
      
      // Clean up markdown ticks if Gemini included them
      textContent = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(textContent);

      // Render the AI's thoughts
      renderBars(parsed.features);
      
      const overall = parsed.overall_score;
      const isPass = parsed.is_authentic;

      previewScan.classList.remove('active');
      const circ = 326.7;
      ringArc.style.transition = 'stroke-dashoffset 1.2s ease';
      ringArc.style.strokeDashoffset = circ - (circ * overall / 100);
      animNum(ringVal, 0, overall, 1000, '%');

      await wait(500);
      
      if (isPass && overall >= 60) {
        verdict.className = 'verdict pass';
        verdictLabel.textContent = 'Authentic';
      } else if (overall >= 40) {
        verdict.className = 'verdict analyzing';
        verdictLabel.textContent = 'Inconclusive (Requires Manual Check)';
      } else {
        verdict.className = 'verdict fail';
        verdictLabel.textContent = 'Likely Counterfeit';
      }
      
      verdictDesc.textContent = parsed.reason || "AI completed structure analysis.";

    } catch (e) {
      console.error('Gemini Analysis Error: ', e);
      verdict.className = 'verdict fail';
      verdictLabel.textContent = 'API Error';
      verdictDesc.textContent = e.message.substring(0, 80) + (e.message.length > 80 ? '...' : '');
      previewScan.classList.remove('active');
    }
  }

  function renderBars(results) {
    resultBars.innerHTML = results.map(r => {
      const cls = r.score >= 70 ? 'high' : r.score >= 45 ? 'mid' : 'low';
      return `<div class="rbar"><div class="rbar-top"><span class="rbar-name">${r.name}</span><span class="rbar-score">${r.score}%</span></div><div class="rbar-track"><div class="rbar-fill ${cls}" style="width:${r.score}%"></div></div></div>`;
    }).join('');
    requestAnimationFrame(() => {
      resultBars.querySelectorAll('.rbar-fill').forEach(f => {
        const w = f.style.width; f.style.width = '0%';
        requestAnimationFrame(() => { f.style.width = w; });
      });
    });
  }

  function animNum(el, from, to, dur, suf) {
    const st = performance.now();
    (function step(now) {
      const p = Math.min((now - st) / dur, 1);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(st);
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* Utilities */
  function analyzeAspectRatio(w, h) {
    const r = Math.max(w,h) / Math.min(w,h);
    let s;
    if (r >= 2.0 && r <= 2.6) s = 95;
    else if (r >= 1.8 && r <= 2.8) s = 80;
    else if (r >= 1.5 && r <= 3.2) s = 60;
    else s = 30;
    return { name: 'Aspect Ratio', score: clamp(s + rnd(3), 10, 98) };
  }

  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
  function rnd(r) { return Math.round((Math.random()-.5)*r*2); }

})();
