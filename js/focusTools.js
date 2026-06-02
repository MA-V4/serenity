/* ═══════════════════════════════════════════════════════════
   js/focusTools.js
   Serenity - Interactive Focus Tools

   Three distraction / grounding tools that appear in the
   results section after the AI analysis:

   1. 3D Breathing Orb   - Three.js WebGL spinning sphere
   2. Dot Mandala        - Canvas connect-the-dots drawing
   3. Grounding 5-4-3-2-1 - Guided sensory exercise

   All tools initialise lazily (only when their tab is shown)
   to keep page load fast.
   ═══════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════
   SECTION A - TAB SWITCHING
   ══════════════════════════════════════════════════════════ */

var orbInitialised      = false;
var puzzleInitialised   = false;
var groundingInitialised = false;

/**
 * Switch the visible focus tool tab.
 * Lazy-initialises each tool the first time it's shown.
 */
function switchFocusTab(tabName) {
  // Update tab button states
  document.querySelectorAll('.focus-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update panel visibility
  document.querySelectorAll('.focus-panel').forEach(function (panel) {
    panel.classList.toggle('active', panel.id === 'tab-' + tabName);
  });

  // Lazy-init each tool
  if (tabName === 'orb'       && !orbInitialised)      { initOrb();       orbInitialised      = true; }
  if (tabName === 'puzzle'    && !puzzleInitialised)   { initPuzzle();    puzzleInitialised   = true; }
  if (tabName === 'grounding' && !groundingInitialised){ initGrounding();  groundingInitialised = true; }
}

// Wire up tab buttons
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.focus-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchFocusTab(btn.dataset.tab);
    });
  });
});

// Called by ui.js when results are shown - init the default tab
function initFocusTools(urgencyLevel) {
  // Store urgency so the orb can use the right colour
  window.serenityUrgency = urgencyLevel || 'moderate';
  // Init the default (orb) tab
  if (!orbInitialised) { initOrb(); orbInitialised = true; }
}


/* ══════════════════════════════════════════════════════════
   SECTION B - 3D BREATHING ORB (Three.js)
   ══════════════════════════════════════════════════════════ */

