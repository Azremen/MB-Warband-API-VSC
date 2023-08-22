const vscode = require('vscode');

function formatAndSaveDocument() {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        const document = activeEditor.document;
        const operationNames = [
            "try_begin",
            "try_for_range",
            "try_for_range_backwards",
            "try_for_parties",
            "try_for_agents",
            "try_for_prop_instances",
            "try_for_players",
            "try_for_dict_keys",
            "[",
        ];

        const formattedLines = [];
        let indentationLevel = 0;

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text.trim();

            if (operationNames.some(op => line.includes(op))) {
                formattedLines.push('\t'.repeat(indentationLevel) + line);
                indentationLevel++;
                if (line.includes("[") && line.includes("]")) {
                    indentationLevel--;
                }
            } else if (line.includes("try_end") || line.includes("]")) {
                indentationLevel = Math.max(0, indentationLevel - 1);
                formattedLines.push('\t'.repeat(indentationLevel) + line);
            } else {
                formattedLines.push('\t'.repeat(indentationLevel) + line);
            }
        }

        const formattedContent = formattedLines.join('\n');

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), formattedContent);

        vscode.workspace.applyEdit(edit).then(success => {
            if (success) {
                vscode.window.showInformationMessage('Formatted and saved the document.');
            } else {
                vscode.window.showErrorMessage('An error occurred while formatting and saving the document.');
            }
        });
    }
}

// Register a command to format and save the active document
vscode.commands.registerCommand('mbap.formatWarbandScript', formatAndSaveDocument);
