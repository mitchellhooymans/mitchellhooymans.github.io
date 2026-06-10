# Cosmology Calculator — Method Notes & Verification

> **Purpose of this document.** This is a self-contained reference for the math, constants, and cosmology presets used in `tools/cosmology.html`. It is intended for a human reviewer (e.g. a collaborator from DES / DESI / OzDES) to cross-check before the tool is presented as accurate. Items flagged **VERIFY** require explicit confirmation that the convention chosen matches the reviewer's expectation.

Tool location: `tools/cosmology.html` (calculator) + `tools/spacetime.html` (Davis & Lineweaver spacetime diagram). Both load the shared math engine `tools/cosmo-engine.js`.
Last updated: 2026-05-26

---

## 1. Scope & Conventions

The engine implements distances, times, and observational quantities for a flat or curved-space **wCDM** model (Friedmann–Lemaître–Robertson–Walker, no radiation).

| Convention | Choice |
|---|---|
| Sign of `Ω_K` | `Ω_K = 1 − Ω_M − Ω_Λ`. `Ω_K > 0` → open (`k = −1`, hyperbolic). `Ω_K = 0` → flat. `Ω_K < 0` → closed (`k = +1`, spherical). |
| Dark energy | Constant equation of state `w`. No `w₀wₐCDM` (CPL). |
| Radiation density `Ω_R` | **Omitted.** Acceptable for `z ≲ 100`; not safe at recombination (`z ≈ 1100`) at percent accuracy. |
| Speed of light | `c = 299 792.458` km/s (exact, SI definition). |
| Year | Julian year (`365.25 d × 86 400 s = 3.1557×10⁷ s`). |
| CMB temperature | Hard-coded `T_CMB,0 = 2.7255 K` (Fixsen 2009). |

**VERIFY** that the `k` sign convention above matches whichever textbook your collaborator uses. The most common modern convention (Weinberg, Hogg) is `Ω_K = 1 − Ω_total` with `k = −sign(Ω_K)`. This is what the calculator uses.

---

## 2. Inputs and defaults

| Symbol | UI ID | Default | Slider range | Hard input range | Meaning |
|---|---|---|---|---|---|
| `H₀` | `H0-input` | 67.4 | 20 – 100 | 20 – 100 | Hubble constant, km/s/Mpc |
| `Ω_M` | `OmegaM-input` | 0.315 | 0 – 2 | 0 – 2 | Present-day matter density |
| `Ω_Λ` | `OmegaL-input` | 0.685 | 0 – 2 | 0 – 2 | Present-day dark-energy density |
| `Ω_K` | `OmegaK-display` | 0 (auto) | — | — | `1 − Ω_M − Ω_Λ`, read-only |
| `w` | `w-input` | −1 | −2 – 0 | −3 – +1 | Dark-energy equation of state |
| `z₁` | `z1-input` | 0 | — | ≥ 0 | Observer redshift |
| `z₂` | `z2-input` | 1.5 | — | ≥ 0 | Target/source redshift |

Validation: `H₀ > 0`, `z₁, z₂ ≥ 0`, `z₂ ≥ z₁`. Otherwise the page shows a banner and skips the recompute.

---

## 3. Constants used

| Constant | Value used | Source / status |
|---|---|---|
| `c` | `299 792.458` km/s | exact, SI |
| `1 Mpc` | `3.0857 × 10¹⁹` km | CODATA |
| `1 yr` | `3.1557 × 10⁷` s | Julian year |
| `1/H₀` in Gyr (when `H₀ = 1 km/s/Mpc`) | `977.7922216807891` Gyr | derived: `(1 Mpc in km) / (1 yr in s × 10⁹)` |
| `1 Gly` | `306.6014` Mpc | derived from `c × 10⁹ yr` |
| `T_CMB,0` | `2.7255` K | Fixsen 2009 (arXiv:0911.1955) |
| `1 arcsecond` | `1/206 264.806 247 1` rad | conversion |

The Hubble-time factor `977.79…` is internally `HUBBLE_TIME_GYR_FACTOR` in the code. Verify against your preferred reference if needed:

```
(1 Mpc in km) / (1 yr in s)
  = 3.0857 × 10¹⁹ / 3.1557 × 10⁷
  = 9.7779 × 10¹¹ yr per (km/s/Mpc)⁻¹
  = 977.79 Gyr per (km/s/Mpc)⁻¹.
```

---

## 4. Core equations

All equations follow Hogg 1999 (arXiv:astro-ph/9905116) except where noted.

### 4.1 Expansion function `E(z)`

