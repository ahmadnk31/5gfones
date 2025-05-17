# ReactQuillEditor Documentation

The `ReactQuillEditor` component is a rich text editor built on top of Quill.js, designed specifically for the FinOpenPOS application. It provides advanced formatting options and supports both light and dark themes.

## Features

- Full rich text formatting capabilities
- Dark mode support
- Customizable toolbar
- Image and link insertion
- Clean and professional UI
- Direct access to plain text content
- Ref forwarding for advanced control

## Usage

### Basic Usage

```tsx
import { ReactQuillEditor } from "@/components/react-quill-editor";
import { useState } from "react";

export default function MyComponent() {
  const [content, setContent] = useState("");

  return (
    <div>
      <ReactQuillEditor
        value={content}
        setValue={setContent}
        placeholder='Start writing your content...'
      />
    </div>
  );
}
```

### Advanced Usage with Ref

```tsx
import {
  ReactQuillEditor,
  ReactQuillEditorRef,
} from "@/components/react-quill-editor";
import { useState, useRef } from "react";

export default function MyComponent() {
  const [content, setContent] = useState("");
  const [plainText, setPlainText] = useState("");
  const editorRef = useRef<ReactQuillEditorRef>(null);

  const handleGetPlainText = () => {
    if (editorRef.current) {
      const text = editorRef.current.getPlainText();
      setPlainText(text);
    }
  };

  return (
    <div>
      <ReactQuillEditor
        ref={editorRef}
        value={content}
        setValue={setContent}
        placeholder='Start writing your content...'
      />
      <button onClick={handleGetPlainText}>Get Plain Text</button>
      <div>
        <h3>Plain Text Content:</h3>
        <pre>{plainText}</pre>
      </div>
    </div>
  );
}
```

### Automatic Plain Text Generation

```tsx
import { ReactQuillEditor } from "@/components/react-quill-editor";
import { useState } from "react";

export default function MyComponent() {
  const [htmlContent, setHtmlContent] = useState("");
  const [plainTextContent, setPlainTextContent] = useState("");

  return (
    <div>
      <ReactQuillEditor
        value={htmlContent}
        setValue={setHtmlContent}
        onHTMLChange={(html, plainText) => {
          setPlainTextContent(plainText);
        }}
      />

      <div className='mt-4'>
        <h3>HTML Content:</h3>
        <pre className='border p-2'>{htmlContent}</pre>

        <h3>Auto-generated Plain Text:</h3>
        <pre className='border p-2'>{plainTextContent}</pre>
      </div>
    </div>
  );
}
```

## Props

| Prop           | Type                                               | Default                        | Description                                                          |
| -------------- | -------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `value`        | `string`                                           | `''`                           | The HTML content of the editor                                       |
| `setValue`     | `(value: string) => void`                          | Required                       | Callback function to update value                                    |
| `placeholder`  | `string`                                           | `'Write your content here...'` | Placeholder text when editor is empty                                |
| `className`    | `string`                                           | `''`                           | Additional CSS classes for the container                             |
| `isEditable`   | `boolean`                                          | `true`                         | Whether the editor is editable                                       |
| `onHTMLChange` | `(htmlContent: string, plainText: string) => void` | `undefined`                    | Callback that provides both HTML and plain text when content changes |

## Ref API

When you use `useRef` with ReactQuillEditor, you get access to the following methods:

| Method           | Return Type | Description                                                               |
| ---------------- | ----------- | ------------------------------------------------------------------------- |
| `getPlainText()` | `string`    | Returns the plain text content of the editor, with all formatting removed |
| `getEditor()`    | `Quill`     | Returns the underlying Quill editor instance for advanced operations      |

Example of using the ref to get plain text:

```tsx
const handleGeneratePlainText = () => {
  if (quillEditorRef.current?.getPlainText) {
    const plainText = quillEditorRef.current.getPlainText();
    setTextContent(plainText);
  }
};
```

## Available Formatting Options

The editor includes the following formatting tools:

- Headers (H1-H6)
- Bold, italic, underline, and strikethrough
- Text color and background color
- Text alignment
- Ordered and unordered lists
- Blockquote and code blocks
- Links and images
- Clean formatting

## Dark Mode Support

The ReactQuillEditor automatically detects the current theme through the `useTheme` hook and applies appropriate styling for both light and dark modes.

## Security

When using the ReactQuillEditor to generate content that will be sent to users (like newsletters), always ensure the HTML content is sanitized before sending it. The application includes `sanitize-html` for this purpose in the SES client.

```typescript
// Example of how the SES client sanitizes HTML
import sanitizeHtml from "sanitize-html";

// In sendEmail function
const sanitizedHtml = sanitizeHtml(htmlBody, sanitizeOptions);

// Then use the sanitizedHtml in your email
```

The sanitization options are configured to allow commonly used HTML elements and attributes while blocking potentially dangerous scripts and content. For a complete list of allowed elements and attributes, see the `sanitizeOptions` in the SES client.

## Example: Newsletter Editor

The ReactQuillEditor is used in the Newsletter Admin page to compose HTML newsletters with a tabbed interface that allows switching between HTML editing, plain text editing, and a preview of the final result.

```tsx
import {
  ReactQuillEditor,
  ReactQuillEditorRef,
} from "@/components/react-quill-editor";
import { useRef } from "react";

// In your component
const quillEditorRef = useRef<ReactQuillEditorRef>(null);

// ...later in the JSX
<Tabs defaultValue='html' className='w-full'>
  <TabsList className='mb-4'>
    <TabsTrigger value='html'>HTML Content</TabsTrigger>
    <TabsTrigger value='text'>Plain Text</TabsTrigger>
    <TabsTrigger value='preview'>Preview</TabsTrigger>
  </TabsList>

  <TabsContent value='html' className='space-y-4'>
    <div className='border rounded-md'>
      <ReactQuillEditor
        ref={quillEditorRef}
        value={htmlContent}
        setValue={(content) => setHtmlContent(content)}
      />
    </div>
  </TabsContent>

  <TabsContent value='text'>
    <div className='space-y-2'>
      <div className='flex justify-end mb-1'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => {
            if (quillEditorRef.current?.getPlainText) {
              const plainText = quillEditorRef.current.getPlainText();
              setTextContent(plainText);
            }
          }}
        >
          <Wand2 className='h-4 w-4 mr-2' />
          Generate from HTML
        </Button>
      </div>
      <Textarea
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        className='min-h-32 w-full'
      />
    </div>
  </TabsContent>

  <TabsContent value='preview'>
    <div className='border rounded-md p-4 dark:bg-gray-900 bg-white min-h-[300px] overflow-auto'>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  </TabsContent>
</Tabs>;
```
