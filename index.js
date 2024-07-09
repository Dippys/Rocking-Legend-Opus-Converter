const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const vdf = require('simple-vdf');
const cliProgress = require('cli-progress');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

const isPkg = typeof process.pkg !== 'undefined';

const ffmpegPath = isPkg
    ? path.join(path.dirname(process.execPath), 'resources', 'ffmpeg.exe')
    : require('ffmpeg-static');

const steamConfigPaths = [
    path.join(os.homedir(), 'AppData', 'Local', 'Steam', 'config', 'libraryfolders.vdf'),
    'C:\\Program Files (x86)\\Steam\\config\\libraryfolders.vdf',
    'C:\\Program Files\\Steam\\config\\libraryfolders.vdf'
];
const gameFolder = 'Rocking Legend';
const chartsFolder = 'RockingLegend_Data\\UserContents\\ChartsToImport';

async function getSteamLibraries() {
    for (const configPath of steamConfigPaths) {
        try {
            const content = await fs.promises.readFile(configPath, 'utf-8');
            const parsed = vdf.parse(content);
            return Object.values(parsed.libraryfolders).map(library => library.path);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
    throw new Error('Steam library configuration file not found.');
}

async function findGameFolder() {
    const libraries = await getSteamLibraries();

    for (const library of libraries) {
        const gamePath = path.join(library, 'steamapps', 'common', gameFolder, chartsFolder);
        if (await fs.promises.access(gamePath).then(() => true).catch(() => false)) {
            return gamePath;
        }
    }

    throw new Error(`Game folder "${gameFolder}" not found in any Steam library.`);
}

async function convertOpusToOgg(filePath, progressBar) {
    const outputFilePath = filePath.replace('.opus', '.ogg');

    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpegPath, ['-i', filePath, outputFilePath]);

        ffmpegProcess.on('error', (error) => {
            console.error(`Error: ${error.message}`);
            reject(error);
        });

        ffmpegProcess.on('close', async (code) => {
            if (code !== 0) {
                reject(new Error(`ffmpeg process exited with code ${code}`));
                return;
            }

            try {
                await unlink(filePath);
                progressBar.increment();
                console.log(`Converted: ${path.basename(filePath)} to ${path.basename(outputFilePath)}`);
                resolve();
            } catch (err) {
                console.error(`Error deleting file: ${filePath}`, err);
                reject(err);
            }
        });
    });
}

async function processFolder(folderPath, progressBar) {
    const files = await readdir(folderPath);
    const fileProcessingQueue = [];

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
            await processFolder(fullPath, progressBar);
        } else if (path.extname(fullPath) === '.opus') {
            fileProcessingQueue.push(fullPath);
        }
    }

    const batchSize = Math.min(os.cpus().length, 5);

    await processFilesInBatches(fileProcessingQueue, batchSize, progressBar);
}

async function processFilesInBatches(files, batchSize, progressBar) {
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(file => convertOpusToOgg(file, progressBar)));
    }
}

findGameFolder()
    .then(async (folderPath) => {
        const opusFiles = await getOpusFiles(folderPath);

        const progressBar = new cliProgress.SingleBar({
            format: 'Progress |{bar}| {percentage}% | {value}/{total} | File: {filename} | Folder: {foldername}',
            clearOnComplete: true
        }, cliProgress.Presets.shades_classic);

        progressBar.start(opusFiles.length, 0, {
            filename: 'N/A',
            foldername: 'N/A'
        });

        for (const file of opusFiles) {
            progressBar.update({ filename: path.basename(file), foldername: path.basename(path.dirname(file)) });
            await convertOpusToOgg(file, progressBar);
        }

        progressBar.stop();
        console.log('Conversion complete.');
    })
    .catch((err) => {
        console.error('Error finding game folder:', err);
    });

async function getOpusFiles(folderPath) {
    const files = await readdir(folderPath);
    const opusFiles = [];

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
            opusFiles.push(...await getOpusFiles(fullPath));
        } else if (path.extname(fullPath) === '.opus') {
            opusFiles.push(fullPath);
        }
    }

    return opusFiles;
}
