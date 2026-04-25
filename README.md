# Echo Swan — Intracardiac Pressure Calculator

A clinical web application for estimating intracardiac pressures from echocardiographic data, based on ASE guidelines and simplified Bernoulli equations.

## Features

- **RAP** — IVC diameter/collapse assessment + hepatic vein SFF method
- **RV Pressures** — RVSP via TR, RVSP via VSD, RVEDP, RVDP
- **PA Pressures** — PASP, PAEDP, mPAP (3 methods)
- **PVR** — Echo (Abbas 2003) and hemodynamic methods
- **LAP** — E/e' formulas and MR-based method
- **LV Pressures** — LVSP (BP, MR, AS methods), LVEDP (AR, Ar–A duration)
- **Summary** — All values in a single hemodynamic overview

## Usage

This is a pure HTML/CSS/JS app — no build step required.

**Option 1: Open locally**
```
open index.html
```

**Option 2: Deploy to GitHub Pages**
1. Push to a GitHub repository
2. Go to Settings → Pages
3. Set source to `main` branch, root `/`
4. Your app will be live at `https://<username>.github.io/<repo>/`

## File Structure

```
echo-swan/
├── index.html   # App markup and structure
├── style.css    # Styles (DM Serif Display + DM Sans)
├── app.js       # All calculation logic
└── README.md
```

## Clinical Disclaimer

These are echocardiographic **estimates** based on simplified Bernoulli equations and population-derived formulas. Values may not be accurate in:
- Atrial fibrillation
- Serial or mixed obstructions (simplified Bernoulli fails)
- Severe valvular disease (torrential TR, pressure recovery in AS)
- Anemia
- Poor acoustic windows

Direct hemodynamic measurement (right heart catheterization) remains the gold standard.

## References

- Kircher BJ et al. *Noninvasive estimation of right atrial pressure from the inspiratory collapse of the inferior vena cava.* Am J Cardiol 1990.
- Yock PG, Popp RL. *Noninvasive estimation of right ventricular systolic pressure.* Circulation 1984.
- Abbas AE, et al. *A simple method for noninvasive estimation of pulmonary vascular resistance.* JACC 2003.
- Nagueh SF, et al. *Doppler estimation of left ventricular filling pressures.* Circulation 1997.
- Fisher MR, et al. *Accuracy of Doppler echocardiography in the hemodynamic assessment of pulmonary hypertension.* Am J Respir Crit Care Med 2009.
- Narang A, Lang RM, et al. *ASE Formula Review Book.*

## Author

Based on Echo Swan lecture by Akhil Narang, MD.
