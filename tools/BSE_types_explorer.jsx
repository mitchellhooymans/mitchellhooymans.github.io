import React, { useState, useMemo, useCallback } from 'react';

/*
 * BSE Stellar Evolution Explorer
 * Physics grounded in:
 *   - Hurley, Pols & Tout (2000) MNRAS 315, 543 — SSE formulae
 *   - Hurley, Tout & Pols (2002) MNRAS 329, 897 — BSE algorithm
 *   - Breivik et al. (2020) ApJ 898, 71 — COSMIC
 *
 * Evolution paths follow Figure 19 of Hurley et al. (2002)
 * k-type assignments follow Section 4 of Hurley et al. (2000)
 */

// ─── Physically-grounded BSE stellar type data ───
const bseTypes = [
  {
    id: 0, name: 'Deeply/Fully Convective MS', shortName: 'MS (≤0.7)',
    massRange: 'M ≤ 0.7 M☉',
    burning: 'Core H → He (pp chain)',
    color: '#E84040',
    hrPos: { logT: 3.55, logL: -1.5 },
    flowPos: { x: 80, y: 380 },
    singleEvolvesTo: [],
    binaryEvolvesTo: [10],
    evolvesFrom: [],
    description: 'Stars with M ≤ 0.7 M☉ that are deeply or fully convective. They fuse hydrogen via the pp chain extremely slowly, with main-sequence lifetimes exceeding the current age of the universe for M < 0.8 M☉. Their thorough internal mixing prevents the development of a distinct core-envelope structure needed to ascend the giant branch. In isolation, they never leave the main sequence within a Hubble time.',
    physicsNote: 'Separated from k=1 because fully convective stars respond differently to mass loss — the entire star contracts homologously rather than developing a growing degenerate core. In BSE, the MS is split at M = 0.7 M☉ to handle this distinction (Section 4, Hurley et al. 2000).',
    binaryNote: 'Can only form a He WD (k=10) through binary envelope stripping before He ignition. This is the primary formation channel for He WDs, since single-star evolution cannot produce them within a Hubble time.',
  },
  {
    id: 1, name: 'Main-Sequence Star', shortName: 'MS (>0.7)',
    massRange: 'M > 0.7 M☉',
    burning: 'Core H → He (pp/CNO)',
    color: '#4D9EF7',
    hrPos: { logT: 4.3, logL: 3.5 },
    flowPos: { x: 80, y: 160 },
    singleEvolvesTo: [2],
    binaryEvolvesTo: [],
    evolvesFrom: [],
    description: 'Stars with M > 0.7 M☉ on the main sequence. Lower-mass stars in this range have radiative cores (M < 1.1 M☉), while higher-mass stars develop convective cores due to the steep temperature gradient from CNO-cycle burning. The MS lifetime decreases steeply with mass: ~10 Gyr for 1 M☉, ~1 Gyr for 2 M☉, ~30 Myr for 10 M☉.',
    physicsNote: 'The luminosity and radius evolution on the MS are modeled by polynomials in fractional time τ = t/t_MS (Equations 12–13, Hurley et al. 2000). Stars with M > M_hook show a "hook" feature near the end of the MS caused by the sudden depletion of H over the convective core region.',
    binaryNote: 'When losing mass on the MS (via wind or RLOF), the effective initial mass M₀ is kept equal to the current mass — the star evolves down along the MS. For massive stars (M > 15 M☉), strong winds can strip the envelope even in isolation.',
  },
  {
    id: 2, name: 'Hertzsprung Gap', shortName: 'HG',
    massRange: 'Post-MS, pre-GB',
    burning: 'Shell H burning',
    color: '#F0D050',
    hrPos: { logT: 3.95, logL: 3.2 },
    flowPos: { x: 230, y: 160 },
    singleEvolvesTo: [3],
    binaryEvolvesTo: [7, 10],
    evolvesFrom: [1],
    description: 'A brief transitional phase after core hydrogen exhaustion. The star crosses the Hertzsprung-Russell diagram rapidly on a thermal (Kelvin-Helmholtz) timescale as the core contracts and the envelope expands. Very few stars are observed in this phase, creating the eponymous "gap" in the HRD.',
    physicsNote: 'The HG spans from t_MS to t_BGB (Equations 4–5, Hurley et al. 2000). Luminosity and radius evolve as power laws in fractional time τ = (t − t_MS)/(t_BGB − t_MS). The core mass grows linearly from ρ·M_c,EHG to M_c,EHG (Equation 30). For high-mass stars (M ≥ M_FGB), He ignites before reaching the GB, so the "HG" actually ends at He ignition.',
    binaryNote: 'HG stars respond to mass loss on a thermal timescale — M₀ is kept equal to M_t. If stripped with M < M_HeF (degenerate core), produces a He WD (k=10). If stripped with M ≥ M_HeF (non-degenerate core), produces a naked He star (k=7). HG donors in CE are uncertain — the core-envelope boundary is not well-defined (Ivanova & Taam 2004).',
  },
  {
    id: 3, name: 'First Giant Branch', shortName: 'RGB',
    massRange: 'Red giants',
    burning: 'Shell H burning, growing He core',
    color: '#F07020',
    hrPos: { logT: 3.60, logL: 3.0 },
    flowPos: { x: 380, y: 160 },
    singleEvolvesTo: [4],
    binaryEvolvesTo: [7, 10],
    evolvesFrom: [2],
    description: 'The star ascends the giant branch along the Hayashi track with a deep convective envelope. A hydrogen-burning shell surrounds the growing helium core. For low-mass stars (M < M_HeF ≈ 2 M☉), the He core becomes degenerate. Helium ignites at the tip of the GB — degenerately (He flash) for low-mass stars, or non-degenerately for intermediate-mass stars.',
    physicsNote: 'Evolution driven by the core mass–luminosity relation L = D·M_c^p (Equation 37, Hurley et al. 2000). The GB radius follows R_GB = A(L^b₁ + b₂·L^b₃) along the Hayashi track (Equation 46). The GB ends at helium ignition. For high-mass stars (M > M_FGB), He ignites on the HG — they skip the GB entirely.',
    binaryNote: 'Deep convective envelope makes tidal circularization very efficient. If stripped: M < M_HeF → He WD (k=10); M ≥ M_HeF → naked He star (k=7). CE evolution is triggered when q₁ > q_crit, where q_crit depends on the radius-mass exponent ζ_ad ≈ −x + 2(M_c/M)^5 (Equation 56, Hurley et al. 2002).',
  },
  {
    id: 4, name: 'Core Helium Burning', shortName: 'CHeB',
    massRange: 'HB / blue loop',
    burning: 'Core He → C,O + Shell H',
    color: '#E8C820',
    hrPos: { logT: 3.85, logL: 2.2 },
    flowPos: { x: 530, y: 160 },
    singleEvolvesTo: [5],
    binaryEvolvesTo: [7],
    evolvesFrom: [3],
    description: 'After helium ignition, the star stably fuses helium into carbon and oxygen in its core while continuing shell hydrogen burning. Low-mass stars settle onto the horizontal branch (including the "red clump"). Intermediate-mass stars execute blue loops. High-mass stars that ignited He on the HG have a blue phase followed by a red supergiant phase.',
    physicsNote: 'CHeB is modeled differently for three mass regimes (Section 5.3, Hurley et al. 2000): LM (M < M_HeF) — entire phase is "blue"; IM (M_HeF ≤ M ≤ M_FGB) — descent along GB then blue loop; HM (M > M_FGB) — blue phase then red supergiant. The core mass grows linearly from M_c,HeI to M_c,BAGB (Equation 67).',
    binaryNote: 'If the envelope is stripped during CHeB, a naked He star (k=7) is formed with age determined by how much central He has been burned (Equation 76, Hurley et al. 2002). The remnant age preserves the fractional He-burning progress.',
  },
  {
    id: 5, name: 'Early AGB', shortName: 'E-AGB',
    massRange: 'Post-CHeB giants',
    burning: 'Shell He + Shell H',
    color: '#E05030',
    hrPos: { logT: 3.55, logL: 3.6 },
    flowPos: { x: 680, y: 160 },
    singleEvolvesTo: [6],
    binaryEvolvesTo: [7],
    evolvesFrom: [4],
    description: 'After core helium exhaustion, the star has an inert C/O core surrounded by a helium-burning shell and a hydrogen-burning shell. The envelope expands again to giant proportions. During this phase, massive enough stars undergo "second dredge-up" where the convective envelope penetrates into the H-exhausted region, reducing the core mass.',
    physicsNote: 'The EAGB ends when the growing CO core catches up with the stationary He core (M_c,CO → M_c,DU). For stars with 0.8 < M_c,BAGB < 2.25, second dredge-up reduces M_c to M_c,DU = 0.44·M_c,He + 0.448. Stars with M_c,BAGB > 2.25 ignite carbon before reaching the TPAGB (Section 5.4, Hurley et al. 2000).',
    binaryNote: 'If envelope is lost during EAGB so that M = M_c,He, a naked helium giant (k=9) forms with unburnt He remaining around the CO core. The star\'s He-giant age is set by M_c = M_c,CO in the HeGB M_c–t relation.',
  },
  {
    id: 6, name: 'Thermally Pulsing AGB', shortName: 'TP-AGB',
    massRange: 'Late AGB',
    burning: 'Double shell, thermal pulses',
    color: '#C01818',
    hrPos: { logT: 3.45, logL: 4.2 },
    flowPos: { x: 830, y: 160 },
    singleEvolvesTo: [11, 12],
    binaryEvolvesTo: [7, 15],
    evolvesFrom: [5],
    description: 'The final AGB phase, marked by violent thermal pulses caused by explosive He-shell flashes. Each pulse drives third dredge-up events that transport carbon and s-process elements to the surface. Intense mass loss via stellar winds (superwind phase) eventually strips the entire envelope, revealing the hot core — a planetary nebula nucleus that fades to become a white dwarf.',
    physicsNote: 'Third dredge-up reduces secular core growth by factor (1−λ), where λ = min(0.9, 0.3 + 0.001·M^5) (Equation 73, Hurley et al. 2000). The AGB terminates when either: the envelope is lost (→ WD), or M_c reaches M_c,SN = max(M_Ch, 0.773·M_c,BAGB − 0.35) (→ SN). Mass loss follows Vassiliadis & Wood (1993) on the AGB.',
    binaryNote: 'For M_c,BAGB < 1.6: CO WD (k=11). For 1.6 ≤ M_c,BAGB ≤ 2.25: ONe WD (k=12) after off-center carbon ignition. For M_c,BAGB > 2.25: SN → NS or BH. If M reaches M_Ch via accretion in a binary: thermonuclear SN (k=15, no remnant) for CO WD, or electron-capture collapse (→ NS) for ONe WD.',
  },
  {
    id: 7, name: 'Naked Helium MS', shortName: 'He-MS',
    massRange: 'Stripped He cores',
    burning: 'Core He → C,O',
    color: '#28C8D8',
    hrPos: { logT: 4.75, logL: 4.5 },
    flowPos: { x: 380, y: 350 },
    singleEvolvesTo: [8],
    binaryEvolvesTo: [],
    evolvesFrom: [],
    description: 'Stars that have lost their entire hydrogen envelope — either through binary mass transfer (Roche-lobe overflow or common envelope) or through strong stellar winds in very massive stars. The exposed helium core fuses He to C and O. These correspond observationally to Wolf-Rayet stars (for massive progenitors) or subdwarf B/O stars (for lower-mass progenitors).',
    physicsNote: 'He-star ZAMS luminosity and radius are fitted by Equations 77–78, with lifetime by Equation 79 (Hurley et al. 2000). The He-MS lifetime is t_HeMS = (0.4129 + 18.81M⁴ + 1.853M⁶)/M^6.5. Luminosity evolves as L = L_ZHe(1 + 0.45τ + aτ²) where a = max(0, 0.85 − 0.08M).',
    binaryNote: 'Formed via binary envelope stripping from k ∈ {2,3,4,5,6}. When a He star has a compact companion (NS/BH), the subsequent mass transfer (Case BB) is critical for forming tight compact binaries. COSMIC includes options for modeling this as stable mass transfer following Tauris et al. (2015).',
  },
  {
    id: 8, name: 'Naked Helium HG', shortName: 'He-HG',
    massRange: 'Post-HeMS',
    burning: 'Shell He, contracting CO core',
    color: '#20B080',
    hrPos: { logT: 4.55, logL: 4.7 },
    flowPos: { x: 530, y: 350 },
    singleEvolvesTo: [9],
    binaryEvolvesTo: [],
    evolvesFrom: [7],
    description: 'The helium-star analog of the Hertzsprung gap. After depleting core helium, the C/O core contracts while the helium envelope expands on a thermal timescale. This is a very brief transitional phase analogous to the hydrogen HG but for stripped helium stars.',
    physicsNote: 'The post-HeMS evolution follows the HeGB core mass–luminosity relation L = min(B·M_c³, D·M_c⁵) (Equation 84, Hurley et al. 2000), with time evolution analogous to GB stars. The HeHG/HeGB boundary is determined by whether the radius follows R₁ (modest expansion) or R₂ = 0.08·L^0.75 (Hayashi track for He stars).',
    binaryNote: 'HG He stars (k=8) have ζ_ad ≈ 0 giving q_crit = 0.784. If unstable mass transfer occurs, CE evolution ensues. In the BSE collision matrix, HeHG stars are treated as having a dense core that survives coalescence.',
  },
  {
    id: 9, name: 'Naked Helium Giant', shortName: 'He-GB',
    massRange: 'He shell burning giants',
    burning: 'Shell He, growing CO core',
    color: '#48C848',
    hrPos: { logT: 4.35, logL: 4.9 },
    flowPos: { x: 680, y: 350 },
    singleEvolvesTo: [11, 12, 13, 14],
    binaryEvolvesTo: [],
    evolvesFrom: [8],
    description: 'A naked helium star on its giant branch with a growing degenerate C/O core surrounded by a helium-burning shell. The helium envelope has expanded significantly, creating a high-luminosity helium giant. Evolution terminates in a white dwarf (for M < 0.7 M☉), or proceeds to core collapse for more massive He stars.',
    physicsNote: 'For M < 0.7 M☉, shell He burning stops before consuming the full envelope, producing a CO WD when M_c reaches M_c,max = min(1.45M − 0.31, M) (Equation 89, Hurley et al. 2000). For more massive He stars, core collapse occurs when M_c ≥ M_c,SN, producing an NS (M_c,SN < 7) or BH (M_c,SN > 7).',
    binaryNote: 'HeGB stars have deep convective envelopes and respond to tidal friction like normal giants. The endpoint depends on the initial He-star mass, analogous to how TPAGB endpoints depend on M_c,BAGB.',
  },
  {
    id: 10, name: 'Helium White Dwarf', shortName: 'He WD',
    massRange: 'M < ~0.5 M☉',
    burning: 'None (cooling)',
    color: '#F8F0F0',
    hrPos: { logT: 4.05, logL: -1.5 },
    flowPos: { x: 830, y: 380 },
    singleEvolvesTo: [],
    binaryEvolvesTo: [15],
    evolvesFrom: [0, 2, 3],
    description: 'Electron-degenerate remnants composed almost entirely of helium. Formed when a low-mass star (M < M_HeF) loses its hydrogen envelope before helium can ignite in the core. Since single low-mass stars take longer than the age of the universe to reach this stage, He WDs are almost exclusively products of binary interaction.',
    physicsNote: 'Cooling follows L_WD = 635·M·Z^0.4 / (A·(t+0.1))^1.4 with A=4 for He WDs (Equation 90, Hurley et al. 2000). The radius follows the mass-radius relation for degenerate objects (Equation 91). The (t+0.1) term mimics the initially rapid cooling phase.',
    binaryNote: 'He WDs can accrete material from a companion. If the mass reaches 0.7 M☉, thermonuclear detonation is assumed (k=15). A He WD accreting from a Roche-lobe-filling companion at high rates can swell up to become a giant star (k=3), effectively reversing evolution.',
  },
  {
    id: 11, name: 'C/O White Dwarf', shortName: 'CO WD',
    massRange: 'M < ~1.4 M☉',
    burning: 'None (cooling)',
    color: '#E0E0E8',
    hrPos: { logT: 4.25, logL: -2.5 },
    flowPos: { x: 830, y: 260 },
    singleEvolvesTo: [],
    binaryEvolvesTo: [13, 15],
    evolvesFrom: [6, 9],
    description: 'The most common type of white dwarf — the electron-degenerate C/O core of a low- to intermediate-mass star (initial M < ~8 M☉) that shed its envelope on the AGB. No nuclear reactions occur; the WD simply cools over billions of years. CO WDs are potential progenitors of Type Ia supernovae through accretion or merger.',
    physicsNote: 'Cooling uses A=15 in the Mestel formula (Equation 90, Hurley et al. 2000). The Chandrasekhar mass M_Ch = 1.44 M☉ is the maximum mass for a WD supported by electron degeneracy pressure. M_c,BAGB < 1.6 M☉ corresponds to initial masses below M_up.',
    binaryNote: 'CO WDs accreting He-rich material: edge-lit detonation (ELD SNIa) after accumulating 0.15 M☉ of He. Accreting H-rich material: novae if Ṁ < 1.03×10⁻⁷ M☉/yr, supersoft sources for higher rates. If M → M_Ch via accretion or merger: Type Ia SN (k=15). Two CO WDs merging can also produce a Type Ia SN.',
  },
  {
    id: 12, name: 'O/Ne White Dwarf', shortName: 'ONe WD',
    massRange: 'M ~ 1.1–1.4 M☉',
    burning: 'None (cooling)',
    color: '#B8B8C8',
    hrPos: { logT: 4.35, logL: -3.0 },
    flowPos: { x: 830, y: 310 },
    singleEvolvesTo: [],
    binaryEvolvesTo: [13, 15],
    evolvesFrom: [6, 9],
    description: 'White dwarfs composed of an oxygen-neon-magnesium mixture, formed by intermediate-mass stars (M_up ≤ M ≤ M_ec, corresponding to ~8–10 M☉) that ignite carbon burning off-center under semi-degenerate conditions but cannot proceed to neon/silicon burning. They sit near the Chandrasekhar mass limit.',
    physicsNote: 'Carbon ignites off-center when M_c,CO ≈ 1.08 M☉, producing a degenerate ONe core (Nomoto 1984). The limiting M_c,BAGB values of 1.6 and 2.25 M☉ correspond to M_up and M_ec respectively (Section 6, Hurley et al. 2000).',
    binaryNote: 'Unlike CO WDs, when an ONe WD reaches M_Ch through accretion, it undergoes accretion-induced collapse (AIC) via electron capture on ²⁴Mg nuclei, forming a neutron star (k=13) rather than exploding as a Type Ia SN.',
  },
  {
    id: 13, name: 'Neutron Star', shortName: 'NS',
    massRange: 'M ~ 1.1–2.5 M☉',
    burning: 'None',
    color: '#B090F0',
    hrPos: { logT: 5.2, logL: -4.5 },
    flowPos: { x: 830, y: 70 },
    singleEvolvesTo: [],
    binaryEvolvesTo: [14],
    evolvesFrom: [6, 9, 11, 12],
    description: 'An ultra-compact remnant supported by neutron degeneracy pressure, formed from core collapse of massive stars (initial M ~ 8–25 M☉) or electron-capture collapse of ONe WDs. Neutron stars pack ~1.4–2 M☉ into a sphere ~20 km across. They can manifest as pulsars, magnetars, or X-ray binary components.',
    physicsNote: 'NS mass: M_NS = 1.17 + 0.09·M_c,SN (Equation 92, Hurley et al. 2000). The criterion for NS vs BH formation is M_c,SN < 7.0 (corresponding to M_c,BAGB < 9.52). NS cooling: L_NS = 0.02·M^(2/3)/max(t, 0.1) (Equation 93). Radius is fixed at R_NS = 1.4×10⁻⁵ R☉ (10 km).',
    binaryNote: 'NSs receive natal kicks drawn from a Maxwellian (σ = 265 km/s for standard CCSNe, σ ≈ 20 km/s for ECSNe). In COSMIC, kicks can be reduced by fallback fraction. An NS accreting past ~1.8 M☉ (or 3.0 M☉ in COSMIC) collapses to a BH (k=14). Binary NS mergers are sources of gravitational waves and short gamma-ray bursts.',
  },
  {
    id: 14, name: 'Black Hole', shortName: 'BH',
    massRange: 'M > ~3 M☉',
    burning: 'None',
    color: '#303038',
    hrPos: { logT: 5.4, logL: -5.0 },
    flowPos: { x: 830, y: 20 },
    singleEvolvesTo: [],
    binaryEvolvesTo: [],
    evolvesFrom: [6, 9, 13],
    description: 'The final endpoint for the most massive stars (initial M > ~25 M☉), where gravity overwhelms all degeneracy pressure during core collapse. The remnant collapses past its event horizon. Stellar-mass BHs interact with their environment only through gravity and accretion. In binaries, accretion produces luminous X-ray emission.',
    physicsNote: 'BH formation occurs when M_c,SN > 7.0, corresponding to M_c,BAGB > 9.52. BH mass is determined by the Fryer et al. (2012) rapid or delayed prescriptions in COSMIC, which account for fallback. Pair-instability supernovae can destroy stars with He cores of 45–135 M☉, creating a "mass gap" above ~40 M☉.',
    binaryNote: 'BH natal kicks can be reduced by fallback fraction (1 − f_fb). For heavy BHs with large fallback, kicks approach zero. BH + BH mergers are the primary LIGO/Virgo source population. BH + NS and BH + WD binaries can form through complex evolutionary channels involving multiple mass transfer episodes.',
  },
  {
    id: 15, name: 'Massless Remnant', shortName: '—',
    massRange: 'M = 0',
    burning: 'Disrupted',
    color: '#606070',
    hrPos: { logT: 5.0, logL: -2.0 },
    flowPos: { x: 960, y: 200 },
    singleEvolvesTo: [],
    binaryEvolvesTo: [],
    evolvesFrom: [10, 11, 12],
    description: 'A bookkeeping designation in the BSE framework for a star that has been completely destroyed or disrupted. This includes stars obliterated by pair-instability supernovae, Type Ia thermonuclear supernovae (which leave no bound remnant), or components that have been dynamically ejected from the system.',
    physicsNote: 'This is not a physical stellar type but a computational flag. It represents the absence of a star where one previously existed. In BSE, it allows the code to track the remaining component of a binary after one star is destroyed.',
    binaryNote: 'Produced when: a CO WD exceeds M_Ch → Type Ia SN; a He WD exceeds 0.7 M☉ → thermonuclear detonation; a star is disrupted in a pair-instability SN (He core 45–135 M☉). The surviving companion becomes an unbound single star.',
  }
];

