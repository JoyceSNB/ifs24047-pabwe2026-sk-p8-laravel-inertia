import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import Spinner from './Spinner';

/**
 * Progress bar di atas + pill "Memproses tindakan..." yang mengikuti setiap request Inertia.
 */
export default function ProcessingIndicator() {
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', () => setIsProcessing(true));
        const removeFinish = router.on('finish', () => setIsProcessing(false));
        const removeError = router.on('error', () => setIsProcessing(false));
        return () => {
            removeStart();
            removeFinish();
            removeError();
        };
    }, []);

    if (!isProcessing) return null;

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
                <div className="h-full bg-white/50 w-full animate-pulse"></div>
            </div>
            <div className="fixed bottom-5 right-5 z-[60] bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-sm border border-slate-700/60">
                <Spinner className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Memproses tindakan...</span>
            </div>
        </>
    );
}