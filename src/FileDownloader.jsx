import React, { useState, useEffect } from "react"

export default function FileDownloader() {
  const [folderHandle, setFolderHandle] = useState(null)
  const [files, setFiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [url, setUrl] = useState("")

  // Ask user to select a folder
  const chooseFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker()
      setFolderHandle(handle)
      await loadFiles(handle)
    } catch (err) {
      console.error("❌ Folder access denied", err)
    }
  }

  // List files from the chosen folder
  const loadFiles = async (handle) => {
    const all = []
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind === "file") {
        const file = await entry.getFile()
        all.push({ name: file.name, type: file.type, handle: entry })
      }
    }
    setFiles(all)
  }

  // Download from URL and save to disk
  const handleDownload = async (e) => {
    e.preventDefault()
    if (!url || !folderHandle) return alert("Select a folder and enter a URL")

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const name = url.split("/").pop()

      // Create or overwrite the file
      const fileHandle = await folderHandle.getFileHandle(name, {
        create: true,
      })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      alert(`✅ Saved ${name}`)
      setUrl("")
      await loadFiles(folderHandle)
    } catch (err) {
      console.error(err)
      alert("❌ Download failed")
    }
  }

  // Preview selected file
  const handleView = async (file) => {
    try {
      const realFile = await file.handle.getFile()
      const objectUrl = URL.createObjectURL(realFile)
      setSelected(file)
      setPreviewUrl(objectUrl)
    } catch (err) {
      console.error(err)
      alert("❌ Could not open file")
    }
  }

  // Delete file from disk
  const handleDelete = async (file) => {
    try {
      await folderHandle.removeEntry(file.name)
      alert(`🗑️ Deleted ${file.name}`)
      await loadFiles(folderHandle)
      if (selected?.name === file.name) {
        setSelected(null)
        setPreviewUrl(null)
      }
    } catch (err) {
      console.error(err)
      alert("❌ Failed to delete")
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>PWA File Explorer</h2>

      {!folderHandle && (
        <button onClick={chooseFolder}>📂 Choose Folder</button>
      )}

      {folderHandle && (
        <>
          <form onSubmit={handleDownload} style={{ marginTop: 20 }}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter file URL..."
              style={{ width: 300, marginRight: 10 }}
            />
            <button type="submit">⬇️ Download</button>
          </form>

          <h3 style={{ marginTop: 30 }}>Files in Folder:</h3>
          <ul>
            {files.map((f, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <button onClick={() => handleView(f)}>{f.name}</button>
                <small style={{ marginLeft: 10, color: "gray" }}>
                  ({f.type || "unknown"})
                </small>
                <button
                  onClick={() => handleDelete(f)}
                  style={{ marginLeft: 10, color: "red" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {selected && previewUrl && (
            <div style={{ marginTop: 20 }}>
              <h4>Preview: {selected.name}</h4>

              {/* 🖼️ Image */}
              {selected.type.startsWith("image/") && (
                <img src={previewUrl} alt={selected.name} width="300" />
              )}

              {/* 🎥 Video */}
              {selected.type.startsWith("video/") && (
                <video controls width="400" src={previewUrl}></video>
              )}

              {/* 📄 PDF */}
              {selected.type === "application/pdf" && (
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="500px"
                  title="pdf"
                />
              )}

              {/* 🧩 Fallback */}
              {!selected.type.startsWith("image/") &&
                !selected.type.startsWith("video/") &&
                selected.type !== "application/pdf" && (
                  <p>
                    File type not previewable.{" "}
                    <a href={previewUrl} download={selected.name}>
                      Download
                    </a>
                  </p>
                )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
