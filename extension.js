const vscode = require('vscode');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');

async function formatAndSaveDocument() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor found.');
    return;
  }

  const doc = editor.document;
  const cfg = vscode.workspace.getConfiguration();
  const lineLength = cfg.get('mbap.lineLength', 2000);

  const src = doc.getText();
  const tmp = `${os.tmpdir()}/temp_mbap_script.py`;
  fs.writeFileSync(tmp, src, 'utf8');

  try {
    execSync(
      `black --line-length ${lineLength} --skip-string-normalization --quiet "${tmp}"`,
      { encoding: 'utf8', shell: true }
    );

    const formatted = fs.readFileSync(tmp, 'utf8');
    fs.unlinkSync(tmp);

    const out = [];
    const operationNames = [
      "try_begin", "try_for_range", "try_for_range_backwards",
      "try_for_parties", "try_for_agents", "try_for_prop_instances",
      "try_for_players", "try_for_dict_keys", "else_try"
    ];
    let tryLevel = 0;
    let listDepth = 0;
    let tupleDepth = 0;

    for (let line of formatted.split('\n')) {
      const trimmed = line.trim();

      // Yorum satırları aynen ekle
      if (trimmed.startsWith('#')) {
        out.push(line);
        continue;
      }

      // depth tetikleyicileri
      const opensList = (line.match(/\[/g) || []).length;
      const closesList = (line.match(/\]/g) || []).length;

      // tuple detektörleri
      const isGenericTupleStart = trimmed === '(';
      const isTupleAssign = /^[\w\.]+\s*=\s*\($/.test(trimmed);
      const isTupleEnd = trimmed === '),' || trimmed === ')';

      // list detektörleri
      const isListAssign = /^[\w\.]+\s*=\s*\[$/.test(trimmed);
      const isListEnd = trimmed === '],' || trimmed === ']';

      // try_end/else_try önce seviyeyı düşür
      if (/\b(try_end|else_try)\b/.test(trimmed)) {
        tryLevel = Math.max(0, tryLevel - 1);
      }

      // indentLevel hesap
      let indentLevel;
      if (isListAssign || isTupleAssign) {
        indentLevel = 0;
      } else if (isTupleEnd || isListEnd) {
        indentLevel = 1;
      } else {
        indentLevel = tryLevel + tupleDepth + listDepth;
      }

      const indent = '\t'.repeat(indentLevel);
      out.push(indent + trimmed);

      // try_begin/else_try sonra seviyeyı artır
      if (/\b(try_begin|else_try)\b/.test(trimmed)) {
        tryLevel++;
      }

      // depth güncelle
      listDepth += opensList - closesList;
      if (isGenericTupleStart || isTupleAssign) tupleDepth++;
      if (isTupleEnd) tupleDepth--;
    }

    // 5) Çıktıyı birleştir ve basit tuple bloklarını tek satıra indir
    let outputText = out.join('\n');
    outputText = outputText.replace(
      /\(\s*([^()\[\]]+?)\s*\),/gs,
      (_, inner) => {
        const items = inner
          .split('\n')
          .map(l => l.trim().replace(/,$/, ''))
          .filter(Boolean);
        return '(' + items.join(', ') + '),';
      }
    );

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      doc.uri,
      new vscode.Range(0, 0, doc.lineCount, 0),
      outputText
    );
    await vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage('Formatted successfully.');
  } catch (err) {
    vscode.window.showErrorMessage(`Formatting error: ${err.message}`);
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'mbap.formatWarbandScript',
      formatAndSaveDocument
    )
  );
}

exports.activate = activate;
