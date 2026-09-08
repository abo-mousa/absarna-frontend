import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { STATIC } from '@/lib/queryCache';

// Public biography page. Query key intentionally matches the one useUpdateBiography
// (hooks/useAdminData.js) invalidates on save, so an admin edit shows up here with no
// extra wiring.
export const useBiography = () => {
    return useQuery({
        queryKey: ['biography'],
        queryFn: async () => {
            const res = await api.get('/biography');
            return res.data;
        },
        ...STATIC,
    });
};
