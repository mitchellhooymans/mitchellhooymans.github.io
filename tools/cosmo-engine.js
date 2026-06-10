/* =====================================================
   cosmo-engine.js
   Shared cosmology math engine used by:
     - tools/cosmology.html   (the calculator)
     - tools/spacetime.html   (the Davis & Lineweaver spacetime diagram)

   Exposes named globals (C_KM_S, MPC_PER_GLY, E, simpson, ...) AND a
   namespaced `Cosmo` object so consumers can pick whichever style they
   prefer. All numerics live here so the two tools never disagree.
   ===================================================== */

const C_KM_S = 299792.458;
const HUBBLE_TIME_GYR_FACTOR = 977.7922216807891;
const MPC_PER_GLY = 306.6013937;
const T_CMB_0 = 2.7255;

const PRESETS = {
  planck18: {
    H0: 67.4, OmegaM: 0.315, OmegaL: 0.685, w: -1,
    ref: 'Aghanim et al. 2020', refUrl: 'https://arxiv.org/abs/1807.06209',
    desc: 'Flat \u039BCDM, Planck 2018 TT,TE,EE+lowE+lensing.'
  },
  wmap9: {
    H0: 69.3, OmegaM: 0.286, OmegaL: 0.712, w: -1,
    ref: 'Hinshaw et al. 2013', refUrl: 'https://arxiv.org/abs/1212.5226',
    desc: 'WMAP 9-year flat \u039BCDM (WMAP-only).'
  },
  pantheon: {
    H0: 73.04, OmegaM: 0.334, OmegaL: 0.666, w: -1,
    ref: 'Brout et al. 2022', refUrl: 'https://arxiv.org/abs/2202.04077',
    desc: 'Pantheon+ &amp; SH0ES flat \u039BCDM (1701 SNe Ia, SH0ES H\u2080 anchor).'
  },
  desy5: {
    H0: 70.0, OmegaM: 0.352, OmegaL: 0.648, w: -1,
    ref: 'Vincenzi et al. 2024', refUrl: 'https://arxiv.org/abs/2401.02929',
    desc: 'DES SN5YR flat \u039BCDM (SN-only; H\u2080 marginalised, fiducial 70).'
  },
  desi: {
    H0: 68.52, OmegaM: 0.3027, OmegaL: 0.6973, w: -1,
    ref: 'Adame et al. 2024', refUrl: 'https://arxiv.org/abs/2404.03002',
    desc: 'DESI BAO Y1 + CMB flat \u039BCDM (constant w; the w\u2080w\u2090 fit is not represented here).'
  },
  eds: {
    H0: 70.0, OmegaM: 1.000, OmegaL: 0.000, w: -1,
    ref: 'Einstein \u0026 de Sitter 1932',
    desc: 'Flat, matter-only universe with closed-form analytic solutions.'
  },
  open: {
    H0: 70.0, OmegaM: 0.300, OmegaL: 0.000, w: -1,
    desc: 'Open universe (\u03A9_K \u003E 0) with matter only \u2014 pedagogical.'
  }
};

/* ---------- Friedmann expansion function ----------
   E(z) = H(z) / H0 for the wCDM family. Falls back to a tiny positive
   value if the parameters produce a non-physical (negative) inside, so
   integrators downstream don't NaN-out. */
function E(z, p) {
  const a1 = 1 + z;
  const matter = p.OmegaM * a1 * a1 * a1;
  const curvature = p.OmegaK * a1 * a1;
  const de = p.OmegaL * Math.pow(a1, 3 * (1 + p.w));
  const inside = matter + curvature + de;
  if (inside <= 0) return 1e-30;
  return Math.sqrt(inside);
}

/* ---------- Composite Simpson's rule ----------
   Uniform-grid Simpson with `n` (even) intervals. Caller is responsible
   for picking an appropriate substitution -- e.g. u = ln(1+z) when the
   range stretches to z >> 1, otherwise the low-z bulk is undersampled. */
function simpson(f, a, b, n) {
  if (b === a) return 0;
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * f(x);
  }
  return sum * h / 3;
}

/* ---------- Comoving radial distance D_C(z) ----------
   Linear-in-z Simpson with n=1000. Accurate to <0.1% for z <~ 50 in
   reasonable cosmologies. For very high z (z >>~ 1000) prefer the
   log-substitution helper below.                                    */
function comovingDistance(z, p) {
  if (z <= 0) return 0;
  const integrand = (zp) => 1 / E(zp, p);
  const c_H0 = C_KM_S / p.H0;
  return c_H0 * simpson(integrand, 0, z, 1000);
}

/* ---------- Comoving distance with log substitution ----------
   Uses u = ln(1+z) so the high-z tail of 1/E(z) is sampled evenly.
   This is what the spacetime diagram uses for D_p_now (z -> infinity)
   and for the CMB worldline (z ~ 1100).                              */
function comovingDistanceLog(z, p, n) {
  if (z <= 0) return 0;
  const integrand = (u) => Math.exp(u) / E(Math.exp(u) - 1, p);
  const c_H0 = C_KM_S / p.H0;
  return c_H0 * simpson(integrand, 0, Math.log(1 + z), n || 1000);
}

