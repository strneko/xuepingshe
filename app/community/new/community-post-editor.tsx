"use client";

import * as React from "react";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommunityPostEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  editor,
  active,
  onClick,
  title,
  children,
}: {
  editor: Editor;
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant={active ? "secondary" : "ghost"}
      className="rounded-md"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      disabled={!editor.isEditable}
    >
      {children}
    </Button>
  );
}

export default function CommunityPostEditor({ value, onChange, placeholder, className }: CommunityPostEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "请输入帖子正文，可以介绍课程体验、学习方法或校园见闻。",
      }),
      CharacterCount.configure({
        limit: 30000,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] outline-none [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline",
      },
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const currentValue = editor.getHTML();
    if (value !== currentValue) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className={cn("rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground", className)}>
        编辑器加载中...
      </div>
    );
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("请输入链接地址", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const wordCount = editor.storage.characterCount.characters();

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-3 py-2">
        <ToolbarButton
          editor={editor}
          active={editor.isActive("bold")}
          title="加粗"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("italic")}
          title="斜体"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("underline")}
          title="下划线"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("strike")}
          title="删除线"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("heading", { level: 1 })}
          title="标题一"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("heading", { level: 2 })}
          title="标题二"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("blockquote")}
          title="引用"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("bulletList")}
          title="无序列表"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive("orderedList")}
          title="有序列表"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton editor={editor} active={editor.isActive("link")} title="插入链接" onClick={toggleLink}>
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive({ textAlign: "left" })}
          title="左对齐"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive({ textAlign: "center" })}
          title="居中"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          active={editor.isActive({ textAlign: "right" })}
          title="右对齐"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton editor={editor} title="撤销" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton editor={editor} title="重做" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="px-4 py-3" />

      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <span>支持富文本、链接和对齐方式，正文将以 TipTap 结构保存。</span>
        <span>{wordCount}/30000</span>
      </div>
    </div>
  );
}
