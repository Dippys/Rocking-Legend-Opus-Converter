# Rocking Legends Opus to Ogg Converter

This Node.js script converts .opus audio files to .ogg format using `ffmpeg-static` and provides a CLI progress bar for tracking the conversion progress.

## Prerequisites

- Node.js installed on your machine ([Download Node.js](https://nodejs.org/))
- NPM (Node Package Manager) or Yarn installed ([NPM installation guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), [Yarn installation guide](https://classic.yarnpkg.com/en/docs/install/))

## Installation

1. Clone this repository or download the ZIP file.

2. Navigate into the project directory:

   ```bash
   cd Rocking-Legend-Opus-Converter
   ```

3. Install dependencies using npm or yarn:

   ```bash
   npm install
   # or
   yarn install
   ```

## Usage

1. Ensure Node.js and npm/yarn are installed and the dependencies are installed as per the installation steps.

2. Run the script:

   ```bash
   npm start
   # or
   node index.js
   ```

3. Follow the on-screen prompts to convert .opus files to .ogg format. The script will search for .opus files in the configured Steam game folder (`Rocking Legend` by default) and its subdirectories.

4. Progress will be displayed in the console with a CLI progress bar, indicating the current file being converted.

## Configuration

- **Steam Game Folder**: By default, the script looks for the `Rocking Legend` game folder in your Steam libraries. You can modify this in `index.js` if your game folder has a different name or location.

## Troubleshooting

- **ENOENT Error**: If you encounter `ENOENT` errors related to `ffmpeg-static`, ensure that `ffmpeg.exe` is located in a `resources` folder alongside your compiled executable (`index.exe`). The `pkg` configuration in `package.json` should explicitly include `resources/ffmpeg.exe` in the assets array. This ensures that `ffmpeg.exe` is bundled correctly and accessible during runtime.

## Contributing

Contributions are welcome! Feel free to fork this repository, submit pull requests, or open issues for bug reports, feature requests, or improvements.

## Acknowledgements

- This script uses `ffmpeg-static` for cross-platform compatibility in running `ffmpeg` commands.
- Progress tracking is implemented using the `cli-progress` package.