/* ---------- Lookback time t_L(z) ----------
   t_L = (1/H0) * int_0^z dz'/[(1+z')E(z')]. We substitute u = ln(1+z')
   so the (1+z')*dz' = du cancels with the e^u factor.                */
function lookbackTime(z, p) {
  if (z <= 0) return 0;
  const integrand = (u) => 1 / E(Math.exp(u) - 1, p);
  const tH = HUBBLE_TIME_GYR_FACTOR / p.H0;
  return tH * simpson(integrand, 0, Math.log(1 + z), 1000);
}

/* ---------- Age of universe at scale factor a ----------
   t(a) = (1/H0) * int_0^a da'/(a' E(a')). We integrate in u = -ln(a')
   from a huge upper bound down to ln(1/a). The exponential weighting
   suppresses the matter-era singularity nicely.                      */
function ageAtScaleFactor(aTarget, p) {
  if (aTarget <= 0) return 0;
  const uMin = -25;
  const uMax = Math.log(aTarget);
  if (uMax <= uMin) return 0;
  const integrand = (u) => 1 / E(Math.exp(-u) - 1, p);
  const tH = HUBBLE_TIME_GYR_FACTOR / p.H0;
  return tH * simpson(integrand, uMin, uMax, 1000);
}

function ageOfUniverse(p) {
  return ageAtScaleFactor(1, p);
}

/* ---------- Transverse comoving distance D_M(D_C) ----------
   Applies sinh / sin curvature correction (Hogg 1999 Eq. 16).        */
function transverseDistance(DC, p) {
  const dH = C_KM_S / p.H0;
  const ok = p.OmegaK;
  if (Math.abs(ok) < 1e-6) return DC;
  const sqrtOk = Math.sqrt(Math.abs(ok));
  const arg = sqrtOk * DC / dH;
  if (ok > 0) return (dH / sqrtOk) * Math.sinh(arg);
  return (dH / sqrtOk) * Math.sin(arg);
}

/* ---------- Hogg 1999 Eq. 19 relative D_M ----------
   D_M(z1,z2) constructed from D_M(0,z1) and D_M(0,z2) so the addition
   formula is correct in curved cosmologies as well as flat.          */
function relativeDM(DM1, DM2, p) {
  const dH = C_KM_S / p.H0;
  const ok = p.OmegaK;
  if (Math.abs(ok) < 1e-6) return DM2 - DM1;
  const t1 = Math.sqrt(1 + ok * (DM1 * DM1) / (dH * dH));
  const t2 = Math.sqrt(1 + ok * (DM2 * DM2) / (dH * dH));
  return DM2 * t1 - DM1 * t2;
}

/* ---------- Comoving volume V_C(D_M) ----------
   Closed-form Hogg 1999 Eq. 29 for flat / open / closed cases.       */
function comovingVolume(DM, p) {
  const dH = C_KM_S / p.H0;
  const ok = p.OmegaK;
  if (Math.abs(ok) < 1e-6) {
    return (4 / 3) * Math.PI * DM * DM * DM;
  }
  const x = DM / dH;
  const sqrtOk = Math.sqrt(Math.abs(ok));
  const inside = 1 + ok * x * x;
  if (ok > 0) {
    const term = (x / 2) * Math.sqrt(inside) - (1 / (2 * sqrtOk)) * Math.asinh(sqrtOk * x);
    return (4 * Math.PI * dH * dH * dH / ok) * term;
  } else {
    const insideSafe = inside < 0 ? 0 : inside;
    const term = (x / 2) * Math.sqrt(insideSafe) - (1 / (2 * sqrtOk)) * Math.asin(sqrtOk * x);
    return (4 * Math.PI * dH * dH * dH / ok) * term;
  }
}

function distanceModulus(DL_Mpc) {
  if (DL_Mpc <= 0) return -Infinity;
  return 5 * Math.log10(DL_Mpc * 1e6) - 5;
}

/* ---------- Bisection root finder ----------
   Generic monotone-increasing-in-z bisection used by the reverse-
   lookup tab in cosmology.html.                                       */
function bisectZ(target, calcFn, opts) {
  const o = Object.assign({ zLo: 0, zHi: 1500, tol: 1e-5, maxIter: 80 }, opts || {});
  let lo = o.zLo, hi = o.zHi;
  const fLo = calcFn(lo) - target;
  let fHi = calcFn(hi) - target;
  if (fLo > 0 && target >= 0) return null;
  if (fHi < 0) return null;
  for (let i = 0; i < o.maxIter; i++) {
    const mid = 0.5 * (lo + hi);
    const fMid = calcFn(mid) - target;
    if (Math.abs(fMid) < o.tol || (hi - lo) < 1e-8) return mid;
    if (fMid < 0) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/* Namespaced re-export for callers that prefer Cosmo.E(...) etc. */
const Cosmo = {
  C_KM_S, HUBBLE_TIME_GYR_FACTOR, MPC_PER_GLY, T_CMB_0,
  PRESETS,
  E, simpson,
  comovingDistance, comovingDistanceLog,
  lookbackTime, ageAtScaleFactor, ageOfUniverse,
  transverseDistance, relativeDM, comovingVolume,
  distanceModulus, bisectZ
};
