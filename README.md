# MB-Warband-API-VSC

This is Azremen (a.k.a. Revan) and Sart's Mount & Blade: Warband Syntax helper. Originally a ported version of Shcherbyna's Sublime Text Version, it has now evolved into a full-fledged IDE tool for Warband Modding.

## ✨ Features
* **Dynamic IntelliSense (Auto-completion):** Automatically parses your `module_*.py` (or `ID_*.py`) files in real-time. Typing `itm_`, `trp_`, `fac_`, or `scn_` will instantly suggest IDs directly from your project without needing to recompile!
* **Smart Skill & Attribute Suggestions:** Full auto-completion for all Warband skills (`skl_`), attributes (`ca_`), and troop skill assignments (`knows_ironflesh_5`, etc.) with in-editor descriptions.
* **Warband Script Formatter:** A custom code formatter designed specifically for Warband's tuple-based syntax. Just press `Alt + Shift + F` to perfectly align your `try_begin`, `try_end` blocks and long arrays.
* **Comprehensive Snippets:** A massive library of module system operations to speed up your coding process.

## 🛠️ Installation

To install manually, follow these steps:
1. Close Microsoft Visual Studio Code.
2. Go to your Visual Studio Code extensions folder:
   * **Windows:** `C:\Users\<yourusername>\.vscode\extensions`
   * **Linux:** `~/.vscode/extensions/`
3. Copy the downloaded `mbap` folder.
4. Paste it into your extensions folder.

That's it! You have successfully installed the Mount & Blade: Warband Syntax Helper. Open your Module System folder in VS Code and enjoy modern developing!

## ❓ Q&A

**Q: Does it support modern module systems like W.R.E.C.K.?**
A: Yes! The Dynamic Parser reads directly from your `module_*.py` files, so it works perfectly even if your compiler doesn't generate static `ID_*.py` files.

**Q: Do I need Python installed for the formatter?**
A: Yes, the formatter utilizes the `black` python library in the background to handle base formatting before applying Warband-specific indentation. Ensure Python and `black` are available in your system path.

**Q: I found a bug. Where can I report it?**
A: We have a forum thread on TaleWorlds (link below). You may post there or try to solve it yourself and push a commit. We don't have a strict limiter on the license. Enjoy developing!

---
**Forum Thread:** [Mount & Blade: Warband Syntax Helper for Microsoft Visual Code](https://forums.taleworlds.com/index.php?threads/mount-blade-warband-syntax-helper-for-microsoft-visual-code.448724/)