const { Plugin, Modal, Notice, MarkdownView } = require('obsidian');

class TableMergerModal extends Modal {
    constructor(app, tables, onSubmit) {
        super(app);
        this.tables = tables;
        this.onSubmit = onSubmit;
        this.selectedTables = []; 
        this.shouldSort = true;
        this.shouldRemoveDuplicates = false;
        this.shouldDeleteSources = false; 
        this.dupColumns = []; 
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Merge Tables' });
        
        const targetInfo = contentEl.createEl('div', { 
            text: 'Merge Destination: (Select tables below)', 
            attr: { style: 'margin-bottom: 12px; font-weight: bold; color: var(--text-accent); padding: 10px; background: var(--background-secondary-alt); border-radius: 6px; border: 1px solid var(--background-modifier-border);' } 
        });

        const listContainer = contentEl.createEl('div', { 
            attr: { style: 'max-height: 400px; overflow-y: auto; margin-bottom: 20px; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 8px;' } 
        });

        this.tables.forEach((table, index) => {
            const rowEl = listContainer.createEl('div', { 
                attr: { style: 'margin-bottom: 8px; display: flex; align-items: center; gap: 15px; padding: 10px; background: var(--background-secondary); border-radius: 6px; cursor: pointer;' } 
            });
            
            const checkbox = rowEl.createEl('input', { type: 'checkbox', id: `tm-cb-${index}` });
            const badge = rowEl.createEl('span', { attr: { style: 'min-width: 35px; font-weight: bold; color: var(--text-accent); font-size: 0.9em;' } });
            
            const lines = table.text.split('\n');
            const previewHeader = lines.find(l => l.includes('|')) || '';
            
            const label = rowEl.createEl('div', { attr: { style: 'flex-grow: 1; overflow: hidden;' } });
            label.createEl('div', { text: `Table ${index + 1}: ${table.heading}`, attr: { style: 'font-weight: bold; font-size: 0.9em;' } });
            label.createEl('pre', { text: previewHeader, attr: { style: 'font-size: 0.75em; margin: 4px 0 0 0; background: var(--background-primary); padding: 4px; border-radius: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;' } });

            const handleToggle = () => {
                if (checkbox.checked) {
                    if (!this.selectedTables.includes(index)) this.selectedTables.push(index);
                } else {
                    this.selectedTables = this.selectedTables.filter(i => i !== index);
                }
                this.updateUI(listContainer, targetInfo);
            };

            rowEl.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    handleToggle();
                }
            });

