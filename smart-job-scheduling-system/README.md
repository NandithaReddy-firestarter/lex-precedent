# Smart Job Scheduling System

An interactive, responsive dashboard demonstrating the **Job Sequencing with Deadlines Greedy Algorithm**. Built as an educational aid for **Analysis and Design of Algorithms (ADA)**.

## Project Structure
- `index.html`: Main visual page containing the dashboard grid, table, interactive visualizer, explanation tab panels, and analytics.
- `style.css`: Design stylesheet carrying variables, HSL color tokens, dark theme styles, animations, and layouts.
- `app.js`: Application logic handling job registration, sorting, validation, step-by-step state snapshot compiling, and animation play cycles.
- `charts.js`: Custom statistics tracking using Chart.js to render scheduled ratios, profit distribution bars, and timeline slot maps.

## Key Features
1. **Interactive Preset Loaders**: Instantly populate the scheduler with standard vectors (e.g. Standard example, high profit clashes, extended slot sets) to observe algorithm properties.
2. **Dynamic Step Scrubber**: Step backward, step forward, play, pause, or reset the animation. 
3. **Execution Console Log**: The simulation console prints explanations for every action (e.g. searching backward from deadline, finding free slot vs checking filled slot, and final rejection).
4. **Visual Color-Coded Timeline**: 
   - **Green**: Job Scheduled
   - **Red**: Job Rejected
   - **Blue/Pulse**: Checking Slot
5. **Real-time Analytics**: Dynamic charts automatically update based on current state.

## How to Run
1. Open the project directory.
2. Simply double-click `index.html` to run in any modern web browser.
3. Alternatively, you can use a local web server to serve the directory:
   - For python: `python -m http.server 8000`
   - For Node: `npx http-server ./`
