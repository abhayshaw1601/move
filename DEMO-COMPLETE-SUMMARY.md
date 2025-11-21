# ✅ DEMO SETUP COMPLETE

## What We've Created

### 1. Demo Files
- ✅ `Llama-3-Quantized.bin` - Professional-looking demo model file (641 bytes)
- ✅ `setup-demo-alias.ps1` - Creates `vfs` command alias and clean prompt
- ✅ `DEMO-READY.md` - Complete 5-minute demo script with all commands
- ✅ `DEMO-QUICK-REF.md` - Quick reference card for during demo
- ✅ `DEMO-FINAL.md` - Detailed demo guide with timing

### 2. Repository IDs (Ready to Use)
```
GOLD_REPO (with 4 versions): 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4
FORKED_REPO (for lineage): 0x771078fdad17362a452ecf02a3a479e2cc829cfad1be447ddc319f952b81fbf6
PAID_REPO (for revenue): 0x87b3d03e330652bfe61386042c0cb789a439fdb8a4159dbea14b216ceba81028
```

### 3. Test Scripts
- ✅ `quick-demo-test.ps1` - Fast validation of all commands
- ✅ `run-full-demo.ps1` - Complete demo simulation

---

## 🚀 HOW TO RUN THE DEMO

### Quick Start (3 steps)

1. **Set your private key:**
```powershell
$env:SUI_PRIVATE_KEY="your_private_key_here"
```

2. **Load the alias (creates `vfs` command):**
```powershell
. .\setup-demo-alias.ps1
```

3. **Start demo:**
```powershell
vfs storefront
```

### ✅ Verified Working!
The `vfs` alias is tested and working. All commands pass through correctly to `npm run cli`.

---

## 📋 THE 5 COMMANDS

```powershell
# 1. Show marketplace (0:00-0:45)
vfs storefront

# 2. Upload model to Walrus (0:45-1:45)
vfs commit --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4 --file ./Llama-3-Quantized.bin --attr "Accuracy=98.2%,Quantization=int8"

# 3. Show lineage tree (1:45-2:45)
vfs inspect --repo 0x771078fdad17362a452ecf02a3a479e2cc829cfad1be447ddc319f952b81fbf6

# 4. Verify with TEE (2:45-3:45)
vfs verify --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4

# 5. Generate audit report (3:45-4:30)
vfs audit-report --repo 0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4 --out demo-report.html
```

---

## 🎯 THE STORY

**Problem → Solution → Demo**

1. **INTRO (0:45)**: AI models are black boxes → Provenance Pro fixes this
2. **STORAGE (1:00)**: Walrus sharding → Censorship-resistant storage
3. **LINEAGE (1:00)**: On-chain tracking → Automatic royalties
4. **TRUST (1:00)**: TEE verification → Gold badge
5. **COMPLIANCE (0:45)**: Audit report → EU AI Act automation
6. **OUTRO (0:30)**: Revenue field → GitHub for AI Era

**Total: 5:00 minutes**

---

## ✅ WHAT WORKS

- ✅ `vfs storefront` - Shows 27 models
- ✅ `vfs commit` - Uploads to Walrus + Sui
- ✅ `vfs inspect` - Shows dependency tree
- ✅ `vfs verify` - Shows ASCII charts (Note: needs main branch)
- ✅ `vfs audit-report` - Generates HTML with charts

---

## ⚠️ KNOWN ISSUES

1. **Verify command**: Requires repository with main branch
   - Use repo: `0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4`
   - This repo has 4 versions with metrics

2. **Commit timing**: May take 10-30 seconds
   - Keep talking during upload
   - Point to "Uploading Shards" progress

---

## 📁 FILES TO OPEN BEFORE DEMO

1. **Terminal**: PowerShell with large font
2. **Browser Tab 1**: Suiscan object page
   - `https://suiscan.xyz/testnet/object/0x87b3d03e330652bfe61386042c0cb789a439fdb8a4159dbea14b216ceba81028`
3. **Browser Tab 2**: Pre-generated audit report (backup)
4. **Document**: DEMO-QUICK-REF.md (for reference)

---

## 🎬 RECORDING TIPS

1. **Font**: JetBrains Mono or Consolas, size 18+
2. **Prompt**: Clean `>` prompt (setup script does this)
3. **Speed**: Type slowly so viewers can read
4. **Mouse**: Point to key lines in output
5. **Energy**: High energy, confident tone
6. **Timing**: Practice 3x to hit 5:00 exactly

---

## 🧪 TEST BEFORE RECORDING

Run this to verify everything works:
```powershell
.\quick-demo-test.ps1
```

Should show:
- ✅ Storefront works
- ✅ Inspect works
- ✅ Verify works (or skip if no main branch)
- ✅ Audit Report works
- ✅ Demo file exists

---

## 🎯 SUCCESS CRITERIA

Your demo is ready when:
- [ ] All commands work without errors
- [ ] Timing is close to 5:00 minutes
- [ ] You can explain each part clearly
- [ ] Terminal is readable on camera
- [ ] Browser tabs are ready
- [ ] You've practiced 3+ times

---

## 📞 QUICK HELP

**Command not found?**
→ Run: `. .\setup-demo-alias.ps1`

**Verify fails?**
→ Use repo with versions: `0xcca7201e5c22e0c4f8f3686e634e26e1f0638d51168410a35622653ea7f269a4`

**Commit too slow?**
→ Keep talking about Walrus distribution

**Forgot what to say?**
→ Open DEMO-QUICK-REF.md

---

## 🚀 YOU'RE READY!

Everything is set up. The demo is tested. The story is clear.

**Next step: Record your 5-minute demo!**

Good luck! 🎬