            checkbox.addEventListener('change', handleToggle);
        });

        this.updateUI = (container, infoEl) => {
            this.tables.forEach((_, i) => {
                const row = container.children[i];
                if (row) {
                    const span = row.querySelector('span');
                    const pos = this.selectedTables.indexOf(i);
                    if (span) span.innerText = pos !== -1 ? `${pos + 1}º` : '';
                }
            });

            if (this.selectedTables.length > 0) {
                const last = this.selectedTables[this.selectedTables.length - 1];
                infoEl.innerText = `Merge Destination: Table ${last + 1} (Will receive all data)`;
                
                if (this.dupColsDiv) {
                    this.dupColsDiv.empty();
                    this.dupColsDiv.createEl('div', { text: 'Match by columns (leave empty for all):', attr: { style: 'color: var(--text-muted); margin-bottom: 4px;' } });
                    
                    const firstTableIdx = this.selectedTables[0];
                    const cols = this.tables[firstTableIdx].headerRow;
                    this.dupColumns = this.dupColumns.filter(c => c < cols.length);

                    cols.forEach((colName, cIdx) => {
                        const colDiv = this.dupColsDiv.createEl('div', { attr: { style: 'display: flex; align-items: center; gap: 6px;' } });
                        const colCb = colDiv.createEl('input', { type: 'checkbox', id: `tm-dup-col-${cIdx}` });
                        colCb.checked = this.dupColumns.includes(cIdx);
                        colDiv.createEl('label', { text: colName || `Column ${cIdx + 1}`, attr: { for: `tm-dup-col-${cIdx}`, style: 'cursor: pointer;' } });
                        
                        colCb.addEventListener('change', (e) => {
                            if (e.target.checked) {
                                if (!this.dupColumns.includes(cIdx)) this.dupColumns.push(cIdx);
                            } else {
                                this.dupColumns = this.dupColumns.filter(idx => idx !== cIdx);
                            }
                        });
                    });
                }
            } else {
                infoEl.innerText = 'Merge Destination: (Select tables below)';
                if (this.dupColsDiv) this.dupColsDiv.empty();
            }
        };

        const footer = contentEl.createEl('div', { attr: { style: 'display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; border-top: 1px solid var(--background-modifier-border);' } });
        const toggles = footer.createEl('div', { attr: { style: 'display: flex; flex-direction: column; gap: 8px;' } });
        
        const createToggle = (id, labelText, defaultVal, key) => {
            const div = toggles.createEl('div', { attr: { style: 'display: flex; align-items: center; gap: 8px;' } });
            const cb = div.createEl('input', { type: 'checkbox', id: id });
            cb.checked = defaultVal;
            div.createEl('label', { text: labelText, attr: { for: id, style: 'cursor: pointer; font-weight: bold; font-size: 0.9em;' } });
            cb.addEventListener('change', (e) => this[key] = e.target.checked);
            return cb;
        };

        createToggle('tm-sort', 'Sort alphabetically', this.shouldSort, 'shouldSort');
        const dupCb = createToggle('tm-dup', 'Remove duplicate rows', this.shouldRemoveDuplicates, 'shouldRemoveDuplicates');
        
        this.dupColsDiv = toggles.createEl('div', { attr: { style: 'display: none; padding-left: 24px; flex-direction: column; gap: 4px; max-height: 150px; overflow-y: auto; font-size: 0.85em; border-left: 2px solid var(--background-modifier-border); margin-left: 6px;' } });
        dupCb.addEventListener('change', (e) => {
            this.dupColsDiv.style.display = e.target.checked ? 'flex' : 'none';
        });

        createToggle('tm-merge-one', 'Merge Tables To One (Delete selected source tables)', this.shouldDeleteSources, 'shouldDeleteSources');

        const btn = footer.createEl('button', { text: 'Merge Selected', cls: 'mod-cta' });
        btn.onclick = () => {
            if (this.selectedTables.length < 2) {
                new Notice('Select at least 2 tables to merge');
                return;
            }
            this.onSubmit(this.selectedTables, this.shouldSort, this.shouldRemoveDuplicates, this.shouldDeleteSources, this.dupColumns);
            this.close();
        };
    }
}

class CSVToTableModal extends Modal {
    constructor(app, file, onSubmit) {
        super(app);
        this.file = file;
        this.onSubmit = onSubmit;
        this.delimiter = ",";
        this.hasHeader = true;
        this.csvContent = "";
        this.previewCounter = 0;
    }

