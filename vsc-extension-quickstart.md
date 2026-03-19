# Welcome to MB-Warband-API-VSC Extension Development

## What's in the folder

* This folder contains all the files necessary for the Mount & Blade: Warband API extension.
* `package.json` - The manifest file where the extension's commands, formatters, snippets, and language configurations are declared.
* `extension.js` - The core logic of the extension. It contains the `WarbandScriptFormatter` for aligning code and the `WarbandIDParser` for dynamic IntelliSense.
* `snippets/mbap.code-snippets` - The snippet library containing Warband module system operations.

## Get up and running straight away

* Make sure you have `black` (the Python code formatter) installed on your system environment, as our custom formatter relies on it for the initial formatting pass.
* Press `F5` to open a new VS Code window with your extension loaded in Debug Mode (Extension Development Host).
* Open a Warband Module System folder in that new window (e.g., your Settler Warbands project).
* Test the core features:
  * **Formatter:** Open any `module_*.py` file, deliberately mess up the indentation of a `try_begin` / `try_end` block, and press `Alt+Shift+F` (or `Shift+Option+F` on Mac) to see it perfectly aligned.
  * **IntelliSense (Static):** Type `skl_`, `ca_`, or `knows_` to see the predefined skills and attributes auto-complete with their descriptions.
  * **IntelliSense (Dynamic):** Type `itm_`, `trp_`, or `fac_` to test if the `WarbandIDParser` is reading your local module files correctly and suggesting IDs on the fly.

## Make changes

* You can relaunch the extension from the debug toolbar after making changes to `extension.js` or `package.json`.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your loaded extension to apply your changes instantly.

## Install and Share your extension

* To pack your extension for production or personal installation, you can use the `vsce package` command in your terminal to generate a `.vsix` file.
* To share your extension with the world, read more about publishing an extension at: https://code.visualstudio.com/api/working-with-extensions/publishing-extension