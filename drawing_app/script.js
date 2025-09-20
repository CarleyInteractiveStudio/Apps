window.addEventListener('load', () => {
    // --- DOM ELEMENTS ---
    const canvasContainer = document.getElementById('canvas-container');
    const colorPalette = document.getElementById('color-palette');
    const brushSizeSlider = document.getElementById('brush-size');
    const pencilTool = document.getElementById('pencil-tool');
    const eraserTool = document.getElementById('eraser-tool');
    const clearCanvasBtn = document.getElementById('clear-canvas');
    const addLayerBtn = document.getElementById('add-layer-btn');
    const layerList = document.getElementById('layer-list');

    // --- STATE MANAGEMENT ---
    window.layers = []; // Exposed for testing
    let activeLayerId = null;
    let nextLayerId = 1;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    let brushSize = 5;
    let currentColor = '#000000';
    let currentTool = 'pencil'; // 'pencil' or 'eraser'

    // --- CORE FUNCTIONS ---
    function createNewLayer(name) {
        const layerId = nextLayerId++;

        const canvas = document.createElement('canvas');
        canvas.id = `layer-${layerId}`;
        canvas.className = 'layer-canvas';
        canvas.width = 800;
        canvas.height = 600;
        canvasContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        const newLayer = {
            id: layerId,
            name: name || `Capa ${layerId}`,
            canvas: canvas,
            ctx: ctx,
            isVisible: true
        };

        layers.push(newLayer);

        // The new layer should be added at the top of the stack visually
        canvasContainer.insertBefore(canvas, canvasContainer.firstChild);

        setActiveLayer(layerId);
        renderLayerList();

        console.log(`Layer ${layerId} created.`);
        return newLayer;
    }

    function renderLayerList() {
        layerList.innerHTML = ''; // Clear the list
        [...layers].reverse().forEach(layer => {
            const li = document.createElement('li');
            li.className = `layer-item ${layer.id === activeLayerId ? 'active' : ''} ${!layer.isVisible ? 'layer-hidden' : ''}`;
            li.dataset.layerId = layer.id;

            const layerName = document.createElement('span');
            layerName.textContent = layer.name;

            const controls = document.createElement('div');
            controls.className = 'layer-controls';

            const visibilityBtn = document.createElement('button');
            visibilityBtn.innerHTML = layer.isVisible ? '👁️' : '🙈';
            visibilityBtn.dataset.action = 'toggle-visibility';

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.dataset.action = 'delete';

            controls.appendChild(visibilityBtn);
            controls.appendChild(deleteBtn);

            li.appendChild(layerName);
            li.appendChild(controls);

            layerList.appendChild(li);
        });
    }

    function getActiveLayer() {
        return layers.find(layer => layer.id === activeLayerId);
    }

    function setActiveLayer(layerId) {
        activeLayerId = layerId;
        renderLayerList();
        console.log(`Layer ${layerId} is now active.`);
    }

    function draw(e) {
        if (!isDrawing) return;

        const activeLayer = getActiveLayer();
        if (!activeLayer || !activeLayer.isVisible) return;

        const ctx = activeLayer.ctx;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = (currentTool === 'eraser') ? '#ffffff' : currentColor;

        // Eraser in a multi-layer setup should draw transparently, not white
        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    // --- EVENT LISTENERS ---

    // Drawing Listeners on the container
    canvasContainer.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    canvasContainer.addEventListener('mousemove', draw);
    canvasContainer.addEventListener('mouseup', () => isDrawing = false);
    canvasContainer.addEventListener('mouseout', () => isDrawing = false);

    // Toolbar Listeners
    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = e.target.value;
    });

    colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            currentColor = e.target.dataset.color;
            document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
            e.target.classList.add('active');
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
        const activeLayer = getActiveLayer();
        if (activeLayer) {
            activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
            console.log(`Layer ${activeLayer.id} cleared.`);
        }
    });

    // Layer Panel Listeners
    addLayerBtn.addEventListener('click', () => {
        createNewLayer();
    });

    layerList.addEventListener('click', (e) => {
        const target = e.target;
        const layerItem = target.closest('.layer-item');
        if (!layerItem) return;

        const layerId = Number(layerItem.dataset.layerId);
        const action = target.dataset.action;

        if (action === 'delete') {
            deleteLayer(layerId);
        } else if (action === 'toggle-visibility') {
            toggleLayerVisibility(layerId);
        } else {
            // If no action button was clicked, assume the user wants to select the layer
            setActiveLayer(layerId);
        }
    });

    function deleteLayer(layerId) {
        if (layers.length <= 1) {
            alert("No se puede eliminar la última capa.");
            return;
        }

        // Remove from DOM
        const canvasToRemove = document.getElementById(`layer-${layerId}`);
        if(canvasToRemove) canvasToRemove.remove();

        // Remove from state
        layers = layers.filter(layer => layer.id !== layerId);

        // If the active layer was deleted, set a new active layer
        if (activeLayerId === layerId) {
            setActiveLayer(layers[layers.length - 1].id);
        }

        renderLayerList();
        console.log(`Layer ${layerId} deleted.`);
    }

    function toggleLayerVisibility(layerId) {
        const layer = layers.find(l => l.id === layerId);
        if (layer) {
            layer.isVisible = !layer.isVisible;
            layer.canvas.style.display = layer.isVisible ? 'block' : 'none';
            renderLayerList();
            console.log(`Layer ${layerId} visibility set to ${layer.isVisible}`);
        }
    }

    // --- INITIALIZATION ---
    function initialize() {
        createNewLayer("Fondo"); // Create the first layer, e.g., "Background"

        // Set initial active color in UI
        const initialColor = document.querySelector('.color-option[data-color="#000000"]');
        if(initialColor) initialColor.classList.add('active');

        console.log('Layer-based drawing app initialized.');
    }

    initialize();
});