```
E(z) = sqrt[ Ω_M (1+z)³ + Ω_K (1+z)² + Ω_Λ (1+z)^{3(1+w)} ]
```

Hubble parameter at `z`: `H(z) = H₀ · E(z)`.
Hubble distance: `D_H = c / H₀`.
Hubble time: `t_H = 1 / H₀`.

### 4.2 Comoving radial distance `D_C(z)` — Hogg Eq. 14

```
D_C(z) = (c / H₀) · ∫₀ᶻ dz' / E(z')
```

### 4.3 Transverse comoving distance `D_M(z)` — Hogg Eqs. 16–17

```
                ⎧  D_H / √Ω_K  · sinh( √Ω_K  · D_C / D_H )   if Ω_K > 0
D_M(z)  =  ⎨  D_C                                              if Ω_K = 0
                ⎩  D_H / √|Ω_K| · sin ( √|Ω_K| · D_C / D_H )   if Ω_K < 0
```

The code uses `|Ω_K| < 10⁻⁶` as the "flat" tolerance.

### 4.4 Angular-diameter distance — Hogg Eq. 18

```
D_A(z) = D_M(z) / (1 + z)
```

### 4.5 Luminosity distance — Hogg Eq. 21

```
D_L(z) = D_M(z) · (1 + z)
```

### 4.6 Comoving volume `V_C` — Hogg Eq. 29

For `Ω_K = 0`:

```
V_C = (4π / 3) · D_M³
```

For `Ω_K > 0` (open):

```
V_C = (4π D_H³ / 2 Ω_K) · { (D_M/D_H) √[1 + Ω_K (D_M/D_H)²]
                          − (1/√Ω_K) · asinh[√Ω_K · D_M/D_H] }
```

For `Ω_K < 0` (closed):

```
V_C = (4π D_H³ / 2 Ω_K) · { (D_M/D_H) √[1 + Ω_K (D_M/D_H)²]
                          − (1/√|Ω_K|) · asin[√|Ω_K| · D_M/D_H] }
```

Output is converted to Gpc³.

### 4.7 Lookback time

```
t_L(z) = (1 / H₀) · ∫₀ᶻ dz' / [ (1 + z') · E(z') ]
```

Implemented with the substitution `u = ln(1+z)` for numerical stability:

```
t_L(z) = t_H · ∫₀^{ln(1+z)} du / E(z(u)),   where z(u) = exp(u) − 1.
```

### 4.8 Age of the universe at scale factor `a`

```
t(a) = (1 / H₀) · ∫₀ᵃ da' / [ a' · E(z(a')) ],   where z(a) = 1/a − 1.
```

Implemented with the substitution `u = ln(a)`:

```
t(a) = t_H · ∫_{u_min}^{ln(a)} du / E(z(u)),   where z(u) = exp(−u) − 1.
```

The lower bound is `u_min = −25`, i.e. `a_min ≈ 1.39 × 10⁻¹¹` (z ≈ 7 × 10¹⁰). For standard cosmologies the integrand decays as `e^{3u/2}` at small `a`, so the cutoff contributes well below floating-point precision.

`t₀ = t(a = 1)`. Age at `z₂` is `t₀ − t_L(z₂)`. Both are reported; they agree to a few microseconds for `z₂ ≲ 100`.

### 4.9 Distance modulus

```
μ = 5 · log₁₀(D_L / Mpc) + 25
```

equivalent to the alternative form `μ = 5 log₁₀(D_L / pc) − 5`.

### 4.10 Surface-brightness dimming

```
dimming = (1 + z)⁴
```

### 4.11 Physical scale (kpc / arcsec)

```
scale = D_A · 1000 / 206 264.806 247
```

(`D_A` in Mpc → kpc; divide by arcseconds per radian.)

### 4.12 CMB temperature

```
T_CMB(z) = 2.7255 · (1 + z) K
```

### 4.13 Wavelength redshift

```
λ_obs = λ_emit · (1 + z₂)
```

(`z₂` is the redshift used by the converter card in the Advanced tab.)

### 4.14 Relative distances between two redshifts

`z₁` is the observer redshift, `z₂` the source. The card auto-greys out for `z₁ = 0`.

- Comoving radial:

```
D_C(z₁, z₂) = D_C(z₂) − D_C(z₁)
```

- Transverse, flat (`Ω_K = 0`):

```
D_M(z₁, z₂) = D_M(z₂) − D_M(z₁)
```

- Transverse, curved — **Hogg Eq. 19**:

