import React, { useState, useEffect } from "react"

export default function FileDownloader() {
  const [url, setUrl] = useState("")
  const [files, setFiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("downloadedFiles") || "[]")
    setFiles(saved)
  }, [])

  const handleDownload = async (e) => {
    e.preventDefault()
    if (!url) return alert("Enter a file URL!")

    try {
      const response = await fetch(url)
      const blob = await response.blob()

      if (url.startsWith("http")) {
        const cache = await caches.open("files-cache")
        await cache.put(new Request(url), new Response(blob))
      }

      const name = url.split("/").pop()
      const newFile = {
        url,
        name,
        type: blob.type,
        date: new Date().toISOString(),
      }

      const updated = [...files, newFile]
      setFiles(updated)
      localStorage.setItem("downloadedFiles", JSON.stringify(updated))
      setUrl("")
      alert(`✅ ${name} downloaded`)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to download file")
    }
  }

  const handleView = async (file) => {
    try {
      const cache = await caches.open("files-cache")
      const response = await cache.match(file.url)
      if (!response) return alert("File not found in cache!")

      const blob = await response.blob()
      const objectURL = URL.createObjectURL(blob)

      setSelected(file)
      setPreviewUrl(objectURL)
    } catch (err) {
      console.error(err)
      alert("❌ Could not load file")
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <form onSubmit={handleDownload}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter file URL..."
          style={{ width: 300, marginRight: 10 }}
        />
        <button type="submit">Download</button>
      </form>

      <h3>Downloaded Files</h3>
      <ul>
        {files.map((f, i) => (
          <li key={i}>
            <button onClick={() => handleView(f)}>{f.name}</button>
            <small style={{ marginLeft: 10, color: "gray" }}>
              {f.type || "unknown"}
            </small>
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
            <video controls width="300" src={previewUrl}></video>
          )}

          {/* 📄 PDF / Doc */}
          {selected.type === "application/pdf" && (
            <iframe src={previewUrl} width="100%" height="500px" title="pdf" />
          )}

          {/* 🧩 Other */}
          {!selected.type.startsWith("image/") &&
            !selected.type.startsWith("video/") &&
            selected.type !== "application/pdf" && (
              <p>
                File cannot be previewed.{" "}
                <a href={previewUrl} download={selected.name}>
                  Download
                </a>
              </p>
            )}
        </div>
      )}
    </div>
  )
}
