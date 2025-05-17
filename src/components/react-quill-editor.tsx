import React, { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useTheme } from 'next-themes';

// Define props interface for the component
interface ReactQuillEditorProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  className?: string;
  isEditable?: boolean;
  onHTMLChange?: (htmlContent: string, plainText: string) => void;
}

// Define a ref type that includes our custom methods
export interface ReactQuillEditorRef {
  getPlainText: () => string;
  getEditor: () => any;
}

export const ReactQuillEditor = forwardRef<ReactQuillEditorRef, ReactQuillEditorProps>(({ 
  value, 
  setValue, 
  placeholder = 'Write your content here...', 
  className = '',
  isEditable = true,
  onHTMLChange
}: ReactQuillEditorProps, ref) => {
  const { theme } = useTheme();
  const quillRef = useRef<ReactQuill>(null);
  // Handle change and get both HTML and text content
  const handleChange = (content: string) => {
    setValue(content);
    console.log(content)
    // If onHTMLChange prop is provided, call it with HTML content and plain text
    if (onHTMLChange) {
      const editor = quillRef.current?.getEditor();
      const plainText = editor ? editor.getText() : '';
      onHTMLChange(content, plainText);
    }
  }
  
  /**
   * Gets the plain text content from the editor
   * Useful for generating plain text versions of HTML emails
   */
  const getPlainText = (): string => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      return editor.getText() || '';
    }
    return '';
  }
    // We'll use useImperativeHandle with the forwarded ref later
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  // Define formats that are allowed
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  // Add dynamic class for dark mode support
  useEffect(() => {
    // Add custom CSS for dark mode
    const style = document.createElement('style');
    style.id = 'quill-dark-mode-styles';
    style.innerHTML = `
      .dark .quill-editor-container .ql-toolbar {
        background-color: #1f2937;
        color: white;
        border-color: #374151;
      }
      .dark .quill-editor-container .ql-container {
        background-color: #111827;
        color: white;
        border-color: #374151;
      }
      .dark .quill-editor-container .ql-editor {
        color: white;
        background-color: #111827;
      }
      .dark .quill-editor-container .ql-picker {
        color: white;
      }
      .dark .quill-editor-container .ql-stroke {
        stroke: white;
      }
      .dark .quill-editor-container .ql-fill {
        fill: white;
      }
      .dark .quill-editor-container .ql-picker-options {
        background-color: #1f2937;
        border-color: #374151;
      }
      .dark .quill-editor-container .ql-toolbar button:hover,
      .dark .quill-editor-container .ql-toolbar .ql-picker-label:hover {
        color: #60a5fa;
      }
      .dark .quill-editor-container .ql-toolbar button:hover .ql-stroke,
      .dark .quill-editor-container .ql-toolbar .ql-picker-label:hover .ql-stroke {
        stroke: #60a5fa;
      }
    `;
    
    if (!document.getElementById('quill-dark-mode-styles')) {
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById('quill-dark-mode-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };  }, []);
  
  // Fix the useImperativeHandle target - it should be the forwarded ref, not quillRef
  useImperativeHandle(ref, () => ({
    getPlainText,
    getEditor: () => quillRef.current?.getEditor()
  }));
  
  return (
    <div className={`quill-editor-container ${className}`}>
      <ReactQuill 
        ref={quillRef}
        theme="snow" 
        value={value} 
        readOnly={!isEditable}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight: '250px' }}
      />
    </div>
  );
});