```
D_M(z₁, z₂) =   D_M(z₂) · √[1 + Ω_K · D_M(z₁)² / D_H²]
              − D_M(z₁) · √[1 + Ω_K · D_M(z₂)² / D_H²]
```

- Angular-diameter:

```
D_A(z₁, z₂) = D_M(z₁, z₂) / (1 + z₂)
```

- Luminosity (**VERIFY** convention — see §9.3):

```
D_L(z₁, z₂) = D_M(z₁, z₂) · (1 + z₂) / (1 + z₁)
```

---

## 5. Numerical methods

| Step | Method | Settings |
|---|---|---|
| `∫ dz'/E(z')` (comoving) | Composite Simpson's rule | n = 1000 sub-intervals |
| `∫ du/E` (lookback) | Simpson, in `u = ln(1+z)` | n = 1000 |
| `∫ du/E` (age) | Simpson, in `u = ln(a)`, `a ∈ [e⁻²⁵, 1]` | n = 1000 |
| Comoving volume | closed-form (Hogg Eq. 29) | — |
| Reverse lookup (`z` from `t_L`, `D_L`, `D_C`, `D_A`, age) | monotonic bisection | tol = 10⁻⁵, max 80 iterations, search range `z ∈ [0, 1500]` |
| Hubble diagram plot | recomputed each parameter change | 120 sample points to `z_max = max(3, 1.25 z₂ + 0.2)` |
| Distance-modulus plot | log-spaced sampling in `z` | 140 points from `z = 0.01` to `z_max` |
| Scale-factor plot | log-spaced sampling in `a` from 10⁻³ to 1 | 80 points + explicit `(t=0, a=0)` |
| Lookback plot | linear sampling | 120 points |

Simpson with `n = 1000` gives ~6-digit precision on the distance integrals for any standard cosmology. Reverse lookups converge in <40 iterations for typical targets.

---

## 6. Cosmology presets

Each preset triggers `H₀`, `Ω_M`, `Ω_Λ`, `w` updates only. `Ω_K` is derived. `z₁`, `z₂` are not changed by a preset.

### 6.1 Planck 2018 (CMB)

- **Citation:** Aghanim et al. (Planck Collaboration) 2020, *A&A* 641, A6 — arXiv:1807.06209
- **Combination used:** TT,TE,EE+lowE+lensing (the standard "Planck 2018 baseline")
- **Values entered:** `H₀ = 67.4`, `Ω_M = 0.315`, `Ω_Λ = 0.685`, `w = −1`
- **Paper values:** `H₀ = 67.36 ± 0.54`, `Ω_M = 0.3153 ± 0.0073` (Table 2, last column)
- **VERIFY:** rounding to one decimal place on `H₀` and three on `Ω_M`.

### 6.2 WMAP 9-year (CMB)

- **Citation:** Hinshaw et al. 2013, *ApJS* 208, 19 — arXiv:1212.5226
- **Combination used:** `WMAP9 + eCMB + BAO + H₀` (the "WMAP9 best-fit" tabulated by NASA LAMBDA)
- **Values entered:** `H₀ = 69.3`, `Ω_M = 0.286`, `Ω_Λ = 0.712`, `w = −1`
- **Paper values:** `H₀ = 69.32 ± 0.80`, `Ω_M = 0.2865 ± 0.0096` (Table 2)
- **VERIFY:** I used the **`WMAP9 + ext`** combination, not WMAP-only. WMAP-only is `H₀ = 70.0, Ω_M = 0.279, Ω_Λ = 0.721`. Dropdown label currently says only "WMAP 9-year"; decide whether to rename to "WMAP9 + ext" or change values to WMAP-only.

### 6.3 Pantheon+ & SH0ES (SN Ia + Cepheid anchor)

- **Citation:** Brout et al. 2022, *ApJ* 938, 110 — arXiv:2202.04077
- **Combination used:** Pantheon+ SNe Ia anchored by SH0ES, Flat ΛCDM
- **Values entered:** `H₀ = 73.04`, `Ω_M = 0.334`, `Ω_Λ = 0.666`, `w = −1`
- **Paper values:** `H₀ = 73.04 ± 1.04`, `Ω_M = 0.334 ± 0.018` (Table 3, "Pantheon+ & SH0ES" row, Flat ΛCDM column)
- **VERIFY:** these are the joint values. Pantheon+ alone gives the same `Ω_M` but does not constrain `H₀`.

### 6.4 DES SN5YR (SN Ia, DES collaboration)