function initOrb() {
  var canvas = document.getElementById('orb-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var container = canvas.parentElement;
  var W = container.clientWidth  || 340;
  var H = 320;
  canvas.width  = W;
  canvas.height = H;

  // ── Renderer ──
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true      // transparent background
  });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // ── Scene & Camera ──
  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.z = 3.2;

  // ── Colour palettes per mode ──
  var palettes = {
    calm: {
      core:  new THREE.Color(0x8B7BAD),  // lavender
      glow:  new THREE.Color(0xA898CC),
      ring:  new THREE.Color(0x6A9E84),  // sage
      bg:    new THREE.Color(0xC4B5D8)
    },
    focus: {
      core:  new THREE.Color(0x5C8C73),  // deep sage
      glow:  new THREE.Color(0x8BAF9A),
      ring:  new THREE.Color(0x7B6FA0),
      bg:    new THREE.Color(0x8BAF9A)
    },
    energise: {
      core:  new THREE.Color(0xC9956E),  // peach/terracotta
      glow:  new THREE.Color(0xE8C4A8),
      ring:  new THREE.Color(0xC4B5D8),
      bg:    new THREE.Color(0xE8C4A8)
    }
  };

  var currentMode   = 'focus';
  var targetPalette = palettes[currentMode];
  var lerpedCore    = targetPalette.core.clone();
  var lerpedGlow    = targetPalette.glow.clone();

  // ── Main sphere - custom shader for organic feel ──
  var sphereGeo = new THREE.SphereGeometry(1, 64, 64);

  var sphereMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uCoreColor:{ value: lerpedCore },
      uGlowColor:{ value: lerpedGlow },
      uBreath:   { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uBreath;
      varying vec3  vNormal;
      varying vec3  vPosition;

      // Simple noise for organic surface distortion
      float hash(vec3 p) {
        p = fract(p * vec3(443.8975, 397.2973, 491.1871));
        p += dot(p.zxy, p.yxz + 19.19);
        return fract(p.x * p.y * p.z);
      }

      float smoothNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
              mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
              mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
          f.z);
      }

      void main() {
        vNormal   = normal;
        vPosition = position;

        // Organic displacement using layered noise
        float noise = smoothNoise(position * 1.8 + uTime * 0.18) * 0.5
                    + smoothNoise(position * 3.2 - uTime * 0.12) * 0.25
                    + smoothNoise(position * 6.0 + uTime * 0.08) * 0.12;

        // Scale displacement with breath (0 → 1 → 0)
        float displacement = noise * 0.12 * (0.7 + uBreath * 0.5);

        vec3 newPos = position + normal * displacement;

        // Breath scale - whole sphere pulses
        float breathScale = 1.0 + uBreath * 0.12;
        newPos *= breathScale;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3  uCoreColor;
      uniform vec3  uGlowColor;
      uniform float uTime;
      uniform float uBreath;
      varying vec3  vNormal;
      varying vec3  vPosition;

      void main() {
        // Fresnel rim glow
        vec3  viewDir = normalize(cameraPosition - vPosition);
        float fresnel = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
        fresnel = pow(fresnel, 2.2);

        // Animated colour sweep
        float sweep = sin(vPosition.y * 2.0 + uTime * 0.6) * 0.5 + 0.5;

        vec3 col = mix(uCoreColor, uGlowColor, fresnel * 0.7 + sweep * 0.25);

        // Brighten on breath peak
        col += uBreath * 0.08;

        // Soft vignette centre
        float centre = 1.0 - length(vPosition.xy) * 0.3;
        col *= 0.85 + centre * 0.25;

        gl_FragColor = vec4(col, 0.92 - fresnel * 0.15);
      }
    `,
    transparent: true
  });

  var sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // ── Inner glow sphere ──
  var innerGeo = new THREE.SphereGeometry(0.82, 32, 32);
  var innerMat = new THREE.MeshBasicMaterial({
    color: lerpedGlow,
    transparent: true,
    opacity: 0.18
  });
  var innerSphere = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerSphere);

  // ── Orbiting ring ──
  var ringGeo = new THREE.TorusGeometry(1.42, 0.022, 16, 100);
  var ringMat = new THREE.MeshBasicMaterial({
    color: targetPalette.ring,
    transparent: true,
    opacity: 0.45
  });
  var ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.5;
  scene.add(ring);

  // Second ring at a different angle
  var ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.012, 16, 100),
    new THREE.MeshBasicMaterial({ color: targetPalette.ring, transparent: true, opacity: 0.25 })
  );
  ring2.rotation.x = -Math.PI / 3.5;
  ring2.rotation.z =  Math.PI / 4;
  scene.add(ring2);

  // ── Particle field ──
  var particleCount = 120;
  var positions     = new Float32Array(particleCount * 3);
  for (var i = 0; i < particleCount; i++) {
    var theta = Math.random() * Math.PI * 2;
    var phi   = Math.acos(2 * Math.random() - 1);
    var r     = 1.7 + Math.random() * 0.8;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  var particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var particleMat = new THREE.PointsMaterial({
    color: 0xC4B5D8,
    size: 0.028,
    transparent: true,
    opacity: 0.6
  });
  var particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── Mouse drag rotation ──
  var isDragging   = false;
  var prevMouseX   = 0;
  var prevMouseY   = 0;
  var rotationVelX = 0;
  var rotationVelY = 0;
  var targetRotX   = 0;
  var targetRotY   = 0;

  canvas.addEventListener('mousedown', function (e) {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup',   function () { isDragging = false; });

  window.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    var dx = e.clientX - prevMouseX;
    var dy = e.clientY - prevMouseY;
    rotationVelY += dx * 0.008;
    rotationVelX += dy * 0.008;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  // Touch support
  canvas.addEventListener('touchstart', function (e) {
    isDragging = true;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    var dx = e.touches[0].clientX - prevMouseX;
    var dy = e.touches[0].clientY - prevMouseY;
    rotationVelY += dx * 0.008;
    rotationVelX += dy * 0.008;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', function () { isDragging = false; });

  // ── Mode buttons ──
  ['calm', 'focus', 'energise'].forEach(function (mode) {
    var btn = document.getElementById('orb-' + mode);
    if (!btn) return;
    btn.addEventListener('click', function () {
      document.querySelectorAll('.orb-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentMode   = mode;
      targetPalette = palettes[mode];
    });
  });

  // ── Breath cycle ──
  // 4s in, 4s out - sinusoidal 0→1→0
  var breathSpeed = (2 * Math.PI) / 8;   // full cycle = 8 seconds

  // ── Animation loop ──
  var clock     = new THREE.Clock();
  var animFrameId;

  function animate() {
    animFrameId = requestAnimationFrame(animate);
    var elapsed = clock.getElapsedTime();

    // Breath value 0 → 1 → 0
    var breath = (Math.sin(elapsed * breathSpeed - Math.PI / 2) + 1) / 2;

    // Update shader uniforms
    sphereMat.uniforms.uTime.value   = elapsed;
    sphereMat.uniforms.uBreath.value = breath;

    // Lerp colours toward target
    lerpedCore.lerp(targetPalette.core, 0.04);
    lerpedGlow.lerp(targetPalette.glow, 0.04);
    sphereMat.uniforms.uCoreColor.value.copy(lerpedCore);
    sphereMat.uniforms.uGlowColor.value.copy(lerpedGlow);
    innerMat.color.copy(lerpedGlow);
    ringMat.color.lerp(targetPalette.ring, 0.04);

    // Auto-rotate + inertia
    if (!isDragging) {
      rotationVelY *= 0.96;  // friction
      rotationVelX *= 0.96;
      rotationVelY += 0.004; // gentle auto-spin
    }

    targetRotY += rotationVelY;
    targetRotX += rotationVelX;

    sphere.rotation.y      = targetRotY;
    sphere.rotation.x      = targetRotX * 0.4;
    innerSphere.rotation.y = targetRotY * 1.1;
    ring.rotation.y        = elapsed * 0.3;
    ring2.rotation.y       = -elapsed * 0.2;
    ring2.rotation.x       = -Math.PI / 3.5 + Math.sin(elapsed * 0.4) * 0.15;
    particles.rotation.y   = elapsed * 0.06;
    particles.rotation.x   = elapsed * 0.04;

    renderer.render(scene, camera);
  }

  animate();

  // Clean up if the panel is ever destroyed
  canvas._destroyOrb = function () {
    cancelAnimationFrame(animFrameId);
    renderer.dispose();
  };
}


/* ══════════════════════════════════════════════════════════
   SECTION C - DOT MANDALA (Canvas 2D)
   ══════════════════════════════════════════════════════════ */

function initPuzzle() {
  var canvas = document.getElementById('puzzle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var SIZE = Math.min(canvas.parentElement.clientWidth, 380);
  canvas.width  = SIZE;
  canvas.height = SIZE;
  var cx = SIZE / 2;
  var cy = SIZE / 2;

  // Colour palette for lines
  var lineColors = [
    'rgba(139,123,173,',   // lavender
    'rgba(106,158,132,',   // sage
    'rgba(201,149,110,',   // peach
    'rgba(168,196,216,',   // sky
    'rgba(232,180,192,'    // blush
  ];

  var dots        = [];
  var connections = [];   // { a, b, color, alpha } pairs drawn so far
  var lastDot     = null;
  var colorIndex  = 0;

  /** Generate a set of dots arranged in concentric rings + centre */
  function generateDots() {
    dots        = [];
    connections = [];
    lastDot     = null;

    // Centre dot
    dots.push({ x: cx, y: cy, ring: 0 });

    // Three rings of dots
    var rings = [
      { count: 6,  radius: SIZE * 0.14 },
      { count: 10, radius: SIZE * 0.26 },
      { count: 14, radius: SIZE * 0.39 }
    ];

    rings.forEach(function (ring) {
      var angleStep = (Math.PI * 2) / ring.count;
      var offset    = Math.random() * Math.PI; // random rotation per ring
      for (var i = 0; i < ring.count; i++) {
        var angle = i * angleStep + offset;
        dots.push({
          x:    cx + Math.cos(angle) * ring.radius,
          y:    cy + Math.sin(angle) * ring.radius,
          ring: ring.count
        });
      }
    });

    drawDots();
  }

  function drawDots() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Draw existing connections first
    connections.forEach(function (conn) {
      drawLine(dots[conn.a], dots[conn.b], conn.color, conn.alpha);
    });

    // Draw dot circles
    dots.forEach(function (dot, i) {
      var isLast = (lastDot === i);

      // Glow
      var grad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, isLast ? 16 : 10);
      grad.addColorStop(0,   isLast ? 'rgba(123,111,160,0.40)' : 'rgba(196,181,216,0.25)');
      grad.addColorStop(1,   'rgba(196,181,216,0)');
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, isLast ? 16 : 10, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, isLast ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isLast ? '#8B7BAD' : 'rgba(139,123,173,0.70)';
      ctx.fill();

      // White centre
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, isLast ? 3 : 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.fill();
    });
  }

  function drawLine(a, b, colorBase, alpha) {
    // Bezier curve through midpoint for an elegant arc
    var midX = (a.x + b.x) / 2 + (Math.random() - 0.5) * 20;
    var midY = (a.y + b.y) / 2 + (Math.random() - 0.5) * 20;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(midX, midY, b.x, b.y);

    ctx.strokeStyle = colorBase + alpha + ')';
    ctx.lineWidth   = 1.5;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  /** Find which dot was clicked (within 18px radius) */
  function findDotAt(px, py) {
    var best = -1, bestDist = 18;
    dots.forEach(function (dot, i) {
      var d = Math.hypot(px - dot.x, py - dot.y);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function handleClick(px, py) {
    var hit = findDotAt(px, py);
    if (hit === -1) return;

    if (lastDot !== null && lastDot !== hit) {
      // Draw connecting line
      var col   = lineColors[colorIndex % lineColors.length];
      var alpha = (0.5 + Math.random() * 0.4).toFixed(2);
      connections.push({ a: lastDot, b: hit, color: col, alpha: alpha });
      colorIndex++;

      // Also draw the mirrored line through centre (mandala symmetry)
      // Find the dot index of the "mirror" - closest to reflected point
      var mirrorX = cx + (cx - dots[hit].x);
      var mirrorY = cy + (cy - dots[hit].y);
      var mirror  = findDotAt(mirrorX, mirrorY);
      if (mirror !== -1 && mirror !== hit && mirror !== lastDot) {
        connections.push({ a: lastDot, b: mirror, color: col, alpha: (parseFloat(alpha) * 0.5).toFixed(2) });
      }
    }

    lastDot = hit;
    drawDots();
  }

  // Click / tap handlers
  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = SIZE / rect.width;
    var scaleY = SIZE / rect.height;
    handleClick(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top)  * scaleY
    );
  });

  canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    var rect  = canvas.getBoundingClientRect();
    var scaleX = SIZE / rect.width;
    var scaleY = SIZE / rect.height;
    var touch = e.changedTouches[0];
    handleClick(
      (touch.clientX - rect.left) * scaleX,
      (touch.clientY - rect.top)  * scaleY
    );
  }, { passive: false });

  // Control buttons
  document.getElementById('puzzle-reset').addEventListener('click', function () {
    colorIndex = 0;
    generateDots();
  });

  document.getElementById('puzzle-clear').addEventListener('click', function () {
    connections = [];
    lastDot     = null;
    drawDots();
  });

  // Initial generation
  generateDots();
}


/* ══════════════════════════════════════════════════════════
   SECTION D - GROUNDING 5-4-3-2-1
   ══════════════════════════════════════════════════════════ */

function initGrounding() {
  // Count of inputs per step: 5 see, 4 touch, 3 hear, 2 smell, 1 taste
  var stepCounts = [5, 4, 3, 2, 1];

  // Build input fields for each step
  stepCounts.forEach(function (count, stepIndex) {
    var container = document.getElementById('g-inputs-' + stepIndex);
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < count; i++) {
      var wrapper = document.createElement('div');
      wrapper.className = 'g-input-row';

      var num = document.createElement('span');
      num.className   = 'g-input-num';
      num.textContent = i + 1;

      var input = document.createElement('input');
      input.type        = 'text';
      input.className   = 'g-input';
      input.placeholder = getPlaceholder(stepIndex, i);

      wrapper.appendChild(num);
      wrapper.appendChild(input);
      container.appendChild(wrapper);
    }
  });

  // "Next sense" buttons
  document.querySelectorAll('.grounding-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nextStep = btn.dataset.next;
      goToGroundingStep(nextStep);
    });
  });

  // Restart
  var restartBtn = document.getElementById('grounding-restart');
  if (restartBtn) {
    restartBtn.addEventListener('click', function () {
      // Clear all inputs
      document.querySelectorAll('.g-input').forEach(function (inp) {
        inp.value = '';
      });
      goToGroundingStep(0);
    });
  }
}

function getPlaceholder(stepIndex, itemIndex) {
  var examples = [
    ['A plant on the windowsill', 'The colour of the wall', 'Your hands', 'Something blue', 'Light or shadow'],
    ['The chair beneath you', 'Your feet on the floor', 'The fabric of your clothes', 'The air temperature'],
    ['Background hum', 'Distant traffic', 'Your own breathing'],
    ['Fresh air', 'Something faint nearby'],
    ['Nothing in particular - that\'s fine']
  ];
  return examples[stepIndex] ? (examples[stepIndex][itemIndex] || '') : '';
}

function goToGroundingStep(step) {
  // Hide all steps
  document.querySelectorAll('.grounding-step').forEach(function (el) {
    el.classList.remove('active');
  });

  // Update progress dots (only for numbered steps)
  document.querySelectorAll('.g-dot').forEach(function (dot) {
    var dotStep = parseInt(dot.dataset.step);
    dot.classList.toggle('active',   dotStep === parseInt(step));
    dot.classList.toggle('complete', dotStep <  parseInt(step));
  });

  // Show target step
  var target = (step === 'done')
    ? document.getElementById('g-step-done')
    : document.getElementById('g-step-' + step);

  if (target) {
    target.classList.add('active');

    // Animate in
    target.style.opacity   = '0';
    target.style.transform = 'translateY(10px)';
    setTimeout(function () {
      target.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      target.style.opacity    = '1';
      target.style.transform  = 'translateY(0)';
    }, 20);

    // Focus first input if there is one
    var firstInput = target.querySelector('.g-input');
    if (firstInput) {
      setTimeout(function () { firstInput.focus(); }, 450);
    }
  }

  // Hide progress dots on done screen
  var progressEl = document.getElementById('grounding-progress');
  if (progressEl) {
    progressEl.style.display = (step === 'done') ? 'none' : 'flex';
  }
}
