const vscode = require('vscode');
const { exec } = require('child_process');
const util = require('util');
const os = require('os');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const crypto = require('crypto');

// Convert the exec command to a Promise-based asynchronous structure
const execAsync = util.promisify(exec);

// Native Warband Skills and Attributes for IntelliSense
const skills = [
  // Base Attributes
  { id: "ca_strength", name: "Strength", desc: "Base attribute. Determines physical power." },
  { id: "ca_agility", name: "Agility", desc: "Base attribute. Determines speed and swiftness." },
  { id: "ca_intelligence", name: "Intelligence", desc: "Base attribute. Determines learning and crafting capabilities." },
  { id: "ca_charisma", name: "Charisma", desc: "Base attribute. Determines social influence and leadership." },
  
  // Game Skills
  { id: "skl_trade", name: "Trade", desc: "Every level of this skill reduces your trade penalty by 5%. (Party skill)" },
  { id: "skl_leadership", name: "Leadership", desc: "Every point increases maximum number of troops you can command by 5, increases your party morale and reduces troop wages by 5%. (Leader skill)" },
  { id: "skl_prisoner_management", name: "Prisoner Management", desc: "Every level of this skill increases maximum number of prisoners. (Leader skill)" },
  { id: "skl_reserved_1", name: "Reserved Skill 1", desc: "This is a reserved skill." },
  { id: "skl_reserved_2", name: "Reserved Skill 2", desc: "This is a reserved skill." },
  { id: "skl_reserved_3", name: "Reserved Skill 3", desc: "This is a reserved skill." },
  { id: "skl_reserved_4", name: "Reserved Skill 4", desc: "This is a reserved skill." },
  { id: "skl_persuasion", name: "Persuasion", desc: "This skill helps you make other people accept your point of view. It also lowers the minimum level of relationship needed to get NPCs to do what you want. (Personal skill)" },
  { id: "skl_engineer", name: "Engineer", desc: "This skill allows you to construct siege equipment and fief improvements more efficiently. (Party skill)" },
  { id: "skl_first_aid", name: "First Aid", desc: "Heroes regain 5% per skill level of hit-points lost during mission. (Party skill)" },
  { id: "skl_surgery", name: "Surgery", desc: "Each point to this skill gives a 4% chance that a mortally struck party member will be wounded rather than killed. (Party skill)" },
  { id: "skl_wound_treatment", name: "Wound Treatment", desc: "Party healing speed is increased by 20% per level of this skill. (Party skill)" },
  { id: "skl_inventory_management", name: "Inventory Management", desc: "Increases inventory capacity by +6 per skill level. (Leader skill)" },
  { id: "skl_spotting", name: "Spotting", desc: "Party seeing range is increased by 10% per skill level. (Party skill)" },
  { id: "skl_pathfinding", name: "Path-finding", desc: "Party map speed is increased by 3% per skill level. (Party skill)" },
  { id: "skl_tactics", name: "Tactics", desc: "Every two levels of this skill increases starting battle advantage by 1. (Party skill)" },
  { id: "skl_tracking", name: "Tracking", desc: "Tracks become more informative. (Party skill)" },
  { id: "skl_trainer", name: "Trainer", desc: "Every day, each hero with this skill adds some experience to every other member of the party whose level is lower than his/hers. Experience gained goes as: {0,4,10,16,23,30,38,46,55,65,80}. (Personal skill)" },
  { id: "skl_reserved_5", name: "Reserved Skill 5", desc: "This is a reserved skill." },
  { id: "skl_reserved_6", name: "Reserved Skill 6", desc: "This is a reserved skill." },
  { id: "skl_reserved_7", name: "Reserved Skill 7", desc: "This is a reserved skill." },
  { id: "skl_reserved_8", name: "Reserved Skill 8", desc: "This is a reserved skill." },
  { id: "skl_looting", name: "Looting", desc: "This skill increases the amount of loot obtained by 10% per skill level. (Party skill)" },
  { id: "skl_horse_archery", name: "Horse Archery", desc: "Reduces damage and accuracy penalties for archery and throwing from horseback. (Personal skill)" },
  { id: "skl_riding", name: "Riding", desc: "Enables you to ride horses of higher difficulty levels and increases your riding speed and manuever. (Personal skill)" },
  { id: "skl_athletics", name: "Athletics", desc: "Improves your running speed. (Personal skill)" },
  { id: "skl_shield", name: "Shield", desc: "Reduces damage to shields (by 8% per skill level) and improves shield speed and coverage. (Personal skill)" },
  { id: "skl_weapon_master", name: "Weapon Master", desc: "Makes it easier to learn weapon proficiencies and increases the proficiency limits. Limits go as: 60, 100, 140, 180, 220, 260, 300, 340, 380, 420. (Personal skill)" },
  { id: "skl_reserved_9", name: "Reserved Skill 9", desc: "This is a reserved skill." },
  { id: "skl_reserved_10", name: "Reserved Skill 10", desc: "This is a reserved skill." },
  { id: "skl_reserved_11", name: "Reserved Skill 11", desc: "This is a reserved skill." },
  { id: "skl_reserved_12", name: "Reserved Skill 12", desc: "This is a reserved skill." },
  { id: "skl_reserved_13", name: "Reserved Skill 13", desc: "This is a reserved skill." },
  { id: "skl_power_draw", name: "Power Draw", desc: "Lets character use more powerful bows. Each point to this skill (up to four plus power-draw requirement of the bow) increases bow damage by 14%. (Personal skill)" },
  { id: "skl_power_throw", name: "Power Throw", desc: "Each point to this skill increases throwing damage by 10%. (Personal skill)" },
  { id: "skl_power_strike", name: "Power Strike", desc: "Each point to this skill increases melee damage by 8%. (Personal skill)" },
  { id: "skl_ironflesh", name: "Ironflesh", desc: "Each point to this skill increases hit points by +2. (Personal skill)" },
  { id: "skl_reserved_14", name: "Reserved Skill 14", desc: "This is a reserved skill." },
  { id: "skl_reserved_15", name: "Reserved Skill 15", desc: "This is a reserved skill." },
  { id: "skl_reserved_16", name: "Reserved Skill 16", desc: "This is a reserved skill." },
  { id: "skl_reserved_17", name: "Reserved Skill 17", desc: "This is a reserved skill." },
  { id: "skl_reserved_18", name: "Reserved Skill 18", desc: "This is a reserved skill." }
];