- **Citation:** Vincenzi et al. (DES Collaboration) 2024 — arXiv:2401.02929
- **Combination used:** DES-SN5YR alone, Flat ΛCDM
- **Values entered:** `H₀ = 70.0`, `Ω_M = 0.352`, `Ω_Λ = 0.648`, `w = −1`
- **Paper value:** `Ω_M = 0.352 ± 0.017` (Section 7, Flat ΛCDM)
- **`H₀ = 70.0` is a fiducial.** The DES-SN5YR-alone fit marginalises over `H₀` (it is absorbed into the SN absolute magnitude `M`). The reported `Ω_M` is independent of the fiducial.
- **VERIFY (this is the most important one):** is `H₀ = 70` the fiducial your group expects, or do you prefer `67.4` (joint with Planck) or `73.04` (joint with SH0ES)? The preset description in the page mentions this, but the value is still presented as a number and will be used in distance outputs.

### 6.5 DESI BAO Y1 + CMB

- **Citation:** Adame et al. (DESI Collaboration) 2024, "DESI 2024 VI" — arXiv:2404.03002
- **Combination used:** DESI Y1 BAO + Planck CMB, Flat ΛCDM
- **Values entered:** `H₀ = 68.52`, `Ω_M = 0.3027`, `Ω_Λ = 0.6973`, `w = −1`
- **Paper values:** `H₀ = 68.52 ± 0.62`, `Ω_M = 0.3027 ± 0.0086` (Table 3, "DESI BAO + CMB" row, Flat ΛCDM)
- **Important caveat:** this is the **constant-`w` ΛCDM** fit. DESI's headline finding of evolving dark energy (`w₀ ≈ −0.86, wₐ ≈ −0.4`, ~`2.5σ` from `w = −1`) uses the `w₀wₐCDM` (CPL) parameterisation, which **is not supported by this engine**. Setting `w = w₀` is *not* equivalent.

### 6.6 Einstein-de Sitter (toy / pedagogical)

- Flat, matter-only universe with closed-form analytic solutions.
- Values: `H₀ = 70.0`, `Ω_M = 1.000`, `Ω_Λ = 0.000`, `w = −1` (irrelevant for `Ω_Λ = 0`).
- Used in sanity checks (§ 7).

### 6.7 Open (toy / pedagogical)

- Open universe with matter only, no dark energy.
- Values: `H₀ = 70.0`, `Ω_M = 0.300`, `Ω_Λ = 0.000`, `w = −1`.
- `Ω_K = 0.700`. Tests the `sinh` branch of `D_M`.

---

## 7. Sanity-check tests

These tests were run during development against analytic / published values. Reviewer can re-run by loading the page, entering each preset/z, and comparing the outputs.

### 7.1 Planck 2018 outputs

Set Planck 2018 preset; `z₁ = 0`, `z₂ = 1.5`:

| Quantity | Calculator | Reference / expected |
|---|---|---|
| `c / H₀` (Hubble distance) | 4 447.96 Mpc | exact |
| `D_C(1.5)` | 4 482.10 Mpc | ~4 482 Mpc (NED) |
| `D_A(1.5)` | 1 792.84 Mpc | ~1 793 Mpc |
| `D_L(1.5)` | 11 205.24 Mpc | ~11 200 Mpc |
| Lookback time `t_L(1.5)` | 9.532 Gyr | ~9.53 Gyr |
| Age of universe `t₀` | 13.796 Gyr | 13.79 Gyr (Planck18) |

### 7.2 Einstein–de Sitter analytic checks

Set EdS preset; `H₀ = 70`:

| Quantity | Calculator | Analytic | Status |
|---|---|---|---|
| `D_C(1)` | 2 508.78 Mpc | `(c/H₀)·2·(1 − 1/√2) = 2 508.78` | exact |
| `t₀` | 9.312 Gyr | `2 / (3 H₀)` Gyr `= 9.312` | exact |
| `t_L(1)` | 6.020 Gyr | `(2/(3H₀)) · (1 − 1/2^{3/2}) = 6.020` | exact |

### 7.3 Curvature handling

Open (toy preset), `z = 2`:

| Quantity | Calculator | Expectation |
|---|---|---|
| `D_C(2)` | 4 244.25 Mpc | — |
| `D_M(2)` | 4 747.54 Mpc | > `D_C` (sinh branch active) ✓ |
| `t₀` | 11.298 Gyr | sensible for open universe |

Closed (custom: `Ω_M = 0.5, Ω_Λ = 0.7 → Ω_K = −0.2`), `z = 1`:

