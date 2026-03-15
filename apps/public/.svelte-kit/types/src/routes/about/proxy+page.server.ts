// @ts-nocheck
import type { PageServerLoad } from './$types';

export const load = async ({ fetch }: Parameters<PageServerLoad>[0]) => {
	const repos = ['PlinkkCorp/plinkk', 'PlinkkCorp/plinkk-backend'];
	
	const fetchRepoStats = async (repo: string) => {
		try {
			const res = await fetch(`https://api.github.com/repos/${repo}`);
			if (!res.ok) return null;
			const data = await res.json();
			return {
				stars: data.stargazers_count ?? 0,
				forks: data.forks_count ?? 0
			};
		} catch (e) {
			return null;
		}
	};

	const stats = await Promise.all(repos.map(repo => fetchRepoStats(repo)));

	return {
		repoStats: {
			'PlinkkCorp/plinkk': stats[0],
			'PlinkkCorp/plinkk-backend': stats[1]
		}
	};
};
