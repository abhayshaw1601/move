# 🎬 START YOUR DEMO HERE

## ⚡ 3-Step Quick Start

### 1. Set Your Private Key
```powershell
$env:SUI_PRIVATE_KEY="your_private_key_here"
```

### 2. Load the VFS Alias
```powershell
. .\setup-demo-alias.ps1
```

### 3. Start the Demo
```powershell
vfs storefront
```

---

## 📋 The 5 Demo Commands (Copy-Paste Ready)

```powershell
# 1. Show marketplace (0:00-0:45)
vfs storefront

# 2. Upload to Walrus (0:45-1:45)
vfs commit --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4 --file ./Llama-3-Quantized.bin --attr "Accuracy=98.2%,Quantization=int8"

# 3. Show lineage (1:45-2:45)
vfs inspect --repo 0x771078fdad17362a452ecf02a3a479e2cc829cfad1be447ddc319f952b81fbf6

# 4. Verify with TEE (2:45-3:45)
vfs verify --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4

# 5. Generate audit report (3:45-4:30)
vfs audit-report --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4 --out demo-report.html
```

---

## 🎯 What to Say (Quick Version)

1. **Storefront**: "AI models are black boxes. Provenance Pro fixes this with Walrus + Sui."
2. **Commit**: "We shard files to Walrus nodes. Censorship-resistant storage."
3. **Inspect**: "On-chain lineage tracks theft. Automatic 5% royalties."
4. **Verify**: "TEE verification. Training metrics on-chain. Gold badge earned."
5. **Audit**: "Legal-grade document. EU AI Act compliance automated."
6. **Outro**: "Revenue on mainnet. GitHub for the AI Era."

---

## ✅ Before You Record

- [ ] Terminal font size 18+
- [ ] Run `.\setup-demo-alias.ps1`
- [ ] File `Llama-3-Quantized.bin` exists
- [ ] Open Suiscan tab: https://suiscan.xyz/testnet/object/0x87b3d03e330652bfe61386042c0cb789a439fdb8a4159dbea14b216ceba81028
- [ ] Practice 3x
- [ ] Time yourself (aim for 5:00)

---

## 📖 Full Scripts

- **Complete Script**: `DEMO-READY.md`
- **Quick Reference**: `DEMO-QUICK-REF.md`
- **Summary**: `DEMO-COMPLETE-SUMMARY.md`

---

## 🧪 Test First

Run this to verify everything works:
```powershell
.\FINAL-DEMO-TEST.ps1
```

---

**YOU'RE READY! 🚀 RECORD YOUR DEMO!**