| Quantity | Calculator | Expectation |
|---|---|---|
| `D_C(1)` | 3 131.21 Mpc | — |
| `D_M(1)` | 3 075.71 Mpc | < `D_C` (sin branch) ✓ |

### 7.4 Hogg Eq. 19 (relative `D_M` in curved space)

Open (toy preset), `z₁ = 0.5`, `z₂ = 1.5`:

| Method | Value | Comment |
|---|---|---|
| Naive `D_M(z₂) − D_M(z₁)` | 2 208 Mpc | wrong in curved space |
| **Hogg Eq. 19** | **1 977 Mpc** | what the calculator uses ✓ |

### 7.5 High-redshift convergence

Planck 2018:

| Quantity | Calculator | Expected |
|---|---|---|
| Age at `z = 10` (= `t₀ − t_L(10)`) | 0.4722 Gyr | ~0.475 Gyr (NED) |
| `t_L(1000)` vs `t₀` | difference 0.0005 Gyr | should approach 0 ✓ |

---

## 8. Outputs reported by the calculator

**Calculator tab:**

| Group | Output | Source |
|---|---|---|
| Expansion | `E(z₂)`, `H(z₂)`, `D_H = c/H₀`, `t_H = 1/H₀` | §4.1 |
| Distances (Earth → `z₂`) | `D_C`, `D_M`, `D_A`, `D_L`, light-travel `= c · t_L`, comoving volume `V_C` | §4.2–4.6 |
| Times | `t₀`, `t_L(z₂)`, age at `z₂`, percent of `t₀` | §4.7–4.8 |
| Observational | `kpc/arcsec`, `μ`, `(1+z)⁴` dimming, `T_CMB(z₂)` | §4.9–4.12 |
| Relative (`z₁ → z₂`) | `D_C, D_M, D_A, D_L` | §4.14 |

**Visualize tab:** energy budget (stacked bar + pills), `D_L(z)`, `μ(z)` (log-x), `a(t)`, `t_L(z)`.

**Batch tab:** table of `D_C, D_M, D_A, D_L, t_L, age(z), μ, kpc/arcsec` per `z` + annotated CSV (header includes cosmology used).

**Advanced tab:** reverse lookup (bisection for `t_L`, `D_L`, `D_C`, `D_A`, or age), rest-frame ↔ observed wavelength converter, references.

---

## 9. Things to verify with your collaborator

These are the items where conventions could legitimately differ between groups. None of them are bugs per se — they are choices.

### 9.1 `H₀` fiducial for DES SN5YR preset

Currently **70.0 km/s/Mpc** (common SN convention). Alternatives:

- `67.4` (joint with Planck CMB) — gives the canonical DES-SN5YR + CMB combined cosmology.
- `73.04` (joint with SH0ES) — late-universe anchor.

Distance values scale as `1/H₀`. If your collaborator expects `67.4`, change `PRESETS.desy5.H0` in `tools/cosmology.html`.

### 9.2 WMAP9 combination

Currently `H₀ = 69.3, Ω_M = 0.286, Ω_Λ = 0.712` = **WMAP9 + ext** (Hinshaw+13 Table 2 best-fit). Many people expect WMAP-only when a preset just says "WMAP9". WMAP-only values are `H₀ = 70.0, Ω_M = 0.279, Ω_Λ = 0.721`.

### 9.3 Relative `D_L(z₁, z₂)` convention

Currently `D_L(z₁, z₂) = D_M(z₁, z₂) · (1+z₂) / (1+z₁)`.

This is the standard SN-cosmology convention (observer at `z₁` looks at source at `z₂`; the analogue of `D_L(z) = D_M · (1+z)` for `z₁ = 0`). It is **not given explicitly by Hogg 1999**.

Some lensing time-delay applications use `D_L(z₁, z₂) = D_M(z₁, z₂) · (1+z₂)² / (1+z₁)`. The reciprocity theorem also gives variations. Verify which convention is wanted.

### 9.4 No radiation density

`Ω_R = 0`. Acceptable for the redshift range targeted (`z ≲ 100`). For percent-level accuracy near recombination, a radiation term

```
Ω_R(z) = Ω_R,0 · (1+z)⁴,  with Ω_R,0 ≈ 9.2 × 10⁻⁵
```

would need to be added inside the square root of `E(z)`.

### 9.5 Constant `w` only

`w₀wₐCDM` (CPL) is not implemented. If your group regularly tests DESI's evolving-DE result, the engine needs:

```
E²(z) = Ω_M (1+z)³ + Ω_K (1+z)² + Ω_Λ · (1+z)^{3(1+w₀+wₐ)} · exp[−3 wₐ z / (1+z)]
```

