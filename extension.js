const vscode = require('vscode');
const { execFileSync } = require('child_process');
const os = require('os');
const fs = require('fs');

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
            "else_try",
        ];

        const originalContent = document.getText();

        // Create a temporary file to store the original content
        const tempFilePath = `${os.tmpdir()}/temp_mbap_script.py`;
        fs.writeFileSync(tempFilePath, originalContent, 'utf-8');

        // Use black command-line tool to format the content and get the formatted code
        const blackCmd = `black --quiet ${tempFilePath}`;
        execFileSync(blackCmd, {
            encoding: 'utf-8',
            shell: true
        });

        // Read the black-formatted content from the temporary file
        const blackFormattedCode = fs.readFileSync(tempFilePath, 'utf-8');

        // Delete the temporary file
        fs.unlinkSync(tempFilePath);

        // Apply your custom formatting with adjusted indentation levels for specific operation names
        const customFormattedLines = [];
        let currentIndentationLevel = 0;

        for (const line of blackFormattedCode.split('\n')) {
            const trimmedLine = line.trim();

            if (trimmedLine.includes("try_end") || trimmedLine.includes("else_try")) {
                currentIndentationLevel--;
            }

            let customFormattedLine = line;

            if (line.includes("(") && line.includes(")") && !line.includes(",") && !line.includes("try")) {
                // Tuple without commas, format as per your preference
                customFormattedLine = line.replace(/^\s*\(/, '').replace(/\)\s*,$/, '');
            }

            const customIndentation = '\t'.repeat(Math.max(0, currentIndentationLevel));
            customFormattedLine = customIndentation + customFormattedLine;
            customFormattedLines.push(customFormattedLine);

            if (operationNames.some(op => trimmedLine.includes(op))) {
                currentIndentationLevel++;
            }
        }

        const customFormattedCode = customFormattedLines.join('\n');

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), customFormattedCode);

        vscode.workspace.applyEdit(edit).then(success => {
            if (success) {
                vscode.window.showInformationMessage('Formatted and saved the document.');
            } else {
                vscode.window.showErrorMessage('An error occurred while formatting and saving the document.');
            }
        });
    }
}

function checkAndInstallBlack() {
    const terminal = vscode.window.createTerminal('Install Black');

    // Check if Black is installed
    terminal.sendText('pip show black', true);

    // When the terminal output is ready, check if Black is installed
    terminal.onDidWriteData(data => {
        if (data.includes("Package(s) not found: black")) {
            // Black is not installed, so install it
            terminal.sendText('pip install black', true);
        }

        // Dispose of the terminal
        terminal.dispose();
    });

    terminal.show();
}

function activate(context) {
    // Register the formatAndSaveDocument command
    const disposable = vscode.commands.registerCommand('mbap.formatWarbandScript', formatAndSaveDocument);

    // Run the checkAndInstallBlack function when the extension is activated
    checkAndInstallBlack();

    // Add the disposable to the context for cleanup
    context.subscriptions.push(disposable);
}

exports.activate = activate;
