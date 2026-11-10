import React, { useEffect, useRef } from 'react';
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function MarkdownViewer({ content = '' }) {
    const viewerElRef = useRef(null);
    const viewerInstanceRef = useRef(null);

    useEffect(() => {
        if (!viewerElRef.current) return;

        viewerInstanceRef.current = Editor.factory({
            el: viewerElRef.current,
            viewer: true,
            initialValue: content || '',
            usageStatistics: false,
        });

        return () => {
            if (viewerInstanceRef.current) {
                viewerInstanceRef.current.destroy();
                viewerInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (viewerInstanceRef.current) {
            viewerInstanceRef.current.setMarkdown(content || '');
        }
    }, [content]);

    return (
        <div className="toastui-viewer-container">
            <div ref={viewerElRef} />
        </div>
    );
}

