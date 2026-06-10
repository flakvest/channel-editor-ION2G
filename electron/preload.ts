import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("dialog:open"),
  saveFile: (content: string) => ipcRenderer.invoke("dialog:save", content),
});