// ─── Mass-dependent evolution tracks ───
const massTracks = [
  { label: '0.3 M☉', mass: 0.3, path: [0], note: 'Stays on MS > Hubble time. Fully convective — no giant phase.' },
  { label: '0.8 M☉', mass: 0.8, path: [1, 2, 3, 4, 5, 6, 11], note: 'Low-mass track. Degenerate He flash at GB tip → HB → AGB → CO WD. t_MS ≈ 15 Gyr.' },
  { label: '1.0 M☉', mass: 1.0, path: [1, 2, 3, 4, 5, 6, 11], note: 'Solar analog. t_MS ≈ 10 Gyr. He flash → horizontal branch → AGB → ~0.6 M☉ CO WD.' },
  { label: '2.0 M☉', mass: 2.0, path: [1, 2, 3, 4, 5, 6, 11], note: 'Near M_HeF boundary. t_MS ≈ 1 Gyr. Non-degenerate He ignition at GB tip.' },
  { label: '5.0 M☉', mass: 5.0, path: [1, 2, 3, 4, 5, 6, 11], note: 'Intermediate mass. Extended blue loop during CHeB. Strong AGB mass loss → CO WD.' },
  { label: '8.0 M☉', mass: 8.0, path: [1, 2, 3, 4, 5, 6, 12], note: 'Near M_up boundary. Carbon ignites off-center → ONe WD or ECSN → NS.' },
  { label: '15 M☉', mass: 15, path: [1, 2, 4, 5, 6, 13], note: 'High mass. He ignites on HG (skips GB). Strong winds can strip envelope → Wolf-Rayet.' },
  { label: '25 M☉', mass: 25, path: [1, 2, 4, 7, 8, 9, 13], note: 'Massive star. Envelope stripped by winds → naked He star → core-collapse SN → NS.' },
  { label: '40 M☉', mass: 40, path: [1, 2, 4, 7, 8, 9, 14], note: 'Very massive. Strong mass loss throughout → naked He star → BH with fallback.' },
  { label: '80 M☉', mass: 80, path: [1, 2, 7, 8, 9, 14], note: 'Extreme mass. LBV-like mass loss on HG. May encounter pair-instability regime.' },
];