with an additional `w_a` slider. (I can add this on request.)

### 9.6 `T_CMB,0` is hard-coded

Fixed at 2.7255 K. If you want it user-configurable for sensitivity tests, expose it as an input.

### 9.7 Sign of `k` vs `Ω_K`

The UI labels:

- "open (k = −1)" when `Ω_K > 0`
- "closed (k = +1)" when `Ω_K < 0`

This is consistent with Hogg 1999 and Weinberg. Some other texts (e.g. Peebles) define `k = +1/0/−1` with the opposite sign relative to `Ω_K`. Confirm preferred labelling.

### 9.8 Age integral lower cutoff

`u_min = ln(a_min) = −25` (i.e. `a ≈ 1.4 × 10⁻¹¹`, `z ≈ 7 × 10¹⁰`). The integrand is `≲ 10⁻¹⁶` at this point for any standard cosmology, so the truncation error is below double-precision noise. If you ever want to integrate into the radiation-dominated era you would need both a radiation term and a more careful lower limit; for typical `z < 1000` work this is invisible.

### 9.9 Distance modulus formula

Using `μ = 5 log₁₀(D_L / Mpc) + 25`. Equivalent to the common form `μ = 5 log₁₀(D_L / pc) − 5`. Confirm with collaborator that both forms are recognised as equivalent.

---

## 10. References (full list)

