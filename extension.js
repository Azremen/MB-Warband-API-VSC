const vscode = require('vscode');
const { execSync } = require('child_process');
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

        try {
            // Use the Black command-line tool to format the content
            const blackCmd = `black --line-length ${vscode.workspace.getConfiguration().get('mbap.lineLength', 2000)} --skip-string-normalization --quiet ${tempFilePath}`;
            execSync(blackCmd, { encoding: 'utf-8', shell: true });

            // Read the Black-formatted content from the temporary file
            const blackFormattedCode = fs.readFileSync(tempFilePath, 'utf-8');

            // Delete the temporary file
            fs.unlinkSync(tempFilePath);

            // Apply custom formatting with adjusted indentation levels for specific operation names
            const customFormattedLines = [];
            let currentIndentationLevel = 0;

            for (const line of blackFormattedCode.split('\n')) {
                const trimmedLine = line.trim();

                // Skip comment lines
                if (trimmedLine.startsWith("#")) {
                    customFormattedLines.push(line);
                    continue;
                }

                // Adjust indentation for "try_end" and "else_try"
                if (trimmedLine.includes("try_end") || trimmedLine.includes("else_try")) {
                    currentIndentationLevel--;
                }

                let customFormattedLine = line;

                // Handle tuples without commas
                if (line.includes("(") && line.includes(")") && !line.includes(",") && !line.includes("try")) {
                    customFormattedLine = line.replace(/^[ \t]*\(/, '').replace(/\)[ \t]*,$/, '');
                }

                const customIndentation = '\t'.repeat(Math.max(0, currentIndentationLevel));
                customFormattedLine = customIndentation + customFormattedLine.trim();
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
                    vscode.window.showInformationMessage('Formatted and saved the document successfully.');
                } else {
                    vscode.window.showErrorMessage('An error occurred while formatting and saving the document.');
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error during formatting: ${error.message}`);
        }
    } else {
        vscode.window.showWarningMessage('No active editor found. Please open a file to format.');
    }
}

function checkAndInstallBlack() {
    try {
        // Check if Black is installed
        execSync('black --version', { encoding: 'utf-8', shell: true });
    } catch (error) {
        // Black is not installed, prompt the user
        const installOption = 'Install Black';
        vscode.window.showInformationMessage(
            'The Black formatter is not installed. Would you like to install it?',
            installOption
        ).then(choice => {
            if (choice === installOption) {
                vscode.window.showInformationMessage('Installing Black...');
                try {
                    execSync('pip install black', { encoding: 'utf-8', shell: true });
                    vscode.window.showInformationMessage('Black installed successfully.');
                } catch (installError) {
                    vscode.window.showErrorMessage(`Failed to install Black: ${installError.message}`);
                }
            } else {
                vscode.window.showWarningMessage('Black is not installed. The extension may not work as expected.');
            }
        });
    }
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
