(function () {
    'use strict';

    /* ── City Configuration ─────────────────────────────────── */

    const CITIES = [
        { name: 'PORTLAND',  tz: 'America/Los_Angeles', home: true  },
        { name: 'BOSTON',    tz: 'America/New_York',    home: false },
        { name: 'SPAIN/POLAND',   tz: 'Europe/Madrid',       home: false },
        { name: 'SÃO PAULO', tz: 'America/Sao_Paulo', home: false },
        { name: 'PUNE',     tz: 'Asia/Kolkata',        home: false },
        { name: 'MANILA',   tz: 'Asia/Manila',         home: false },
    ];

    /* ── Home Location (for sunrise / sunset) ────────────────── */

    const HOME_LAT =  45.5152;   // Portland, OR
    const HOME_LNG = -122.6784;
    const HOME_TZ  = 'America/Los_Angeles';

    /* ── Colour Palette ─────────────────────────────────────── */

    const COL = {
        dayBg:      '#F0EDE5',
        nightBg:    '#181818',
        homeDark:   '#2B7BCE',
        homeLight:  '#5BB0EE',
        handDark:   '#888',
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

    /** Convert decimal hours (0–24) to canvas angle (radians). */
    function decimalToAngle(dec) {
        const hrs = ((dec - 12 + 24) % 24);
        return (hrs * 15 - 90) * Math.PI / 180;
    }

    /** Normalise angle to [0, 2π). */
    function normAngle(a) {
        const T = 2 * Math.PI;
        return ((a % T) + T) % T;
    }

    /** Midpoint of the clockwise arc from a → b. */
    function midAngle(a, b) {
        a = normAngle(a);
        b = normAngle(b);
        let diff = b - a;
        if (diff < 0) diff += 2 * Math.PI;
        return normAngle(a + diff / 2);
    }

    /** True when the given canvas angle falls in the day arc
     *  (between sunrise and sunset, clockwise through noon). */
    function isDay(angle) {
        const a = normAngle(angle);
        const r = sunAngles.rise;
        const s = sunAngles.set;
        if (r <= s) return a >= r && a <= s;
        return a >= r || a <= s;
    }

    /* ── Sunrise / Sunset — NOAA Solar Calculator ────────────── */

    let sunTimes  = { sunrise: 6, sunset: 18 };
    let sunAngles = {
        rise: normAngle(decimalToAngle(6)),
        set:  normAngle(decimalToAngle(18)),
    };

    /** Return the UTC offset (in minutes) for a given IANA timezone. */
    function getUtcOffsetMinutes(tz) {
        try {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                timeZoneName: 'longOffset',
            }).formatToParts(new Date());
            const tzp = parts.find(function (p) { return p.type === 'timeZoneName'; });
            if (tzp) {
                if (tzp.value === 'GMT') return 0;
                const m = tzp.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
                if (m) {
                    let mins = parseInt(m[2], 10) * 60 + (m[3] ? parseInt(m[3], 10) : 0);
                    if (m[1] === '-') mins = -mins;
                    return mins;
                }
            }
        } catch (_) { /* fall through to default */ }
        return 0;
    }

    /** Compute sunrise/sunset for HOME location using NOAA equations.
     *  Updates the sunTimes and sunAngles module-level variables. */
    function computeSunTimes() {
        var now = new Date();
        var D2R = Math.PI / 180;

        /* Date in home timezone */
        var dp = new Intl.DateTimeFormat('en-US', {
            timeZone: HOME_TZ,
            year: 'numeric', month: 'numeric', day: 'numeric',
        }).formatToParts(now);

        var yr, mo, dy;
        for (var i = 0; i < dp.length; i++) {
            if (dp[i].type === 'year')  yr = parseInt(dp[i].value, 10);
            if (dp[i].type === 'month') mo = parseInt(dp[i].value, 10);
            if (dp[i].type === 'day')   dy = parseInt(dp[i].value, 10);
        }

        /* Julian Day Number (Gregorian) */
        var y = yr, m = mo;
        if (m <= 2) { y--; m += 12; }
        var A  = Math.floor(y / 100);
        var B  = 2 - A + Math.floor(A / 4);
        var JD = Math.floor(365.25 * (y + 4716))
               + Math.floor(30.6001 * (m + 1))
               + dy + B - 1524.5;
        var JC = (JD - 2451545) / 36525;

        /* Sun geometry */
        var L0 = (280.46646 + JC * (36000.76983 + 0.0003032 * JC)) % 360;
        var M  = 357.52911 + JC * (35999.05029 - 0.0001537 * JC);
        var e  = 0.016708634 - JC * (0.000042037 + 0.0000001267 * JC);

        var C = Math.sin(M * D2R) * (1.914602 - JC * (0.004817 + 0.000014 * JC))
              + Math.sin(2 * M * D2R) * (0.019993 - 0.000101 * JC)
              + Math.sin(3 * M * D2R) * 0.000289;

        var omega  = 125.04 - 1934.136 * JC;
        var lambda = (L0 + C) - 0.00569 - 0.00478 * Math.sin(omega * D2R);

        var eps0 = 23 + (26 + (21.448 - JC * (46.815 + JC *
                   (0.00059 - JC * 0.001813))) / 60) / 60;
        var eps  = eps0 + 0.00256 * Math.cos(omega * D2R);

        /* Solar declination */
        var decl = Math.asin(Math.sin(eps * D2R) * Math.sin(lambda * D2R)) / D2R;

        /* Equation of time (minutes) */
        var y2  = Math.pow(Math.tan(eps * D2R / 2), 2);
        var EoT = y2 * Math.sin(2 * L0 * D2R)
                - 2 * e * Math.sin(M * D2R)
                + 4 * e * y2 * Math.sin(M * D2R) * Math.cos(2 * L0 * D2R)
                - 0.5 * y2 * y2 * Math.sin(4 * L0 * D2R)
                - 1.25 * e * e * Math.sin(2 * M * D2R);
        EoT *= 4 / D2R;

        /* Hour angle at official sunrise/sunset zenith */
        var zenith = 90.833;
        var cosHA  = Math.cos(zenith * D2R)
                   / (Math.cos(HOME_LAT * D2R) * Math.cos(decl * D2R))
                   - Math.tan(HOME_LAT * D2R) * Math.tan(decl * D2R);

        /* Edge cases: polar night / midnight sun */
        if (cosHA > 1)  { sunTimes = { sunrise: 12, sunset: 12 }; applySunAngles(); return; }
        if (cosHA < -1) { sunTimes = { sunrise: 0,  sunset: 24 }; applySunAngles(); return; }

        var HA = Math.acos(cosHA) / D2R;

        /* Solar noon (minutes from midnight UTC) */
        var noonUTC = 720 - 4 * HOME_LNG - EoT;
        var riseUTC = noonUTC - HA * 4;
        var setUTC  = noonUTC + HA * 4;

        /* Convert to local time */
        var off = getUtcOffsetMinutes(HOME_TZ);
        sunTimes = {
            sunrise: ((riseUTC + off) / 60 + 24) % 24,
            sunset:  ((setUTC  + off) / 60 + 24) % 24,
        };
        applySunAngles();
    }

    function applySunAngles() {
        sunAngles = {
            rise: normAngle(decimalToAngle(sunTimes.sunrise)),
            set:  normAngle(decimalToAngle(sunTimes.sunset)),
        };
    }

    /* ── Drawing: Clock Face ────────────────────────────────── */

    function drawFace() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, R, 0, Math.PI * 2);
        ctx.clip();

        /* Day background — full circle */
        ctx.fillStyle = COL.dayBg;
        ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

        /* Night wedge (sunset → sunrise, clockwise through midnight) */
        ctx.fillStyle = COL.nightBg;
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R, sunAngles.set, sunAngles.rise, false);
        ctx.closePath();
        ctx.fill();

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
        const fs = R * 0.144;
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

    /** Centroid distance from centre for a circular sector of given span. */
    function sectorCentroid(span) {
        if (span < 0.01) return R * 0.62;
        return (4 * R * Math.sin(span / 2)) / (3 * span);
    }

    function drawSunMoon() {
        const NOON     = -Math.PI / 2;   // top dead centre
        const MIDNIGHT =  Math.PI / 2;   // bottom dead centre
        const iconR    = R * 0.50;

        /* ☀ Sun — noon (top) */
        const sx = CX + Math.cos(NOON) * iconR;
        const sy = CY + Math.sin(NOON) * iconR;
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

        /* 🌙 Moon — midnight (bottom) */
        const mx = CX + Math.cos(MIDNIGHT) * iconR;
        const my = CY + Math.sin(MIDNIGHT) * iconR;
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

        /* Segment visible on DAY wedge (sunrise → sunset, clockwise) */
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R, sunAngles.rise, sunAngles.set, false);
        ctx.closePath();
        ctx.clip();
        strokeLine(sx, sy, ex, ey, dk, lw);
        ctx.restore();

        /* Segment visible on NIGHT wedge (sunset → sunrise, clockwise) */
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R, sunAngles.set, sunAngles.rise, false);
        ctx.closePath();
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
        const day = isDay(angle);

        const dk = city.home ? COL.homeDark  : COL.labelDark;
        const lt = city.home ? COL.homeLight : COL.labelLight;
        const fs = R * 0.080;

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
    computeSunTimes();
    setInterval(computeSunTimes, 3600000);   // recompute every hour
    draw();

})();
