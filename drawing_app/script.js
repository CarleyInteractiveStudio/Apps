window.addEventListener('load', () => {
    // Canvas setup
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Toolbar elements
    const colorPalette = document.getElementById('color-palette');
    const brushSizeSlider = document.getElementById('brush-size');
    const pencilTool = document.getElementById('pencil-tool');
    const eraserTool = document.getElementById('eraser-tool');
    const clearCanvasBtn = document.getElementById('clear-canvas');

    // Drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let brushSize = 5;
    let currentColor = '#000000';
    let currentTool = 'pencil'; // 'pencil' or 'eraser'

    function draw(e) {
        if (!isDrawing) return;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = (currentTool === 'eraser') ? '#ffffff' : currentColor;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    // Event Listeners
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Tool selection
    brushSizeSlider.addEventListener('change', (e) => {
        brushSize = e.target.value;
    });

    colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            currentColor = e.target.dataset.color;
            // Remove active class from all colors
            document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
            // Add active class to the clicked color
            e.target.classList.add('active');
            // Switch to pencil tool when a color is selected
            currentTool = 'pencil';
            pencilTool.classList.add('active');
            eraserTool.classList.remove('active');
        }
    });

    pencilTool.addEventListener('click', () => {
        currentTool = 'pencil';
        pencilTool.classList.add('active');
        eraserTool.classList.remove('active');
    });

    eraserTool.addEventListener('click', () => {
        currentTool = 'eraser';
        eraserTool.classList.add('active');
        pencilTool.classList.remove('active');
    });

    clearCanvasBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Set initial active color
    document.querySelector('.color-option[data-color="#000000"]').classList.add('active');
    console.log('Interactive drawing app initialized.');
});
