# 🎬 THE 5-MINUTE PROTOCOL DEMO SCRIPT
## "The Lifecycle of a Verifiable AI Model"

---

## 🎯 PRE-DEMO CHECKLIST

### Terminal Setup
- [ ] Font: JetBrains Mono / Consolas (Size 18+)
- [ ] Clean prompt: `function prompt { "> " }`
- [ ] Set environment: `$env:SUI_PRIVATE_KEY="your_key_here"`
- [ ] Clear screen: `cls`

### Browser Setup
- [ ] Tab 1: Suiscan open to your Gold/Paid repo
- [ ] Tab 2: Dark mode audit report ready (generate first)
- [ ] Tab 3: Walrus explorer (optional)

### Files Ready
- [ ] `Llama-3-Quantized.bin` in root directory
- [ ] Deployment info loaded
- [ ] All repo IDs noted

---

## 🎥 THE SCRIPT

### INTRO: The Vision (0:00 - 0:45)

**Visual:** Clear terminal, type command slowly

```powershell
> vfs storefront
```

**Voiceover:**
> "Hi, I'm [Name], and this is Provenance Pro.
> 
> The AI industry is facing a crisis. We treat models like black boxes. We don't know where the data came from, we can't prove they comply with the EU AI Act, and creators are struggling to monetize.
> 
> Provenance Pro is the Infrastructure Layer that fixes this. We combine Walrus for decentralized storage with Sui for immutable lineage and trust.
> 
> Let me show you the lifecycle of a verifiable AI model."

**Action:** ASCII table loads showing Free, Paid, and Gold models

---

### PART 1: The Storage Protocol (Walrus) (0:45 - 1:45)

**Visual:** Type the commit command

```powershell
> vfs commit --repo [GOLD_REPO_ID] --file ./Llama-3-Quantized.bin --attr "Accuracy=98.2%,Quantization=int8"
```

**Voiceover:**
> "Let's start with the core protocol. When an engineer pushes a model, we don't just dump it to a server.
> 
> Our protocol shards the file into cryptographically hashed blobs and streams them directly to Walrus nodes.
> 
> Watch the logs: Each shard gets its own Blob ID. On Sui, we store the Manifest—the map of these shards.
> 
> This ensures the model is censorship-resistant and permanently accessible, unlike centralized servers that can delete your work."

**Action:** 
- Point to "Uploading Shards to Walrus" line
- Point to "Blob IDs" in output
- Point to "Transaction Hash" when complete

---

### PART 2: The Lineage & Theft Protection (1:45 - 2:45)

**Visual:** Type inspect command

```powershell
> vfs inspect --repo [FORK_REPO_ID]
```

**Voiceover:**
> "But storage isn't enough. We need to solve Model Theft.
> 
> Here, I'm inspecting a fine-tuned model. The protocol tracks the On-Chain Lineage.
> 
> You can see exactly which Parent Model this was forked from. The dependency tree shows the entire provenance chain.
> 
> If this model generates revenue, the Smart Contract automatically enforces Royalties, sending 5% back to the original architect.
> 
> This turns Open Source from a charity into an economy."

**Action:**
- Point to "Parent Repository" field
- Point to "Dependency Tree" visualization
- Point to "Royalty Split: 5%" line

---

### PART 3: The Trust & Verification (2:45 - 3:45)

**Visual:** Type verify command

```powershell
> vfs verify --repo [GOLD_REPO_ID]
```

**Voiceover:**
> "Now, compliance. How do we know this model is safe?
> 
> We use Trusted Execution Environments—TEEs—to verify the training run.
> 
> Look at the terminal: The protocol pulls the training metrics on-chain. The Loss Curve shows convergence. The Accuracy Chart shows performance.
> 
> The TEE signature is validated by the Sui Smart Contract.
> 
> This updates the repository's Trust Score in real-time. This model just earned Gold Badge status."

**Action:**
- Point to ASCII Charts (Loss/Accuracy)
- Point to "Trust Score Updated: 850 -> 950"
- Point to "Badge: Gold" line

---

### PART 4: The Artifact (EU AI Act) (3:45 - 4:30)

**Visual:** Type audit report command

```powershell
> vfs audit-report --repo [GOLD_REPO_ID] --out demo-report.html
```

**Action:** Browser opens with dark mode HTML. Scroll through it.

**Voiceover:**
> "For enterprise adoption, we generate this: The Audit Artifact.
> 
> This is a legal-grade document generated from blockchain data. It links the Walrus Blob IDs, the Sui Transaction Hash, and the Performance Metrics.
> 
> Notice the charts, the version history, the compliance checklist.
> 
> This effectively automates compliance for the EU AI Act. No manual paperwork. Just click, generate, submit."

**Action:**
- Scroll to "Blockchain Verification" section
- Point to "Walrus Blob IDs" table
- Point to "Trust Score: Gold" badge
- Scroll to charts

---

### OUTRO: The Future (4:30 - 5:00)

**Visual:** Switch to Suiscan showing the Object with Revenue > 0

**Voiceover:**
> "Finally, notice the revenue field. This protocol is already settling payments on Mainnet.
> 
> We aren't just building a tool. We are building the GitHub for the AI Era, powered by Sui and Walrus.
> 
> Provenance Pro: Verifiable AI Infrastructure.
> 
> Thank you."

**Action:** 
- Point to "revenue" field in Suiscan
- Point to "trust_score" field
- Show the transaction history

---

## 🎯 TIMING BREAKDOWN

| Section | Time | Key Message |
|---------|------|-------------|
| Intro | 0:45 | Problem statement + Solution |
| Storage | 1:00 | Walrus sharding + Censorship resistance |
| Lineage | 1:00 | Theft protection + Royalties |
| Trust | 1:00 | TEE verification + Trust scores |
| Artifact | 0:45 | EU AI Act compliance |
| Outro | 0:30 | Revenue + Vision |

**Total: 5:00**

---

## 💡 PRO TIPS

1. **Practice the timing** - Run through 3 times before recording
2. **Slow down on commands** - Let viewers read what you're typing
3. **Point with mouse** - Highlight key lines in terminal output
4. **Pause for effect** - After "Gold Badge" appears, pause 1 second
5. **Energy level** - Start high, maintain throughout
6. **No dead air** - If upload takes time, keep talking about what's happening

---

## 🚨 BACKUP PLAN

If something fails during demo:

1. **Commit fails**: Have a pre-recorded video of successful commit
2. **Network slow**: Use smaller file (rename demo-model.txt to .bin)
3. **Browser crash**: Have HTML report open in backup tab
4. **Terminal freeze**: Have second terminal ready with commands pre-typed

---

## 📋 COMMAND REFERENCE

```powershell
# Setup
$env:SUI_PRIVATE_KEY="your_key_here"
function prompt { "> " }
cls

# Demo commands (in order)
vfs storefront
vfs commit --repo [GOLD_ID] --file ./Llama-3-Quantized.bin --attr "Accuracy=98.2%,Quantization=int8"
vfs inspect --repo [FORK_ID]
vfs verify --repo [GOLD_ID]
vfs audit-report --repo [GOLD_ID] --out demo-report.html
```

---

## ✅ POST-DEMO

- [ ] Save recording
- [ ] Export HTML report
- [ ] Screenshot Suiscan page
- [ ] Note all transaction hashes
- [ ] Backup demo files
