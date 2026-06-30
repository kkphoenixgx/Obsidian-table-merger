# Obsidian Table Merger 🛠️📊

A powerful Obsidian plugin that takes the pain out of managing Markdown tables. Whether you have multiple fragmented tables you want to combine, or CSV files you need to import directly into your notes, **Table Merger** handles it cleanly and safely.

## ✨ Features

### 1. Merge Markdown Tables
Open the command palette and run **`Merge Tables`**. A beautiful UI modal will appear showing all the tables in your current active note.

- **Select & Combine**: Choose exactly which tables you want to merge. The last selected table becomes the "destination" table.
- **Smart Formatting**: Automatically aligns columns and fixes uneven row lengths, generating a perfectly formatted Markdown table.
- **Sort Alphabetically**: Optionally sort the merged data alphabetically (A-Z).
- **Deduplication**: Remove duplicate rows! You can even choose specific columns to match against when finding duplicates.
- **Clean Up**: Option to automatically delete the original source tables after they've been successfully merged into the destination.
- **Structural Integrity**: The plugin prevents merging tables with different column counts to avoid corrupting your data.

### 2. Import CSV as Markdown Table
Right-click on any `.csv` file in your Obsidian file explorer and select **`Convert to table in current file`**.

- **Custom Delimiters**: Supports Comma (`,`), Semicolon (`;`), and Tab (`\t`).
- **Live Preview**: See exactly how your table will look before inserting it. (The preview smartly limits to 50 rows to keep things fast).
- **Header Toggle**: Choose whether the first row should be treated as a table header.
- **Performance Optimized**: Built with memory protection and asynchronous yielding to ensure Obsidian doesn't freeze when converting massive CSV files.

## 🚀 Installation

### Manual Installation

1. Download the latest release from the [Releases page](../../releases).
2. Extract the `table-merger` folder.
3. Move the folder into your vault's plugins directory: `<vault>/.obsidian/plugins/`.
4. The folder must contain `main.js` and `manifest.json`.
5. Open Obsidian, go to **Settings > Community plugins**.
6. Disable "Safe mode" (if enabled).
7. Refresh the plugins list and toggle on **"Table Merger"**.

## 💡 How to Use

1. **Merging existing tables**: Open a note with at least two Markdown tables. Press `Ctrl/Cmd + P` to open the Command Palette, search for "Merge Tables", and hit Enter. Select the tables in the popup and click "Merge Selected".
2. **Importing CSV**: Open the markdown note where you want the table to appear. In the left sidebar (File Explorer), right-click a `.csv` file and select "Convert to table in current file". Adjust the settings and click "Insert Table at Cursor".

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
