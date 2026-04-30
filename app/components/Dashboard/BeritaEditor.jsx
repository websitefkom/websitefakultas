"use client";
import dynamic from "next/dynamic";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((mod) => mod.Editor), {
  ssr: false,
});

export default function BeritaEditor({ initialValue = "", onChange, onToggleFullScreen, isFullScreen = false }) {
  const editorRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Update konten editor setiap kali initialValue berubah
  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      const editor = editorRef.current;
      const currentContent = editor.getContent();
      if (initialValue && currentContent !== initialValue) {
        editor.setContent(initialValue || "");
      }
    }
  }, [initialValue, isEditorReady]);

  const filePickerCallback = useCallback((callback, value, meta) => {
    if (meta.filetype === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = function () {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function () {
          const base64 = reader.result;
          try {
            const id = "blobid" + new Date().getTime();
            const blobCache = window.tinymce?.activeEditor?.editorUpload?.blobCache;
            if (blobCache) {
              const blobInfo = blobCache.create(id, file, base64.split(",")[1]);
              blobCache.add(blobInfo);
              callback(blobInfo.blobUri(), { title: file.name });
            } else {
              callback(base64, { title: file.name });
            }
          } catch {
            callback(base64, { title: file.name });
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  }, []);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const onToggleFullScreenRef = useRef(onToggleFullScreen);
  useEffect(() => {
    onToggleFullScreenRef.current = onToggleFullScreen;
  }, [onToggleFullScreen]);

  const handleEditorChange = useCallback((val) => {
    if (typeof onChangeRef.current === "function") onChangeRef.current(val);
  }, []);

  const onInit = useCallback((evt, editor) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // ✅ Set isi awal ketika editor pertama kali siap
    if (initialValue) {
      editor.setContent(initialValue || "");
    }

    // Set tampilan LTR agar stabil
    const doc = editor.getDoc();
    if (doc && doc.documentElement) {
      doc.documentElement.style.unicodeBidi = "isolate";
      doc.documentElement.style.direction = "ltr";
    }
    const body = editor.getBody();
    if (body) {
      body.style.unicodeBidi = "isolate";
      body.setAttribute("dir", "ltr");
      body.style.textAlign = "left";
    }

    // Notify parent when TinyMCE enters/exits fullscreen (plugin event)
    try {
      editor.on && editor.on('FullscreenStateChanged', function (e) {
        if (typeof onToggleFullScreenRef.current === 'function') onToggleFullScreenRef.current(!!e.state);
      });
    } catch (err) {
      // ignore if event isn't available
    }
  }, [initialValue]);

  const init = useMemo(
    () => ({
      directionality: "ltr",
      height: (typeof window !== 'undefined' && isFullScreen) ? Math.max(400, window.innerHeight - 160) : 500,
      menubar: true,
      plugins: "lists link image media table wordcount code fullscreen",
      toolbar:
        "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image media table | code | fullscreen",
      branding: false,
      paste_data_images: true,
      automatic_uploads: true,
      // Prevent editors from setting fixed pixel dimensions
      image_dimensions: false,
      // Provide a default responsive class option for inserted images
      image_class_list: [
        { title: 'Responsive', value: 'w-full h-auto rounded-lg shadow-md' },
      ],
      file_picker_types: "image",
      file_picker_callback: filePickerCallback,
      // Make editor WYSIWYG and responsive — mimic frontend typography for authoring
      content_style: `
        body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin: 1rem; font-size: 16px; color: #0f172a; }
        img { max-width: 100% !important; height: auto !important; display: block !important; margin: 1rem 0 !important; border-radius: 0.5rem !important; }
        p { margin-bottom: 1em; line-height: 1.75; }
        h1, h2, h3 { font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }
        ul, ol { padding-left: 1.5em; margin-bottom: 1em; }
      `,
    }),
    [filePickerCallback, isFullScreen]
  );

  if (!mounted) return null;

  return (
    <div dir="ltr" style={{ direction: "ltr", textAlign: "left", height: isFullScreen ? 'calc(100vh - 120px)' : 'auto' }}>
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || ""}
        onInit={onInit}
        init={init}
        onEditorChange={handleEditorChange}
      />
    </div>
  );
}
