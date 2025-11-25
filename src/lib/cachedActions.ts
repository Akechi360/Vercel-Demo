'use server';

import { unstable_cache } from 'next/cache';
import { getPatients, getCompanyById } from './actions';

// Cache patients list for 5 minutes
// The arguments passed to the returned function are automatically part of the cache key
export const getCachedPatients = unstable_cache(
    async (currentUserId?: string) => {
        return await getPatients(currentUserId);
    },
    ['cached-patients'],
    { revalidate: 300 }
);

// Cache company lookup for 10 minutes
export const getCachedCompanyById = unstable_cache(
    async (companyId: string) => {
        return await getCompanyById(companyId);
    },
    ['cached-company'],
    { revalidate: 600 }
);
