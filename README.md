# DRISHTI · frontend prototype

# BACKEND SOURCE CODE IS IN A SEPARATE PRIVATE REPOSITORY THIS IS JUST A DEMO REPO THAT PORTED FROM THE OG PRIVATE REPO

Clickable PORTED PUBLIC prototype for SIH26121 on representative (synthetic) Upper Assam data. Frontend only: Next.js, IBM Carbon (g100 dark / white), three.js, framer-motion. No backend. All data is in `lib/data.ts`, shaped like the planned API.
## Run (use the production build for recording; it is smoother than dev)

```bash
npm install
npm run build && npm start -- -p 3100   # http://localhost:3100
# or: npm run dev -- -p 3100
```

## Guide

A 44-step guided tour starts on first load (Next / Back, arrow keys; **Skip guide** is always on screen, Esc also skips). Replay it from **Guide** in the sidebar. It switches roles and routes for you, so start a screen recording and press Next.

## 4-minute demo storyboard

1. **Role: Planning engineer** → `Well & area`. Drag the radius slider; the map ring and offset count follow.
2. `Offset map & ranking` → hover a row (map highlights), open the relevance breakdown, switch to **3D wells** and orbit. Tick 4 offsets → **Compare**.
3. `Casing / cement / mud` ladder → depth cursor, toggle layers, click an event marker (evidence drawer).
4. `Risk register` → click a red cell (drawer: events, drivers, source pages). Note hatched "Insufficient" cells and "1 restricted offset also contributes". **Generate Offset Well Review**.
5. **Role: Drilling engineer** → `Cockpit`. Speed 10×, press **Play**. Watch the look-ahead strip, tracks (torque spikes in coal, flow-out and pit loss in the loss zone) and the 3D well tab with the bit.
6. Advisory, then Caution, then Warning arrive (toast + bell). `Alerts` → evidence, "what offsets did", Acknowledge (Warning needs a confirm), Annotate (reason required), Escalate.
7. `Deja-vu & Immune Watch` → switch on **How the fly brain thinks**; let it auto-play the five stages (real FlyHash on a synthetic window). Click **New drilling window** to see a different hash.
8. `Ask NWIS` → click a suggested question; citations open the source page (`Document viewer`). Ask something unrelated to see "No matching evidence".
9. **Role: Knowledge steward** → `Review queue`: approve / edit / reject a low-confidence field. **Role: Rig contractor** → restricted cockpit, watermark, no documents.

## Notes

- The replay is compressed (1 s of replay ≈ 0.2 m of hole) so alerts arrive within the demo; the badge says so.
- Deja-vu neighbours and hashes are computed in the browser (`lib/flyhash.ts`); the 10 historical windows are synthetic.
- Permissions come from one file, `lib/rbac-matrix.json`, read by `can()`.