// --- Formatter Class ---
class WarbandScriptFormatter {
  async provideDocumentFormattingEdits(document, options, token) {
    const cfg = vscode.workspace.getConfiguration();
    const lineLength = cfg.get('mbap.lineLength', 2000);
    
    const src = document.getText();
    
    // Unique temporary file name to prevent multiple formatting conflicts at the same time
    const uniqueId = crypto.randomBytes(4).toString('hex');
    const tmpPath = path.join(os.tmpdir(), `temp_mbap_${uniqueId}.py`);
    
    try {
      // 1. Write the code asynchronously to the temp file
      await fsPromises.writeFile(tmpPath, src, 'utf8');
      
      // 2. Run Black asynchronously (prevents VS Code UI from freezing)
      await execAsync(`black --line-length ${lineLength} --skip-string-normalization --quiet "${tmpPath}"`, {
        encoding: 'utf8', 
        shell: true
      });
      
      // 3. Read the formatted file asynchronously
      const formatted = await fsPromises.readFile(tmpPath, 'utf8');
      
      // 4. Apply Warband-specific indentation and tuple formatting
      const outputText = this.applyWarbandFormatting(formatted);
      
      // 5. Determine the Range covering the entire document
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(src.length)
      );
      
      // 6. Return the change to VS Code as a TextEdit object
      return [vscode.TextEdit.replace(fullRange, outputText)];
      
    } catch (error) {
      vscode.window.showErrorMessage(`Warband Format Error: ${error.message}`);
      return []; // Do not modify the document in case of an error
    } finally {
      // Clean up the temporary file when the process is finished
      if (fs.existsSync(tmpPath)) {
        await fsPromises.unlink(tmpPath);
      }
    }
  }

  applyWarbandFormatting(formattedText) {
    const out = [];
    let tryLevel = 0;
    let listDepth = 0;
    let tupleDepth = 0;

    const lines = formattedText.split('\n');

    for (let line of lines) {
      const trimmed = line.trim();

      // Exclude comment lines (#) from logical checks
      const codePart = trimmed.split('#')[0].trim();

      const opensList = (codePart.match(/\[/g) || []).length;
      const closesList = (codePart.match(/\]/g) || []).length;

      const isTupleAssign = /^[\w\.]+\s*=\s*\($/.test(codePart);
      const isListAssign  = /^[\w\.]+\s*=\s*\[$/.test(codePart);
      const isTupleEnd    = codePart === '),' || codePart === ')';
      const isListEnd     = codePart === '],' || codePart === ']';

      // try_end / else_try closure
      if (/\b(try_end|else_try)\b/.test(codePart)) {
        tryLevel = Math.max(0, tryLevel - 1);
      }

      let td = tupleDepth;
      let ld = listDepth;
      if (isTupleEnd) td--;
      if (isListEnd)  ld -= closesList;

      let indentLevel;
      if (isListAssign || isTupleAssign) {
        indentLevel = 0;
      } else {
        indentLevel = tryLevel + td + ld;
      }
      const indent = '    '.repeat(Math.max(0, indentLevel));
      
      // Add the formatted line to the array
      out.push(indent + trimmed);

      // try_begin / else_try opening
      if (/\b(try_begin|else_try)\b/.test(codePart)) {
        tryLevel++;
      }

      listDepth += opensList - closesList;
      if (codePart === '(' || isTupleAssign) tupleDepth++;
      if (isTupleEnd) tupleDepth--;
    }

    let outputText = out.join('\n');

    // Collapse outer tuple opening to a single line
    const splitLines = outputText.split('\n');
    const newLines = [];
    for (let i = 0; i < splitLines.length; i++) {
      if (
        i <= splitLines.length - 5 &&
        /^\s*\($/.test(splitLines[i]) &&
        /^\s*"[^"]+",?$/.test(splitLines[i+1]) &&
        /^\s*[0-9]+,?$/.test(splitLines[i+2]) &&
        /^\s*[0-9]+,?$/.test(splitLines[i+3]) &&
        /^\s*\[$/.test(splitLines[i+4])
      ) {
        const baseIndent = (splitLines[i].match(/^(\s*)\(/) || ['',''])[1];
        const key        = splitLines[i+1].trim().replace(/,$/, '').replace(/^"|"$/g, '');
        const n1         = splitLines[i+2].trim().replace(/,$/, '');
        const n2         = splitLines[i+3].trim().replace(/,$/, '');
        newLines.push(`${baseIndent}("${key}", ${n1}, ${n2},`);
        newLines.push(`${baseIndent}    [`);
        i += 4;
      } else {
        newLines.push(splitLines[i]);
      }
    }
    outputText = newLines.join('\n');

    // Collapse inner tuples to a single line
    outputText = outputText.replace(
      /\(\s*([^()\[\]]+?)\s*\),/gs,
      (_, inner) =>
        '(' +
        inner
          .split(/,?\s*\n/)
          .map(s => s.replace(/,$/, '').trim())
          .filter(Boolean)
          .join(', ') +
        '),'
    );

    return outputText;
  }
}

// --- Dynamic ID Parser Class ---
class WarbandIDParser {
  constructor() {
    this.dynamicItems = [];
    this.watcher = null;
    
    // File name and prefix mapping for dynamic parsing
    this.filePrefixMap = {
      'module_items.py': 'itm_',
      'module_troops.py': 'trp_',
      'module_factions.py': 'fac_',
      'module_parties.py': 'p_',
      'module_party_templates.py': 'pt_',
      'module_scenes.py': 'scn_',
      'module_scene_props.py': 'spr_',
      'module_game_menus.py': 'mnu_',
      'module_presentations.py': 'prsnt_',
      'module_quests.py': 'qst_',
      'module_mission_templates.py': 'mt_',
      'module_meshes.py': 'mesh_',
      'module_sounds.py': 'snd_',
      'module_info_pages.py': 'ip_',
      'module_animations.py': 'anim_',
      'module_particle_systems.py': 'psys_',
      'module_scripts.py': 'script_'
    };
    
    this.supportedPrefixes = Object.values(this.filePrefixMap);
  }

  async parseWorkspace() {
    this.dynamicItems = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    // Find both ID_*.py and module_*.py source files
    const files = await vscode.workspace.findFiles('{ID_*.py,module_*.py}');
    
    for (const file of files) {
      const fileName = path.basename(file.fsPath);
      const isModuleFile = fileName.startsWith('module_');
      const isIdFile = fileName.startsWith('ID_');
      
      try {
        const content = await fsPromises.readFile(file.fsPath, 'utf8');
        const lines = content.split('\n');
        
        if (isIdFile) {
          // Classic method: Read compiled ID_ files if they exist
          for (const line of lines) {
            const match = line.trim().match(/^([a-zA-Z0-9_]+)\s*=\s*[0-9]+$/);
            if (match) {
              const idName = match[1];
              if (this.supportedPrefixes.some(prefix => idName.startsWith(prefix))) {
                this.addCompletionItem(idName, fileName);
              }
            }
          }
        } else if (isModuleFile && this.filePrefixMap[fileName]) {
          // Modern method: Read module_*.py source files directly (e.g. for W.R.E.C.K.)
          const prefix = this.filePrefixMap[fileName];
          for (const line of lines) {
            // Match the start of a tuple or list. e.g.: ["iron_sword" or ("village_1"
            const match = line.trim().match(/^[\[\(]\s*['"]([^'"]+)['"]/);
            if (match) {
              let rawId = match[1];
              
              // Handle scripts properly (they are sometimes written as "script_game_start")
              let fullId = rawId.startsWith(prefix) ? rawId : prefix + rawId;
              this.addCompletionItem(fullId, fileName);
            }
          }
        }
      } catch (err) {
        console.error(`Failed to parse ${file.fsPath}:`, err);
      }
    }
  }

  addCompletionItem(idName, sourceFile) {
    // Prevent duplicate entries (if an item exists in both module_ and ID_ file)
    if (!this.dynamicItems.some(item => item.label === idName)) {
      const item = new vscode.CompletionItem(idName, vscode.CompletionItemKind.Variable);
      item.detail = "Project ID";
      item.documentation = new vscode.MarkdownString(`Auto-parsed from \`${sourceFile}\``);
      this.dynamicItems.push(item);
    }
  }

  startWatching() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    // Listen for changes in both source and ID files
    const pattern = new vscode.RelativePattern(workspaceFolders[0], '{ID_*.py,module_*.py}');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    // Update the list immediately when a file is saved, created or deleted
    this.watcher.onDidChange(() => this.parseWorkspace());
    this.watcher.onDidCreate(() => this.parseWorkspace());
    this.watcher.onDidDelete(() => this.parseWorkspace());
  }

  dispose() {
    if (this.watcher) {
      this.watcher.dispose();
    }
  }

  getCompletionItems(prefix) {
    // Filter array efficiently
    return this.dynamicItems.filter(item => item.label.startsWith(prefix));
  }
}


function activate(context) {
  // 1. Initialize Formatter
  const formatter = new WarbandScriptFormatter();
  const providerRegistration = vscode.languages.registerDocumentFormattingEditProvider(
    { language: 'python', scheme: 'file' }, 
    formatter
  );
  context.subscriptions.push(providerRegistration);

  const commandRegistration = vscode.commands.registerCommand('mbap.formatWarbandScript', async () => {
    await vscode.commands.executeCommand('editor.action.formatDocument');
  });
  context.subscriptions.push(commandRegistration);

  // 2. Initialize Dynamic Parser
  const idParser = new WarbandIDParser();
  idParser.parseWorkspace(); // Scan files on startup
  idParser.startWatching();  // Start listening to file changes
  context.subscriptions.push({ dispose: () => idParser.dispose() });

  // 3. IntelliSense (Auto-completion) for Skills, Attributes AND Dynamic IDs
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'python', scheme: 'file' },
    {
      provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        
        // Dynamic regex checking for all supported prefixes (including skills and dynamic ones like itm_, trp_)
        const allPrefixes = ['skl_', 'ca_', 'knows_', ...idParser.supportedPrefixes];
        const prefixRegex = new RegExp(`(${allPrefixes.join('|')})[a-zA-Z0-9_]*$`);
        const match = linePrefix.match(prefixRegex);

        if (!match) {
          return undefined;
        }

        const matchedPrefix = match[1];
        let completionList = [];

        // If prefix is related to skills/attributes, return the static list
        if (matchedPrefix === 'skl_' || matchedPrefix === 'ca_' || matchedPrefix === 'knows_') {
          completionList = skills.flatMap(skill => {
            const items = [];
            
            // Generate items for skl_ and ca_
            const baseItem = new vscode.CompletionItem(skill.id, vscode.CompletionItemKind.Constant);
            baseItem.detail = skill.name;
            baseItem.documentation = new vscode.MarkdownString(skill.desc);
            items.push(baseItem);

            // Generate knows_ 1-10 variations only for skills (skl_)
            if (skill.id.startsWith('skl_')) {
              const baseName = skill.id.replace('skl_', '');
              for (let i = 1; i <= 10; i++) {
                const knowsItem = new vscode.CompletionItem(`knows_${baseName}_${i}`, vscode.CompletionItemKind.EnumMember);
                knowsItem.detail = `${skill.name} Level ${i}`;
                knowsItem.documentation = new vscode.MarkdownString(`Assigns level ${i} ${skill.name} to a troop.`);
                items.push(knowsItem);
              }
            }
            return items;
          });
        } 
        // If prefix is a dynamic ID (e.g. itm_, trp_), return the list from the Parser
        else {
           completionList = idParser.getCompletionItems(matchedPrefix);
        }

        return completionList;
      }
    },
    '_' // Trigger character
  );
  
  context.subscriptions.push(completionProvider);
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;