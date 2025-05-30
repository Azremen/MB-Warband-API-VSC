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

  // Kaynak kodu tmp dosyaya yaz, black ile formatla, oku, tmp’yi sil
  const src = doc.getText();
  const tmp = `${os.tmpdir()}/temp_mbap_script.py`;
  fs.writeFileSync(tmp, src, 'utf8');
  execSync(`black --line-length ${lineLength} --skip-string-normalization --quiet "${tmp}"`, {
    encoding: 'utf8', shell: true
  });
  const formatted = fs.readFileSync(tmp, 'utf8');
  fs.unlinkSync(tmp);

  const out = [];
  let tryLevel = 0;
  let listDepth = 0;
  let tupleDepth = 0;

  for (let line of formatted.split('\n')) {
    const trimmed = line.trim();

    const opensList = (line.match(/\[/g) || []).length;
    const closesList = (line.match(/\]/g) || []).length;

    const isTupleAssign = /^[\w\.]+\s*=\s*\($/.test(trimmed);
    const isListAssign  = /^[\w\.]+\s*=\s*\[$/.test(trimmed);
    const isTupleEnd    = trimmed === '),' || trimmed === ')';
    const isListEnd     = trimmed === '],' || trimmed === ']';

    // try_end / else_try kapanışı
    if (/\b(try_end|else_try)\b/.test(trimmed)) {
      tryLevel = Math.max(0, tryLevel - 1);
    }

    // --- burası yenilendi: kapanış satırları için depth'i bir azaltıyoruz
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
    out.push(indent + trimmed);

    // try_begin / else_try açılışı
    if (/\b(try_begin|else_try)\b/.test(trimmed)) {
      tryLevel++;
    }

    // gerçek depth güncellemesi (bir sonraki satırlar için)
    listDepth += opensList - closesList;
    if (trimmed === '(' || isTupleAssign) tupleDepth++;
    if (isTupleEnd) tupleDepth--;
  }

  // Birleştir
  let outputText = out.join('\n');

  // Dış tuple açılışını tek satıra indir (örnek: (  "isim", 0, 0,   [ → ("isim", 0, 0, then [ alt satırda)
  {
    const lines = outputText.split('\n');
    const newLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (
        i <= lines.length - 5 &&
        /^\s*\($/.test(lines[i]) &&
        /^\s*"[^"]+",?$/.test(lines[i+1]) &&
        /^\s*[0-9]+,?$/.test(lines[i+2]) &&
        /^\s*[0-9]+,?$/.test(lines[i+3]) &&
        /^\s*\[$/.test(lines[i+4])
      ) {
        const baseIndent = (lines[i].match(/^(\s*)\(/) || ['',''])[1];
        const key        = lines[i+1].trim().replace(/,$/, '').replace(/^"|"$/g, '');
        const n1         = lines[i+2].trim().replace(/,$/, '');
        const n2         = lines[i+3].trim().replace(/,$/, '');
        newLines.push(`${baseIndent}("${key}", ${n1}, ${n2},`);
        newLines.push(`${baseIndent}    [`);
        i += 4;
      } else {
        newLines.push(lines[i]);
      }
    }
    outputText = newLines.join('\n');
  }

  // İç tuple’ları tek satıra indir
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

  // Sonucu VSCode’a uygula
  const edit = new vscode.WorkspaceEdit();
  edit.replace(doc.uri, new vscode.Range(0, 0, doc.lineCount, 0), outputText);
  await vscode.workspace.applyEdit(edit);
  vscode.window.showInformationMessage('Formatted successfully.');
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('mbap.formatWarbandScript', formatAndSaveDocument)
  );
}

exports.activate = activate;