// ─── Critical masses ───
const criticalMasses = [
  { name: 'M_hook', value: '~1.0', desc: 'Above which MS hook feature appears' },
  { name: 'M_HeF', value: '~2.0', desc: 'Max mass for degenerate He flash (divides LM/IM)' },
  { name: 'M_FGB', value: '~13', desc: 'Max mass for He ignition on GB (divides IM/HM)' },
  { name: 'M_up', value: '~8', desc: 'Min mass for carbon ignition (CO WD → ONe WD)' },
  { name: 'M_ec', value: '~10', desc: 'Min mass for non-degenerate carbon (ONe WD → NS)' },
  { name: 'M_Ch', value: '1.44', desc: 'Chandrasekhar limit for white dwarfs' },
];

// ─── Binary processes ───
const binaryProcesses = [
  { name: 'Roche Lobe Overflow (RLOF)', desc: 'When a star expands to fill its Roche lobe, mass flows through the inner Lagrangian point L₁ to the companion. The stability depends on the mass ratio q = M_donor/M_accretor relative to q_crit. Stable RLOF proceeds on nuclear or thermal timescales; unstable RLOF leads to dynamical mass transfer or common envelope.' },
  { name: 'Common Envelope (CE)', desc: 'When mass transfer becomes dynamically unstable, the transferred mass cannot be accreted and engulfs both stars. The cores spiral inward, depositing orbital energy into the envelope with efficiency α_CE. The outcome is either: (1) envelope ejection leaving a much tighter binary, or (2) coalescence. The α·λ formalism is standard: E_bind = α_CE · (E_orb,f − E_orb,i).' },
  { name: 'Wind Accretion', desc: 'In detached systems, the companion can accrete mass from the primary\'s stellar wind via a Bondi-Hoyle mechanism. The accretion rate depends on the wind velocity, orbital separation, and mass ratio. This is important for symbiotic stars and massive X-ray binaries.' },
  { name: 'Tidal Evolution', desc: 'Tides raised on stellar surfaces transfer angular momentum between spin and orbit. Convective damping (equilibrium tide) is efficient for stars with deep convective envelopes. Radiative damping (dynamical tide) operates on stars with radiative envelopes but is weaker. Tides tend to synchronize rotation and circularize orbits.' },
  { name: 'Supernova Kicks', desc: 'Asymmetric supernovae impart natal kicks to newborn NSs and BHs. Standard kicks follow a Maxwellian (σ = 265 km/s for CCSNe). Kicks can be reduced by fallback (for BHs), or drawn from lower distributions for ECSNe (σ ≈ 20 km/s) and ultrastripped SNe. Kicks can disrupt or significantly alter binary orbits.' },
  { name: 'Magnetic Braking', desc: 'Stars with convective envelopes lose angular momentum through magnetically coupled stellar winds. In CVs, this angular momentum is removed from the orbit via tidal coupling, driving mass transfer. Magnetic braking is shut off for fully convective stars (M < 0.35 M☉), explaining the CV period gap.' },
];

