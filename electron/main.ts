import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("dialog:open", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: "Codeplug Files", extensions: ["zcp"] }],
    properties: ["openFile"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const content = readFileSync(filePath, "utf-8");
  return { filePath, content };
});

ipcMain.handle("dialog:save", async (_event, content: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [{ name: "Codeplug Files", extensions: ["zcp"] }],
    defaultPath: "system.zcp",
  });
  if (result.canceled || !result.filePath) return false;

  writeFileSync(result.filePath, content, "utf-8");
  return true;
});
