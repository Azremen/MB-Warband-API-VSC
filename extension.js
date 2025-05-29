const vscode = require('vscode');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');

async function formatAndSaveDocument() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showWarningMessage('No active editor found. Please open a file to format.');
        return;
    }

    const document = activeEditor.document;
    const operationNames = [
        "try_begin","try_for_range","try_for_range_backwards",
        "try_for_parties","try_for_agents","try_for_prop_instances",
        "try_for_players","try_for_dict_keys","else_try"
    ];

    // Geçici dosyaya orijinal içeriği yaz
    const originalContent = document.getText();
    const tempFilePath = `${os.tmpdir()}/temp_mbap_script.py`;
    fs.writeFileSync(tempFilePath, originalContent, 'utf-8');

    try {
        // Black ile format
        const lineLength = vscode.workspace.getConfiguration().get('mbap.lineLength', 2000);
        const blackCmd = `black --line-length ${lineLength} --skip-string-normalization --quiet "${tempFilePath}"`;
        execSync(blackCmd, { encoding: 'utf-8', shell: true });

        // Okuyup geçici dosyayı sil
        const blackFormattedCode = fs.readFileSync(tempFilePath, 'utf-8');
        fs.unlinkSync(tempFilePath);

        const customFormattedLines = [];
        let currentIndentationLevel = 0;
        let listDepth = 0;

        for (const line of blackFormattedCode.split('\n')) {
            const trimmed = line.trim();

            // Yorum satırlarını olduğu gibi ekle
            if (trimmed.startsWith('#')) {
                customFormattedLines.push(line);
                continue;
            }

            // Köşeli parantez derinliğini güncelle
            const opens  = (line.match(/\[/g) || []).length;
            const closes = (line.match(/\]/g) || []).length;

            // try_end/else_try çıktısı
            if (trimmed.includes("try_end") || trimmed.includes("else_try")) {
                currentIndentationLevel--;
            }

            // Liste içindeysek +1 tab
            const inList = listDepth > 0;
            const indentLevel = currentIndentationLevel + (inList ? 1 : 0);
            const indent = '\t'.repeat(Math.max(0, indentLevel));

            // Tuple vs. minör transform
            let transformed = line;
            if (line.includes('(') && line.includes(')') && !line.includes(',') && !line.includes('try')) {
                transformed = line.replace(/^[ \t]*\(/, '').replace(/\)[ \t]*,$/, '');
            }

            customFormattedLines.push(indent + transformed.trim());

            // try_begin gibi blok içi artışı
            if (operationNames.some(op => trimmed.includes(op))) {
                currentIndentationLevel++;
            }

            listDepth += opens - closes;
        }

        // Değişikliği belgeye uygula
        const edited = customFormattedLines.join('\n');
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), edited);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage('Formatted and saved the document successfully.');
    }
    catch (e) {
        vscode.window.showErrorMessage(`Error during formatting: ${e.message}`);
    }
}

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('mbap.formatWarbandScript', formatAndSaveDocument)
    );
}

exports.activate = activate;
