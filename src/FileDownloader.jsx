import React, { useState, useEffect } from "react"

export default function FileDownloader() {
  const [url, setUrl] = useState("")
  const [files, setFiles] = useState([])

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

      // Save in cache for offline
      const cache = await caches.open("files-cache")
      await cache.put(url, new Response(blob))

      const name = url.split("/").pop()
      const newFile = { url, name, date: new Date().toISOString() }

      const updated = [...files, newFile]
      setFiles(updated)
      localStorage.setItem("downloadedFiles", JSON.stringify(updated))
      setUrl("")
      alert(`✅ ${name} downloaded and available offline`)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to download file")
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
            <a href={f.url} target="_blank" rel="noreferrer">
              {f.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
