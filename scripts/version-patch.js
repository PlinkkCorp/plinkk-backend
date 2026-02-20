const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function getStagedFiles() {
    try {
        const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        return output.split('\n').filter(Boolean);
    } catch (error) {
        console.error('Error getting staged files:', error.message);
        return [];
    }
}

function getPackageJsonPath(filePath) {
    let currentDir = path.dirname(path.resolve(filePath));
    const rootDir = path.resolve(__dirname, '..');

    while (currentDir !== rootDir && currentDir !== path.parse(currentDir).root) {
        const pkgPath = path.join(currentDir, 'package.json');
        if (fs.existsSync(pkgPath)) {
            return pkgPath;
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}

function updatePatchVersion() {
    const stagedFiles = getStagedFiles();
    const packagesToUpdate = new Set();

    stagedFiles.forEach(file => {
        const pkgPath = getPackageJsonPath(file);
        if (pkgPath) {
            packagesToUpdate.add(pkgPath);
        }
    });

    if (packagesToUpdate.size === 0) {
        console.log('No package.json found for changed files.');
        return;
    }

    packagesToUpdate.forEach(pkgPath => {
        const pkgDir = path.dirname(pkgPath);
        const pkgName = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).name;

        // Skip root package.json if it's not intended to be auto-patched
        if (pkgDir === path.resolve(__dirname, '..')) {
            // Uncomment if you want to patch the root too
            // console.log(`Skipping root package: ${pkgName}`);
            // return;
        }

        console.log(`Patching version for ${pkgName} in ${pkgDir}...`);
        try {
            execSync('npm version patch --no-git-tag-version', { cwd: pkgDir, stdio: 'inherit' });
            execSync(`git add package.json`, { cwd: pkgDir });
            console.log(`Successfully patched and staged ${pkgName}`);
        } catch (error) {
            console.error(`Failed to patch ${pkgName}:`, error.message);
        }
    });
}

updatePatchVersion();
