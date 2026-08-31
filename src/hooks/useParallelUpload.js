import { useState } from 'react';
import api from '@/lib/api/client';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PARALLEL = 3; // Upload 3 chunks at once

export const useParallelUpload = () => {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadId, setUploadId] = useState(null);

    const calculateHash = async (file) => {
        const buffer = await file.slice(0, 1024 * 1024).arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const uploadChunk = async (file, chunkIndex, totalChunks, uploadId, hash) => {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex);
        formData.append('totalChunks', totalChunks);
        formData.append('fileName', file.name);
        formData.append('fileHash', hash);

        await api.post('/upload/chunk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    };

    const uploadVideo = async (file, onProgress) => {
        setUploading(true);
        setProgress(0);

        try {
            // 1. Calculate hash
            const hash = await calculateHash(file);

            // 2. Check if file exists or has partial upload
            const checkRes = await api.get(`/upload/check?hash=${hash}`);
            const currentUploadId = checkRes.data.uploadId;
            const uploadedChunks = new Set(checkRes.data.uploadedChunks || []);
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

            setUploadId(currentUploadId);

            // 3. Upload chunks in parallel
            const pendingChunks = [];
            for (let i = 0; i < totalChunks; i++) {
                if (!uploadedChunks.has(i)) {
                    pendingChunks.push(i);
                }
            }

            let completedCount = uploadedChunks.size;

            // Process chunks in parallel batches
            for (let i = 0; i < pendingChunks.length; i += MAX_PARALLEL) {
                const batch = pendingChunks.slice(i, i + MAX_PARALLEL);

                await Promise.all(
                    batch.map(async (chunkIndex) => {
                        await uploadChunk(file, chunkIndex, totalChunks, currentUploadId, hash);
                        completedCount++;
                        const percent = Math.round((completedCount / totalChunks) * 100);
                        setProgress(percent);
                        if (onProgress) onProgress(percent);
                    })
                );
            }

            // 4. Complete upload
            const completeRes = await api.post(`/upload/complete?uploadId=${currentUploadId}`);

            setProgress(100);
            setUploading(false);
            return completeRes.data;

        } catch (err) {
            console.error('Upload failed:', err);
            setUploading(false);
            throw err;
        }
    };

    return { uploadVideo, progress, uploading, uploadId };
};