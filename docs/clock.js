(function () {
    'use strict';

    /* ── City Configuration ─────────────────────────────────── */

    const CITIES = [
        { name: 'PORTLAND',  tz: 'America/Los_Angeles', home: true  },
        { name: 'BOSTON',    tz: 'America/New_York',    home: false },
        { name: 'LONDON',   tz: 'Europe/London',       home: false },
        { name: 'PUNE',     tz: 'Asia/Kolkata',        home: false },
        { name: 'MANILA',   tz: 'Asia/Manila',         home: false },
    ];

    /* ── Colour Palette ─────────────────────────────────────── */

    const COL = {
        dayBg:      '#F0EDE5',
        nightBg:    '#181818',
        homeDark:   '#2B7BCE',
        homeLight:  '#5BB0EE',
        handDark:   '#444',
        handLight:  '#AAA',
        numDark:    '#333',
        numLight:   '#CCC',
        tickDark:   '#555',
        tickLight:  '#888',
        labelDark:  '#444',
        labelLight: '#BBB',
        sun:        '#D4960A',
        moon:       '#CCC',
    };

    /* ── Canvas Setup ───────────────────────────────────────── */

    const cvs = document.getElementById('clock');
    const ctx = cvs.getContext('2d');
    let W, H, CX, CY, R;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const sz  = Math.min(window.innerWidth, window.innerHeight) * 0.88;
        cvs.width  = sz * dpr;
        cvs.height = sz * dpr;
        cvs.style.width  = sz + 'px';
        cvs.style.height = sz + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        W  = sz;
        H  = sz;
        CX = W / 2;
        CY = H / 2;
        R  = sz * 0.46;
    }

    /* ── Time Helpers ───────────────────────────────────────── */

    function getTime(tz) {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false,
        }).formatToParts(new Date());

        let h = 0, m = 0, s = 0;
        for (const p of parts) {
            if (p.type === 'hour')   h = parseInt(p.value, 10);
            if (p.type === 'minute') m = parseInt(p.value, 10);
            if (p.type === 'second') s = parseInt(p.value, 10);
        }
        if (h === 24) h = 0;
        return { h, m, s };
    }

    /** Convert 24-hour time to a canvas angle (radians).
     *  Noon = top (−π/2), 6 pm = right (0), midnight = bottom (π/2), 6 am = left (π). */
    function toAngle(h, m, s) {
        const hrs = ((h - 12 + 24) % 24) + m / 60 + s / 3600;
        return (hrs * 15 - 90) * Math.PI / 180;
    }

    /** True when angle falls in the top (day) half. */
    function isDay(angle) {
        return Math.sin(angle) <= 0;
    }

    /* ── Drawing: Clock Face ────────────────────────────────── */

    function drawFace() {
        /* Clip to circle, fill two halves */
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = COL.dayBg;
        ctx.fillRect(CX - R, CY - R, R * 2, R);
        ctx.fillStyle = COL.nightBg;
        ctx.fillRect(CX - R, CY, R * 2, R);
        ctx.restore();

        /* Outer ring */
        ctx.beginPath();
        ctx.arc(CX, CY, R, 0, Math.PI * 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
    }

    /* ── Drawing: Tick Marks ────────────────────────────────── */

    function drawTicks() {
        for (let i = 0; i < 24; i++) {
            const a    = (i * 15 - 90) * Math.PI / 180;
            const maj  = (i % 6 === 0);
            const mid  = (i % 3 === 0) && !maj;
            const outR = R * 0.96;
            const inR  = maj ? R * 0.87 : mid ? R * 0.90 : R * 0.92;

            ctx.beginPath();
            ctx.moveTo(CX + Math.cos(a) * inR, CY + Math.sin(a) * inR);
            ctx.lineTo(CX + Math.cos(a) * outR, CY + Math.sin(a) * outR);
            ctx.strokeStyle = isDay(a) ? COL.tickDark : COL.tickLight;
            ctx.lineWidth   = maj ? 2.5 : 1;
            ctx.stroke();
        }
    }

    /* ── Drawing: Hour Numbers ──────────────────────────────── */

    function drawNumbers() {
        const fs = R * 0.072;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 24; i++) {
            const a   = (i * 15 - 90) * Math.PI / 180;
            const num = (i % 12) || 12;
            const nr  = R * 0.81;
            const x   = CX + Math.cos(a) * nr;
            const y   = CY + Math.sin(a) * nr;

            const bold = (i % 6 === 0);
            ctx.font = bold
                ? `700 ${fs}px 'Helvetica Neue', Helvetica, Arial, sans-serif`
                : `400 ${fs * 0.88}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
            ctx.fillStyle = isDay(a) ? COL.numDark : COL.numLight;
            ctx.fillText(String(num), x, y);
        }
    }

    /* ── Drawing: Sun & Moon Icons ───────────────────────────── */

    function drawSunMoon() {
        /* ☀ Sun — upper-right area of the day half */
        const sa = -40 * Math.PI / 180;
        const sr = R * 0.62;
        const sx = CX + Math.cos(sa) * sr;
        const sy = CY + Math.sin(sa) * sr;
        const ss = R * 0.028;

        ctx.fillStyle = COL.sun;
        ctx.beginPath();
        ctx.arc(sx, sy, ss, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 8; i++) {
            const ra = i * 45 * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(sx + Math.cos(ra) * ss * 1.5, sy + Math.sin(ra) * ss * 1.5);
            ctx.lineTo(sx + Math.cos(ra) * ss * 2.2, sy + Math.sin(ra) * ss * 2.2);
            ctx.strokeStyle = COL.sun;
            ctx.lineWidth   = 1;
            ctx.stroke();
        }

        /* 🌙 Moon — lower-left area of the night half */
        const ma = 140 * Math.PI / 180;
        const mr = R * 0.62;
        const mx = CX + Math.cos(ma) * mr;
        const my = CY + Math.sin(ma) * mr;
        const ms = R * 0.028;

        ctx.fillStyle = COL.moon;
        ctx.beginPath();
        ctx.arc(mx, my, ms, 0, Math.PI * 2);
        ctx.fill();

        /* Crescent cutout */
        ctx.fillStyle = COL.nightBg;
        ctx.beginPath();
        ctx.arc(mx + ms * 0.35, my - ms * 0.25, ms * 0.78, 0, Math.PI * 2);
        ctx.fill();
    }

    /* ── Drawing: City Hands ────────────────────────────────── */

    function drawHand(angle, city) {
        const r0 = R * 0.06;
        const r1 = R * 0.75;
        const sx = CX + Math.cos(angle) * r0;
        const sy = CY + Math.sin(angle) * r0;
        const ex = CX + Math.cos(angle) * r1;
        const ey = CY + Math.sin(angle) * r1;

        const dk = city.home ? COL.homeDark  : COL.handDark;
        const lt = city.home ? COL.homeLight : COL.handLight;
        const lw = city.home ? 2.5 : 1.5;

        /* Segment visible on DAY half */
        ctx.save();
        ctx.beginPath();
        ctx.rect(CX - R, CY - R, R * 2, R);
        ctx.clip();
        strokeLine(sx, sy, ex, ey, dk, lw);
        ctx.restore();

        /* Segment visible on NIGHT half */
        ctx.save();
        ctx.beginPath();
        ctx.rect(CX - R, CY, R * 2, R);
        ctx.clip();
        strokeLine(sx, sy, ex, ey, lt, lw);
        ctx.restore();
    }

    function strokeLine(x1, y1, x2, y2, colour, width) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = colour;
        ctx.lineWidth   = width;
        ctx.lineCap     = 'round';
        ctx.stroke();
    }

    /* ── Drawing: City Labels ───────────────────────────────── */

    function drawLabel(angle, city) {
        const lr  = R * 0.44;
        const lx  = CX + Math.cos(angle) * lr;
        const ly  = CY + Math.sin(angle) * lr;
        const day = ly < CY;

        const dk = city.home ? COL.homeDark  : COL.labelDark;
        const lt = city.home ? COL.homeLight : COL.labelLight;
        const fs = R * 0.055;

        ctx.save();
        ctx.translate(lx, ly);

        /* Flip text when hand points left so labels stay readable */
        let ta = angle;
        if (Math.cos(angle) < 0) ta += Math.PI;
        ctx.rotate(ta);

        ctx.font         = `700 ${fs}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = day ? dk : lt;
        ctx.fillText(city.name, 0, 0);
        ctx.restore();
    }

    /* ── Drawing: Centre Dot ────────────────────────────────── */

    function drawCentre() {
        ctx.beginPath();
        ctx.arc(CX, CY, R * 0.018, 0, Math.PI * 2);
        ctx.fillStyle = '#888';
        ctx.fill();
    }

    /* ── Main Render Loop ───────────────────────────────────── */

    function draw() {
        ctx.clearRect(0, 0, W, H);

        drawFace();
        drawTicks();
        drawNumbers();
        drawSunMoon();

        for (const c of CITIES) {
            const t = getTime(c.tz);
            const a = toAngle(t.h, t.m, t.s);
            drawHand(a, c);
            drawLabel(a, c);
        }

        drawCentre();
        requestAnimationFrame(draw);
    }

    /* ── Initialise ─────────────────────────────────────────── */

    window.addEventListener('resize', resize);
    resize();
    draw();

})();