    async onOpen() {
        const { contentEl } = this;
        this.csvContent = await this.app.vault.read(this.file);

        contentEl.createEl('h2', { text: `Convert CSV: ${this.file.name}` });

        const optionsRow = contentEl.createEl('div', { attr: { style: 'display: flex; gap: 20px; margin-bottom: 20px; align-items: center; background: var(--background-secondary); padding: 15px; border-radius: 8px;' } });

        const delDiv = optionsRow.createEl('div');
        delDiv.createEl('label', { text: 'Delimiter: ', attr: { style: 'font-weight: bold; margin-right: 8px;' } });
        const delSelect = delDiv.createEl('select');
        [
            { label: 'Comma (,)', value: ',' },
            { label: 'Semicolon (;)', value: ';' },
            { label: 'Tab (\\t)', value: '\t' }
        ].forEach(opt => {
            const el = delSelect.createEl('option', { text: opt.label });
            el.value = opt.value;
        });
        delSelect.addEventListener('change', (e) => {
            this.delimiter = e.target.value;
            this.updatePreview();
        });

        const headerDiv = optionsRow.createEl('div', { attr: { style: 'display: flex; align-items: center; gap: 8px;' } });
        const headerCb = headerDiv.createEl('input', { type: 'checkbox', id: 'csv-header-cb' });
        headerCb.checked = true;
        headerDiv.createEl('label', { text: 'First row is header', attr: { for: 'csv-header-cb', style: 'cursor: pointer; font-weight: bold;' } });
        headerCb.addEventListener('change', (e) => {
            this.hasHeader = e.target.checked;
            this.updatePreview();
        });

        contentEl.createEl('h3', { text: 'Preview' });
        this.previewEl = contentEl.createEl('pre', { 
            attr: { style: 'max-height: 300px; overflow: auto; background: var(--background-primary); padding: 10px; border-radius: 4px; font-size: 0.85em; border: 1px solid var(--background-modifier-border); white-space: pre;' } 
        });

        const footer = contentEl.createEl('div', { attr: { style: 'display: flex; justify-content: flex-end; margin-top: 20px;' } });
        const btn = footer.createEl('button', { text: 'Insert Table at Cursor', cls: 'mod-cta' });
        btn.onclick = async () => {
            btn.disabled = true;
            btn.innerText = "Processing Data...";
            const notice = new Notice('Processing large CSV, please wait...', 0);
            
            try {
                const fullData = await this.parseCSV(false);
                const mdTable = this.buildMarkdownString(fullData);
                this.onSubmit(mdTable);
                notice.hide();
                this.close();
            } catch (err) {
                notice.hide();
                new Notice('Critical Error during conversion!');
                console.error(err);
                btn.disabled = false;
                btn.innerText = "Insert Table at Cursor";
            }
        };

        this.updatePreview();
    }