const phaseCategories = [
  { label: 'Core H-burning', ids: [0, 1], color: '#4D9EF7' },
  { label: 'Shell H-burning', ids: [2, 3], color: '#F0D050' },
  { label: 'Core He-burning', ids: [4, 7], color: '#E8C820' },
  { label: 'Shell He-burning', ids: [5, 8], color: '#E05030' },
  { label: 'Double shell', ids: [6, 9], color: '#C01818' },
  { label: 'Remnants', ids: [10, 11, 12, 13, 14, 15], color: '#B090F0' },
];

// ─── Main App ───
export default function App() {
  const [selectedId, setSelectedId] = useState(1);
  const [tab, setTab] = useState('flow');
  const [massTrackIdx, setMassTrackIdx] = useState(3);
  const [showBinary, setShowBinary] = useState(true);
  const [infoTab, setInfoTab] = useState('overview');
  const [hoveredId, setHoveredId] = useState(null);

  const activeStar = bseTypes.find(s => s.id === selectedId);
  const activeTrack = massTracks[massTrackIdx];

  const isOnTrack = useCallback((id) => activeTrack.path.includes(id), [activeTrack]);

  const allEvolvesTo = useMemo(() => {
    const s = bseTypes.find(s => s.id === selectedId);
    if (!s) return { single: [], binary: [] };
    return { single: s.singleEvolvesTo, binary: s.binaryEvolvesTo };
  }, [selectedId]);

  const allEvolvesFrom = useMemo(() => {
    return bseTypes.filter(s =>
      s.singleEvolvesTo.includes(selectedId) ||
      s.binaryEvolvesTo.includes(selectedId)
    ).map(s => s.id);
  }, [selectedId]);

  // ─── Flow Chart SVG ───
  const renderFlowChart = () => {
    const W = 1060, H = 440;
    const edges = [];

    bseTypes.forEach(src => {
      src.singleEvolvesTo.forEach(tid => {
        const tgt = bseTypes.find(s => s.id === tid);
        if (tgt) edges.push({ from: src, to: tgt, type: 'single' });
      });
      if (showBinary) {
        src.binaryEvolvesTo.forEach(tid => {
          const tgt = bseTypes.find(s => s.id === tid);
          if (tgt) edges.push({ from: src, to: tgt, type: 'binary' });
        });
      }
    });

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ minHeight: 400 }}>
        <defs>
          <marker id="ah-single" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,1 L10,5 L0,9" fill="none" stroke="#8899aa" strokeWidth="1.5" />
          </marker>
          <marker id="ah-binary" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,1 L10,5 L0,9" fill="none" stroke="#cc7744" strokeWidth="1.5" />
          </marker>
          <marker id="ah-track" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="#50e0a0" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Phase category labels */}
        <text x="80" y="435" fill="#556677" fontSize="9" textAnchor="middle" fontFamily="monospace">Core H</text>
        <text x="305" y="435" fill="#556677" fontSize="9" textAnchor="middle" fontFamily="monospace">Shell H</text>
        <text x="455" y="435" fill="#556677" fontSize="9" textAnchor="middle" fontFamily="monospace">Core He</text>
        <text x="605" y="435" fill="#556677" fontSize="9" textAnchor="middle" fontFamily="monospace">Shell He</text>
        <text x="755" y="435" fill="#556677" fontSize="9" textAnchor="middle" fontFamily="monospace">Double Shell</text>
        <text x="895" y="435" fill="#556677" fontSize="9" textAnchor="middle" fontFamily="monospace">Remnants</text>

        {/* Edges */}
        {edges.map((e, i) => {
          const fx = e.from.flowPos.x, fy = e.from.flowPos.y;
          const tx = e.to.flowPos.x, ty = e.to.flowPos.y;
          const isSingle = e.type === 'single';
          const isTrackEdge = isOnTrack(e.from.id) && isOnTrack(e.to.id) &&
            activeTrack.path.indexOf(e.to.id) === activeTrack.path.indexOf(e.from.id) + 1;

          const dx = tx - fx, dy = ty - fy;
          const len = Math.sqrt(dx * dx + dy * dy);
          const mx = (fx + tx) / 2, my = (fy + ty) / 2;
          const ox = -dy / len * (isSingle ? 12 : 18), oy = dx / len * (isSingle ? 12 : 18);

          return (
            <path key={`e${i}`}
              d={`M${fx},${fy} Q${mx + (isSingle ? 0 : ox)},${my + (isSingle ? 0 : oy)} ${tx},${ty}`}
              fill="none"
              stroke={isTrackEdge ? '#50e0a0' : isSingle ? '#556677' : '#995533'}
              strokeWidth={isTrackEdge ? 2.5 : 1.2}
              strokeDasharray={isSingle ? 'none' : '6,3'}
              markerEnd={`url(#ah-${isTrackEdge ? 'track' : e.type})`}
              opacity={isTrackEdge ? 1 : 0.5}
            />
          );
        })}

        {/* Nodes */}
        {bseTypes.map(star => {
          const x = star.flowPos.x, y = star.flowPos.y;
          const isSelected = star.id === selectedId;
          const onTrack = isOnTrack(star.id);
          const isHovered = star.id === hoveredId;
          const isConnected = allEvolvesTo.single.includes(star.id) ||
            allEvolvesTo.binary.includes(star.id) ||
            allEvolvesFrom.includes(star.id);

          return (
            <g key={star.id}
              onClick={() => setSelectedId(star.id)}
              onMouseEnter={() => setHoveredId(star.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              {onTrack && (
                <circle cx={x} cy={y} r={24} fill="#50e0a020" stroke="#50e0a0" strokeWidth={1} />
              )}
              <rect
                x={x - 38} y={y - 18} width={76} height={36} rx={6}
                fill={isSelected ? '#1a2535' : '#0d1520'}
                stroke={isSelected ? star.color : isHovered ? '#88aacc' : onTrack ? '#50e0a060' : isConnected ? '#445566' : '#2a3545'}
                strokeWidth={isSelected ? 2 : 1}
              />
              <circle cx={x - 22} cy={y - 4} r={5} fill={star.id === 14 ? '#000' : star.color}
                stroke={star.id === 14 ? '#555' : 'none'} />
              <text x={x + 2} y={y - 5} fill={isSelected ? '#fff' : '#99aabb'} fontSize="8" textAnchor="middle"
                fontWeight={isSelected ? 'bold' : 'normal'} fontFamily="monospace">
                k={star.id}
              </text>
              <text x={x} y={y + 10} fill={isSelected ? '#ccc' : '#667788'} fontSize="7.5" textAnchor="middle"
                fontFamily="monospace">
                {star.shortName}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // ─── HR Diagram SVG ───
  const renderHRDiagram = () => {
    const W = 500, H = 500;
    const pad = 50;
    const logTmin = 3.3, logTmax = 5.6, logLmin = -5.5, logLmax = 6.0;

    const toX = (logT) => pad + ((logTmax - logT) / (logTmax - logTmin)) * (W - 2 * pad);
    const toY = (logL) => pad + ((logLmax - logL) / (logLmax - logLmin)) * (H - 2 * pad);

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ minHeight: 400 }}>
        {/* Grid */}
        {[3.5, 4.0, 4.5, 5.0].map(t => (
          <line key={`gt${t}`} x1={toX(t)} y1={pad} x2={toX(t)} y2={H - pad} stroke="#1a2535" strokeWidth={1} />
        ))}
        {[-4, -2, 0, 2, 4].map(l => (
          <line key={`gl${l}`} x1={pad} y1={toY(l)} x2={W - pad} y2={toY(l)} stroke="#1a2535" strokeWidth={1} />
        ))}

        {/* Axis labels */}
        {[3.5, 4.0, 4.5, 5.0].map(t => (
          <text key={`lt${t}`} x={toX(t)} y={H - pad + 16} fill="#556677" fontSize="10" textAnchor="middle" fontFamily="monospace">{t.toFixed(1)}</text>
        ))}
        {[-4, -2, 0, 2, 4].map(l => (
          <text key={`ll${l}`} x={pad - 8} y={toY(l) + 4} fill="#556677" fontSize="10" textAnchor="end" fontFamily="monospace">{l}</text>
        ))}
        <text x={W / 2} y={H - 8} fill="#778899" fontSize="11" textAnchor="middle" fontFamily="monospace">log T_eff (K)  ← hotter</text>
        <text x={12} y={H / 2} fill="#778899" fontSize="11" textAnchor="middle" fontFamily="monospace"
          transform={`rotate(-90, 12, ${H / 2})`}>log L/L☉ ↑</text>

        {/* Main sequence band */}
        <path d={`M${toX(3.5)},${toY(-1.5)} Q${toX(3.9)},${toY(1)} ${toX(4.6)},${toY(4)} L${toX(5.0)},${toY(5.5)}`}
          stroke="#4D9EF720" strokeWidth={30} fill="none" />

        {/* Stars */}
        {bseTypes.map(star => {
          const cx = toX(star.hrPos.logT);
          const cy = toY(star.hrPos.logL);
          const isSelected = star.id === selectedId;
          const onTrack = isOnTrack(star.id);

          if (cx < pad || cx > W - pad || cy < pad || cy > H - pad) return null;

          return (
            <g key={star.id} onClick={() => setSelectedId(star.id)}
              onMouseEnter={() => setHoveredId(star.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer">
              {isSelected && <circle cx={cx} cy={cy} r={20} fill={star.color} opacity={0.15} />}
              {onTrack && <circle cx={cx} cy={cy} r={16} fill="#50e0a0" opacity={0.12} />}
              <circle cx={cx} cy={cy}
                r={isSelected ? 8 : 5}
                fill={star.id === 14 ? '#000' : star.color}
                stroke={isSelected ? '#fff' : onTrack ? '#50e0a0' : 'none'}
                strokeWidth={isSelected ? 2 : 1}
                opacity={isSelected || onTrack ? 1 : 0.6}
              />
              <text x={cx} y={cy - (isSelected ? 14 : 10)}
                fill={isSelected ? '#fff' : '#889'} fontSize="8" textAnchor="middle" fontFamily="monospace">
                {star.shortName}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const tabBtnStyle = (active) => ({
    padding: '8px 18px',
    border: 'none',
    borderBottom: active ? '2px solid #50e0a0' : '2px solid transparent',
    background: 'transparent',
    color: active ? '#e0f0e8' : '#667788',
    fontSize: '13px',
    fontFamily: "'DM Mono', monospace",
    cursor: 'pointer',
    letterSpacing: '0.5px',
  });

  const infoTabStyle = (active) => ({
    padding: '4px 12px',
    border: active ? '1px solid #334455' : '1px solid transparent',
    borderRadius: '4px',
    background: active ? '#0d1520' : 'transparent',
    color: active ? '#c0d0e0' : '#556677',
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    cursor: 'pointer',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c12',
      color: '#c0d0e0',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: '0',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0e15; }
        ::-webkit-scrollbar-thumb { background: #2a3545; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1a2535',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px',
            color: '#e0f0e8', fontFamily: "'DM Mono', monospace",
          }}>
            <span style={{ color: '#50e0a0' }}>BSE</span> Stellar Evolution Explorer
          </h1>
          <p style={{ fontSize: '12px', color: '#556677', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
            Hurley, Pols & Tout (2000) · Hurley, Tout & Pols (2002) · 16 stellar types (k = 0–15)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#0d1520', borderRadius: '6px', padding: '3px', border: '1px solid #1a2535' }}>
          {[
            { key: 'flow', label: 'Evolution Flow' },
            { key: 'hr', label: 'H-R Diagram' },
            { key: 'binary', label: 'Binary Physics' },
            { key: 'masses', label: 'Critical Masses' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabBtnStyle(tab === t.key)}>{t.label}</button>
          ))}
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>

        {/* ─── Main Panel ─── */}
        <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>

          {/* Mass track selector */}
          {(tab === 'flow' || tab === 'hr') && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
              padding: '10px 16px', background: '#0a0e16', border: '1px solid #1a2535', borderRadius: '8px',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '11px', color: '#556677', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
                MASS TRACK
              </span>
              <input type="range" min={0} max={massTracks.length - 1} value={massTrackIdx}
                onChange={e => setMassTrackIdx(+e.target.value)}
                style={{ flex: '0 0 180px', accentColor: '#50e0a0' }}
              />
              <span style={{ fontSize: '13px', color: '#50e0a0', fontFamily: "'DM Mono', monospace", fontWeight: 500, minWidth: '60px' }}>
                {activeTrack.label}
              </span>
              <span style={{ fontSize: '11px', color: '#667788', fontFamily: "'DM Mono', monospace" }}>
                {activeTrack.note}
              </span>
              {tab === 'flow' && (
                <label style={{ fontSize: '11px', color: '#556677', fontFamily: "'DM Mono', monospace", marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={showBinary} onChange={e => setShowBinary(e.target.checked)}
                    style={{ accentColor: '#995533' }} />
                  Binary paths
                </label>
              )}
            </div>
          )}

          {/* Diagram */}
          <div style={{
            background: '#0a0e16', border: '1px solid #1a2535', borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {tab === 'flow' && renderFlowChart()}
            {tab === 'hr' && renderHRDiagram()}

            {tab === 'binary' && (
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '16px', color: '#e0f0e8', fontFamily: "'DM Mono', monospace", marginBottom: '16px' }}>
                  Binary Interaction Processes
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {binaryProcesses.map((p, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', background: '#0d1520', border: '1px solid #1a2535', borderRadius: '6px',
                    }}>
                      <h3 style={{ fontSize: '13px', color: '#50e0a0', fontFamily: "'DM Mono', monospace", marginBottom: '6px' }}>
                        {p.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#889', lineHeight: '1.6' }}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'masses' && (
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '16px', color: '#e0f0e8', fontFamily: "'DM Mono', monospace", marginBottom: '16px' }}>
                  Critical Masses (Z = 0.02)
                </h2>
                <p style={{ fontSize: '12px', color: '#667788', marginBottom: '16px', lineHeight: '1.6' }}>
                  These boundary masses divide stars into distinct evolutionary regimes. They are functions of metallicity Z
                  (Equations 1–3, Hurley et al. 2000). Values shown are for solar metallicity.
                </p>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {criticalMasses.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '10px 14px', background: '#0d1520', border: '1px solid #1a2535', borderRadius: '6px',
                    }}>
                      <span style={{ fontSize: '14px', color: '#50e0a0', fontFamily: "'DM Mono', monospace", fontWeight: 500, minWidth: '80px' }}>
                        {m.name}
                      </span>
                      <span style={{ fontSize: '14px', color: '#e0f0e8', fontFamily: "'DM Mono', monospace", minWidth: '70px' }}>
                        {m.value} M☉
                      </span>
                      <span style={{ fontSize: '12px', color: '#778899' }}>{m.desc}</span>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: '14px', color: '#e0f0e8', fontFamily: "'DM Mono', monospace", marginTop: '24px', marginBottom: '12px' }}>
                  Burning Phase Categories
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {phaseCategories.map((p, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', background: '#0d1520', border: '1px solid #1a2535', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', color: '#c0d0e0', fontFamily: "'DM Mono', monospace" }}>{p.label}</div>
                        <div style={{ fontSize: '10px', color: '#556677', fontFamily: "'DM Mono', monospace" }}>
                          k = {p.ids.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Legend for flow chart */}
          {tab === 'flow' && (
            <div style={{
              display: 'flex', gap: '20px', marginTop: '10px', padding: '8px 16px',
              fontSize: '10px', color: '#556677', fontFamily: "'DM Mono', monospace", flexWrap: 'wrap',
            }}>
              <span>── Single-star evolution</span>
              <span style={{ color: '#995533' }}>- - Binary-only path</span>
              <span style={{ color: '#50e0a0' }}>━ Active mass track</span>
              <span>Based on Figure 19, Hurley et al. (2002)</span>
            </div>
          )}
        </div>

        {/* ─── Detail Sidebar ─── */}
        <div style={{
          width: '380px', flexShrink: 0,
          borderLeft: '1px solid #1a2535', background: '#0a0e16',
          overflow: 'auto', padding: '20px',
        }}>
          {/* Type badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: activeStar.id === 14 ? '#000' : activeStar.color,
              border: activeStar.id === 14 ? '1.5px solid #555' : 'none',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: '11px', color: '#556677', fontFamily: "'DM Mono', monospace",
              padding: '2px 8px', background: '#0d1520', border: '1px solid #1a2535', borderRadius: '4px',
            }}>
              k = {activeStar.id}
            </span>
          </div>

          <h2 style={{
            fontSize: '18px', fontWeight: 700, color: '#e0f0e8', lineHeight: 1.2, marginBottom: '4px',
          }}>
            {activeStar.name}
          </h2>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#50e0a0', fontFamily: "'DM Mono', monospace" }}>{activeStar.massRange}</span>
            <span style={{ fontSize: '11px', color: '#667788', fontFamily: "'DM Mono', monospace" }}>{activeStar.burning}</span>
          </div>

          {/* Info tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {['overview', 'physics', 'binary'].map(t => (
              <button key={t} onClick={() => setInfoTab(t)} style={infoTabStyle(infoTab === t)}>
                {t === 'overview' ? 'Overview' : t === 'physics' ? 'SSE Physics' : 'Binary (BSE)'}
              </button>
            ))}
          </div>

          <div style={{
            fontSize: '12.5px', color: '#99aabb', lineHeight: '1.7',
            marginBottom: '20px',
          }}>
            {infoTab === 'overview' && <p>{activeStar.description}</p>}
            {infoTab === 'physics' && <p>{activeStar.physicsNote}</p>}
            {infoTab === 'binary' && <p>{activeStar.binaryNote}</p>}
          </div>

          {/* Evolution connections */}
          <div style={{ borderTop: '1px solid #1a2535', paddingTop: '14px' }}>
            {activeStar.evolvesFrom.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#556677', fontFamily: "'DM Mono', monospace", letterSpacing: '1px', marginBottom: '6px' }}>
                  ← EVOLVES FROM
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {activeStar.evolvesFrom.map(id => {
                    const s = bseTypes.find(x => x.id === id);
                    return (
                      <button key={id} onClick={() => setSelectedId(id)} style={{
                        fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
                        background: '#0d1520', border: '1px solid #1a2535',
                        color: '#99aabb', cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                        {s.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeStar.singleEvolvesTo.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#556677', fontFamily: "'DM Mono', monospace", letterSpacing: '1px', marginBottom: '6px' }}>
                  SINGLE-STAR →
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {activeStar.singleEvolvesTo.map(id => {
                    const s = bseTypes.find(x => x.id === id);
                    return (
                      <button key={id} onClick={() => setSelectedId(id)} style={{
                        fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
                        background: '#0d1520', border: '1px solid #1a2535',
                        color: '#99aabb', cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                        {s.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeStar.binaryEvolvesTo.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#995533', fontFamily: "'DM Mono', monospace", letterSpacing: '1px', marginBottom: '6px' }}>
                  BINARY-ONLY →
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {activeStar.binaryEvolvesTo.map(id => {
                    const s = bseTypes.find(x => x.id === id);
                    return (
                      <button key={id} onClick={() => setSelectedId(id)} style={{
                        fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
                        background: '#1a1510', border: '1px solid #332a20',
                        color: '#cc9966', cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                        {s.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Type list */}
          <div style={{ borderTop: '1px solid #1a2535', paddingTop: '14px', marginTop: '8px' }}>
            <div style={{ fontSize: '10px', color: '#556677', fontFamily: "'DM Mono', monospace", letterSpacing: '1px', marginBottom: '8px' }}>
              ALL STELLAR TYPES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
              {bseTypes.map(s => (
                <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                  fontSize: '10px', padding: '5px 8px', borderRadius: '3px', textAlign: 'left',
                  background: s.id === selectedId ? '#1a2535' : 'transparent',
                  border: s.id === selectedId ? '1px solid #2a3545' : '1px solid transparent',
                  color: s.id === selectedId ? '#e0f0e8' : '#667788',
                  cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: s.id === 14 ? '#000' : s.color,
                    border: s.id === 14 ? '1px solid #555' : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{ opacity: 0.6 }}>{s.id}</span> {s.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}