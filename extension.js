const acorn = require('acorn');
const escodegen = require('escodegen');
const vscode = require('vscode');

// Implementation of the traverse function
function traverse(node, visitors) {
    function visit(node, parent) {
        const visitor = visitors[node.type];

        if (visitor && visitor.enter) {
            visitor.enter(node, parent);
        }

        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const child = node[key];

                if (typeof child === 'object' && child !== null) {
                    if (Array.isArray(child)) {
                        child.forEach(grandchild => visit(grandchild, node));
                    } else {
                        visit(child, node);
                    }
                }
            }
        }

        if (visitor && visitor.leave) {
            visitor.leave(node, parent);
        }
    }

    visit(node, null);
}

function formatWarbandScriptLanguageCode(code) {
    const parsedAst = acorn.parse(code, { ecmaVersion: 'latest' });

    let indentationLevel = 0;

    // Define your visitors object
    const visitors = {
        CallExpression: {
            enter(node, parent) {
                const operationNames = [
                    'try_begin',
                    'try_for_range',
                    'try_for_range_backwards',
                    'try_for_parties',
                    'try_for_agents',
                    'try_for_prop_instances',
                    'try_for_players',
                    'try_for_dict_keys',
                ];

                if (operationNames.includes(node.callee.name)) {
                    // Insert a newline before the operation call
                    if (parent.body.indexOf(node) === 0) {
                        const newlineNode = {
                            type: 'WhiteSpace',
                            value: '\n' + '    '.repeat(indentationLevel), // Adjust the desired indentation
                        };
                        parent.body.unshift(newlineNode);
                    }

                    // Add a tab indentation to the arguments of the operation
                    node.arguments.forEach(arg => {
                        if (arg.type === 'ArrayExpression') {
                            arg.elements.forEach(element => {
                                element.loc.indent += 1; // Adjust the indentation level
                            });
                        }
                    });

                    indentationLevel++;
                }
            },
            leave(node) {
                const operationNames = [
                    'try_begin',
                    'try_for_range',
                    'try_for_range_backwards',
                    'try_for_parties',
                    'try_for_agents',
                    'try_for_prop_instances',
                    'try_for_players',
                    'try_for_dict_keys',
                ];

                if (operationNames.includes(node.callee.name)) {
                    indentationLevel--;
                }
            },
        },
        // Define other node types you want to visit
    };

    traverse(parsedAst, visitors);

    const formattedCode = escodegen.generate(parsedAst);
    return formattedCode;
}

function activate(context) {
    console.log('M&B Warband API extension is now active.');
    // ... other activation code ...

    let disposable = vscode.commands.registerCommand('mbap.formatWarbandScript', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const text = document.getText();

        // Format the code
        const formattedCode = formatWarbandScriptLanguageCode(text);

        // Apply the formatted code
        const edit = new vscode.TextEdit(
            new vscode.Range(0, 0, document.lineCount, 0),
            formattedCode
        );

        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, [edit]);
        vscode.workspace.applyEdit(workspaceEdit);
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {
    console.log('M&B Warband API extension is now deactivated.');
}

module.exports = {
    activate,
    deactivate
};