    async parseCSV(isPreview = false) {
        let lines = this.csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
        
        //! Proteção de memória para preview: limita a 50 linhas
        if (isPreview && lines.length > 50) {
            lines = lines.slice(0, 50);
        }

        const dataMatrix = [];

        //! Lida com valores entre aspas duplas e valores sem aspas
        const regex = new RegExp(
            `(\\"[^\\"]*\\"(?:\\"\\"[^\\"]*\\")*|[^${this.delimiter}]*)(?:${this.delimiter}|$)`, 'g'
        );

        for (let i = 0; i < lines.length; i++) {
            //! Prevenção de travamento da Thread Principal (Yielding)
            if (!isPreview && i > 0 && i % 500 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            let line = lines[i];
            let row = [];
            let matches;

            while ((matches = regex.exec(line)) !== null) {
                if (matches.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                
                let cell = matches[1];
                if (cell !== undefined) {
                    //? Remove aspas externas e converte aspas duplas escapadas em aspas simples
                    cell = cell.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim();
                    row.push(cell);
                }
            }
            
            if (row.length > 0 && line.endsWith(this.delimiter) === false && row[row.length - 1] === '') {
                 row.pop();
            }

            if (row.length > 0) {
                dataMatrix.push(row);
            }
        }
        return dataMatrix;
    }

    buildMarkdownString(data) {
        if (data.length === 0) return "";

        let header = [];
        let rows = [];

        if (this.hasHeader) {
            header = data[0];
            rows = data.slice(1);
        } else {
            header = data[0].map((_, i) => `Column ${i + 1}`);
            rows = data;
        }

        const colCount = header.length;
        
        //! NORMALIZAÇÃO ESTRUTURAL: Garante que todas as linhas tenham a mesma largura do cabeçalho
        rows = rows.map(row => {
            const normalizedRow = [...row];
            while (normalizedRow.length < colCount) normalizedRow.push("");
            return normalizedRow.slice(0, colCount);
        });

        const colWidths = Array(colCount).fill(0);
        
        header.forEach((h, i) => colWidths[i] = Math.max(colWidths[i], h.length));
        rows.forEach(row => {
            row.forEach((cell, i) => {
                colWidths[i] = Math.max(colWidths[i], cell.length);
            });
        });

        const padCell = (str, len) => " " + str.padEnd(len, ' ') + " ";
        
        let md = "|" + header.map((h, i) => padCell(h, colWidths[i])).join("|") + "|\n";
        md += "|" + colWidths.map(w => "-".repeat(w + 2)).join("|") + "|\n";
        rows.forEach(row => {
            md += "|" + header.map((_, i) => padCell(row[i], colWidths[i])).join("|") + "|\n";
        });

        return md;
    }

    async updatePreview() {
        const currentCounter = ++this.previewCounter;
        this.previewEl.textContent = "Loading preview...";
        
        try {
            const previewData = await this.parseCSV(true);
            
            if (currentCounter !== this.previewCounter) return; 
            
            let md = this.buildMarkdownString(previewData);
            const totalLines = this.csvContent.split(/\r?\n/).filter(l => l.trim().length > 0).length;
            
            if (totalLines > 50) {
                md += `\n\n... (Preview limited to 50 of ${totalLines} rows to maintain performance) ...`;
            }
            
            this.previewEl.textContent = md;
        } catch (err) {
            this.previewEl.textContent = "Critical error generating preview.";
            console.error(err);
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}

module.exports = class TableMergerPlugin extends Plugin {
    onload() {
        this.addCommand({
            id: 'table-merger-final-v9',
            name: 'Merge Tables',
            editorCallback: (editor) => {
                const tables = this.findTables(editor);
                if (tables.length === 0) {
                    new Notice('No tables found');
                    return;
                }
                new TableMergerModal(this.app, tables, (indices, sort, dups, del, dupCols) => {
                    this.runMerge(editor, tables, indices, sort, dups, del, dupCols);
                }).open();
            }
        });

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (file.extension === "csv") {
                    menu.addItem((item) => {
                        item
                            .setTitle("Convert to table in current file")
                            .setIcon("table")
                            .onClick(() => {
                                let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                                
                                if (!activeView) {
                                    const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
                                    if (markdownLeaves.length > 0) {
                                        activeView = markdownLeaves[0].view;
                                    }
                                }

                                if (!activeView || !(activeView instanceof MarkdownView)) {
                                    new Notice("Please open a markdown note first!");
                                    return;
                                }

                                new CSVToTableModal(this.app, file, (mdTable) => {
                                    activeView.editor.replaceSelection(mdTable);
                                    new Notice(`Inserted: ${file.name}`);
                                }).open();
                            });
                    });
                }
            })
        );
    }

    findTables(editor) {
        const lines = editor.getValue().split('\n');
        const tables = [];
        let heading = 'No Title';

        // Função que verifica se a linha é um separador válido de tabela Markdown (ex: |---|---|)
        const isSeparator = (str) => {
            const s = str.trim();
            if (!s.includes('-') || !s.includes('|')) return false;
            // Se removermos espaços, pipes, traços, dois-pontos e >, não deve sobrar nada
            const stripped = s.replace(/[>\s|:\-]/g, '');
            return stripped.length === 0;
        };

        let i = 0;
        while (i < lines.length) {
            let line = lines[i];
            if (line.trim().startsWith('#')) heading = line.trim();
            
            if (isSeparator(line) && i > 0 && lines[i - 1].includes('|')) {
                let start = i - 1; // O cabeçalho fica imediatamente acima do separador
                let end = i;
                
                // Continua descendo até acabar a tabela
                while (end + 1 < lines.length && lines[end + 1].includes('|')) {
                    const nextLineTrimmed = lines[end + 1].trim();
                    if (nextLineTrimmed === '' || nextLineTrimmed === '>') break;
                    end++;
                }

                let buffer = lines.slice(start, end + 1);
                const headerRow = this.parseRow(lines[start]);
                tables.push({ text: buffer.join('\n'), startLine: start, endLine: end, heading, headerRow });
                
                i = end;
            }
            i++;
        }
        return tables;
    }

    parseRow(line) {
        let s = line.trim();
        s = s.replace(/^[>\s]+/, ''); // Remove setas de blockquote (ex: >)
        if (s.startsWith('|')) s = s.substring(1);
        if (s.endsWith('|')) s = s.substring(0, s.length - 1);

        const cells = [];
        let currentCell = "";
        let isEscaped = false;

        for (let i = 0; i < s.length; i++) {
            const char = s[i];

            if (isEscaped) {
                currentCell += char;
                isEscaped = false;
            } else if (char === '\\') {
                isEscaped = true;
                currentCell += char; //! Mantém a barra de escape para a serialização futura
            } else if (char === '|') {
                cells.push(currentCell.trim());
                currentCell = "";
            } else {
                currentCell += char;
            }
        }
        
        cells.push(currentCell.trim());
        return cells;
    }

    runMerge(editor, allTables, indices, sort, dups, deleteOthers, dupCols = []) {
        const targetIdx = indices[indices.length - 1];
        
        let baseHeader = null;
        let baseColCount = 0;
        let dataMatrix = [];

        for (let order = 0; order < indices.length; order++) {
            const idx = indices[order];
            const tableText = allTables[idx].text;
            const lines = tableText.split('\n').filter(l => l.trim().length > 0);
            
            if (lines.length < 3) continue;

            const currentHeader = this.parseRow(lines[0]);
            
            if (baseHeader === null) {
                baseHeader = currentHeader;
                baseColCount = currentHeader.length;
            } else if (currentHeader.length !== baseColCount) {
                new Notice(`Falha Crítica: Assimetria de colunas. A Tabela ${indices[0] + 1} possui ${baseColCount} colunas e a Tabela ${idx + 1} possui ${currentHeader.length}. Operação abortada para evitar corrupção.`);
                return;
            }

            for (let i = 2; i < lines.length; i++) {
                const rowCells = this.parseRow(lines[i]);
                while (rowCells.length < baseColCount) rowCells.push("");
                dataMatrix.push(rowCells.slice(0, baseColCount));
            }
        }

        if (!baseHeader) {
            new Notice('Falha na extração de dados. Tabelas inválidas.');
            return;
        }

        if (dups) {
            const seen = new Set();
            dataMatrix = dataMatrix.filter(row => {
                //! Serialização unicamente para hash, usando delimitador impossível de ocorrer nativamente
                const cellsToHash = dupCols.length > 0 ? dupCols.map(c => row[c] || "") : row;
                const hash = cellsToHash.map(cell => cell.toLowerCase()).join('||_HASH_||');
                if (seen.has(hash)) return false;
                seen.add(hash);
                return true;
            });
        }

        if (sort) {
            dataMatrix.sort((rowA, rowB) => {
                for (let c = 0; c < baseColCount; c++) {
                    const valA = rowA[c].toLowerCase();
                    const valB = rowB[c].toLowerCase();
                    const cmp = valA.localeCompare(valB, undefined, { numeric: true });
                    if (cmp !== 0) return cmp;
                }
                return 0;
            });
        }

        const colWidths = Array(baseColCount).fill(0);
        baseHeader.forEach((h, c) => colWidths[c] = Math.max(colWidths[c], h.length));
        dataMatrix.forEach(row => {
            row.forEach((cell, c) => colWidths[c] = Math.max(colWidths[c], cell.length));
        });

        const padCell = (str, len) => " " + str.padEnd(len, ' ') + " ";
        
        let mergedText = "";
        mergedText += "|" + baseHeader.map((h, c) => padCell(h, colWidths[c])).join("|") + "|\n";
        mergedText += "|" + colWidths.map(w => "-".repeat(w + 2)).join("|") + "|\n";
        dataMatrix.forEach(row => {
            mergedText += "|" + row.map((cell, c) => padCell(cell, colWidths[c])).join("|") + "|\n";
        });

        const sortedSelectedDesc = [...indices].sort((a, b) => allTables[b].startLine - allTables[a].startLine);

        editor.transaction({
            changes: sortedSelectedDesc.map(idx => {
                const table = allTables[idx];
                if (idx === targetIdx) {
                    return {
                        text: mergedText,
                        from: { line: table.startLine, ch: 0 },
                        to: { line: table.endLine, ch: editor.getLine(table.endLine).length }
                    };
                } else if (deleteOthers) {
                    let endL = table.endLine;
                    let endC = editor.getLine(table.endLine).length;
                    if (endL < editor.lastLine()) {
                        endL++;
                        endC = 0;
                    }
                    return {
                        text: '',
                        from: { line: table.startLine, ch: 0 },
                        to: { line: endL, ch: endC }
                    };
                }
                return null;
            }).filter(change => change !== null)
        });
        
        new Notice(`Merged ${indices.length} selected tables into Table ${targetIdx + 1}`);
    }
}