1. **Adame, A. G. et al.** (DESI Collaboration) 2024. *DESI 2024 VI: Cosmological Constraints from the Measurements of Baryon Acoustic Oscillations.* arXiv:[2404.03002](https://arxiv.org/abs/2404.03002).
2. **Aghanim, N. et al.** (Planck Collaboration) 2020. *Planck 2018 results. VI. Cosmological parameters.* A&A 641, A6. arXiv:[1807.06209](https://arxiv.org/abs/1807.06209).
3. **Brout, D. et al.** 2022. *The Pantheon+ Analysis: Cosmological Constraints.* ApJ 938, 110. arXiv:[2202.04077](https://arxiv.org/abs/2202.04077).
4. **Fixsen, D. J.** 2009. *The Temperature of the Cosmic Microwave Background.* ApJ 707, 916. arXiv:[0911.1955](https://arxiv.org/abs/0911.1955).
5. **Hinshaw, G. et al.** 2013. *Nine-Year WMAP Observations: Cosmological Parameter Results.* ApJS 208, 19. arXiv:[1212.5226](https://arxiv.org/abs/1212.5226).
6. **Hogg, D. W.** 1999. *Distance Measures in Cosmology.* arXiv:[astro-ph/9905116](https://arxiv.org/abs/astro-ph/9905116).
7. **Riess, A. G. et al.** 2022. *A Comprehensive Measurement of the Local Value of the Hubble Constant.* ApJL 934, L7. arXiv:[2112.04510](https://arxiv.org/abs/2112.04510).
8. **Vincenzi, M. et al.** (DES Collaboration) 2024. *The Dark Energy Survey Supernova Programme: Cosmological Analysis.* arXiv:[2401.02929](https://arxiv.org/abs/2401.02929).
9. **Wright, E. L.** 2006. *A Cosmology Calculator for the World Wide Web.* PASP 118, 1711. arXiv:[astro-ph/0609593](https://arxiv.org/abs/astro-ph/0609593).

---

## 11. Implementation pointers (for code review)

Engine code lives in `tools/cosmo-engine.js`, loaded as `<script src="cosmo-engine.js"></script>` by both `tools/cosmology.html` and `tools/spacetime.html`. Key functions and where they originate:

| Function | Purpose | File |
|---|---|---|
| `E(z, p)` | expansion function | `cosmo-engine.js` |
| `simpson(f, a, b, n)` | composite Simpson's rule | `cosmo-engine.js` |
| `comovingDistance(z, p)` | `D_C(z)`, linear-in-`z` Simpson, `n = 1000` | `cosmo-engine.js` |
| `comovingDistanceLog(z, p, n)` | `D_C(z)` with `u = ln(1+z)` substitution — used by the spacetime diagram and for `z ≳ 10³` work | `cosmo-engine.js` |
| `transverseDistance(D_C, p)` | sinh/linear/sin branch of `D_M` | `cosmo-engine.js` |
| `relativeDM(D_M1, D_M2, p)` | Hogg Eq. 19 | `cosmo-engine.js` |
| `comovingVolume(D_M, p)` | `V_C` per Hogg Eq. 29 | `cosmo-engine.js` |
| `lookbackTime(z, p)` | `t_L(z)` via `ln(1+z)` substitution | `cosmo-engine.js` |
| `ageAtScaleFactor(a, p)` | `t(a)` via `ln(a)` substitution | `cosmo-engine.js` |
| `ageOfUniverse(p)` | `t(a = 1)` | `cosmo-engine.js` |
| `distanceModulus(D_L)` | `μ = 5 log₁₀(D_L · 10⁶) − 5` (equivalent to `5 log₁₀(D_L / Mpc) + 25`) | `cosmo-engine.js` |
| `bisectZ(target, calcFn, opts)` | reverse-lookup root finder | `cosmo-engine.js` |
| `PRESETS` | dictionary of all preset cosmologies (single source of truth for both tools) | `cosmo-engine.js` |
| `drawSpacetime()` | Davis & Lineweaver-style spacetime diagram (uses all of the above) | `tools/spacetime.html` |

Everything is also re-exported under the namespace `Cosmo` (e.g. `Cosmo.E`, `Cosmo.comovingDistance`, `Cosmo.PRESETS`) for callers that prefer to avoid the global symbol table.

All math runs in the browser; no network calls. As of 2026-05-26 the engine has been factored out of `cosmology.html` into a shared file `tools/cosmo-engine.js` that is loaded by both the calculator and `tools/spacetime.html` (the Davis & Lineweaver-style spacetime diagram). All function names and signatures listed above are unchanged.

---

## 12. Further reading & study guide

If you (or a reviewer) want to brush up on the cosmology behind the engine, the table below maps each equation in §4 to its standard treatment in **Andrew Liddle, *An Introduction to Modern Cosmology*, 3rd ed. (Wiley, 2015)**. Chapter numbers refer to the 3rd edition; the 2nd edition is similar but lacks the dark-energy advanced topic. Complementary papers are listed in §12.4 for the few places where Liddle is intentionally light.

### 12.1 Tier 1 — Core: what every line in the engine is doing

| Liddle chapter | What it gives you | Maps to |
|---|---|---|
| Ch. 3 — Newtonian Gravity | Newtonian derivation of the Friedmann equation; critical density `ρ_c` | The origin of `E(z)`; the meaning of `Ω = ρ/ρ_c` |
| Ch. 4 — The Geometry of the Universe | FLRW metric, scale factor `a(t)`, `k = −1/0/+1`, comoving vs proper distance | The entire spacetime-diagram x-axis (comoving) and y-axis (cosmic time); why galaxy worldlines are vertical |
| Ch. 5 — Simple Cosmological Models | Closed-form solutions for matter-only (EdS), radiation-only, empty universes | Sanity checks for the age and distance integrals (cross-check against §7.2 of this document) |
| Ch. 6 — Observational Parameters | `H₀`, `Ω₀`, deceleration `q₀`, definitions of distance measures | The `H₀`, `Ω_M`, `Ω_Λ` sliders and the foundation for `D_C`/`D_L`/`D_A` |
| Ch. 7 — The Cosmological Constant | `Λ` as a fluid with `w = −1`; ΛCDM equations; flat-ΛCDM age formula | The `Ω_Λ` slider; why the Planck 2018 preset behaves the way it does |
| Ch. 8 — The Age of the Universe | The age integral `∫ da/(a H)`, Hubble time vs actual age, EdS vs ΛCDM ages | The `ageAtScaleFactor` integrand and the `t₀` outputs |

A reasonable one-afternoon spine is **3 → 4 → 6 → 7 → 8**. That sequence covers everything encoded in `E(z)` and the four big integrals.

### 12.2 Tier 2 — The pieces around it

| Liddle chapter | Why it's worth a pass |
|---|---|
| Ch. 9 — The Density of the Universe and Dark Matter | Provenance of the `Ω_M` values in the Planck/WMAP/DES/DESI presets (lensing, dynamics, clustering) |
| Ch. 10 — The Cosmic Microwave Background | What "the CMB worldline at `z ≈ 1100`" means physically; why `D_C(1100) ≈ 45 Glyr` is the radius of our observable universe |
| Ch. 2 — Observational Overview | Distance ladder, redshift surveys, what SNe Ia actually measure — useful when explaining the calculator to colleagues |

### 12.3 Tier 3 — Advanced topics most relevant to SN / DESI / DES work

| Liddle advanced topic | Why it matters |
|---|---|
| Adv. Topic 2 — Classical Cosmology: Distances and Luminosities | Proper derivations of `D_L`, `D_A`, `D_M`, `μ = 5 log₁₀(D_L/10 pc)`, the `(1+z)` factors, and the angular-diameter-distance turnover. Read alongside §4 of this document. |
| Adv. Topic 4 — Dark Energy | `w` as the equation-of-state parameter, the `w₀wₐ` (CPL) parameterisation, what Pantheon+/DES/DESI actually constrain. **Read before turning the `w` slider away from `−1`** — and before extending the engine per §9.5. |
| Adv. Topic 1 — General Relativistic Cosmology | Optional: derives the Friedmann equation from GR rather than Newton, and clarifies what "expansion of space" means in the comoving frame the spacetime diagram is plotted in. |

### 12.4 What Liddle does not cover well (complementary reading)

The spacetime diagram, the kinematic/GR interpretation of redshift, and the more practical distance formulae each have a dedicated paper that is shorter and more pointed than any textbook treatment.

| Paper | What it adds |
|---|---|
| **Davis & Lineweaver 2004**, *Expanding Confusion: Common Misconceptions of Cosmological Horizons and the Superluminal Expansion of the Universe*, PASA 21, 97. arXiv:[astro-ph/0310808](https://arxiv.org/abs/astro-ph/0310808). | The paper the spacetime tool is named after. Figure 1 is exactly what `tools/spacetime.html` renders; sections 3–4 disentangle particle / event / Hubble horizons. **Required reading** for anyone using the spacetime tool seriously. |
| **D. W. Hogg 1999**, *Distance Measures in Cosmology*, arXiv:[astro-ph/9905116](https://arxiv.org/abs/astro-ph/9905116). | Six pages. Every formula in §4 of this document is in there. Treat it as a function-reference for Liddle Ch. 6 / Adv. Topic 2. |
| **Bunn & Hogg 2009**, *The kinematic origin of the cosmological redshift*, AJP 77, 688. arXiv:[0808.1081](https://arxiv.org/abs/0808.1081). | The kinematic interpretation of redshift; clarifies in what sense (and in what sense not) the recession of distant galaxies is "motion". Liddle stays away from this debate. |
| **Davis, Lineweaver & Webb 2003**, *Solutions to the tethered galaxy problem within the Friedmann–Lemaître–Robertson–Walker universe*, AJP 71, 358. arXiv:[astro-ph/0104349](https://arxiv.org/abs/astro-ph/0104349). | Short, conceptually clarifying companion to Davis & Lineweaver 2004 — what happens to a galaxy you "release" from a comoving position. |

### 12.5 A concrete one-week brush-up plan

If you want a structured pass rather than a buffet:

| Day | Reading | Hands-on check |
|---|---|---|
| 1 | Liddle Ch. 3 + Ch. 4 | Re-derive the Friedmann equation; sketch the three FLRW geometries (open / flat / closed). |
| 2 | Liddle Ch. 5 + Ch. 6 | Apply the **EdS** preset in the calculator; verify the closed-form answer `a(t) ∝ t^{2/3}`, `t₀ = 2 / (3 H₀)` against the `t₀` pill (§7.2). |
| 3 | Liddle Ch. 7 + Ch. 8 | Compute the flat-ΛCDM age formula by hand for Planck 2018; compare against the tool's `t₀` (should be `13.80 Gyr`, §7.1). |
| 4 | Liddle Adv. Topic 2 (Distances) | Open this document side-by-side with the textbook and verify each formula in §4 of the doc against the textbook derivation. |
| 5 | Davis & Lineweaver 2004 §3–4 (horizons) | Open `tools/spacetime.html`. Reproduce DL2004 Figure 1 panels by toggling the layer checkboxes. |
| 6 | Liddle Adv. Topic 4 + Hogg 1999 | Sets you up for the `w₀wₐ` engine extension (§9.5). Hogg is the function-reference. |
| 7 | Catch-up + Bunn & Hogg 2009 + Davis, Lineweaver & Webb 2003 | These crystallise the interpretive picture rather than the maths. |

### 12.6 Once Liddle starts feeling thin

The natural next-step textbook (and the one most observational cosmologists end up living in) is **Dodelson & Schmidt, *Modern Cosmology*, 2nd ed. (Academic Press, 2021)** — deeper on CMB analysis, large-scale structure, dark-energy parameterisations, and the statistical machinery of survey cosmology. Mukhanov's *Physical Foundations of Cosmology* (CUP, 2005) is the more mathematical companion. Neither replaces Liddle for first-pass intuition; both improve on it for actual research-grade work.

