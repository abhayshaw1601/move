# 🎬 3-MINUTE CLI DEMO SCRIPT

## Quick Demo - AI Provenance Platform

### Setup (Already Done)
```bash
# Repository IDs from our tests:
REPO1=0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4  # 4 versions
REPO2=0x3d7c9a69ad9b5b332e219033921338c98424f2a436e7f0e6ecb385ab9928cb04  # Gold badge
REPO3=0x61a165112fd23b2ec40e0330c78f0229d466b996a97a210b016b8f91ee728c37  # Premium
```

---

## 🎯 DEMO FLOW (3 minutes)

### 1️⃣ Show Marketplace (30 seconds)
```bash
npm run cli -- storefront
```
**Say**: "Here's our AI model marketplace on Sui blockchain. You can see all published models with their trust scores and prices."

---

### 2️⃣ Inspect Repository (30 seconds)
```bash
npm run cli -- inspect --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4
```
**Say**: "Let's inspect a model to see its dependencies and lineage - full provenance tracking."

---

### 3️⃣ View Commit History (30 seconds)
```bash
npm run cli -- log
```
**Say**: "Here's the complete version history stored on blockchain - every commit is immutable and verifiable."

---

### 4️⃣ Generate Audit Report (60 seconds)
```bash
npm run cli -- audit-report --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4 --out ./demo-report.html
```
**Say**: "Now let's generate a comprehensive audit report with performance metrics, trust scores, and version history."

**Then open the HTML report in browser** - Show:
- Beautiful gradient UI
- Trust score badge
- Interactive charts (Loss & Accuracy)
- Complete version table with metrics
- 4 versions, 18 shards, 9.6 GB tracked

---

### 5️⃣ Show Trust Score Progression (30 seconds)
```bash
npm run cli -- audit-report --repo 0x3d7c9a69ad9b5b332e219033921338c98424f2a436e7f0e6ecb385ab9928cb04 --out ./gold-badge.html
```
**Say**: "This model has a Gold badge from 100 TEE verifications - proving reproducibility and trustworthiness."

**Open report** - Show Gold badge (🥇)

---

## 🎤 KEY TALKING POINTS

1. **Blockchain-Based**: All data stored on Sui blockchain - immutable and verifiable
2. **AI Provenance**: Track every version, metric, and dependency
3. **Trust Scores**: TEE verification builds trust (Bronze → Silver → Gold)
4. **Marketplace**: Buy/sell premium AI models with on-chain payments
5. **Sharding**: Large models split into shards, stored on Walrus
6. **Audit Reports**: Beautiful HTML reports with interactive charts

---

## 📊 IMPRESSIVE STATS TO MENTION

- ✅ 6 repositories created
- ✅ 150+ transactions on testnet
- ✅ 100% success rate
- ✅ 18 shards tracked
- ✅ 9.6 GB model storage
- ✅ Real-time charts
- ✅ Premium purchases working

---

## 🚀 CLOSING

**Say**: "This is a complete AI provenance platform on blockchain - from model versioning to marketplace to trust verification. Everything is transparent, immutable, and verifiable."

**Show**: Blockchain explorer link
```
https://suiscan.xyz/testnet/object/0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4
```

---

## ⚡ BACKUP COMMANDS (If Time)

```bash
# Show specific repo details
npm run cli -- inspect --repo 0x61a165112fd23b2ec40e0330c78f0229d466b996a97a210b016b8f91ee728c37

# Show premium model (0.01 SUI price)
npm run cli -- audit-report --repo 0x61a165112fd23b2ec40e0330c78f0229d466b996a97a210b016b8f91ee728c37 --out ./premium.html
```

---

## 🎯 DEMO TIPS

1. **Pre-open terminals** with commands ready
2. **Have HTML reports pre-generated** in case of slow network
3. **Keep browser tabs ready** with blockchain explorer
4. **Practice timing** - 30s per command
5. **Focus on visuals** - charts, badges, UI

**Total Time**: ~3 minutes
**Wow Factor**: 🔥🔥🔥
