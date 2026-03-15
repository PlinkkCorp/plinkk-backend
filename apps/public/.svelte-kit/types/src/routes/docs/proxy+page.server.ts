// @ts-nocheck
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load = async () => {
    return {
        dashboardUrl: env.DASHBOARD_URL || 'https://dash.plinkk.fr'
    };
};
;null as any as PageServerLoad;