import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
    return {
        dashboardUrl: env.DASHBOARD_URL || 'https://dash.plinkk.fr'
    };
};
